"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase";
import { TRPCProvider } from "../../lib/trpc-provider";
import { KybBanner } from "../../components/kyb-banner";
import { ThemeToggle } from "../../components/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const meta = session.user.app_metadata as Record<string, unknown>;
      if (typeof meta.org_id === "string") {
        setOrgName((meta.org_id as string).slice(0, 8));
      }
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

  return (
    <TRPCProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="font-mono text-lg font-bold text-chain">
                Vierify
              </Link>
              <nav className="hidden items-center gap-4 sm:flex">
                <NavLink href="/dashboard" current={pathname === "/dashboard"}>
                  Lô hàng
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {orgName && (
                <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:block">
                  Org {orgName}…
                </span>
              )}
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>

        <KybBanner />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </TRPCProvider>
  );
}

function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${
        current
          ? "text-chain"
          : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-50"
    >
      Đăng xuất
    </button>
  );
}
