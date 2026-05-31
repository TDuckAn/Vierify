"use client";

import Link from "next/link";
import { useState } from "react";

import { createBrowserSupabaseClient } from "../../../lib/supabase";

function PasswordToggleInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-950 outline-none transition focus:border-chain focus:ring-2 focus:ring-chain/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function PasswordStrength({ pw }: { pw: string }) {
  if (!pw) return null;
  let level = 0;
  if (pw.length >= 8) level = 1;
  if (pw.length >= 10) level = 2;
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) level = 3;
  const colors = ["", "bg-rose-500", "bg-amber-500", "bg-emerald-500"];
  const labels = ["", "Yếu", "Trung bình", "Mạnh"];
  const textColors = ["", "text-rose-600", "text-amber-600", "text-emerald-600"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${level >= i ? colors[level] : "bg-slate-200 dark:bg-slate-700"}`}
          />
        ))}
      </div>
      {level > 0 && (
        <p className={`mt-1 text-xs font-semibold ${textColors[level]}`}>{labels[level]}</p>
      )}
    </div>
  );
}

export default function RegisterPage(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { setError("Mật khẩu xác nhận không khớp."); return; }
    if (pw.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: authError } = await supabase.auth.signUp({ email, password: pw });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setDone(true);
  }

  async function handleResend() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.resend({ type: "signup", email });
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center cursor-pointer">
            <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-xl text-chain">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chain">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Vierify
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="mb-4 flex justify-center text-chain" style={{ animation: "scaleIn .4s ease" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50 mb-2">Kiểm tra email của bạn</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Chúng tôi đã gửi link xác nhận đến <strong className="text-slate-700 dark:text-slate-200">{email}</strong>. Nhấp vào link để kích hoạt tài khoản.
            </p>
            <button
              onClick={handleResend}
              className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-chain hover:text-chain transition-colors dark:border-slate-600 dark:text-slate-300 mb-3 flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.01-5.68"/></svg>
              Gửi lại email
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
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-xl text-chain">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chain">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            Vierify
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-950 dark:text-slate-50 mb-1">Tạo tài khoản</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Dùng thử miễn phí 3 tháng. Không cần thẻ tín dụng.</p>

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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Mật khẩu</label>
              <PasswordToggleInput value={pw} onChange={setPw} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" />
              <PasswordStrength pw={pw} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Xác nhận mật khẩu</label>
              <PasswordToggleInput value={pw2} onChange={setPw2} placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
              {pw2 && pw !== pw2 && (
                <p className="mt-1 text-xs text-rose-500">Mật khẩu không khớp</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-chain px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
            </button>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <Link href="#" className="text-chain underline">Điều khoản sử dụng</Link>
              {" "}và{" "}
              <Link href="#" className="text-chain underline">Chính sách bảo mật</Link>
            </p>
          </form>

          <p className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-chain hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
