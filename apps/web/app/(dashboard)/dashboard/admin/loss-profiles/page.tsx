"use client";

import { useState } from "react";

import { trpc } from "../../../../../lib/trpc";

type LossProfile = {
  id: string;
  productType: string;
  processStep: string;
  minLossPct: string;
  maxLossPct: string;
  createdAt: string | null;
};

type FormState = {
  productType: string;
  processStep: string;
  minLossPct: string;
  maxLossPct: string;
};

const EMPTY_FORM: FormState = { productType: "", processStep: "", minLossPct: "", maxLossPct: "" };

function pct(v: string) { return parseFloat(v); }
function formValid(f: FormState) {
  const min = pct(f.minLossPct), max = pct(f.maxLossPct);
  return f.productType.trim() && f.processStep.trim() &&
    !isNaN(min) && !isNaN(max) && min >= 0 && max <= 100 && min <= max;
}

export default function LossProfilesPage(): React.ReactNode {
  const utils = trpc.useUtils();
  const { data: profiles = [], isPending } = trpc.lossProfiles.list.useQuery();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  function onError(err: { message: string }) {
    setApiError(err.message);
  }

  const createMutation = trpc.lossProfiles.create.useMutation({
    onSuccess: () => { utils.lossProfiles.list.invalidate(); setShowAdd(false); setAddForm(EMPTY_FORM); setApiError(null); },
    onError,
  });

  const updateMutation = trpc.lossProfiles.update.useMutation({
    onSuccess: () => { utils.lossProfiles.list.invalidate(); setEditId(null); setApiError(null); },
    onError,
  });

  const deleteMutation = trpc.lossProfiles.delete.useMutation({
    onSuccess: () => { utils.lossProfiles.list.invalidate(); setDeleteId(null); setApiError(null); },
    onError,
  });

  function startEdit(p: LossProfile) {
    setEditId(p.id);
    setEditForm({ productType: p.productType, processStep: p.processStep, minLossPct: p.minLossPct, maxLossPct: p.maxLossPct });
    setApiError(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            Hồ sơ hao hụt
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cấu hình ngưỡng hao hụt cho từng loại sản phẩm và bước xử lý.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setApiError(null); }}
          className="rounded-full bg-chain px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
        >
          + Thêm hồ sơ
        </button>
      </div>

      {apiError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
          {apiError}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="mb-6 rounded-2xl border border-chain/30 bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Thêm hồ sơ mới</h2>
          <ProfileForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={() => createMutation.mutate({ productType: addForm.productType.trim(), processStep: addForm.processStep.trim(), minLossPct: pct(addForm.minLossPct), maxLossPct: pct(addForm.maxLossPct) })}
            onCancel={() => { setShowAdd(false); setAddForm(EMPTY_FORM); }}
            isPending={createMutation.isPending}
            submitLabel="Lưu"
          />
        </div>
      )}

      {/* Profiles table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {isPending ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : profiles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-400">Chưa có hồ sơ nào.</p>
            <p className="mt-1 text-xs text-slate-400">
              Khi chưa cấu hình, hệ thống dùng ngưỡng mặc định 5% cho tất cả bước xử lý.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  {["Loại sản phẩm", "Bước xử lý", "Hao hụt tối thiểu", "Hao hụt tối đa", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    {editId === p.id ? (
                      <td colSpan={5} className="px-4 py-3">
                        <ProfileForm
                          form={editForm}
                          onChange={setEditForm}
                          onSubmit={() => updateMutation.mutate({ id: p.id, productType: editForm.productType.trim(), processStep: editForm.processStep.trim(), minLossPct: pct(editForm.minLossPct), maxLossPct: pct(editForm.maxLossPct) })}
                          onCancel={() => setEditId(null)}
                          isPending={updateMutation.isPending}
                          submitLabel="Cập nhật"
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm font-medium text-slate-950 dark:text-slate-50">{p.productType}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.processStep}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            ≥ {parseFloat(p.minLossPct).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            ≤ {parseFloat(p.maxLossPct).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(p)} className="text-xs font-semibold text-chain hover:underline">Sửa</button>
                            <button onClick={() => setDeleteId(p.id)} className="text-xs font-semibold text-rose-500 hover:underline">Xoá</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-600">
        Hao hụt thực tế nằm ngoài khoảng cho phép sẽ bị từ chối khi ghép lô hàng (HTTP 409).
        Nếu không cấu hình, ngưỡng mặc định là 0–5%.
      </p>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <h2 className="mb-2 text-base font-bold text-slate-950 dark:text-slate-50">Xoá hồ sơ?</h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300">Huỷ</button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteId })}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-full bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Đang xoá..." : "Xác nhận xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileForm({ form, onChange, onSubmit, onCancel, isPending, submitLabel }: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const valid = formValid(form);
  const min = pct(form.minLossPct), max = pct(form.maxLossPct);
  const bandError = !isNaN(min) && !isNaN(max) && min > max;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Loại sản phẩm</label>
          <input
            type="text"
            value={form.productType}
            onChange={e => onChange({ ...form, productType: e.target.value })}
            placeholder="Ví dụ: Thịt heo đông lạnh"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bước xử lý</label>
          <input
            type="text"
            value={form.processStep}
            onChange={e => onChange({ ...form, processStep: e.target.value })}
            placeholder="Ví dụ: Lọc xương"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hao hụt tối thiểu (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.minLossPct}
            onChange={e => onChange({ ...form, minLossPct: e.target.value })}
            placeholder="0"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hao hụt tối đa (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.maxLossPct}
            onChange={e => onChange({ ...form, maxLossPct: e.target.value })}
            placeholder="5"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </div>
      </div>
      {bandError && (
        <p className="text-xs text-rose-500">Hao hụt tối thiểu phải ≤ tối đa</p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!valid || isPending}
          className="rounded-full bg-chain px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Đang lưu..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
