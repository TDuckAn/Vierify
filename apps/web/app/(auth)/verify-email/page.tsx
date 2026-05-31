"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "../../../lib/supabase";

function VerifyEmailContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    // Supabase handles the token exchange on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setState("success");
      }
    });

    // If already signed in, treat as verified
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setState("success");
      else if (searchParams.get("error")) setState("error");
      else setState("success"); // landing here means link was clicked
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  if (state === "loading") {
    return (
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-chain border-t-transparent" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center text-rose-500">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50 mb-3">Liên kết đã hết hạn</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Link xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.
        </p>
        <Link
          href="/register"
          className="inline-flex rounded-full bg-chain px-8 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
        >
          Đăng ký lại
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-5 flex justify-center text-emerald-500" style={{ animation: "scaleIn .5s ease" }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50 mb-3">Email đã được xác nhận!</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Tài khoản của bạn đã sẵn sàng. Tiếp theo, hãy chọn gói dịch vụ.
      </p>
      <button
        onClick={() => router.push("/onboarding/plan")}
        className="w-full rounded-full bg-chain px-8 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
      >
        Tiếp tục →
      </button>
    </div>
  );
}

export default function VerifyEmailPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-xl text-chain">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chain">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            Vierify
          </Link>
        </div>
        <Suspense fallback={<div className="flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-chain border-t-transparent" /></div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
