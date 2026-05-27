import { ScrollReveal } from "../components/scroll-reveal";
import { ThemeToggle } from "../components/theme-toggle";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-500"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconQr() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M17 17h3M14 20h3" />
    </svg>
  );
}

function IconChain() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconProof() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function IconRealtime() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconTimeline() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <circle cx="12" cy="8" r="2" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="text-xl font-extrabold tracking-tight text-chain">
          Vierify
        </a>
        <div className="hidden items-center gap-7 sm:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
          >
            Cách hoạt động
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
          >
            Tính năng
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
          >
            Bảng giá
          </a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#pricing"
            className="rounded-full bg-chain px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            Bắt đầu miễn phí
          </a>
        </div>
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-chain/5 blur-3xl dark:bg-chain/10" />
        <div className="absolute right-0 top-1/4 h-[300px] w-[400px] rounded-full bg-proof/5 blur-3xl dark:bg-proof/10" />
      </div>
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="animate-fade-in-up">
          <span className="inline-block rounded-full border border-chain/30 bg-chain/10 px-4 py-1.5 text-sm font-semibold text-chain">
            Powered by Polygon Blockchain
          </span>
        </div>
        <h1 className="animate-fade-in-up delay-100 mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-slate-50 lg:text-7xl">
          Truy xuất nguồn gốc{" "}
          <span className="text-chain">minh bạch</span> từ nông trại đến tay bạn
        </h1>
        <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Vierify giúp doanh nghiệp Việt Nam số hoá chuỗi cung ứng, lưu vết từng lô
          hàng và tạo niềm tin với người tiêu dùng bằng bằng chứng blockchain không
          thể giả mạo.
        </p>
        <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#pricing"
            className="rounded-full bg-chain px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-teal-600 hover:shadow-md"
          >
            Bắt đầu miễn phí
          </a>
          <a
            href="/trace/demo"
            className="rounded-full border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-chain hover:text-chain dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-chain dark:hover:text-chain"
          >
            Xem demo →
          </a>
        </div>

        {/* Product preview */}
        <div className="animate-fade-in delay-400 mx-auto mt-20 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-4 text-xs text-slate-400">vierify.vercel.app/trace/GS1-7869823...</span>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Vierify trace
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                    Cà phê Arabica Đắk Lắk — Lô 2024-11
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400">
                  ✓ Đã xác minh trên Polygon
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: "Số lượng", value: "500 kg" },
                  { label: "Nút nguồn gốc", value: "HTX Cà phê Ea Tu" },
                  { label: "Trạng thái", value: "Đã xác minh" }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Mã giao dịch blockchain
                </p>
                <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                  0x3a8f...c4d2 —{" "}
                  <span className="text-proof underline-offset-4 hover:underline">
                    Xem trên Polygonscan Amoy
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  const badges = [
    "Polygon Blockchain",
    "GS1 Vietnam",
    "TCVN 13274:2020",
    "ISO 22000 Ready",
    "Nghị định 13/2023/NĐ-CP"
  ];
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Được thiết kế cho tiêu chuẩn ngành
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────

