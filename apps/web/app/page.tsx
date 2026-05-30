"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { ScrollReveal } from "../components/scroll-reveal";
import { ThemeToggle } from "../components/theme-toggle";

// ─── Lang Context ─────────────────────────────────────────────────────────────

type Lang = "vi" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "vi",
  setLang: () => {}
});

function useLang() {
  return useContext(LangContext);
}

// ─── Translations ─────────────────────────────────────────────────────────────

const STRINGS = {
  vi: {
    nav: {
      howItWorks: "Cách hoạt động",
      features: "Tính năng",
      pricing: "Bảng giá",
      cta: "Bắt đầu miễn phí"
    },
    hero: {
      badge: "Powered by Polygon Blockchain",
      headlinePre: "Truy xuất nguồn gốc",
      headlineAccent: "minh bạch",
      headlinePost: "từ nông trại đến tay bạn",
      sub: "Vierify giúp doanh nghiệp Việt Nam số hoá chuỗi cung ứng, lưu vết từng lô hàng và tạo niềm tin với người tiêu dùng bằng bằng chứng blockchain không thể giả mạo.",
      ctaPrimary: "Bắt đầu miễn phí",
      ctaSecondary: "Xem demo →",
      previewTag: "Vierify trace",
      previewTitle: "Cà phê Arabica Đắk Lắk — Lô 2024-11",
      verified: "✓ Đã xác minh trên Polygon",
      stats: [
        { label: "Số lượng", value: "500 kg" },
        { label: "Nút nguồn gốc", value: "HTX Cà phê Ea Tu" },
        { label: "Trạng thái", value: "Đã xác minh" }
      ],
      txLabel: "Mã giao dịch blockchain",
      txLink: "Xem trên Polygonscan Amoy"
    },
    trustBar: "Được thiết kế cho tiêu chuẩn ngành",
    problem: {
      label: "Vấn đề",
      title: "Chuỗi cung ứng thiếu minh bạch",
      items: [
        "Người tiêu dùng không biết sản phẩm đến từ đâu",
        "Hàng giả, hàng nhái len lỏi vào chuỗi phân phối",
        "Doanh nghiệp mất uy tín khi xảy ra sự cố thực phẩm",
        "Không có bằng chứng số về nguồn gốc khi kiểm tra"
      ]
    },
    solution: {
      label: "Giải pháp Vierify",
      title: "Mọi lô hàng đều có dấu vết số",
      items: [
        "Mã QR duy nhất cho mỗi lô — người tiêu dùng quét là biết ngay",
        "Dữ liệu được mã hoá và ghi lên Polygon blockchain — không thể sửa đổi",
        "Bằng chứng giao dịch blockchain công khai, bất kỳ ai cũng xác minh được",
        "Tuân thủ GS1 Vietnam và quy định truy xuất nguồn gốc"
      ]
    },
    howItWorks: {
      label: "Cách hoạt động",
      title: "Ba bước đơn giản",
      sub: "Từ nhà máy đến tay người tiêu dùng — minh bạch hoàn toàn",
      steps: [
        {
          title: "Quét và tạo lô hàng",
          body: "Nhân viên dùng ứng dụng MerchantApp quét mã GS1, nhập thông tin lô hàng (số lượng, GPS, tài liệu). Dữ liệu được gửi ngay lên máy chủ."
        },
        {
          title: "Kết nối chuỗi cung ứng",
          body: "Liên kết lô hàng con với lô hàng cha để tạo sơ đồ nguồn gốc đầy đủ. Hệ thống tự động kiểm tra cân bằng khối lượng và phát hiện vòng lặp."
        },
        {
          title: "Người tiêu dùng xác minh",
          body: "Khách hàng quét mã QR trên bao bì → trang truy xuất nguồn gốc hiện ra với toàn bộ hành trình và bằng chứng Polygon blockchain."
        }
      ]
    },
    features: {
      label: "Tính năng",
      title: "Đầy đủ công cụ cho chuỗi cung ứng",
      items: [
        {
          title: "Quét mã GS1 Barcode",
          body: "Hỗ trợ đầy đủ chuẩn GS1 GTIN theo TCVN 13274:2020. Tạo mã QR PNG cho mỗi lô hàng, sẵn sàng in ấn."
        },
        {
          title: "Bằng chứng blockchain",
          body: "Mỗi lô hàng được băm SHA-256 và ghi lên Polygon. Mã giao dịch công khai — bất kỳ ai cũng xác minh được."
        },
        {
          title: "Sơ đồ nguồn gốc thời gian thực",
          body: "Kết nối lô cha — lô con, kiểm tra cân bằng khối lượng tự động, phát hiện vòng lặp ngay khi nhập liệu."
        },
        {
          title: "Upload tài liệu",
          body: "Đính kèm giấy chứng nhận, kiểm định chất lượng vào từng lô. File được băm và lưu trữ bảo mật."
        },
        {
          title: "Trang truy xuất B2C",
          body: "Người tiêu dùng quét QR → xem hành trình đầy đủ từ nguồn gốc đến tay mình, với trạng thái blockchain rõ ràng."
        },
        {
          title: "Cập nhật theo thời gian thực",
          body: "Trạng thái blockchain, số lần quét, liên kết phả hệ — tất cả cập nhật ngay khi có thay đổi."
        }
      ]
    },
    pricing: {
      label: "Bảng giá",
      title: "Minh bạch từ giá cả đến chuỗi cung ứng",
      sub: "Bắt đầu miễn phí 3 tháng. Nâng cấp khi doanh nghiệp phát triển.",
      featureHeader: "Tính năng"
    },
    cta: {
      title: "Bắt đầu truy xuất nguồn gốc ngay hôm nay",
      sub: "Miễn phí 3 tháng. Không cần thẻ tín dụng. Hỗ trợ thiết lập tận nơi.",
      primary: "Bắt đầu miễn phí",
      secondary: "Đặt lịch demo →"
    },
    footer: {
      tagline: "Nền tảng truy xuất nguồn gốc chuỗi cung ứng cho doanh nghiệp Việt Nam.",
      product: "Sản phẩm",
      productLinks: ["Tính năng", "Bảng giá", "Cập nhật"],
      company: "Công ty",
      companyLinks: ["Về chúng tôi", "Liên hệ", "Tuyển dụng"],
      legal: "Pháp lý",
      legalLinks: ["Chính sách bảo mật", "Điều khoản sử dụng"],
      rights: "© 2026 Vierify. All rights reserved."
    }
  },
  en: {
    nav: {
      howItWorks: "How It Works",
      features: "Features",
      pricing: "Pricing",
      cta: "Get started free"
    },
    hero: {
      badge: "Powered by Polygon Blockchain",
      headlinePre: "Transparent supply chain",
      headlineAccent: "traceability",
      headlinePost: "from farm to your hands",
      sub: "Vierify helps Vietnamese businesses digitise their supply chain, track every batch and build consumer trust with tamper-proof blockchain proof.",
      ctaPrimary: "Get started free",
      ctaSecondary: "View demo →",
      previewTag: "Vierify trace",
      previewTitle: "Arabica Coffee Dak Lak — Batch 2024-11",
      verified: "✓ Verified on Polygon",
      stats: [
        { label: "Quantity", value: "500 kg" },
        { label: "Origin node", value: "Ea Tu Coffee Cooperative" },
        { label: "Status", value: "Verified" }
      ],
      txLabel: "Blockchain transaction hash",
      txLink: "View on Polygonscan Amoy"
    },
    trustBar: "Designed for industry standards",
    problem: {
      label: "The Problem",
      title: "Supply chains lack transparency",
      items: [
        "Consumers don't know where products come from",
        "Counterfeit goods infiltrate distribution channels",
        "Companies lose credibility when food incidents occur",
        "No digital proof of origin during inspections"
      ]
    },
    solution: {
      label: "Vierify Solution",
      title: "Every batch has a digital footprint",
      items: [
        "Unique QR code per batch — consumers scan and know instantly",
        "Data encrypted and written to Polygon blockchain — immutable",
        "Public blockchain transaction proof — anyone can verify",
        "Compliant with GS1 Vietnam and traceability regulations"
      ]
    },
    howItWorks: {
      label: "How It Works",
      title: "Three simple steps",
      sub: "From factory to consumer — completely transparent",
      steps: [
        {
          title: "Scan and create batch",
          body: "Staff use the MerchantApp to scan GS1 codes, enter batch info (quantity, GPS, documents). Data is sent to the server immediately."
        },
        {
          title: "Connect the supply chain",
          body: "Link child batches to parent batches to create a complete origin graph. The system auto-checks mass balance and detects loops."
        },
        {
          title: "Consumer verification",
          body: "Customers scan the QR code on packaging → the traceability page shows the full journey with Polygon blockchain proof."
        }
      ]
    },
    features: {
      label: "Features",
      title: "Full toolset for the supply chain",
      items: [
        {
          title: "GS1 Barcode Scanning",
          body: "Full GS1 GTIN support per TCVN 13274:2020. Generate PNG QR codes for each batch, ready to print."
        },
        {
          title: "Blockchain proof",
          body: "Each batch is SHA-256 hashed and written to Polygon. Public transaction hash — anyone can verify."
        },
        {
          title: "Real-time origin graph",
          body: "Connect parent-child batches, automatic mass balance checks, loop detection on entry."
        },
        {
          title: "Document upload",
          body: "Attach certificates and quality audits to each batch. Files are hashed and stored securely."
        },
        {
          title: "B2C trace page",
          body: "Consumers scan QR → view full journey from origin to their hands, with clear blockchain status."
        },
        {
          title: "Real-time updates",
          body: "Blockchain status, scan count, genealogy links — all update the moment something changes."
        }
      ]
    },
    pricing: {
      label: "Pricing",
      title: "Transparent from pricing to supply chain",
      sub: "Start free for 3 months. Upgrade as your business grows.",
      featureHeader: "Feature"
    },
    cta: {
      title: "Start tracing your supply chain today",
      sub: "Free for 3 months. No credit card required. On-site setup support.",
      primary: "Get started free",
      secondary: "Book a demo →"
    },
    footer: {
      tagline: "Supply chain traceability platform for Vietnamese businesses.",
      product: "Product",
      productLinks: ["Features", "Pricing", "Updates"],
      company: "Company",
      companyLinks: ["About us", "Contact", "Careers"],
      legal: "Legal",
      legalLinks: ["Privacy Policy", "Terms of Service"],
      rights: "© 2026 Vierify. All rights reserved."
    }
  }
} as const;

