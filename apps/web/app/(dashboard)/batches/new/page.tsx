"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "../../../../lib/trpc";

const GS1_REGEX = /^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/;

const UNITS = ["kg", "tấn", "lít", "thùng", "cái", "g", "mg", "m³"] as const;

export default function NewBatchPage(): React.ReactNode {
  const router = useRouter();
  const { data: nodes } = trpc.nodes.list.useQuery({ limit: 100 });
  const approvedNodes = nodes?.filter((n) => n.kybStatus === "approved") ?? [];

  const [name, setName] = useState("");
  const [gs1TraceId, setGs1TraceId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [uom, setUom] = useState("kg");
  const [apiError, setApiError] = useState<string | null>(null);

  const gs1Valid = GS1_REGEX.test(gs1TraceId);
  const gs1Touched = gs1TraceId.length > 0;

  const createMutation = trpc.batches.create.useMutation({
    onSuccess: (batch) => router.push(`/batches/${batch.id}`),
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
      uom
    });
  }

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
            disabled={createMutation.isPending || (gs1Touched && !gs1Valid)}
            className="flex-1 rounded-lg bg-chain px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? "Đang tạo…" : "Tạo lô hàng"}
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
