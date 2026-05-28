import { inArray } from "drizzle-orm";

import { createDb, type DbClient } from "../db/client";
import { batchGenealogy, supplyChainNode, traceBatch } from "../db/schema";

export const TEST_ACTOR_ID = "00000000-0000-0000-0000-000000000099";
export const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001";
export const OTHER_TEST_ORG_ID = "00000000-0000-0000-0000-000000000002";

export function getTestDb(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL (or TEST_DATABASE_URL) must be set to run integration tests."
    );
  }
  return createDb(url);
}

export function makeGs1Id(): string {
  const gtin = Array.from({ length: 14 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const batch = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `01${gtin}10${batch}`;
}

export async function insertTestNode(
  db: DbClient,
  overrides: Partial<typeof supplyChainNode.$inferInsert> = {}
) {
  const [node] = await db
    .insert(supplyChainNode)
    .values({
      kybStatus: "approved",
      name: "Test Farm",
      nodeType: "farm",
      orgId: TEST_ORG_ID,
      ...overrides,
    })
    .returning();
  if (!node) throw new Error("insertTestNode: insert returned no rows");
  return node;
}

export async function insertTestBatch(
  db: DbClient,
  nodeId: string,
  overrides: Partial<typeof traceBatch.$inferInsert> = {}
) {
  const [batch] = await db
    .insert(traceBatch)
    .values({
      gs1TraceId: makeGs1Id(),
      name: "Test Batch",
      nodeId,
      quantity: "100",
      uom: "kg",
      ...overrides,
    })
    .returning();
  if (!batch) throw new Error("insertTestBatch: insert returned no rows");
  return batch;
}

export async function cleanupBatches(db: DbClient, batchIds: string[]) {
  if (!batchIds.length) return;
  await db
    .delete(batchGenealogy)
    .where(inArray(batchGenealogy.childBatchId, batchIds));
  await db
    .delete(batchGenealogy)
    .where(inArray(batchGenealogy.parentBatchId, batchIds));
  await db.delete(traceBatch).where(inArray(traceBatch.id, batchIds));
}

export async function cleanupNodes(db: DbClient, nodeIds: string[]) {
  if (!nodeIds.length) return;
  const rows = await db
    .select({ id: traceBatch.id })
    .from(traceBatch)
    .where(inArray(traceBatch.nodeId, nodeIds));
  await cleanupBatches(db, rows.map((r) => r.id));
  await db
    .delete(supplyChainNode)
    .where(inArray(supplyChainNode.id, nodeIds));
}
