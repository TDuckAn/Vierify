import { brandName, proofStatuses } from "@vierify/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-950">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-chain">
          {proofStatuses.pending}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold">{brandName}</h1>
        <p className="max-w-2xl text-lg text-slate-700">
          Supply chain traceability for merchants and consumers, with product
          batch proofs prepared for Polygon verification.
        </p>
      </section>
    </main>
  );
}
