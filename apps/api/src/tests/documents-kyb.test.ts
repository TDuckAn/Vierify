import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/supabase", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase";
import { enqueueHashBatchJob } from "../queues/blockchain.queue";
import type { DbClient } from "../db/client";
import { auditLog, traceBatch } from "../db/schema";
import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  uploadBatchDocument,
} from "../modules/documents/documents.service";
import { createBatch } from "../modules/batches/batches.service";
import { updateKybStatus } from "../modules/nodes/nodes.service";
import { requireAdminUser } from "../context";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode,
  makeGs1Id,
} from "./helpers";

const FAKE_SIGNED_URL = "https://abc.supabase.co/storage/v1/signed/batch-documents/test";
const SMALL_FILE = Buffer.from("hello-vierify-document");

function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// ─── Document upload ──────────────────────────────────────────────────────────

describe("uploadBatchDocument", () => {
  let db: DbClient;
  const nodeIds: string[] = [];
  let mockUpload: ReturnType<typeof vi.fn>;
  let mockCreateSignedUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();

    mockUpload = vi.fn().mockResolvedValue({ error: null });
    mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: FAKE_SIGNED_URL },
      error: null,
    });

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          createSignedUrl: mockCreateSignedUrl,
        })),
      },
    } as any);
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("stores the SHA-256 doc_hash in trace_batch and returns the signed URL", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);

    const result = await uploadBatchDocument(
      { batchId: batch.id, fileBuffer: SMALL_FILE, fileName: "cert.pdf", mimeType: "application/pdf" },
      TEST_ACTOR_ID
    );

    const expectedHash = sha256Hex(SMALL_FILE);

    expect(result.docHash).toBe(expectedHash);
    expect(result.signedUrl).toBe(FAKE_SIGNED_URL);

    const [updated] = await db
      .select({ docHash: traceBatch.docHash })
      .from(traceBatch)
      .where(eq(traceBatch.id, batch.id));
    expect(updated?.docHash).toBe(expectedHash);
  });

  it("rejects an empty file → BAD_REQUEST", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);

    await expect(
      uploadBatchDocument(
        { batchId: batch.id, fileBuffer: Buffer.alloc(0), fileName: "empty.pdf", mimeType: "application/pdf" },
        TEST_ACTOR_ID
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a file over 10 MB → PAYLOAD_TOO_LARGE", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);

    await expect(
      uploadBatchDocument(
        { batchId: batch.id, fileBuffer: Buffer.alloc(MAX_DOCUMENT_UPLOAD_BYTES + 1), fileName: "huge.pdf", mimeType: "application/pdf" },
        TEST_ACTOR_ID
      )
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("rejects upload for a non-existent batch → NOT_FOUND", async () => {
    await expect(
      uploadBatchDocument(
        { batchId: "00000000-0000-0000-0000-000000000000", fileBuffer: SMALL_FILE, fileName: "cert.pdf", mimeType: "application/pdf" },
        TEST_ACTOR_ID
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("writes an audit_log entry with action='batch.document.upload' and correct actorId", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);

    await uploadBatchDocument(
      { batchId: batch.id, fileBuffer: SMALL_FILE, fileName: "cert.pdf", mimeType: "application/pdf" },
      TEST_ACTOR_ID
    );

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.resourceId, batch.id));

    expect(entries.some((e) => e.action === "batch.document.upload")).toBe(true);
    expect(entries.every((e) => e.actorId === TEST_ACTOR_ID)).toBe(true);
  });

  it("triggers enqueueHashBatchJob with the correct batchId after upload", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id);

    await uploadBatchDocument(
      { batchId: batch.id, fileBuffer: SMALL_FILE, fileName: "cert.pdf", mimeType: "application/pdf" },
      TEST_ACTOR_ID
    );

    expect(vi.mocked(enqueueHashBatchJob)).toHaveBeenCalledOnce();
    expect(vi.mocked(enqueueHashBatchJob)).toHaveBeenCalledWith({ batchId: batch.id });
  });
});

// ─── KYB status update ────────────────────────────────────────────────────────

describe("updateKybStatus", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("updates kybStatus and writes an audit_log entry", async () => {
    const node = await insertTestNode(db, { kybStatus: "pending" });
    nodeIds.push(node.id);

    const updated = await updateKybStatus({ id: node.id, kybStatus: "approved" }, TEST_ACTOR_ID);

    expect(updated?.kybStatus).toBe("approved");

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.resourceId, node.id));

    expect(entries.some((e) => e.action === "node.kyb.update")).toBe(true);
    expect(entries.every((e) => e.actorId === TEST_ACTOR_ID)).toBe(true);
  });

  it("returns undefined for a non-existent node (NOT_FOUND handled by caller)", async () => {
    const result = await updateKybStatus(
      { id: "00000000-0000-0000-0000-000000000000", kybStatus: "approved" },
      TEST_ACTOR_ID
    );
    expect(result).toBeUndefined();
  });
});

// ─── KYB gate in createBatch ──────────────────────────────────────────────────

describe("createBatch — KYB gate", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: vi.fn() },
    } as any);
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it.each(["pending", "rejected", "suspended"] as const)(
    "blocks batch creation when kybStatus is '%s' → FORBIDDEN",
    async (status) => {
      const node = await insertTestNode(db, { kybStatus: status });
      nodeIds.push(node.id);

      await expect(
        createBatch(
          { gs1TraceId: makeGs1Id(), name: "Batch A", nodeId: node.id, quantity: 100, uom: "kg" },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  );

  it("allows batch creation once kybStatus transitions to 'approved'", async () => {
    const node = await insertTestNode(db, { kybStatus: "pending" });
    nodeIds.push(node.id);

    await updateKybStatus({ id: node.id, kybStatus: "approved" }, TEST_ACTOR_ID);

    await expect(
      createBatch(
        { gs1TraceId: makeGs1Id(), name: "Batch A", nodeId: node.id, quantity: 100, uom: "kg" },
        TEST_ACTOR_ID
      )
    ).resolves.toBeDefined();
  });
});

// ─── requireAdminUser — RBAC ──────────────────────────────────────────────────

describe("requireAdminUser — RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves with user when app_metadata.role is 'admin'", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-user-id",
              email: "admin@vierify.com",
              app_metadata: { role: "admin" },
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    } as any);

    const user = await requireAdminUser("Bearer valid-admin-token");
    expect(user.id).toBe("admin-user-id");
    expect(user.role).toBe("admin");
  });

  it("throws FORBIDDEN when user has no role in app_metadata", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "merchant-user-id",
              email: "merchant@vierify.com",
              app_metadata: {},
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    } as any);

    await expect(requireAdminUser("Bearer valid-merchant-token")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws UNAUTHORIZED when no Authorization header is provided", async () => {
    await expect(requireAdminUser(undefined)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws UNAUTHORIZED when the Supabase token is invalid", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid JWT" },
        }),
      },
    } as any);

    await expect(requireAdminUser("Bearer bad-token")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
