"use client";

import Link from "next/link";
import { useState } from "react";

import { createBrowserSupabaseClient } from "../../../../lib/supabase";
import { getApiUrl, trpc } from "../../../../lib/trpc";

export default function BatchDetailClient({ id }: { id: string }): React.ReactNode {
  const { data: batch, isPending, isError } = trpc.batches.get.useQuery({ id });
  const { data: genealogy } = trpc.genealogy.get.useQuery({ batchId: id });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadQr() {
    setQrLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const base = getApiUrl().replace("/trpc", "");
    const res = await fetch(`${base}/batches/${id}/qr`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
    });
    if (res.ok) {
      const json = await res.json() as { qrDataUrl: string };
      setQrDataUrl(json.qrDataUrl);
    }
    setQrLoading(false);
  }

  async function copyHash(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        Không tìm thấy lô hàng.{" "}
        <Link href="/dashboard" className="underline">← Quay lại</Link>
      </div>
    );
  }

  const confirmed = batch.bcStatus === 1 && batch.txHash;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-950 dark:hover:text-slate-50">← Lô hàng</Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-slate-950 dark:text-slate-50">{batch.name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">{batch.name}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          confirmed
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          {confirmed ? "Đã xác minh trên Polygon" : "Đang xử lý blockchain"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Số lượng", value: `${batch.quantity} ${batch.uom}` },
          { label: "Lượt quét", value: String(batch.scanCount) },
          { label: "Ngày tạo", value: new Date(batch.createdAt).toLocaleDateString("vi-VN") },
          { label: "Phiên bản", value: `v${batch.version}` }
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{value}</p>
          </div>
        ))}
      </div>

      <Card title="GS1 Trace ID">
        <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{batch.gs1TraceId}</p>
      </Card>

      <Card title="Bằng chứng blockchain">
        {confirmed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-300">
                {batch.txHash!.slice(0, 16)}…{batch.txHash!.slice(-8)}
              </span>
              <button
                onClick={() => copyHash(batch.txHash!)}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {copied ? "Đã sao chép!" : "Sao chép"}
              </button>
            </div>
            <a
              href={`https://amoy.polygonscan.com/tx/${batch.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-proof hover:underline"
            >
              Xem giao dịch trên Polygonscan Amoy ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Giao dịch đang được xử lý trên blockchain Polygon. Vui lòng quay lại sau.
          </p>
        )}
      </Card>

      <Card title="Mã QR truy xuất">
        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-xl" />
            <a
              href={qrDataUrl}
              download={`qr-${batch.gs1TraceId}.png`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Tải xuống PNG
            </a>
          </div>
        ) : (
          <button
            onClick={loadQr}
            disabled={qrLoading}
            className="rounded-lg bg-chain px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
          >
            {qrLoading ? "Đang tải…" : "Xem mã QR"}
          </button>
        )}
      </Card>

      <Card title="Lô hàng cha">
        {genealogy?.parents && genealogy.parents.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {genealogy.parents.map(({ parentBatch }) => (
              <li key={parentBatch.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-950 dark:text-slate-50">{parentBatch.name}</p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {parentBatch.gs1TraceId.slice(0, 24)}…
                  </p>
                </div>
                <Link href={`/batches/${parentBatch.id}`} className="text-sm text-proof hover:underline">
                  Chi tiết →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có lô hàng cha nào được liên kết.</p>
        )}
      </Card>

      {batch.docHash && (
        <Card title="Tài liệu đính kèm">
          <p className="font-mono text-xs text-slate-600 break-all dark:text-slate-400">{batch.docHash}</p>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      {children}
    </div>
  );
}
