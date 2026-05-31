"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingHeader } from "../onboarding-header";

const TIERS = [
  {
    id: "free",
    name: "Free",
    desc: "Trải nghiệm",
    price: "0đ",
    period: "3 tháng miễn phí",
    batches: "30 lô/tháng",
    users: "1",
    verify: "Cuối ngày",
    featured: false,
    cta: "Bắt đầu miễn phí",
    features: [
      { label: "Sơ đồ hành trình B2C", val: true },
      { label: "Xác thực blockchain", val: false },
      { label: "Tích hợp GS1", val: false },
      { label: "Dashboard quản lý", val: false },
      { label: "KYB ưu tiên", val: false },
      { label: "Account Manager", val: false },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    desc: "Cơ bản",
    price: "99.000đ",
    period: "/tháng",
    batches: "100 lô/tháng",
    users: "1",
    verify: "6–12 giờ",
    featured: false,
    cta: "Chọn gói này",
    features: [
      { label: "Sơ đồ hành trình B2C", val: true },
      { label: "Xác thực blockchain", val: true },
      { label: "Tích hợp GS1", val: false },
      { label: "Dashboard quản lý", val: false },
      { label: "KYB ưu tiên", val: false },
      { label: "Account Manager", val: false },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    desc: "Nâng cao",
    price: "499.000đ",
    period: "/tháng",
    batches: "500–1.000/tháng",
    users: "5",
    verify: "1–2 giờ",
    featured: false,
    cta: "Chọn gói này",
    features: [
      { label: "Sơ đồ hành trình B2C", val: true },
      { label: "Xác thực blockchain", val: true },
      { label: "Tích hợp GS1", val: true },
      { label: "Dashboard quản lý", val: "Cơ bản" },
      { label: "KYB ưu tiên", val: false },
      { label: "Account Manager", val: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    desc: "Chuyên nghiệp",
    price: "4.999.999đ",
    period: "/tháng",
    batches: "Không giới hạn",
    users: "20",
    verify: "Real-time",
    featured: true,
    cta: "Chọn gói này",
    features: [
      { label: "Sơ đồ hành trình B2C", val: true },
      { label: "Xác thực blockchain", val: true },
      { label: "Tích hợp GS1", val: true },
      { label: "Dashboard quản lý", val: "Nâng cao" },
      { label: "KYB ưu tiên", val: true },
      { label: "Account Manager", val: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "Tập đoàn",
    price: "Liên hệ",
    period: "",
    batches: "Không giới hạn",
    users: "Không giới hạn",
    verify: "Real-time",
    featured: false,
    cta: "Liên hệ với chúng tôi",
    features: [
      { label: "Sơ đồ hành trình B2C", val: true },
      { label: "Xác thực blockchain", val: true },
      { label: "Tích hợp GS1", val: true },
      { label: "Dashboard quản lý", val: "Tùy biến" },
      { label: "KYB ưu tiên", val: true },
      { label: "Account Manager", val: true },
    ],
  },
] as const;

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function OnboardingPlanPage(): React.ReactNode {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("free");
  const [payMethod, setPayMethod] = useState<"payos" | "momo">("payos");

  const isPaid = selected !== "free" && selected !== "enterprise";
  const selectedTier = TIERS.find((t) => t.id === selected);

  function handleContinue() {
    if (selected === "enterprise") {
      window.location.href = "mailto:sales@vierify.vn";
      return;
    }
    router.push("/onboarding/profile");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <OnboardingHeader step={1} />

      <div className="mx-auto max-w-6xl px-6 py-10 pb-20">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 mb-2">Chọn gói dịch vụ</h1>
          <p className="text-slate-500 dark:text-slate-400">Bắt đầu miễn phí, nâng cấp bất kỳ lúc nào. Không cần thẻ tín dụng.</p>
        </div>

        {/* Tier cards */}
        <div className="flex gap-3.5 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {TIERS.map((tier) => {
            const isSel = selected === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelected(tier.id)}
                className={`relative flex min-w-[220px] cursor-pointer flex-col gap-4 rounded-2xl border p-6 transition-all lg:min-w-0 ${
                  isSel || tier.featured
                    ? "border-chain shadow-lg shadow-chain/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                } bg-white dark:bg-slate-900`}
              >
                {isSel && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chain px-3 py-1 text-[11px] font-bold text-white">
                    ✓ Đang chọn
                  </div>
                )}
                {tier.featured && !isSel && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chain px-3 py-1 text-[11px] font-bold text-white">
                    Lựa chọn tốt nhất
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-chain mb-1">{tier.name}</div>
                  <div className="text-xs text-slate-400 mb-3">{tier.desc}</div>
                  <div className="text-xl font-extrabold text-slate-950 dark:text-slate-50 leading-none">{tier.price}</div>
                  {tier.period && <div className="text-xs text-slate-400 mt-1">{tier.period}</div>}
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-950 dark:text-slate-50">{tier.batches}</div>
                  <div>{tier.users} người dùng</div>
                  <div className="text-xs text-slate-400">Xác minh: {tier.verify}</div>
                </div>

                <ul className="flex flex-1 flex-col gap-2">
                  {tier.features.map((f, i) => {
                    const yes = f.val === true;
                    const isText = typeof f.val === "string";
                    return (
                      <li key={i} className={`flex items-center justify-between gap-1.5 text-xs ${yes || isText ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600"}`}>
                        <span className="flex-1">{f.label}</span>
                        {isText ? (
                          <span className="text-[10px] font-bold text-chain">{f.val}</span>
                        ) : yes ? (
                          <span className="text-emerald-500"><CheckIcon /></span>
                        ) : (
                          <span><XIcon /></span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={(e) => { e.stopPropagation(); handleContinue(); }}
                  className={`w-full rounded-full py-2 text-sm font-semibold transition-colors ${
                    isSel || tier.featured
                      ? "bg-chain text-white hover:bg-teal-600"
                      : "border border-slate-300 text-slate-700 hover:border-chain hover:text-chain dark:border-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment method (only for paid tiers) */}
        {isPaid && (
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Phương thức thanh toán</p>
            <div className="flex gap-3 justify-center">
              {[
                { id: "payos" as const, label: "PayOS", color: "#1A56DB" },
                { id: "momo" as const, label: "MoMo", color: "#ae2070" },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPayMethod(pm.id)}
                  className="flex min-w-[120px] items-center justify-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-all"
                  style={{
                    borderColor: pm.color,
                    color: payMethod === pm.id ? "#fff" : pm.color,
                    background: payMethod === pm.id ? pm.color : "transparent",
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              {payMethod === "payos" ? "Chuyển khoản ngân hàng · QR Pay" : "Ví điện tử MoMo"}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mx-auto mt-7 max-w-sm text-center">
          {selected === "free" && (
            <p className="mb-3 text-sm text-slate-400">Gói Free · 30 lô/tháng · 3 tháng miễn phí</p>
          )}
          {isPaid && selectedTier && (
            <p className="mb-3 text-sm text-slate-400">{selectedTier.name} · {selectedTier.price}/tháng</p>
          )}
          <button
            onClick={handleContinue}
            className="w-full rounded-full bg-chain py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
          >
            {selected === "free"
              ? "Bắt đầu miễn phí →"
              : selected === "enterprise"
              ? "Liên hệ với chúng tôi"
              : "Tiếp tục thanh toán →"}
          </button>
        </div>
      </div>
    </div>
  );
}
