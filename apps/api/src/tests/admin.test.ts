import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined)
}));

import type { DbClient } from "../db/client";
import { auditLog, supplyChainNode } from "../db/schema";
import { updateKybStatus } from "../modules/nodes/nodes.service";
import {
  TEST_ACTOR_ID,
  cleanupNodes,
  getTestDb,
  insertTestNode
} from "./helpers";

describe("admin KYB flow", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("updates node KYB status and writes an audit_log entry", async () => {
    const node = await insertTestNode(db, { kybStatus: "pending" });
    nodeIds.push(node.id);

    const updated = await updateKybStatus(
      {
        id: node.id,
        kybStatus: "approved"
      },
      TEST_ACTOR_ID
    );

    expect(updated?.kybStatus).toBe("approved");

    const [storedNode] = await db
      .select({ kybStatus: supplyChainNode.kybStatus })
      .from(supplyChainNode)
      .where(eq(supplyChainNode.id, node.id));
    expect(storedNode?.kybStatus).toBe("approved");

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.resourceId, node.id));
    expect(audit?.action).toBe("node.kyb.update");
    expect(audit?.actorId).toBe(TEST_ACTOR_ID);
  });
});