function ProblemSolution() {
  return (
    <section className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Problem */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 dark:border-rose-900/40 dark:bg-rose-900/10">
            <span className="text-sm font-bold uppercase tracking-widest text-rose-400">
              Vấn đề
            </span>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
              Chuỗi cung ứng thiếu minh bạch
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Người tiêu dùng không biết sản phẩm đến từ đâu",
                "Hàng giả, hàng nhái len lỏi vào chuỗi phân phối",
                "Doanh nghiệp mất uy tín khi xảy ra sự cố thực phẩm",
                "Không có bằng chứng số về nguồn gốc khi kiểm tra"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-900/40">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="rounded-2xl border border-chain/20 bg-chain/5 p-8 dark:border-chain/20 dark:bg-chain/10">
            <span className="text-sm font-bold uppercase tracking-widest text-chain">
              Giải pháp Vierify
            </span>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
              Mọi lô hàng đều có dấu vết số
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Mã QR duy nhất cho mỗi lô — người tiêu dùng quét là biết ngay",
                "Dữ liệu được mã hoá và ghi lên Polygon blockchain — không thể sửa đổi",
                "Bằng chứng giao dịch blockchain công khai, bất kỳ ai cũng xác minh được",
                "Tuân thủ GS1 Vietnam và quy định truy xuất nguồn gốc"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chain/20 text-chain">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Quét và tạo lô hàng",
      body: "Nhân viên dùng ứng dụng MerchantApp quét mã GS1, nhập thông tin lô hàng (số lượng, GPS, tài liệu). Dữ liệu được gửi ngay lên máy chủ.",
      icon: <IconQr />
    },
    {
      num: "02",
      title: "Kết nối chuỗi cung ứng",
      body: "Liên kết lô hàng con với lô hàng cha để tạo sơ đồ nguồn gốc đầy đủ. Hệ thống tự động kiểm tra cân bằng khối lượng và phát hiện vòng lặp.",
      icon: <IconChain />
    },
    {
      num: "03",
      title: "Người tiêu dùng xác minh",
      body: "Khách hàng quét mã QR trên bao bì → trang truy xuất nguồn gốc hiện ra với toàn bộ hành trình và bằng chứng Polygon blockchain.",
      icon: <IconProof />
    }
  ];

  return (
    <section id="how-it-works" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            Cách hoạt động
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            Ba bước đơn giản
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Từ nhà máy đến tay người tiêu dùng — minh bạch hoàn toàn
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="relative rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <span className="absolute right-6 top-6 text-5xl font-black text-slate-100 dark:text-slate-800">
                {step.num}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chain/10 text-chain">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-slate-50">
                {step.title}
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: <IconQr />,
      title: "Quét mã GS1 Barcode",
      body: "Hỗ trợ đầy đủ chuẩn GS1 GTIN theo TCVN 13274:2020. Tạo mã QR PNG cho mỗi lô hàng, sẵn sàng in ấn."
    },
    {
      icon: <IconProof />,
      title: "Bằng chứng blockchain",
      body: "Mỗi lô hàng được băm SHA-256 và ghi lên Polygon. Mã giao dịch công khai — bất kỳ ai cũng xác minh được."
    },
    {
      icon: <IconChain />,
      title: "Sơ đồ nguồn gốc thời gian thực",
      body: "Kết nối lô cha — lô con, kiểm tra cân bằng khối lượng tự động, phát hiện vòng lặp ngay khi nhập liệu."
    },
    {
      icon: <IconDoc />,
      title: "Upload tài liệu",
      body: "Đính kèm giấy chứng nhận, kiểm định chất lượng vào từng lô. File được băm và lưu trữ bảo mật."
    },
    {
      icon: <IconTimeline />,
      title: "Trang truy xuất B2C",
      body: "Người tiêu dùng quét QR → xem hành trình đầy đủ từ nguồn gốc đến tay mình, với trạng thái blockchain rõ ràng."
    },
    {
      icon: <IconRealtime />,
      title: "Cập nhật theo thời gian thực",
      body: "Trạng thái blockchain, số lần quét, liên kết phả hệ — tất cả cập nhật ngay khi có thay đổi."
    }
  ];

  return (
    <section id="features" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            Tính năng
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            Đầy đủ công cụ cho chuỗi cung ứng
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 p-6 transition-all hover:border-chain/40 hover:shadow-lg dark:border-slate-800 dark:hover:border-chain/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-chain/10 group-hover:text-chain dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-chain/10 dark:group-hover:text-chain">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-slate-50">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

type PricingFeature = {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  advanced: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
};

const PRICING_FEATURES: PricingFeature[] = [
  {
    name: "Sơ đồ hành trình mẫu",
    free: true,
    basic: true,
    advanced: true,
    professional: true,
    enterprise: true
  },
  {
    name: "Xác thực blockchain (Polygon)",
    free: false,
    basic: true,
    advanced: true,
    professional: true,
    enterprise: true
  },
  {
    name: "Quét mã GS1 Barcode",
    free: false,
    basic: false,
    advanced: true,
    professional: true,
    enterprise: true
  },
  {
    name: "Dashboard quản lý",
    free: false,
    basic: false,
    advanced: "Cơ bản",
    professional: "Nâng cao",
    enterprise: "Tùy biến"
  },
  {
    name: "Hệ thống Referral (Mã giới thiệu)",
    free: false,
    basic: false,
    advanced: false,
    professional: true,
    enterprise: true
  },
  {
    name: "Thẩm định KYB ưu tiên (< 24h)",
    free: false,
    basic: false,
    advanced: false,
    professional: true,
    enterprise: true
  },
  {
    name: "Vị trí nổi bật trên Marketplace",
    free: false,
    basic: false,
    advanced: false,
    professional: true,
    enterprise: true
  },
  {
    name: "Account Manager riêng",
    free: false,
    basic: false,
    advanced: false,
    professional: false,
    enterprise: true
  },
  {
    name: "Market Insights & Đối soát",
    free: false,
    basic: false,
    advanced: false,
    professional: false,
    enterprise: true
  },
  {
    name: "White-label trang truy xuất",
    free: false,
    basic: false,
    advanced: false,
    professional: false,
    enterprise: true
  }
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>;
  }
  return value ? <IconCheck /> : <IconMinus />;
}

