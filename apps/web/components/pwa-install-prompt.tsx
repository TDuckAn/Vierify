"use client";

import React, { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt(): React.ReactNode {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed this session
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDismissed(true);
      sessionStorage.setItem("pwa-prompt-dismissed", "1");
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:left-auto sm:right-6 sm:w-80">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Cài đặt Vierify</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Thêm vào màn hình chính</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="rounded-lg bg-chain px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-600"
        >
          Cài đặt
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
