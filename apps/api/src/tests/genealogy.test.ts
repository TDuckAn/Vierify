import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined),
}));

import type { DbClient } from "../db/client";
import { auditLog } from "../db/schema";
import { DEFAULT_WASTE_TOLERANCE, linkGenealogySchema } from "../modules/genealogy/genealogy.schema";
import { getGenealogy, linkGenealogy } from "../modules/genealogy/genealogy.service";
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

      // child = 192, parent = 200 → loss = 4% < 5% default max → OK
      const parent = await insertTestBatch(db, node.id, { quantity: "200" });
      const child = await insertTestBatch(db, node.id, { quantity: "192" });

      const links = await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      expect(links).toHaveLength(1);
      expect(links[0]?.parentBatchId).toBe(parent.id);
      expect(links[0]?.childBatchId).toBe(child.id);
    });

    it("rejects phantom input: child exceeds total parent quantity", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 110, parent = 100 → loss = -10% < min(0%) → phantom input
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "110" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("accepts child quantity with loss within default 5% loss band", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 96, parent = 100 → loss = 4% < 5% default max → OK
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "96" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
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

    it("rejects circular genealogy through existing descendants", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // All equal quantity → 0% loss, within [0%, 5%] band
      const source = await insertTestBatch(db, node.id, { quantity: "100" });
      const intermediate = await insertTestBatch(db, node.id, { quantity: "100" });
      const descendant = await insertTestBatch(db, node.id, { quantity: "100" });

      await linkGenealogy(
        {
          childBatchId: intermediate.id,
          parentBatchIds: [source.id],
          wasteTolerance: 0
        },
        TEST_ACTOR_ID
      );
      await linkGenealogy(
        {
          childBatchId: descendant.id,
          parentBatchIds: [intermediate.id],
          wasteTolerance: 0
        },
        TEST_ACTOR_ID
      );

      await expect(
        linkGenealogy(
          {
            childBatchId: source.id,
            parentBatchIds: [descendant.id],
            wasteTolerance: 0
          },
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

      // child = 114, sum(parents) = 120 → loss = 5% = max default → OK
      const p1 = await insertTestBatch(db, node.id, { quantity: "60" });
      const p2 = await insertTestBatch(db, node.id, { quantity: "60" });
      const child = await insertTestBatch(db, node.id, { quantity: "114" });

      const links = await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [p1.id, p2.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      expect(links).toHaveLength(2);
    });

    it("accepts child quantity exactly at the 5% loss boundary", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 95, parent = 100 → loss = 5% = max default → OK
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "95" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
          TEST_ACTOR_ID
        )
      ).resolves.toHaveLength(1);
    });

    it("rejects child quantity exceeding default 5% loss maximum", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 94, parent = 100 → loss = 6% > 5% max → CONFLICT
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "94" });

      await expect(
        linkGenealogy(
          { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("applies DEFAULT_WASTE_TOLERANCE constant (5%) as schema default", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      expect(DEFAULT_WASTE_TOLERANCE).toBe(0.05);

      // child = 96, parent = 100 → loss = 4% < 5% default loss profile max → OK
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "96" });

      const parsed = linkGenealogySchema.parse({
        childBatchId: child.id,
        parentBatchIds: [parent.id],
      });
      expect(parsed.wasteTolerance).toBe(0.05);

      await expect(
        linkGenealogy(parsed, TEST_ACTOR_ID)
      ).resolves.toHaveLength(1);
    });

    it("writes an audit_log entry with action='genealogy.link' and resourceId=childBatchId", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // child = 96, parent = 100 → 4% loss within default band
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "96" });

      await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      const entries = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.resourceId, child.id));

      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.some((e) => e.action === "genealogy.link")).toBe(true);
      expect(entries.every((e) => e.actorId === TEST_ACTOR_ID)).toBe(true);
    });
  });

  // ─── getGenealogy ──────────────────────────────────────────────────────────

  describe("getGenealogy", () => {
    it("returns empty parents and children for an unlinked batch", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const orphan = await insertTestBatch(db, node.id);
      const result = await getGenealogy(orphan.id);

      expect(result.parents).toHaveLength(0);
      expect(result.children).toHaveLength(0);
    });

    it("returns parents when a child is linked to parents", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // 4% loss — within default 5% band
      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "96" });

      await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      const result = await getGenealogy(child.id);

      expect(result.parents).toHaveLength(1);
      expect(result.parents[0]?.parentBatch.id).toBe(parent.id);
      expect(result.children).toHaveLength(0);
    });

    it("returns children when a parent has linked children", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      const parent = await insertTestBatch(db, node.id, { quantity: "100" });
      const child = await insertTestBatch(db, node.id, { quantity: "96" });

      await linkGenealogy(
        { childBatchId: child.id, parentBatchIds: [parent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      const result = await getGenealogy(parent.id);

      expect(result.children).toHaveLength(1);
      expect(result.children[0]?.childBatch.id).toBe(child.id);
      expect(result.parents).toHaveLength(0);
    });

    it("returns both parents and children for a middle-chain batch", async () => {
      const node = await insertTestNode(db);
      nodeIds.push(node.id);

      // Each step ~4% loss — within default 5% band
      const grandparent = await insertTestBatch(db, node.id, { quantity: "100" });
      const middle = await insertTestBatch(db, node.id, { quantity: "96" });
      const grandchild = await insertTestBatch(db, node.id, { quantity: "92" });

      await linkGenealogy(
        { childBatchId: middle.id, parentBatchIds: [grandparent.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );
      await linkGenealogy(
        { childBatchId: grandchild.id, parentBatchIds: [middle.id], wasteTolerance: 0 },
        TEST_ACTOR_ID
      );

      const result = await getGenealogy(middle.id);

      expect(result.parents).toHaveLength(1);
      expect(result.parents[0]?.parentBatch.id).toBe(grandparent.id);
      expect(result.children).toHaveLength(1);
      expect(result.children[0]?.childBatch.id).toBe(grandchild.id);
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