// ─── Pricing Data ─────────────────────────────────────────────────────────────

type PricingFeature = {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  advanced: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
};

function getPricingFeatures(lang: Lang): PricingFeature[] {
  const dashboard = lang === "vi"
    ? { advanced: "Cơ bản", professional: "Nâng cao", enterprise: "Tùy biến" }
    : { advanced: "Basic", professional: "Advanced", enterprise: "Custom" };

  return [
    {
      name: lang === "vi" ? "Sơ đồ hành trình mẫu" : "Sample journey map",
      free: true, basic: true, advanced: true, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Xác thực blockchain (Polygon)" : "Blockchain verification (Polygon)",
      free: false, basic: true, advanced: true, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Quét mã GS1 Barcode" : "GS1 Barcode scanning",
      free: false, basic: false, advanced: true, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Dashboard quản lý" : "Management dashboard",
      free: false, basic: false,
      advanced: dashboard.advanced,
      professional: dashboard.professional,
      enterprise: dashboard.enterprise
    },
    {
      name: lang === "vi" ? "Hệ thống Referral (Mã giới thiệu)" : "Referral system",
      free: false, basic: false, advanced: false, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Thẩm định KYB ưu tiên (< 24h)" : "Priority KYB verification (< 24h)",
      free: false, basic: false, advanced: false, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Vị trí nổi bật trên Marketplace" : "Featured listing on Marketplace",
      free: false, basic: false, advanced: false, professional: true, enterprise: true
    },
    {
      name: lang === "vi" ? "Account Manager riêng" : "Dedicated Account Manager",
      free: false, basic: false, advanced: false, professional: false, enterprise: true
    },
    {
      name: lang === "vi" ? "Market Insights & Đối soát" : "Market Insights & Reconciliation",
      free: false, basic: false, advanced: false, professional: false, enterprise: true
    },
    {
      name: lang === "vi" ? "White-label trang truy xuất" : "White-label trace page",
      free: false, basic: false, advanced: false, professional: false, enterprise: true
    }
  ];
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

function getTiers(lang: Lang): Tier[] {
  const vi = lang === "vi";
  return [
    {
      id: "free",
      name: "Free",
      subtitle: vi ? "Trải nghiệm" : "Trial",
      price: vi ? "0đ" : "Free",
      period: vi ? "3 tháng miễn phí" : "3 months free",
      batches: vi ? "30 lô/tháng" : "30 batches/mo",
      users: vi ? "1 người dùng" : "1 user",
      frequency: vi ? "Cuối ngày" : "End of day",
      cta: vi ? "Bắt đầu miễn phí" : "Start for free",
      highlighted: false
    },
    {
      id: "basic",
      name: "Basic",
      subtitle: vi ? "Cơ bản" : "Starter",
      price: vi ? "99.000đ" : "$4",
      period: vi ? "/tháng" : "/month",
      batches: vi ? "100 lô/tháng" : "100 batches/mo",
      users: vi ? "1 người dùng" : "1 user",
      frequency: vi ? "6–12 giờ" : "6–12 hours",
      cta: vi ? "Chọn gói này" : "Choose plan",
      highlighted: false
    },
    {
      id: "advanced",
      name: "Advanced",
      subtitle: vi ? "Nâng cao" : "Growing",
      price: vi ? "499.000đ" : "$20",
      period: vi ? "/tháng" : "/month",
      batches: vi ? "500–1.000 lô/tháng" : "500–1,000 batches/mo",
      users: vi ? "5 người dùng" : "5 users",
      frequency: vi ? "1–2 giờ" : "1–2 hours",
      cta: vi ? "Chọn gói này" : "Choose plan",
      highlighted: false
    },
    {
      id: "professional",
      name: "Professional",
      subtitle: vi ? "Chuyên nghiệp" : "Scale",
      price: vi ? "4.999.999đ" : "$200",
      period: vi ? "/tháng" : "/month",
      batches: vi ? "Không giới hạn" : "Unlimited",
      users: vi ? "20 người dùng" : "20 users",
      frequency: "Real-time",
      cta: vi ? "Chọn gói này" : "Choose plan",
      highlighted: true,
      badge: "Best choice"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: vi ? "Tập đoàn" : "Enterprise",
      price: vi ? "Liên hệ" : "Contact us",
      period: "",
      batches: vi ? "Không giới hạn" : "Unlimited",
      users: vi ? "Không giới hạn" : "Unlimited",
      frequency: "Real-time",
      cta: vi ? "Liên hệ với chúng tôi" : "Talk to sales",
      highlighted: false
    }
  ];
}

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

// ─── Lang Toggle ──────────────────────────────────────────────────────────────

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "vi" ? "en" : "vi")}
      aria-label={lang === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
      className="flex h-9 items-center justify-center rounded-full px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {lang === "vi" ? "EN" : "VI"}
    </button>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const { lang } = useLang();
  const t = STRINGS[lang].nav;

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
            {t.howItWorks}
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
          >
            {t.features}
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-chain dark:text-slate-400 dark:hover:text-chain"
          >
            {t.pricing}
          </a>
        </div>
        <div className="flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <a
            href="#pricing"
            className="ml-1 rounded-full bg-chain px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            {t.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { lang } = useLang();
  const t = STRINGS[lang].hero;

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-chain/5 blur-3xl dark:bg-chain/10" />
        <div className="absolute right-0 top-1/4 h-[300px] w-[400px] rounded-full bg-proof/5 blur-3xl dark:bg-proof/10" />
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: text — no animation so h1 is visible immediately (LCP) */}
          <div>
            <span className="inline-block rounded-full border border-chain/30 bg-chain/10 px-4 py-1.5 text-sm font-semibold text-chain">
              {t.badge}
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.25] tracking-tight text-slate-950 dark:text-slate-50 lg:text-6xl lg:leading-[1.2]">
              {t.headlinePre}{" "}
              <span className="text-chain">{t.headlineAccent}</span>{" "}
              {t.headlinePost}
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              {t.sub}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#pricing"
                className="rounded-full bg-chain px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-teal-600 hover:shadow-md"
              >
                {t.ctaPrimary}
              </a>
              <a
                href="/trace/demo"
                className="rounded-full border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-chain hover:text-chain dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-chain dark:hover:text-chain"
              >
                {t.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Right: trace mockup */}
          <div className="animate-fade-in delay-200">
            <a
              href="/trace/demo"
              className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-shadow hover:shadow-chain/20 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-4 rounded bg-white px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
                  vierify.vn/trace/VN.GS1.8936012…
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {t.previewTag}
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold leading-snug text-slate-950 dark:text-slate-50">
                      {t.previewTitle}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t.verified}
                  </span>
                </div>
                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-1 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  {t.stats.map((stat) => (
                    <div key={stat.label} className="bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-950 dark:text-slate-50">{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Supply chain timeline */}
                <div className="mt-4 space-y-0">
                  {[
                    { name: lang === "vi" ? "Nông trại Hòa Lộc" : "Hoa Loc Farm", loc: lang === "vi" ? "Tiền Giang · 14/01" : "Tien Giang · Jan 14", cur: false },
                    { name: lang === "vi" ? "Cơ sở chế biến" : "Processing facility", loc: lang === "vi" ? "Cần Thơ · 18/01" : "Can Tho · Jan 18", cur: false },
                    { name: lang === "vi" ? "Kho lạnh TP.HCM" : "Cold storage HCMC", loc: lang === "vi" ? "22/01/2026" : "Jan 22, 2026", cur: true }
                  ].map((nd, i, arr) => (
                    <div key={i} className="relative flex gap-3 pb-3 last:pb-0" style={{ paddingLeft: "1.25rem" }}>
                      <div
                        className={`absolute left-1 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${nd.cur ? "bg-emerald-500" : "bg-chain"}`}
                      />
                      {i < arr.length - 1 && (
                        <div className="absolute bottom-0 left-[0.3rem] top-4 w-px bg-slate-200 dark:bg-slate-700" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-950 dark:text-slate-50">{nd.name}</p>
                        <p className="text-xs text-slate-400">{nd.loc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-slate-400">Nhấp để xem trang trace đầy đủ →</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Demo Section ─────────────────────────────────────────────────────────────

function DemoSection() {
  const { lang } = useLang();
  const vi = lang === "vi";
  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-chain">
          {vi ? "Demo trực quan" : "Live demo"}
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 lg:text-4xl">
          {vi ? "Xem Vierify hoạt động" : "See Vierify in action"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          {vi
            ? "Người tiêu dùng quét QR trên bao bì và thấy ngay toàn bộ nguồn gốc cùng bằng chứng blockchain."
            : "Consumers scan a QR on packaging and immediately see the full origin story with blockchain proof."}
        </p>
        <a
          href="/trace/demo"
          className="mt-8 inline-block rounded-full bg-chain px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-teal-600 hover:shadow-md"
        >
          {vi ? "Mở trang trace demo" : "Open trace demo"}
        </a>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  const { lang } = useLang();
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
          {STRINGS[lang].trustBar}
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
  const { lang } = useLang();
  const tp = STRINGS[lang].problem;
  const ts = STRINGS[lang].solution;

  return (
    <section className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Problem */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 dark:border-rose-900/40 dark:bg-rose-900/10">
            <span className="text-sm font-bold uppercase tracking-widest text-rose-400">
              {tp.label}
            </span>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
              {tp.title}
            </h2>
            <ul className="mt-6 space-y-4">
              {tp.items.map((item) => (
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
              {ts.label}
            </span>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
              {ts.title}
            </h2>
            <ul className="mt-6 space-y-4">
              {ts.items.map((item) => (
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

const STEP_ICONS = [<IconQr key="qr" />, <IconChain key="chain" />, <IconProof key="proof" />];

function HowItWorks() {
  const { lang } = useLang();
  const t = STRINGS[lang].howItWorks;
  const nums = ["01", "02", "03"];

  return (
    <section id="how-it-works" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            {t.label}
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            {t.sub}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {t.steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <span className="absolute right-6 top-6 text-5xl font-black text-slate-100 dark:text-slate-800">
                {nums[i]}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chain/10 text-chain">
                {STEP_ICONS[i]}
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

const FEATURE_ICONS = [
  <IconQr key="qr" />,
  <IconProof key="proof" />,
  <IconChain key="chain" />,
  <IconDoc key="doc" />,
  <IconTimeline key="timeline" />,
  <IconRealtime key="realtime" />
];

function Features() {
  const { lang } = useLang();
  const t = STRINGS[lang].features;

  return (
    <section id="features" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            {t.label}
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            {t.title}
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 p-6 transition-all hover:border-chain/40 hover:shadow-lg dark:border-slate-800 dark:hover:border-chain/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-chain/10 group-hover:text-chain dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-chain/10 dark:group-hover:text-chain">
                {FEATURE_ICONS[i]}
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

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>;
  }
  return value ? <IconCheck /> : <IconMinus />;
}

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
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chain px-4 py-1 text-xs font-bold text-white">
          {tier.badge}
        </span>
      )}

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {tier.name}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{tier.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
          <span className={`font-extrabold text-slate-950 dark:text-slate-50 ${
            tier.price.length > 7 ? "text-2xl" : "text-3xl"
          }`}>
            {tier.price}
          </span>
          {tier.period && (
            <span className="text-sm text-slate-400">{tier.period}</span>
          )}
        </div>
      </div>

      <ul className="mb-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
        <li className="truncate">📦 {tier.batches}</li>
        <li>👤 {tier.users}</li>
        <li>⏱ {tier.frequency}</li>
      </ul>

      <a
        href="#"
        className={`mt-auto rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          tier.highlighted
            ? "bg-chain text-white hover:bg-teal-600"
            : "border border-slate-300 text-slate-700 hover:border-chain hover:text-chain dark:border-slate-600 dark:text-slate-300 dark:hover:border-chain dark:hover:text-chain"
        }`}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function Pricing() {
  const { lang } = useLang();
  const t = STRINGS[lang].pricing;
  const tiers = getTiers(lang);
  const pricingFeatures = getPricingFeatures(lang);

  return (
    <section id="pricing" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-chain">
            {t.label}
          </span>
          <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-slate-50">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            {t.sub}
          </p>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="mt-12 lg:hidden">
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
            {tiers.map((tier) => (
              <div key={tier.id} className="snap-start">
                <PricingCard tier={tier} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="mt-12 hidden grid-cols-5 gap-4 lg:grid">
          {tiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 text-left text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {t.featureHeader}
                </th>
                {tiers.map((tier) => (
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
              {pricingFeatures.map((feature, i) => (
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
  const { lang } = useLang();
  const t = STRINGS[lang].cta;

  return (
    <section className="bg-chain py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl font-extrabold text-white">
          {t.title}
        </h2>
        <p className="mt-4 text-lg text-teal-100">
          {t.sub}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#pricing"
            className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-chain shadow-md transition-all hover:shadow-lg"
          >
            {t.primary}
          </a>
          <a
            href="#"
            className="rounded-full border border-teal-300 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white"
          >
            {t.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { lang } = useLang();
  const t = STRINGS[lang].footer;

  return (
    <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xl font-extrabold text-chain">Vierify</span>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {t.tagline}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              {t.product}
            </p>
            <ul className="mt-4 space-y-2">
              {t.productLinks.map((link) => (
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
              {t.company}
            </p>
            <ul className="mt-4 space-y-2">
              {t.companyLinks.map((link) => (
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
              {t.legal}
            </p>
            <ul className="mt-4 space-y-2">
              {t.legalLinks.map((link) => (
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
            {t.rights}
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
  const [lang, setLang] = useState<Lang>("vi");

  useEffect(() => {
    const stored = localStorage.getItem("vierify-lang");
    if (stored === "vi" || stored === "en") setLang(stored);
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("vierify-lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang }}>
      <Nav />
      <main>
        <Hero />
        <ScrollReveal><TrustBar /></ScrollReveal>
        <ScrollReveal><ProblemSolution /></ScrollReveal>
        <ScrollReveal><HowItWorks /></ScrollReveal>
        <ScrollReveal><Features /></ScrollReveal>
        <ScrollReveal><DemoSection /></ScrollReveal>
        <ScrollReveal><Pricing /></ScrollReveal>
        <ScrollReveal><CTABanner /></ScrollReveal>
      </main>
      <Footer />
    </LangContext.Provider>
  );
}
