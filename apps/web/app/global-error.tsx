"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({
  error,
  reset
}: GlobalErrorProps): React.ReactNode {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Vierify
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">
            Đã xảy ra lỗi
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Vừa có sự cố khi tải trang. Vui lòng thử lại.
          </p>
          <button
            className="mt-6 w-fit rounded-lg bg-chain px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            onClick={reset}
            type="button"
          >
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
