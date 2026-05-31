"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase";
import { TRPCProvider } from "../../lib/trpc-provider";
import { KybBanner } from "../../components/kyb-banner";

// TODO(T52): read from billing.getCurrentSubscription when available
const TIER_LABEL = "Free";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-chain border-t-transparent" />
      </div>
    );
  }

  const isBatches = pathname === "/dashboard" || pathname.startsWith("/batches");
  const isScan = pathname === "/scan";

  return (
    <TRPCProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center">
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-extrabold text-lg text-chain">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chain">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                Vierify
              </Link>
              <nav className="ml-4 hidden items-center gap-0.5 sm:flex">
                <Link
                  href="/dashboard"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${isBatches ? "bg-chain/10 text-chain dark:bg-chain/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"}`}
                >
                  Lô hàng
                </Link>
                <Link
                  href="/scan"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${isScan ? "bg-chain/10 text-chain dark:bg-chain/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"}`}
                >
                  Quét mã
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-chain/10 px-3 py-1 text-xs font-bold text-chain sm:block">
                {TIER_LABEL}
              </span>
              <AvatarMenu />
            </div>
          </div>
        </header>

        <KybBanner />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-slate-200 bg-white pb-safe dark:border-slate-800 dark:bg-slate-950 sm:hidden">
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 px-6 py-3 text-xs font-semibold ${isBatches ? "text-chain" : "text-slate-400"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Lô hàng
          </Link>
          <Link href="/scan" className={`flex flex-col items-center gap-1 px-6 py-3 text-xs font-semibold ${isScan ? "text-chain" : "text-slate-400"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
            Quét mã
          </Link>
        </nav>
      </div>
    </TRPCProvider>
  );
}

function AvatarMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [open]);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-chain hover:text-chain dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        aria-label="Tài khoản"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Link
            href="/dashboard/subscription"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            Quản lý gói
          </Link>
          <Link
            href="/dashboard/admin/loss-profiles"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            Hồ sơ hao hụt
          </Link>
          <Link
            href="/dashboard/recall"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            🔔 Recall Mode
          </Link>
          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
