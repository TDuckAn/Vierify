import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined),
}));

import type { DbClient } from "../db/client";
import { linkGenealogy } from "../modules/genealogy/genealogy.service";
import { linkGenealogySchema } from "../modules/genealogy/genealogy.schema";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode,
} from "./helpers";

describe("genealogy", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  // ─── linkGenealogy ─────────────────────────────────────────────────────────

  describe("linkGenealogy", () => {
    it("links parent batches to a child batch successfully", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const parent = await insertTestBatch(db, node.id, { quantity: "200" });
      const child = await insertTestBatch(db, node.id, { quantity: "180" });

      const links = await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      expect(links).toHaveLength(1);
      expect(links[0]?.parentBatchId).toBe(parent.id);
      expect(links[0]?.childBatchId).toBe(child.id);
    });

    it("rejects Mass Balance violation: child > sum(parents) × (1 + tolerance)", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "110" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("accepts child within waste tolerance", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 105, parent = 100, tolerance = 0.1 → 100 × 1.1 = 110 ≥ 105 → OK
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "105" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0.1 },
          TEST_ACTOR_ID
        )
      ).resolves.toHaveLength(1);
    });

    it("rejects self-reference: childBatchId in parentBatchIds", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);
      const batch = await insertTestBatch(db, node.id);

      await expect(
        linkGenealogy(
          { childBatchId: batch.id, parentBatchIds: [batch.id], wasteTolerance: 0 },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects when a parent batch does not exist", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);
      const child = await insertTestBatch(db, node.id);

      await expect(
        linkGenealogy(
          {
            childBatchId: child.id,
            parentBatchIds: ["00000000-0000-0000-0000-000000000000"],
            wasteTolerance: 0,
          },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects when the child batch does not exist", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);
      const parent = await insertTestBatch(db, node.id);

      await expect(
        linkGenealogy(
          {
            childBatchId: "00000000-0000-0000-0000-000000000000",
            parentBatchIds: [parent.id],
            wasteTolerance: 0,
          },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("links multiple parents to one child (aggregate Mass Balance)", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const p1 = await insertTestBatch(db, node.id, { quantity: "60" });
      const p2 = await insertTestBatch(db, node.id, { quantity: "60" });
      // child = 110, sum(parents) = 120, tolerance = 0 → OK
      const child = await insertTestBatch(db, node.id, { quantity: "110" });

      const links = await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [p1.id, p2.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      expect(links).toHaveLength(2);
    });
  });

  // ─── linkGenealogySchema ───────────────────────────────────────────────────

  describe("linkGenealogySchema (Zod validation)", () => {
    const base = {
      childBatchId: "00000000-0000-0000-0000-000000000001",
      parentBatchIds: ["00000000-0000-0000-0000-000000000002"],
      wasteTolerance: 0,
    };

    it("rejects duplicate parentBatchIds", () => {
      const dup = "00000000-0000-0000-0000-000000000002";
      expect(
        linkGenealogySchema.safeParse({ ...base, parentBatchIds: [dup, dup] }).success
      ).toBe(false);
    });

    it("rejects empty parentBatchIds array", () => {
      expect(
        linkGenealogySchema.safeParse({ ...base, parentBatchIds: [] }).success
      ).toBe(false);
    });

    it("rejects wasteTolerance > 1", () => {
      expect(
        linkGenealogySchema.safeParse({ ...base, wasteTolerance: 1.5 }).success
      ).toBe(false);
    });

    it("rejects negative wasteTolerance", () => {
      expect(
        linkGenealogySchema.safeParse({ ...base, wasteTolerance: -0.1 }).success
      ).toBe(false);
    });
  });
});
