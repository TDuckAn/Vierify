import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../queues/blockchain.queue", () => ({
  enqueueHashBatchJob: vi.fn().mockResolvedValue(undefined)
}));

import type { DbClient } from "../db/client";
import {
  createBatch,
  getBatch,
  listBatches
} from "../modules/batches/batches.service";
import { linkGenealogy } from "../modules/genealogy/genealogy.service";
import {
  OTHER_TEST_ORG_ID,
  TEST_ACTOR_ID,
  TEST_ORG_ID,
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode,
  makeGs1Id
} from "./helpers";

describe("multi-tenant organization scope", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("scopes batch reads to the user's organization", async () => {
    const tenantNode = await insertTestNode(db, { orgId: TEST_ORG_ID });
    const otherNode = await insertTestNode(db, { orgId: OTHER_TEST_ORG_ID });
    nodeIds.push(tenantNode.id, otherNode.id);

    const tenantBatch = await insertTestBatch(db, tenantNode.id);
    const otherBatch = await insertTestBatch(db, otherNode.id);

    await expect(getBatch(tenantBatch.id, TEST_ORG_ID)).resolves.toMatchObject({
      id: tenantBatch.id
    });
    await expect(getBatch(otherBatch.id, TEST_ORG_ID)).resolves.toBeUndefined();

    const visibleBatches = await listBatches({ limit: 50 }, TEST_ORG_ID);
    expect(visibleBatches.some((batch) => batch.id === tenantBatch.id)).toBe(true);
    expect(visibleBatches.some((batch) => batch.id === otherBatch.id)).toBe(false);
  });

  it("blocks merchants from creating batches for another organization node", async () => {
    const otherNode = await insertTestNode(db, { orgId: OTHER_TEST_ORG_ID });
    nodeIds.push(otherNode.id);

    await expect(
      createBatch(
        {
          gs1TraceId: makeGs1Id(),
          name: "Wrong Tenant Batch",
          nodeId: otherNode.id,
          quantity: 10,
          uom: "kg"
        },
        TEST_ACTOR_ID,
        TEST_ORG_ID
      )
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("rejects genealogy links that cross organization boundaries before mass balance", async () => {
    const tenantNode = await insertTestNode(db, { orgId: TEST_ORG_ID });
    const otherNode = await insertTestNode(db, { orgId: OTHER_TEST_ORG_ID });
    nodeIds.push(tenantNode.id, otherNode.id);

    const childBatch = await insertTestBatch(db, tenantNode.id, {
      quantity: "10"
    });
    const otherOrgParentBatch = await insertTestBatch(db, otherNode.id, {
      quantity: "1000"
    });

    await expect(
      linkGenealogy(
        {
          childBatchId: childBatch.id,
          parentBatchIds: [otherOrgParentBatch.id],
          wasteTolerance: 0.05
        },
        TEST_ACTOR_ID,
        TEST_ORG_ID
      )
    ).rejects.toMatchObject({
      code: "CONFLICT"
    });
  });
});
