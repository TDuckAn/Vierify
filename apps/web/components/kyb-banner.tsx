"use client";

import React from "react";

import { trpc } from "../lib/trpc";

export function KybBanner(): React.ReactNode {
  const { data: nodes } = trpc.nodes.list.useQuery({ limit: 10 });

  const pendingNode = nodes?.find((n) => n.kybStatus !== "approved");
  if (!pendingNode) return null;

  const isPending = pendingNode.kybStatus === "pending";
  const isRejected = pendingNode.kybStatus === "rejected";

  return (
    <div className={`border-b px-4 py-2.5 text-sm ${
      isRejected
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
    }`}>
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <span>{isRejected ? "⚠️" : "⏳"}</span>
        {isRejected ? (
          <span>
            Tài khoản <strong>{pendingNode.name}</strong> bị từ chối KYB. Vui lòng{" "}
            <a href="mailto:support@vierify.vn" className="underline">liên hệ hỗ trợ</a> để biết thêm.
          </span>
        ) : isPending ? (
          <span>
            Tài khoản <strong>{pendingNode.name}</strong> đang chờ duyệt KYB — thường hoàn tất trong <strong>24 giờ</strong>. Bạn có thể tạo lô hàng sau khi được phê duyệt.
          </span>
        ) : (
          <span>
            Tài khoản <strong>{pendingNode.name}</strong> có trạng thái KYB: <strong>{pendingNode.kybStatus}</strong>. Liên hệ admin để được hỗ trợ.
          </span>
        )}
      </div>
    </div>
  );
}