type Tier = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  batches: string;
  users: string;
  frequency: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    subtitle: "Trải nghiệm",
    price: "0đ",
    period: "3 tháng miễn phí",
    batches: "30 lô/tháng",
    users: "1 người dùng",
    frequency: "Cuối ngày",
    cta: "Bắt đầu miễn phí",
    highlighted: false
  },
  {
    id: "basic",
    name: "Basic",
    subtitle: "Cơ bản",
    price: "99.000đ",
    period: "/tháng",
    batches: "100 lô/tháng",
    users: "1 người dùng",
    frequency: "6–12 giờ",
    cta: "Chọn gói này",
    highlighted: false
  },
  {
    id: "advanced",
    name: "Advanced",
    subtitle: "Nâng cao",
    price: "499.000đ",
    period: "/tháng",
    batches: "500–1.000 lô/tháng",
    users: "5 người dùng",
    frequency: "1–2 giờ",
    cta: "Chọn gói này",
    highlighted: false
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "Chuyên nghiệp",
    price: "4.999.999đ",
    period: "/tháng",
    batches: "Không giới hạn",
    users: "20 người dùng",
    frequency: "Real-time",
    cta: "Chọn gói này",
    highlighted: true,
    badge: "Lựa chọn tốt nhất"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Tập đoàn",
    price: "Liên hệ",
    period: "",
    batches: "Không giới hạn",
    users: "Không giới hạn",
    frequency: "Real-time",
    cta: "Liên hệ với chúng tôi",
    highlighted: false
  }
];

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex min-w-[240px] flex-col rounded-2xl border p-6 transition-all sm:min-w-[260px] lg:min-w-0 ${
        tier.highlighted
          ? "border-chain bg-white shadow-xl shadow-chain/10 dark:bg-slate-900"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {tier.badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-chain px-4 py-1 text-xs font-bold text-white">
          {tier.badge}
        </span>
      )}

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {tier.name}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{tier.subtitle}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-950 dark:text-slate-50">
            {tier.price}
          </span>
          {tier.period && (
            <span className="text-sm text-slate-400">{tier.period}</span>
          )}
        </div>
      </div>

      <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <li>📦 {tier.batches}</li>
        <li>👤 {tier.users}</li>
        <li>⏱ {tier.frequency}</li>
      </ul>

      <a
        href="#"
        className={`mt-auto rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          tier.highlighted
            ? "bg-chain text-white hover:bg-teal-600"
            : tier.id === "enterprise"
              ? "border border-slate-300 text-slate-700 hover:border-chain hover:text-chain dark:border-slate-600 dark:text-slate-300 dark:hover:border-chain dark:hover:text-chain"
              : "border border-slate-300 text-slate-700 hover:border-chain hover:text-chain dark:border-slate-600 dark:text-slate-300 dark:hover:border-chain dark:hover:text-chain"
        }`}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            Bảng giá
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            Minh bạch từ giá cả đến chuỗi cung ứng
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Bắt đầu miễn phí 3 tháng. Nâng cấp khi doanh nghiệp phát triển.
          </p>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="mt-12 lg:hidden">
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
            {TIERS.map((tier) => (
              <div key={tier.id} className="snap-start">
                <PricingCard tier={tier} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="mt-12 hidden grid-cols-5 gap-4 lg:grid">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 text-left text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Tính năng
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wide ${
                      tier.highlighted ? "text-chain" : "text-slate-500"
                    }`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURES.map((feature, i) => (
                <tr
                  key={feature.name}
                  className={`border-b border-slate-100 dark:border-slate-800/60 ${
                    i % 2 === 0 ? "" : "bg-slate-50/60 dark:bg-slate-900/30"
                  }`}
                >
                  <td className="py-3 text-sm text-slate-700 dark:text-slate-300">
                    {feature.name}
                  </td>
                  {(
                    [
                      "free",
                      "basic",
                      "advanced",
                      "professional",
                      "enterprise"
                    ] as const
                  ).map((key) => (
                    <td key={key} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <FeatureCell value={feature[key]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-chain py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl font-extrabold text-white">
          Bắt đầu truy xuất nguồn gốc ngay hôm nay
        </h2>
        <p className="mt-4 text-lg text-teal-100">
          Miễn phí 3 tháng. Không cần thẻ tín dụng. Hỗ trợ thiết lập tận nơi.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#pricing"
            className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-chain shadow-md transition-all hover:shadow-lg"
          >
            Bắt đầu miễn phí
          </a>
          <a
            href="#"
            className="rounded-full border border-teal-300 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white"
          >
            Đặt lịch demo →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xl font-extrabold text-chain">Vierify</span>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Nền tảng truy xuất nguồn gốc chuỗi cung ứng cho doanh nghiệp Việt Nam.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Sản phẩm
            </p>
            <ul className="mt-4 space-y-2">
              {["Tính năng", "Bảng giá", "Cập nhật"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Công ty
            </p>
            <ul className="mt-4 space-y-2">
              {["Về chúng tôi", "Liên hệ", "Tuyển dụng"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Pháp lý
            </p>
            <ul className="mt-4 space-y-2">
              {["Chính sách bảo mật", "Điều khoản sử dụng"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row">
          <p className="text-sm text-slate-400">
            © 2026 Vierify. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Powered by{" "}
            <span className="font-semibold text-chain">Polygon</span> &{" "}
            <span className="font-semibold text-proof">Supabase</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage(): React.ReactNode {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScrollReveal><TrustBar /></ScrollReveal>
        <ScrollReveal><ProblemSolution /></ScrollReveal>
        <ScrollReveal><HowItWorks /></ScrollReveal>
        <ScrollReveal><Features /></ScrollReveal>
        <ScrollReveal><Pricing /></ScrollReveal>
        <ScrollReveal><CTABanner /></ScrollReveal>
      </main>
      <Footer />
    </>
  );
}
