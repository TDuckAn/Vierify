"use client";

import Link from "next/link";
import { useState } from "react";

import { createBrowserSupabaseClient } from "../../../lib/supabase";

export default function ForgotPasswordPage(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setDone(true);
  }

  const Logo = () => (
    <div className="mb-8 text-center">
      <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-xl text-chain">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chain">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        Vierify
      </Link>
    </div>
  );

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="mb-4 flex justify-center text-chain" style={{ animation: "scaleIn .4s ease" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50 mb-2">Kiểm tra email của bạn</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Link đặt lại mật khẩu đã được gửi đến{" "}
              <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
            </p>
            <button
              onClick={() => setDone(false)}
              className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-chain hover:text-chain transition-colors dark:border-slate-600 dark:text-slate-300 mb-3 flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.01-5.68"/></svg>
              Gửi lại
            </button>
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-950 dark:text-slate-50 mb-1">Đặt lại mật khẩu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Nhập email để nhận link đặt lại mật khẩu.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@congty.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-chain px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang gửi…" : "Gửi link đặt lại"}
            </button>
          </form>

          <p className="mt-5 text-center">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
