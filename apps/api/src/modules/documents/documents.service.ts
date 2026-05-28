import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { auditLog, supplyChainNode, traceBatch } from "../../db/schema";
import { getSupabaseAdmin } from "../../lib/supabase";
import { enqueueHashBatchJob } from "../../queues/blockchain.queue";

export const DOCUMENT_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET ?? "batch-documents";
export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type UploadBatchDocumentInput = {
  batchId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "document";
}

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function uploadBatchDocument(
  input: UploadBatchDocumentInput,
  actorId: string,
  orgId?: string
) {
  if (input.fileBuffer.byteLength === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Document upload must not be empty."
    });
  }

  if (input.fileBuffer.byteLength > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Document upload exceeds the 10 MB limit."
    });
  }

  const db = getDb();
  const [batch] = orgId
    ? await db
        .select({ id: traceBatch.id })
        .from(traceBatch)
        .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
        .where(and(eq(traceBatch.id, input.batchId), eq(supplyChainNode.orgId, orgId)))
    : await db
        .select({ id: traceBatch.id })
        .from(traceBatch)
        .where(eq(traceBatch.id, input.batchId));

  if (!batch) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trace batch not found."
    });
  }

  const docHash = sha256Hex(input.fileBuffer);
  const objectPath = `${input.batchId}/${docHash}-${sanitizeFileName(input.fileName)}`;
  const storage = getSupabaseAdmin().storage.from(DOCUMENT_BUCKET);

  const { error: uploadError } = await storage.upload(objectPath, input.fileBuffer, {
    contentType: input.mimeType,
    upsert: false
  });

  if (uploadError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: uploadError.message
    });
  }

  const { data: signedUrlData, error: signedUrlError } =
    await storage.createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (signedUrlError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: signedUrlError.message
    });
  }

  const [updatedBatch] = await db
    .update(traceBatch)
    .set({
      docHash,
      updatedAt: new Date()
    })
    .where(eq(traceBatch.id, input.batchId))
    .returning();

  await db.insert(auditLog).values({
    action: "batch.document.upload",
    actorId,
    resourceId: input.batchId
  });

  await enqueueHashBatchJob({ batchId: input.batchId });

  return {
    batch: updatedBatch,
    docHash,
    objectPath,
    signedUrl: signedUrlData.signedUrl
  };
}
