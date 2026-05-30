"use client";

import Link from "next/link";
import { useState } from "react";

import { trpc } from "../../../lib/trpc";

const BC_STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: "Đang xử lý", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  1: { label: "Đã xác minh", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
};

const PAGE_SIZE = 20;

type TabKey = "all" | "confirmed" | "pending";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "confirmed", label: "Đã xác minh" },
  { key: "pending", label: "Đang xử lý" }
];

export default function DashboardPage(): React.ReactNode {
  const { data: batches, isPending, isError } = trpc.batches.list.useQuery({ limit: 100 });

  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = (batches ?? []).filter((b) => {
    const matchesTab =
      tab === "all" ||
      (tab === "confirmed" && b.bcStatus === 1) ||
      (tab === "pending" && b.bcStatus !== 1);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.gs1TraceId.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleTabChange(key: TabKey) {
    setTab(key);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Lô hàng của tôi</h1>
        <Link
          href="/batches/new"
          className="rounded-lg bg-chain px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
        >
          + Tạo lô hàng mới
        </Link>
      </div>

      {/* Tabs + Search bar */}
      {!isPending && !isError && batches && batches.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-slate-50"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc GS1 ID…"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 sm:w-64"
          />
        </div>
      )}

      {/* Loading skeletons */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
          Không thể tải danh sách lô hàng. Vui lòng thử lại.
        </div>
      )}

      {/* Empty state — no batches at all */}
      {!isPending && !isError && batches?.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
          <div className="mb-3 text-4xl">📦</div>
          <p className="font-medium text-slate-700 dark:text-slate-300">Chưa có lô hàng nào</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tạo lô hàng đầu tiên để bắt đầu truy xuất nguồn gốc.</p>
          <Link
            href="/batches/new"
            className="mt-5 rounded-lg bg-chain px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            Tạo lô hàng đầu tiên
          </Link>
        </div>
      )}

      {/* Empty state — filter/search yields nothing */}
      {!isPending && !isError && batches && batches.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
          <p className="font-medium text-slate-700 dark:text-slate-300">Không tìm thấy lô hàng</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
        </div>
      )}

      {/* Batch table — desktop */}
      {!isPending && !isError && paginated.length > 0 && (
        <>
          {/* Table: md+ */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  {["Tên lô hàng", "GS1 Trace ID", "Số lượng", "Trạng thái", "Ngày tạo", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((batch) => {
                  const status = BC_STATUS[batch.bcStatus as keyof typeof BC_STATUS] ?? BC_STATUS[0];
                  return (
                    <tr key={batch.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4 font-medium text-slate-950 dark:text-slate-50">{batch.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {batch.gs1TraceId.length > 20 ? batch.gs1TraceId.slice(0, 20) + "…" : batch.gs1TraceId}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        {batch.quantity} {batch.uom}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(batch.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/batches/${batch.id}`} className="font-medium text-proof hover:underline">
                          Chi tiết →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards: mobile */}
          <div className="space-y-3 md:hidden">
            {paginated.map((batch) => {
              const status = BC_STATUS[batch.bcStatus as keyof typeof BC_STATUS] ?? BC_STATUS[0];
              return (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-chain dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-950 dark:text-slate-50">{batch.name}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {batch.gs1TraceId.length > 24 ? batch.gs1TraceId.slice(0, 24) + "…" : batch.gs1TraceId}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {batch.quantity} {batch.uom} · {new Date(batch.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                Lô hàng {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  ← Trước
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
