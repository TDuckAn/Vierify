"use client";

import Link from "next/link";
import { useState } from "react";

import { trpc } from "../../../lib/trpc";

const PLAN_CONFIG = {
  free:         { label: "Free",         batchLimit: 30 },
  basic:        { label: "Basic",        batchLimit: 100 },
  advanced:     { label: "Advanced",     batchLimit: 1000 },
  professional: { label: "Professional", batchLimit: Infinity },
  enterprise:   { label: "Enterprise",   batchLimit: Infinity },
};

const STATUS_STYLES = {
  paid:    { label: "Đã thanh toán", className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  pending: { label: "Chờ thanh toán", className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  failed:  { label: "Thất bại", className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
};

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function XSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

const UPGRADE_TIERS = [
  { id: "basic",        name: "Basic",        price: "99.000đ/tháng",      batches: "100 lô/tháng",      featured: false },
  { id: "advanced",     name: "Advanced",     price: "499.000đ/tháng",     batches: "500–1.000/tháng",   featured: false },
  { id: "professional", name: "Professional", price: "4.999.999đ/tháng",   batches: "Không giới hạn",    featured: true  },
  { id: "enterprise",   name: "Enterprise",   price: "Liên hệ",            batches: "Không giới hạn",    featured: false },
];

export default function SubscriptionPage(): React.ReactNode {
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const { data: subData, isPending: subPending } = trpc.billing.getCurrentSubscription.useQuery();
  const { data: invoiceData, isPending: invoicePending } = trpc.billing.getInvoices.useQuery();

  const tier = subData?.tier ?? "free";
  const batchesUsed = subData?.batchesUsed ?? 0;
  const trialEndsAt = subData?.trialEndsAt
    ? new Date(subData.trialEndsAt).toLocaleDateString("vi-VN")
    : null;

  const plan = PLAN_CONFIG[tier];
  const batchLimit = plan.batchLimit;
  const usagePct = batchLimit === Infinity ? 0 : Math.round((batchesUsed / batchLimit) * 100);
  const isFree = tier === "free";

  if (subPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
          Gói dịch vụ của bạn
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Quay lại
        </Link>
      </div>

      {/* Current plan card */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gói hiện tại</div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-extrabold text-chain">{plan.label}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckIcon /> Đang hoạt động
              </span>
            </div>
            {isFree && trialEndsAt && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                ⏰ Gói Free hết hạn vào {trialEndsAt} · Nâng cấp để tiếp tục
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {!isFree && (
              <button
                onClick={() => setShowCancel(true)}
                className="rounded-full border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500 hover:text-white transition-colors"
              >
                Hủy đăng ký
              </button>
            )}
            <button
              onClick={() => setShowPlans((v) => !v)}
              className="rounded-full bg-chain px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
            >
              Nâng cấp gói
            </button>
          </div>
        </div>

        {batchLimit !== Infinity ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Lô hàng đã dùng tháng này</span>
              <span className={`font-bold ${usagePct > 85 ? "text-amber-500" : "text-slate-950 dark:text-slate-50"}`}>
                {batchesUsed} / {batchLimit}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${usagePct}%`, background: usagePct > 85 ? "#F59E0B" : "#14B8A6" }}
              />
            </div>
            {usagePct > 85 && (
              <p className="mt-1.5 text-xs text-amber-500">
                Sắp đạt giới hạn —{" "}
                <button
                  onClick={() => setShowPlans(true)}
                  className="font-bold underline hover:no-underline"
                >
                  Nâng cấp ngay
                </button>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Số lô hàng: <strong className="text-slate-950 dark:text-slate-50">Không giới hạn</strong> · {batchesUsed} lô đã tạo tháng này
          </p>
        )}
      </div>

      {/* Upgrade plans (collapsible) */}
      {showPlans && (
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Chọn gói nâng cấp:</p>
          <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {UPGRADE_TIERS.map((t) => (
              <Link
                key={t.id}
                href="/onboarding/plan"
                className={`relative flex min-w-[180px] flex-col gap-3 rounded-2xl border p-5 transition-all hover:shadow-md lg:min-w-0 ${
                  t.featured
                    ? "border-chain bg-white shadow-lg shadow-chain/10 dark:bg-slate-900"
                    : "border-slate-200 bg-white hover:border-chain dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chain px-3 py-0.5 text-[10px] font-bold text-white">
                    Lựa chọn tốt nhất
                  </div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-widest text-chain">{t.name}</div>
                <div className="font-extrabold text-slate-950 dark:text-slate-50">{t.price}</div>
                <div className="text-xs text-slate-400">{t.batches}</div>
                <span className="mt-auto rounded-full border border-slate-300 py-1.5 text-center text-xs font-semibold text-slate-600 hover:border-chain hover:text-chain transition-colors dark:border-slate-600 dark:text-slate-300">
                  Chọn gói này
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Invoice history */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Lịch sử thanh toán</div>
        {invoicePending ? (
          <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ) : !invoiceData || invoiceData.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có hóa đơn nào. Nâng cấp gói để bắt đầu.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  {["Kỳ thanh toán", "Số tiền", "Phương thức", "Trạng thái", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoiceData.map((inv) => {
                  const st = STATUS_STYLES[inv.status] ?? STATUS_STYLES.pending;
                  const amountFormatted = new Intl.NumberFormat("vi-VN").format(inv.amountVnd) + "đ";
                  const methodLabel = inv.method === "payos" ? "PayOS" : "MoMo";
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-4 py-3 text-sm">{inv.period}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{amountFormatted}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{methodLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-semibold text-proof hover:underline">↓ PDF</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {showCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setShowCancel(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-bold text-slate-950 dark:text-slate-50">Hủy đăng ký?</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Tài khoản sẽ chuyển về gói Free vào cuối kỳ thanh toán hiện tại.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 rounded-full border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors dark:border-slate-600 dark:text-slate-300"
              >
                Không, giữ lại
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 rounded-full border border-rose-400 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-500 hover:text-white transition-colors"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
