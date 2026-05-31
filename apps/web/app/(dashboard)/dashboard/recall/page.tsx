"use client";

import { useState } from "react";

import { trpc } from "../../../../lib/trpc";

type TraceNode = {
  id: string;
  name: string;
  gs1TraceId: string;
  nodeId: string;
  bcStatus: number;
  scanCount: number;
  hop: number;
};

function bcBadge(status: number) {
  return status === 1
    ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Đã xác thực</span>
    : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Đang xử lý</span>;
}

function exportCsv(nodes: TraceNode[]) {
  const header = "Hop,ID,Tên lô,GS1 ID,Blockchain,Lượt quét";
  const rows = nodes.map((n: TraceNode) =>
    [n.hop, n.id, `"${n.name}"`, n.gs1TraceId, n.bcStatus === 1 ? "Đã xác thực" : "Đang xử lý", n.scanCount].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recall-trace-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecallPage(): React.ReactNode {
  const [batchId, setBatchId] = useState("");
  const [searchId, setSearchId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notifyDone, setNotifyDone] = useState(false);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId.trim());

  const { data: nodes, isFetching, error } = trpc.batches.traceForward.useQuery(
    { batchId: searchId! },
    { enabled: !!searchId }
  );

  const notifyMutation = trpc.batches.notifyRecall.useMutation({
    onSuccess: () => { setNotifyDone(true); setSelected(new Set()); },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSelected(new Set());
    setNotifyDone(false);
    setSearchId(batchId.trim());
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(nodes?.map(n => n.id) ?? []));
  }

  const byHop = nodes
    ? [...nodes].sort((a, b) => a.hop - b.hop)
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
          Truy xuất xuôi — Recall Mode
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nhập ID lô hàng nguồn để tìm tất cả lô hàng xuôi dòng và trạng thái lưu kho hiện tại.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={batchId}
          onChange={e => { setBatchId(e.target.value); setNotifyDone(false); }}
          placeholder="Dán UUID lô hàng nguồn..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
        />
        <button
          type="submit"
          disabled={!isUuid || isFetching}
          className="rounded-xl bg-chain px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFetching ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
          {error.message}
        </div>
      )}

      {/* Results */}
      {byHop !== null && (
        <div>
          {byHop.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Không tìm thấy lô hàng xuôi dòng.</p>
              <p className="mt-1 text-xs text-slate-400">Lô hàng này chưa được ghép làm lô cha cho lô nào.</p>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-950 dark:text-slate-50">{byHop.length}</strong> lô hàng tìm thấy
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={() => exportCsv(byHop)}
                    className="rounded-full border border-chain px-3 py-1.5 text-xs font-semibold text-chain hover:bg-chain/5"
                  >
                    ↓ Xuất CSV
                  </button>
                  <button
                    onClick={() => notifyMutation.mutate({ batchIds: selected.size > 0 ? [...selected] : byHop.map(n => n.id) })}
                    disabled={notifyMutation.isPending}
                    className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                  >
                    {notifyMutation.isPending ? "Đang gửi..." : "🔔 Gửi cảnh báo"}
                  </button>
                </div>
              </div>

              {notifyDone && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Đã ghi nhật ký cảnh báo cho {byHop.length} lô hàng.
                </div>
              )}

              {/* Tree table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                        <th className="w-8 px-3 py-2.5" />
                        {["Cấp", "Tên lô", "GS1 ID", "Blockchain", "Lượt quét"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byHop.map(node => (
                        <tr
                          key={node.id}
                          className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${selected.has(node.id) ? "bg-chain/5 dark:bg-chain/10" : ""}`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(node.id)}
                              onChange={() => toggleSelect(node.id)}
                              className="h-3.5 w-3.5 accent-chain"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {node.hop}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-950 dark:text-slate-50">{node.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-slate-400">{node.id.slice(0, 8)}…</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {node.gs1TraceId.slice(0, 24)}…
                          </td>
                          <td className="px-4 py-3">{bcBadge(node.bcStatus)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{node.scanCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400 dark:text-slate-600">
                Kết quả giới hạn 10 cấp độ xuôi dòng. Nhấn "Gửi cảnh báo" để ghi sự kiện recall vào nhật ký kiểm tra.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
