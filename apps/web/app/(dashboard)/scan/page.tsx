"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { trpc } from "../../../lib/trpc";

const GS1_REGEX = /^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/;

type ScanState = "idle" | "scanning" | "denied" | "unsupported";

export default function ScanPage(): React.ReactNode {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [manualGs1, setManualGs1] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  // Damaged QR fallback modal
  const [showFallback, setShowFallback] = useState(false);
  const [partialId, setPartialId] = useState("");
  const [fallbackReason, setFallbackReason] = useState("");
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const manualOverride = trpc.batches.manualOverride.useMutation({
    onSuccess: (batch) => {
      setShowFallback(false);
      router.push(`/batches/${batch.id}`);
    },
    onError: (err) => {
      if (err.data?.code === "NOT_FOUND") {
        setFallbackError("Không tìm thấy lô hàng với ID này. Kiểm tra lại 6 ký tự cuối.");
      } else if (err.data?.code === "CONFLICT") {
        setFallbackError("Có nhiều lô hàng khớp với ID này. Hãy liên hệ quản trị viên.");
      } else {
        setFallbackError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    },
  });

  function openFallback() {
    stopCamera();
    setPartialId("");
    setFallbackReason("");
    setFallbackError(null);
    setShowFallback(true);
  }

  function submitFallback(e: React.FormEvent) {
    e.preventDefault();
    setFallbackError(null);
    manualOverride.mutate({
      partialBatchId: partialId.trim().slice(-6),
      reason: fallbackReason.trim(),
      // TODO(T51): replace with Supabase Storage presigned URL after file upload is wired
      evidenceDocUrl: `${window.location.origin}/evidence-pending`,
    });
  }

  const manualValid = GS1_REGEX.test(manualGs1.trim());

  async function startCamera() {
    setScanError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("scanning");
      scanLoop();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setState("denied");
      } else {
        setScanError("Không thể mở camera. Thử làm mới trang hoặc dùng HTTPS.");
        setState("idle");
      }
    }
  }

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
  }

  function scanLoop() {
    rafRef.current = requestAnimationFrame(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        scanLoop();
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const jsQR = (await import("jsqr")).default;
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (result?.data) {
        stopCamera();
        handleScannedValue(result.data);
        return;
      }

      scanLoop();
    });
  }

  function handleScannedValue(value: string) {
    const trimmed = value.trim();

    // If it's a URL pointing to /trace/*, navigate there
    try {
      const url = new URL(trimmed);
      if (url.pathname.startsWith("/trace/")) {
        router.push(url.pathname);
        return;
      }
    } catch {
      // not a URL
    }

    // If it looks like a GS1 trace ID, open the B2C trace page
    if (GS1_REGEX.test(trimmed)) {
      router.push(`/trace/${encodeURIComponent(trimmed)}`);
      return;
    }

    setScanError(`Mã quét không nhận dạng được: "${trimmed.slice(0, 40)}"`);
    setState("idle");
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualValid) handleScannedValue(manualGs1.trim());
  }

  // Clean up on unmount
  useEffect(() => () => stopCamera(), []);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Quét mã</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Dùng camera để quét mã QR / mã GS1 trên sản phẩm, hoặc nhập thủ công bên dưới.
      </p>

      {/* Camera viewport */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-800" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ display: state === "scanning" ? "block" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay when not scanning */}
        {state !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            {state === "denied" && (
              <>
                <span className="text-4xl">🚫</span>
                <p className="text-center text-sm px-6">
                  Quyền truy cập camera bị từ chối. Cho phép trong cài đặt trình duyệt và thử lại.
                </p>
              </>
            )}
            {state === "unsupported" && (
              <>
                <span className="text-4xl">📵</span>
                <p className="text-center text-sm px-6">
                  Trình duyệt này không hỗ trợ camera. Vui lòng dùng Chrome hoặc Safari mới nhất.
                </p>
              </>
            )}
            {state === "idle" && (
              <>
                <span className="text-5xl opacity-40">📷</span>
                <p className="text-sm text-white/60">Camera chưa bật</p>
              </>
            )}
          </div>
        )}

        {/* Scan frame overlay */}
        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-52 w-52 rounded-xl border-4 border-chain opacity-70" />
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="mb-6 flex gap-3">
        {state !== "scanning" ? (
          <button
            onClick={startCamera}
            disabled={state === "unsupported"}
            className="flex-1 rounded-lg bg-chain px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bật camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Dừng quét
          </button>
        )}
      </div>

      {/* Damaged QR fallback trigger */}
      <div className="mb-4 text-center">
        <button
          onClick={openFallback}
          className="text-xs text-slate-400 underline underline-offset-2 hover:text-chain dark:text-slate-500 dark:hover:text-chain"
        >
          Không quét được mã QR?
        </button>
      </div>

      {scanError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
          {scanError}
        </div>
      )}

      {/* Manual entry fallback */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Nhập thủ công
        </h2>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualGs1}
            onChange={(e) => setManualGs1(e.target.value)}
            placeholder="011234567890123410LOT001"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
          <button
            type="submit"
            disabled={!manualValid}
            className="rounded-lg bg-chain px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tra cứu
          </button>
        </form>
        {manualGs1 && !manualValid && (
          <p className="mt-1.5 text-xs text-rose-500">Định dạng GS1 không hợp lệ</p>
        )}
      </div>
      {/* Damaged QR fallback modal */}
      {showFallback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowFallback(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-base font-bold text-slate-950 dark:text-slate-50">
              Tra cứu lô hàng thủ công
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Nhập 6 ký tự cuối của mã lô hàng (in phía dưới mã QR).
            </p>

            <form onSubmit={submitFallback} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  6 ký tự cuối mã lô
                </label>
                <input
                  type="text"
                  value={partialId}
                  onChange={(e) => setPartialId(e.target.value.slice(0, 6))}
                  placeholder="Ví dụ: 4a2f8c"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm tracking-widest outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Lý do không quét được
                </label>
                <textarea
                  value={fallbackReason}
                  onChange={(e) => setFallbackReason(e.target.value)}
                  placeholder="Ví dụ: Nhãn bị rách, dính ướt..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              {fallbackError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
                  {fallbackError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFallback(false)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={partialId.length < 6 || !fallbackReason.trim() || manualOverride.isPending}
                  className="flex-1 rounded-full bg-chain py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {manualOverride.isPending ? "Đang tìm..." : "Tra cứu"}
                </button>
              </div>
            </form>

            <p className="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-600">
              Sự kiện này sẽ được ghi vào nhật ký kiểm tra.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
