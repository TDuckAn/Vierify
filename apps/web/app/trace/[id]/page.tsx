import { getTraceTimeline, type TraceBatchPayload, type TraceNode } from "./data";

type TracePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const POLYGONSCAN_AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx";

function getPrimaryNode(node: TraceBatchPayload["supply_chain_node"]): TraceNode | undefined {
  if (Array.isArray(node)) {
    return node[0];
  }

  return node ?? undefined;
}

function getBlockchainStatus(batch: TraceBatchPayload): {
  className: string;
  label: string;
} {
  if (batch.bc_status === 1 && batch.tx_hash) {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      label: "Confirmed on Polygon"
    };
  }

  return {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    label: "Blockchain proof pending"
  };
}

export default async function TracePage({
  params
}: TracePageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const timeline = await getTraceTimeline(id);

  if (!timeline.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Vierify trace
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">Trace not found</h1>
        <p className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {timeline.error}
        </p>
      </main>
    );
  }

  const batch = timeline.data;
  const node = getPrimaryNode(batch.supply_chain_node);
  const proofStatus = getBlockchainStatus(batch);
  const txHash = batch.tx_hash;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Vierify trace
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">
              {batch.name ?? "Trace batch"}
            </h1>
            <p className="mt-2 break-all text-sm text-slate-600">{id}</p>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${proofStatus.className}`}
          >
            {proofStatus.label}
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Quantity
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {batch.quantity ?? "-"} {batch.uom ?? ""}
          </p>
        </div>
        <div className="border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Source node
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {node?.name ?? "Unknown"}
          </p>
        </div>
        <div className="border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Batch status
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {batch.bc_status === 1 ? "Verified" : "Pending"}
          </p>
        </div>
      </section>

      <section className="border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Blockchain proof</h2>
        {txHash ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="break-all font-mono text-sm text-slate-700">{txHash}</p>
            <a
              className="w-fit text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
              href={`${POLYGONSCAN_AMOY_TX_BASE_URL}/${txHash}`}
              rel="noreferrer"
              target="_blank"
            >
              View transaction on Polygonscan Amoy
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            This batch has been accepted and is waiting for the Polygon proof
            transaction to confirm.
          </p>
        )}
      </section>
    </main>
  );
}
