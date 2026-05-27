import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { traceBatch } from "../../db/schema";

const DEFAULT_CONSUMER_TRACE_BASE_URL = "https://vierify.vercel.app/trace";

function getConsumerTraceBaseUrl(): string {
  return (process.env.CONSUMER_TRACE_BASE_URL ?? DEFAULT_CONSUMER_TRACE_BASE_URL).replace(
    /\/+$/,
    ""
  );
}

export function buildTraceUrl(gs1TraceId: string): string {
  return `${getConsumerTraceBaseUrl()}/${encodeURIComponent(gs1TraceId)}`;
}

export async function getBatchQrCode(batchId: string) {
  const db = getDb();
  const [batch] = await db
    .select({
      gs1TraceId: traceBatch.gs1TraceId,
      id: traceBatch.id
    })
    .from(traceBatch)
    .where(eq(traceBatch.id, batchId));

  if (!batch) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trace batch not found."
    });
  }

  const traceUrl = buildTraceUrl(batch.gs1TraceId);
  const qrDataUrl = await QRCode.toDataURL(traceUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    type: "image/png"
  });

  return {
    batchId: batch.id,
    gs1TraceId: batch.gs1TraceId,
    qrDataUrl,
    traceUrl
  };
}
