"use client";

import React from "react";

import { trpc } from "../lib/trpc";

export function KybBanner(): React.ReactNode {
  const { data: nodes } = trpc.nodes.list.useQuery({ limit: 10 });

  const pendingNode = nodes?.find((n) => n.kybStatus !== "approved");
  if (!pendingNode) return null;

  const status = pendingNode.kybStatus;

  const configs = {
    pending: {
      icon: "⏳",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      msg: `Tài khoản đang chờ xét duyệt KYB · Thường mất 24–48 giờ · Liên hệ support@vierify.vn`,
    },
    rejected: {
      icon: "🚫",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800",
      text: "text-rose-800 dark:text-rose-300",
      msg: `Xét duyệt KYB bị từ chối · Liên hệ support@vierify.vn để được hỗ trợ`,
    },
    suspended: {
      icon: "⚠️",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      msg: `Tài khoản bị tạm đình chỉ · Liên hệ admin@vierify.vn`,
    },
  } as const;

  const cfg = configs[status as keyof typeof configs] ?? configs.pending;

  return (
    <div className={`mx-6 mt-4 flex items-start gap-3 rounded-xl border px-5 py-3.5 text-sm ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className="shrink-0 text-lg">{cfg.icon}</span>
      <p>{cfg.msg}</p>
    </div>
  );
}
