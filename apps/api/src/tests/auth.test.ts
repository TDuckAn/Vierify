import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined),
}));

import type { DbClient } from "../db/client";
import { createBatch } from "../modules/batches/batches.service";
import type { kybStatusEnum } from "../db/schema";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestNode,
  makeGs1Id,
} from "./helpers";

type KybStatus = (typeof kybStatusEnum.enumValues)[number];

describe("KYB gate enforcement", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  const blockedStatuses: KybStatus[] = ["pending", "rejected", "suspended"];

  it.each(blockedStatuses)(
    "blocks batch creation when kybStatus = %s",
    async (status) => {
      const node = await insertTestNode(db, { kybStatus: status });
      nodeIds.push(node.id);

      await expect(
        createBatch(
          { gs1TraceId: makeGs1Id(), name: "Batch", nodeId: node.id, quantity: 10, uom: "kg" },
          TEST_ACTOR_ID
        )
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  );

  it("allows batch creation when kybStatus = approved", async () => {
    const node = await insertTestNode(db, { kybStatus: "approved" });
    nodeIds.push(node.id);

    const batch = await createBatch(
      { gs1TraceId: makeGs1Id(), name: "Batch", nodeId: node.id, quantity: 10, uom: "kg" },
      TEST_ACTOR_ID
    );

    expect(batch.nodeId).toBe(node.id);
  });
});
