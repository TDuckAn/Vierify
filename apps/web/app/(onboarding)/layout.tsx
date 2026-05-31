import Link from "next/link";
import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }): React.ReactNode {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  );
}

export function OnboardingHeader({ step }: { step: 1 | 2 }): React.ReactNode {
  const steps = [
    { n: 1, label: "Chọn gói" },
    { n: 2, label: "Hồ sơ" },
  ];

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-lg text-chain">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chain">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        Vierify
      </Link>

      <div className="flex items-center gap-0">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`mx-1 h-0.5 w-9 transition-colors ${step > 1 ? "bg-chain" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= n
                  ? "bg-chain text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}>
                {step > n ? "✓" : n}
              </div>
              <span className={`hidden text-sm font-semibold sm:block ${step >= n ? "text-slate-950 dark:text-slate-50" : "text-slate-400 dark:text-slate-500"}`}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
