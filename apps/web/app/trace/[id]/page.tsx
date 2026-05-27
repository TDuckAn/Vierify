import { getTraceTimeline, type ParentBatchEntry, type TraceBatchPayload, type TraceNode } from "./data";

type TracePageProps = {
  params: Promise<{ id: string }>;
};

const POLYGONSCAN_AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx";

function getPrimaryNode(
  node: TraceBatchPayload["supply_chain_node"]
): TraceNode | undefined {
  if (Array.isArray(node)) return node[0];
  return node ?? undefined;
}

function getBlockchainStatus(batch: TraceBatchPayload) {
  if (batch.bc_status === 1 && batch.tx_hash) {
    return {
      dot: "bg-emerald-500",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      label: "Đã xác minh trên Polygon",
      confirmed: true
    } as const;
  }
  return {
    dot: "bg-amber-400",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Đang xử lý blockchain",
    confirmed: false
  } as const;
}

function truncateHash(hash: string, chars = 12): string {
  return `${hash.slice(0, chars)}...${hash.slice(-6)}`;
}

function NodeTypeLabel(type: string | undefined | null): string {
  const map: Record<string, string> = {
    farm: "Nông trại",
    factory: "Nhà máy",
    warehouse: "Kho bãi",
    distributor: "Nhà phân phối",
    retailer: "Cửa hàng"
  };
  return type ? (map[type] ?? type) : "—";
}

function TimelineRow({
  name,
  nodeName,
  nodeType,
  badgeClass,
  badgeLabel,
  dotClass,
  isCurrent = false,
  isLast = false
}: {
  name: string;
  nodeName?: string;
  nodeType?: string;
  badgeClass: string;
  badgeLabel: string;
  dotClass: string;
  isCurrent?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isCurrent ? dotClass : "border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
          }`}
        >
          {isCurrent ? (
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          ) : (
            <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
          )}
        </div>
        {!isLast && <div className="my-1 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>
      <div className={`min-w-0 ${isLast ? "pb-0" : "pb-5"}`}>
        <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{name}</p>
        {nodeName && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {nodeName}
            {nodeType ? ` · ${NodeTypeLabel(nodeType)}` : ""}
          </p>
        )}
        <span className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

export default async function TracePage({
  params
}: TracePageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const timeline = await getTraceTimeline(id);

  if (!timeline.ok) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
            <a
              href="/"
              className="text-lg font-extrabold tracking-tight text-chain"
            >
              Vierify
            </a>
            <span className="text-sm font-medium text-slate-500">
              Truy xuất nguồn gốc
            </span>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-5 py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Vierify trace
          </p>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">
            Không tìm thấy lô hàng
          </h1>
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-400">
            {timeline.error}
          </p>
          <a
            href="/"
            className="mt-4 w-fit text-sm font-semibold text-chain hover:underline"
          >
            ← Về trang chủ
          </a>
        </main>
      </div>
    );
  }

  const batch = timeline.data;
  const parents = timeline.parents;
  const node = getPrimaryNode(batch.supply_chain_node);
  const proof = getBlockchainStatus(batch);
  const txHash = batch.tx_hash;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <a href="/" className="text-lg font-extrabold tracking-tight text-chain">
            Vierify
          </a>
          <span className="hidden text-sm font-medium text-slate-500 sm:block">
            Truy xuất nguồn gốc
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-10 pb-20">

        {/* Batch identity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Vierify trace
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50">
                {batch.name ?? "Lô hàng không tên"}
              </h1>
              {node?.name && (
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Nguồn gốc: <span className="text-slate-900 dark:text-slate-200">{node.name}</span>
                </p>
              )}
              <p className="mt-2 break-all font-mono text-xs text-slate-400">
                {id}
              </p>
            </div>
            {/* Status badge */}
            <span
              className={`flex w-fit shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${proof.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${proof.dot}`} />
              {proof.label}
            </span>
          </div>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Số lượng",
              value: batch.quantity
                ? `${batch.quantity} ${batch.uom ?? ""}`
                : "—"
            },
            {
              label: "Loại nút",
              value: NodeTypeLabel(
                node && "node_type" in node
                  ? (node as Record<string, unknown>)["node_type"] as string
                  : undefined
              )
            },
            {
              label: "Lượt quét",
              value:
                batch.scan_count != null && batch.scan_count !== undefined
                  ? String(batch.scan_count as number)
                  : "—"
            }
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1.5 text-lg font-bold text-slate-950 dark:text-slate-50">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Blockchain proof */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-950 dark:text-slate-50">
            <svg
              className="h-5 w-5 text-proof"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bằng chứng blockchain
          </h2>

          {txHash ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-medium text-slate-400">Mã giao dịch</p>
                <p className="mt-1 break-all font-mono text-sm text-slate-700 dark:text-slate-300">
                  {txHash}
                </p>
              </div>
              <a
                href={`${POLYGONSCAN_AMOY_TX_BASE_URL}/${txHash}`}
                rel="noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-proof/30 bg-proof/5 px-4 py-2 text-sm font-semibold text-proof transition-colors hover:bg-proof/10 dark:bg-proof/10 dark:hover:bg-proof/20"
              >
                Xem giao dịch trên Polygonscan Amoy
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                  ⏳
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                    Đang chờ xác nhận
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Lô hàng đã được ghi nhận và đang chờ giao dịch Polygon xác nhận.
                    Quá trình này thường mất vài phút.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Supply chain timeline */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">
            Hành trình chuỗi cung ứng
          </h2>
          <div className="mt-5">
            {/* Parent hops (oldest first) */}
            {parents.map((parent) => {
              const parentNode = getPrimaryNode(parent.supply_chain_node as TraceBatchPayload["supply_chain_node"]);
              const parentProof = getBlockchainStatus(parent as unknown as TraceBatchPayload);
              return (
                <TimelineRow
                  key={parent.id}
                  name={parent.name ?? "Lô hàng cha"}
                  nodeName={parentNode?.name ?? undefined}
                  nodeType={parentNode?.node_type ?? undefined}
                  badgeClass={parentProof.badge}
                  badgeLabel={parentProof.label}
                  dotClass="bg-chain"
                  isCurrent={false}
                />
              );
            })}

            {/* Current batch — always last */}
            <TimelineRow
              name={batch.name ?? "Lô hàng hiện tại"}
              nodeName={node?.name ?? undefined}
              nodeType={node?.node_type ?? undefined}
              badgeClass={proof.badge}
              badgeLabel={proof.label}
              dotClass="bg-emerald-500"
              isCurrent
              isLast
            />

            {/* Empty state when no parents */}
            {parents.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">
                Chưa có lô hàng cha. Liên kết qua MerchantApp để xem toàn bộ chuỗi cung ứng.
              </p>
            )}
          </div>
        </section>

        {/* Document hash */}
        {typeof batch.doc_hash === "string" && batch.doc_hash && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-950 dark:text-slate-50">
              <svg
                className="h-5 w-5 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Tài liệu đính kèm
            </h2>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-400">
                Mã băm tài liệu (SHA-256)
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-400">
                {truncateHash(batch.doc_hash, 20)}
              </p>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 text-center dark:border-slate-800">
          <p className="text-sm text-slate-400">
            Được cung cấp bởi{" "}
            <a href="/" className="font-semibold text-chain hover:underline">
              Vierify
            </a>{" "}
            · Dữ liệu được xác thực trên Polygon blockchain
          </p>
        </footer>
      </main>
    </div>
  );
}
