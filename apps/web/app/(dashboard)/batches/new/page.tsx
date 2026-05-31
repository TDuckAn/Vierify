"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "../../../../lib/trpc";

const GS1_REGEX = /^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/;

const UNITS = ["kg", "tấn", "lít", "thùng", "cái", "g", "mg", "m³"] as const;

function isMassBalanceError(msg: string) {
  return msg.toLowerCase().includes("mass balance");
}

export default function NewBatchPage(): React.ReactNode {
  const router = useRouter();
  const { data: nodes } = trpc.nodes.list.useQuery({ limit: 100 });
  const { data: allBatches } = trpc.batches.list.useQuery({ limit: 100 });
  const approvedNodes = nodes?.filter((n) => n.kybStatus === "approved") ?? [];

  const [name, setName] = useState("");
  const [gs1TraceId, setGs1TraceId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [uom, setUom] = useState("kg");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [parentSearch, setParentSearch] = useState("");
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const gs1Valid = GS1_REGEX.test(gs1TraceId);
  const gs1Touched = gs1TraceId.length > 0;

  const linkMutation = trpc.genealogy.link.useMutation();

  const createMutation = trpc.batches.create.useMutation({
    onSuccess: async (batch) => {
      if (selectedParentIds.length > 0) {
        try {
          await linkMutation.mutateAsync({
            childBatchId: batch.id,
            parentBatchIds: selectedParentIds
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setApiError(
            isMassBalanceError(msg)
              ? "Lô hàng đã tạo nhưng không thể liên kết lô cha: tổng khối lượng đầu vào vượt quá giới hạn cho phép (±5%). Hãy kiểm tra lại số lượng."
              : `Lô hàng đã tạo nhưng liên kết lô cha thất bại: ${msg}`
          );
          router.push(`/batches/${batch.id}`);
          return;
        }
      }
      router.push(`/batches/${batch.id}`);
    },
    onError: (err) => setApiError(err.message)
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!gs1Valid) return;

    createMutation.mutate({
      gs1TraceId,
      name,
      nodeId,
      quantity: parseFloat(quantity),
      uom,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {})
    });
  }

  function toggleParent(id: string) {
    setSelectedParentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredBatches = (allBatches ?? [])
    .filter(
      (b) =>
        b.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
        b.gs1TraceId.toLowerCase().includes(parentSearch.toLowerCase())
    )
    .sort((a, b) => {
      // FIFO: sort by expiresAt ascending, nulls last
      if (!a.expiresAt && !b.expiresAt) return 0;
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });

  const fifoNudgeBatch = (() => {
    const top = filteredBatches.find(b => b.expiresAt);
    if (!top?.expiresAt) return null;
    const daysLeft = Math.ceil((new Date(top.expiresAt).getTime() - Date.now()) / 86_400_000);
    return daysLeft <= 3 ? { name: top.name, daysLeft } : null;
  })();

  const isPending = createMutation.isPending || linkMutation.isPending;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50">
          ← Lô hàng
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-sm text-slate-950 dark:text-slate-50">Tạo lô hàng mới</span>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-slate-950 dark:text-slate-50">Tạo lô hàng mới</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <Field label="Tên lô hàng" required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Cà phê Arabica — Lứa 1"
            className={inputCls}
          />
        </Field>

        {/* GS1 */}
        <Field
          label="GS1 Trace ID"
          required
          hint="Định dạng: 01{14 chữ số GTIN}10{1-20 ký tự mã lô}"
          error={gs1Touched && !gs1Valid ? "Mã GS1 không đúng định dạng" : undefined}
        >
          <input
            type="text"
            required
            value={gs1TraceId}
            onChange={(e) => setGs1TraceId(e.target.value.trim())}
            placeholder="011234567890123410LOT001"
            className={`${inputCls} font-mono ${gs1Touched && !gs1Valid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600" : ""}`}
          />
        </Field>

        {/* Node */}
        <Field label="Cơ sở sản xuất" required>
          {approvedNodes.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
              Chưa có cơ sở nào được phê duyệt KYB. Vui lòng liên hệ admin.
            </div>
          ) : (
            <select
              required
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className={inputCls}
            >
              <option value="">Chọn cơ sở sản xuất…</option>
              {approvedNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Quantity + UOM */}
        <div className="flex gap-3">
          <Field label="Số lượng" required className="flex-1">
            <input
              type="number"
              required
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="250"
              className={inputCls}
            />
          </Field>
          <Field label="Đơn vị" required className="w-32">
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className={inputCls}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Expiry date */}
        <Field label="Ngày hết hạn" hint="Tùy chọn — để trống nếu không áp dụng">
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className={inputCls}
          />
        </Field>

        {/* Parent batch picker */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Lô hàng cha{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(tùy chọn)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowParentPicker((v) => !v)}
              className="text-sm text-proof hover:underline"
            >
              {showParentPicker ? "Thu gọn" : `+ Thêm lô hàng cha${selectedParentIds.length > 0 ? ` (${selectedParentIds.length})` : ""}`}
            </button>
          </div>

          {selectedParentIds.length > 0 && !showParentPicker && (
            <ul className="mt-2 space-y-1">
              {selectedParentIds.map((pid) => {
                const b = allBatches?.find((x) => x.id === pid);
                return b ? (
                  <li key={pid} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-slate-800 dark:text-slate-200">{b.name}</span>
                    <button type="button" onClick={() => toggleParent(pid)} className="text-xs text-slate-400 hover:text-rose-500">✕</button>
                  </li>
                ) : null;
              })}
            </ul>
          )}

          {showParentPicker && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <input
                type="text"
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc GS1 ID…"
                className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
              />
              {fifoNudgeBatch && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
                  <span className="mt-0.5 text-amber-500">⏰</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>{fifoNudgeBatch.name}</strong> còn{" "}
                    <strong>{fifoNudgeBatch.daysLeft} ngày</strong> · Nên xử lý trước (FIFO)
                  </p>
                </div>
              )}
              {filteredBatches.length === 0 ? (
                <p className="py-2 text-center text-sm text-slate-400">Không tìm thấy lô hàng</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBatches.map((b) => (
                    <li key={b.id}>
                      <label className="flex cursor-pointer items-start gap-3 px-1 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedParentIds.includes(b.id)}
                          onChange={() => toggleParent(b.id)}
                          className="mt-0.5 accent-chain"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{b.name}</p>
                          <p className="truncate font-mono text-xs text-slate-400">{b.gs1TraceId.slice(0, 28)}…</p>
                          {b.expiresAt && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                              HSD: {new Date(b.expiresAt).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
            {apiError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Huỷ
          </Link>
          <button
            type="submit"
            disabled={isPending || (gs1Touched && !gs1Valid)}
            className="flex-1 rounded-lg bg-chain px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Đang tạo…" : "Tạo lô hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus:border-chain";

function Field({
  label,
  required,
  hint,
  error,
  className,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}
