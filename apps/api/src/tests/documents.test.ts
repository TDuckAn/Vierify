import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const uploadMock = vi.fn();
const createSignedUrlMock = vi.fn();

vi.mock("../lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: createSignedUrlMock,
        upload: uploadMock
      }))
    }
  })
}));

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined)
}));

import type { DbClient } from "../db/client";
import { auditLog, traceBatch } from "../db/schema";
import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  uploadBatchDocument
} from "../modules/documents/documents.service";
import { enqueueHashBatchJob } from "../queues/blockchain.queue";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode
} from "./helpers";

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

describe("documents", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
    uploadMock.mockResolvedValue({ data: { path: "path" }, error: null });
    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: "https://signed.example/document" },
      error: null
    });
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("uploads a document, stores SHA-256 doc_hash, audits, and enqueues rehash", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);
    const fileBuffer = Buffer.from("certificate contents");
    const expectedHash = sha256Hex(fileBuffer);

    const result = await uploadBatchDocument(
      {
        batchId: batch.id,
        fileBuffer,
        fileName: "origin certificate.pdf",
        mimeType: "application/pdf"
      },
      TEST_ACTOR_ID
    );

    expect(result.docHash).toBe(expectedHash);
    expect(result.signedUrl).toBe("https://signed.example/document");
    expect(result.objectPath).toBe(`${batch.id}/${expectedHash}-origin-certificate.pdf`);
    expect(uploadMock).toHaveBeenCalledWith(result.objectPath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false
    });
    expect(createSignedUrlMock).toHaveBeenCalledWith(result.objectPath, 3600);

    const [updatedBatch] = await db
      .select({ docHash: traceBatch.docHash })
      .from(traceBatch)
      .where(eq(traceBatch.id, batch.id));
    expect(updatedBatch?.docHash).toBe(expectedHash);

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.resourceId, batch.id));
    expect(audit?.action).toBe("batch.document.upload");
    expect(audit?.actorId).toBe(TEST_ACTOR_ID);
    expect(enqueueHashBatchJob).toHaveBeenCalledWith({ batchId: batch.id });
  });

  it("rejects uploads over 10 MB before storage is called", async () => {
    await expect(
      uploadBatchDocument(
        {
          batchId: "00000000-0000-0000-0000-000000000001",
          fileBuffer: Buffer.alloc(MAX_DOCUMENT_UPLOAD_BYTES + 1),
          fileName: "too-large.pdf",
          mimeType: "application/pdf"
        },
        TEST_ACTOR_ID
      )
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rejects upload when batch does not exist", async () => {
    await expect(
      uploadBatchDocument(
        {
          batchId: "00000000-0000-0000-0000-000000000000",
          fileBuffer: Buffer.from("document"),
          fileName: "document.pdf",
          mimeType: "application/pdf"
        },
        TEST_ACTOR_ID
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
