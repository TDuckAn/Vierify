// Static marketing demo — no database, no auth required.
// Shows a realistic sample trace to help visitors understand the product.

const DEMO = {
  gs1TraceId: "VN.GS1.8936012345.2024.11.001",
  name: "Cà phê Arabica Đắk Lắk — Lô 2024-11",
  node: { name: "HTX Cà phê Ea Tu", type: "farm", address: "Huyện Cư M'gar, Đắk Lắk" },
  quantity: "500",
  uom: "kg",
  scanCount: 47,
  txHash: "0x4a7b2c9e1f3d8a6b5e0c4f2d9a8b3e7c1d5f2a9e8b3c6d1e4f7a2b5c8d3e6f9a1",
  docHash: "sha256:e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855",
  timeline: [
    {
      name: "Lô nguyên liệu cà phê thô",
      node: "HTX Cà phê Ea Tu",
      nodeType: "farm",
      date: "02/11/2024",
      confirmed: true
    },
    {
      name: "Lô cà phê rang xay sơ chế",
      node: "Cơ sở chế biến Tây Nguyên",
      nodeType: "factory",
      date: "10/11/2024",
      confirmed: true
    }
  ]
};

const POLYGONSCAN = "https://amoy.polygonscan.com/tx";

const NODE_TYPE_MAP: Record<string, string> = {
  farm: "Nông trại",
  factory: "Nhà máy",
  warehouse: "Kho bãi",
  distributor: "Nhà phân phối",
  retailer: "Cửa hàng"
};

function TimelineRow({
  name,
  nodeName,
  nodeType,
  date,
  isCurrent = false,
  isLast = false,
  confirmed = true
}: {
  name: string;
  nodeName: string;
  nodeType: string;
  date: string;
  isCurrent?: boolean;
  isLast?: boolean;
  confirmed?: boolean;
}) {
  const badgeClass = confirmed
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  const badgeLabel = confirmed ? "Đã xác minh trên Polygon" : "Đang xử lý";

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isCurrent
            ? "bg-emerald-500"
            : "border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
        }`}>
          {isCurrent ? (
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-chain" />
          )}
        </div>
        {!isLast && <div className="my-1 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>
      <div className={`min-w-0 ${isLast ? "pb-0" : "pb-5"}`}>
        <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{name}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {nodeName} · {NODE_TYPE_MAP[nodeType] ?? nodeType}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{date}</p>
        <span className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

export default function DemoTracePage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <a href="/" className="text-lg font-extrabold tracking-tight text-chain">Vierify</a>
          <span className="hidden text-sm font-medium text-slate-500 sm:block">Truy xuất nguồn gốc</span>
        </div>
      </header>

      {/* Demo banner */}
      <div className="border-b border-chain/20 bg-chain/5 py-2 text-center dark:bg-chain/10">
        <p className="text-xs font-semibold text-chain">
          ✦ Đây là trang demo — dữ liệu mẫu, không phải dữ liệu thực tế.{" "}
          <a href="/" className="underline underline-offset-2 hover:opacity-80">Tìm hiểu thêm về Vierify →</a>
        </p>
      </div>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-10 pb-20">

        {/* Batch identity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Vierify trace</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50">{DEMO.name}</h1>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                Nguồn gốc:{" "}
                <span className="text-slate-900 dark:text-slate-200">{DEMO.node.name}</span>
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-400">{DEMO.gs1TraceId}</p>
            </div>
            <span className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Đã xác minh trên Polygon
            </span>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Số lượng", value: `${DEMO.quantity} ${DEMO.uom}` },
            { label: "Loại nút", value: NODE_TYPE_MAP[DEMO.node.type] ?? DEMO.node.type },
            { label: "Lượt quét", value: String(DEMO.scanCount) }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-1.5 text-lg font-bold text-slate-950 dark:text-slate-50">{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Blockchain proof */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-950 dark:text-slate-50">
            <svg className="h-5 w-5 text-proof" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bằng chứng blockchain
          </h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-400">Mã giao dịch</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-700 dark:text-slate-300">{DEMO.txHash}</p>
            </div>
            <a
              href={`${POLYGONSCAN}/${DEMO.txHash}`}
              rel="noreferrer"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-proof/30 bg-proof/5 px-4 py-2 text-sm font-semibold text-proof transition-colors hover:bg-proof/10"
            >
              Xem giao dịch trên Polygonscan Amoy
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>

        {/* Supply chain timeline */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Hành trình chuỗi cung ứng</h2>
          <div className="mt-5">
            {DEMO.timeline.map((hop, i) => (
              <TimelineRow
                key={i}
                name={hop.name}
                nodeName={hop.node}
                nodeType={hop.nodeType}
                date={hop.date}
                confirmed={hop.confirmed}
                isCurrent={false}
                isLast={false}
              />
            ))}
            <TimelineRow
              name={DEMO.name}
              nodeName={DEMO.node.name}
              nodeType={DEMO.node.type}
              date="22/11/2024"
              confirmed
              isCurrent
              isLast
            />
          </div>
        </section>

        {/* Document */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-950 dark:text-slate-50">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Tài liệu đính kèm
          </h2>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-400">Giấy chứng nhận VietGAP · Mã băm SHA-256</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-400">{DEMO.docHash}</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 text-center dark:border-slate-800">
          <p className="text-sm text-slate-400">
            Được cung cấp bởi{" "}
            <a href="/" className="font-semibold text-chain hover:underline">Vierify</a>
            {" "}· Dữ liệu được xác thực trên Polygon blockchain
          </p>
        </footer>
      </main>
    </div>
  );
}
