"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../../lib/supabase";

declare global {
  interface Window {
    __vierifyCountedTraceScans?: Set<string>;
  }
}

type ScanCountValueProps = {
  batchId: string;
  gs1TraceId: string;
  initialScanCount: number | null;
};

const INCREMENT_SCAN_COUNT_RPC = "increment_trace_batch_scan_count";

function coerceScanCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readScanCount(row: unknown): number | null {
  if (!row || typeof row !== "object" || !("scan_count" in row)) {
    return null;
  }

  return coerceScanCount((row as { scan_count: unknown }).scan_count);
}

function shouldRecordScan(batchId: string, gs1TraceId: string): boolean {
  const key = `${batchId}:${gs1TraceId}`;
  window.__vierifyCountedTraceScans ??= new Set<string>();

  if (window.__vierifyCountedTraceScans.has(key)) {
    return false;
  }

  window.__vierifyCountedTraceScans.add(key);
  return true;
}

export function ScanCountValue({
  batchId,
  gs1TraceId,
  initialScanCount
}: ScanCountValueProps): React.ReactNode {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [scanCount, setScanCount] = useState<number | null>(initialScanCount);

  useEffect(() => {
    let isMounted = true;

    const channel = supabase
      .channel(`trace-batch-scan-count:${batchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${batchId}`,
          schema: "public",
          table: "trace_batch"
        },
        (payload) => {
          const nextScanCount = readScanCount(payload.new);
          if (nextScanCount !== null) {
            setScanCount(nextScanCount);
          }
        }
      )
      .subscribe((status) => {
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.warn(`Trace scan-count realtime unavailable: ${status}`);
        }
      });

    async function incrementScanCount(): Promise<void> {
      if (!shouldRecordScan(batchId, gs1TraceId)) {
        return;
      }

      const { data, error } = await supabase.rpc(INCREMENT_SCAN_COUNT_RPC, {
        p_gs1_trace_id: gs1TraceId
      });

      if (error) {
        console.warn("Trace scan-count increment failed:", error.message);
        return;
      }

      const nextScanCount = coerceScanCount(data);
      if (isMounted && nextScanCount !== null) {
        setScanCount(nextScanCount);
      }
    }

    void incrementScanCount();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [batchId, gs1TraceId, supabase]);

  return (
    <span aria-live="polite" data-testid="trace-scan-count">
      {scanCount !== null ? String(scanCount) : "---"}
    </span>
  );
}
