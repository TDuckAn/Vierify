"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingHeader } from "../layout";
import { trpc } from "../../../lib/trpc";

const MST_REGEX = /^\d{10}(-\d{3})?$/;
const NODE_TYPES = [
  { value: "farm", label: "Nông trại" },
  { value: "factory", label: "Nhà máy" },
  { value: "warehouse", label: "Kho bãi" },
  { value: "distributor", label: "Nhà phân phối" },
  { value: "retailer", label: "Cửa hàng" },
] as const;

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export default function OnboardingProfilePage(): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mst, setMst] = useState("");
  const [type, setType] = useState("");
  const [address, setAddress] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const mstTouched = mst.length > 0;
  const mstValid = MST_REGEX.test(mst);

  const createNode = trpc.nodes.create.useMutation({
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => setApiError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mstValid) { setApiError("Mã số thuế không đúng định dạng."); return; }
    setApiError(null);
    createNode.mutate({
      name,
      taxCode: mst,
      nodeType: type,
      nodeAddress: address,
      isIndividual,
      orgId: crypto.randomUUID(), // will be set properly by billing.activateMerchant (T52)
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <OnboardingHeader step={2} />

      <div className="mx-auto max-w-xl px-6 py-10 pb-20">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 mb-1">Hồ sơ doanh nghiệp</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Thông tin này sẽ xuất hiện trên trang truy xuất nguồn gốc của lô hàng.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Tên doanh nghiệp / cơ sở" required>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nông trại Hòa Lộc"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </Field>

          <Field
            label="Mã số thuế (MST)"
            required
            hint="10 chữ số (doanh nghiệp) hoặc 13 chữ số (chi nhánh)"
            error={mstTouched && !mstValid ? "Mã số thuế phải có 10 hoặc 13 chữ số" : null}
          >
            <input
              type="text"
              required
              value={mst}
              onChange={(e) => setMst(e.target.value.trim())}
              placeholder="0123456789"
              className={`w-full rounded-xl border px-4 py-3 font-mono text-sm text-slate-950 outline-none transition focus:ring-2 dark:text-slate-50 dark:bg-slate-800 ${
                mstTouched && !mstValid
                  ? "border-rose-400 bg-rose-50 focus:border-rose-400 focus:ring-rose-400/20 dark:bg-rose-950/20 dark:border-rose-700"
                  : "border-slate-200 bg-white focus:border-chain focus:ring-chain/20 dark:border-slate-700"
              }`}
            />
          </Field>

          <Field label="Loại nút chuỗi cung ứng" required>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            >
              <option value="">Chọn loại nút…</option>
              {NODE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Địa chỉ" required>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              style={{ minHeight: 80 }}
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 py-2">
            <input
              type="checkbox"
              checked={isIndividual}
              onChange={(e) => setIsIndividual(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-chain"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">Đây là hộ kinh doanh cá nhân</span>
          </label>

          {isIndividual && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 leading-relaxed dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              ℹ️ Thông tin nhận dạng của bạn sẽ được ẩn trên trang công khai theo quy định Nghị định 13/2023/NĐ-CP.
            </div>
          )}

          {apiError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={createNode.isPending}
            className="w-full rounded-full bg-chain py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {createNode.isPending ? "Đang hoàn tất…" : "Hoàn tất đăng ký →"}
          </button>
        </form>
      </div>
    </div>
  );
}
