import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocked before any service import so getDb() in service uses the real test DB
// but the blockchain queue never connects to Redis.
vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined),
}));

import { enqueueHashBatchJob } from "../queues/blockchain.queue";
import type { DbClient } from "../db/client";
import {
  createBatch,
  getBatch,
  getBatchByTraceId,
  listBatches,
} from "../modules/batches/batches.service";
import { createBatchSchema } from "../modules/batches/batches.schema";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode,
  makeGs1Id,
} from "./helpers";

describe("batches", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  // ─── createBatch ────────────────────────────────────────────────────────────

  describe("createBatch", () => {
    it("creates a batch for an approved node and enqueues a blockchain job", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const gs1TraceId = makeGs1Id();
      const batch = await createBatch(
        { gs1TraceId, name: "Coffee Batch", nodeId: node.id, quantity: 50, uom: "kg" },
        TEST_ACTOR_ID
      );

      expect(batch.gs1TraceId).toBe(gs1TraceId);
      expect(batch.nodeId).toBe(node.id);
      expect(batch.bcStatus).toBe(0);
      expect(enqueueHashBatchJob).toHaveBeenCalledOnce();
      expect(enqueueHashBatchJob).toHaveBeenCalledWith({ batchId: batch.id });
    });

    it("throws NOT_FOUND when the node does not exist", async () => {
      await expect(
        createBatch(
          {
            gs1TraceId: makeGs1Id(),
            name: "Orphan",
            nodeId: "00000000-0000-0000-0000-000000000000",
            quantity: 10,
            uom: "kg",
          },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // ─── getBatch ───────────────────────────────────────────────────────────────

  describe("getBatch", () => {
    it("returns the batch by UUID", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);
      const inserted = await insertTestBatch(db, node.id);

      const result = await getBatch(inserted.id);
      expect(result?.id).toBe(inserted.id);
    });

    it("returns undefined for an unknown UUID", async () => {
      expect(await getBatch("00000000-0000-0000-0000-000000000000")).toBeUndefined();
    });
  });

  // ─── getBatchByTraceId ───────────────────────────────────────────────────────

  describe("getBatchByTraceId", () => {
    it("returns batch with node for a valid GS1 trace ID", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);
      const gs1TraceId = makeGs1Id();
      const inserted = await insertTestBatch(db, node.id, { gs1TraceId });

      const result = await getBatchByTraceId(gs1TraceId);
      expect(result?.batch.id).toBe(inserted.id);
      expect(result?.node.id).toBe(node.id);
    });

    it("returns undefined for an unknown trace ID", async () => {
      expect(await getBatchByTraceId(makeGs1Id())).toBeUndefined();
    });
  });

  // ─── listBatches ─────────────────────────────────────────────────────────────

  describe("listBatches", () => {
    it("filters by nodeId", async () => {
      const nodeA = await insertTestNode(db);
      const nodeB = await insertTestNode(db);
      nodeIds.push(nodeA.id, nodeB.id);
      await insertTestBatch(db, nodeA.id);
      await insertTestBatch(db, nodeB.id);

      const results = await listBatches({ nodeId: nodeA.id, limit: 50 });
      expect(results.every((b) => b.nodeId === nodeA.id)).toBe(true);
    });
  });

  // ─── createBatchSchema ───────────────────────────────────────────────────────

  describe("createBatchSchema (Zod validation)", () => {
    const base = {
      name: "Batch",
      nodeId: "00000000-0000-0000-0000-000000000001",
      quantity: 10,
      uom: "kg",
    };

    it("accepts a valid GS1 trace ID", () => {
      expect(
        createBatchSchema.safeParse({ ...base, gs1TraceId: makeGs1Id() }).success
      ).toBe(true);
    });

    it("rejects a plain UUID as gs1TraceId", () => {
      expect(
        createBatchSchema.safeParse({
          ...base,
          gs1TraceId: "550e8400-e29b-41d4-a716-446655440000",
        }).success
      ).toBe(false);
    });

    it("rejects zero quantity", () => {
      expect(
        createBatchSchema.safeParse({ ...base, gs1TraceId: makeGs1Id(), quantity: 0 })
          .success
      ).toBe(false);
    });

    it("rejects negative quantity", () => {
      expect(
        createBatchSchema.safeParse({ ...base, gs1TraceId: makeGs1Id(), quantity: -1 })
          .success
      ).toBe(false);
    });

    it("rejects a doc_hash that is not a 64-char hex string", () => {
      expect(
        createBatchSchema.safeParse({
          ...base,
          gs1TraceId: makeGs1Id(),
          docHash: "not-a-hash",
        }).success
      ).toBe(false);
    });
  });
});
