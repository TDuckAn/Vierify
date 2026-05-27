import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DbClient } from "../db/client";
import { getBatchByTraceId } from "../modules/batches/batches.service";
import {
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode,
  makeGs1Id,
} from "./helpers";

describe("PII anonymisation — B2C getBatchByTraceId", () => {
  let db: DbClient;
  const nodeIds: string[] = [];

  beforeEach(() => {
    db = getTestDb();
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));
  });

  it("masks name and nodeAddress for is_individual = true nodes", async () => {
    const node = await insertTestNode(db, {
      isIndividual: true,
      name: "Nguyen Van A",
      nodeAddress: "123 Private Lane, Hanoi",
    });
    nodeIds.push(node.id);

    const gs1TraceId = makeGs1Id();
    await insertTestBatch(db, node.id, { gs1TraceId });

    const result = await getBatchByTraceId(gs1TraceId);

    expect(result).not.toBeUndefined();
    expect(result?.node.name).toBe("***");
    expect(result?.node.nodeAddress).toBe("***");
  });

  it("does NOT mask fields for is_individual = false nodes", async () => {
    const node = await insertTestNode(db, {
      isIndividual: false,
      name: "Viet Coffee Co.",
      nodeAddress: "456 Industrial Zone, Ho Chi Minh City",
    });
    nodeIds.push(node.id);

    const gs1TraceId = makeGs1Id();
    await insertTestBatch(db, node.id, { gs1TraceId });

    const result = await getBatchByTraceId(gs1TraceId);

    expect(result?.node.name).toBe("Viet Coffee Co.");
    expect(result?.node.nodeAddress).toBe("456 Industrial Zone, Ho Chi Minh City");
  });

  it("exposes all non-PII batch fields regardless of node type", async () => {
    const node = await insertTestNode(db, { isIndividual: true });
    nodeIds.push(node.id);

    const gs1TraceId = makeGs1Id();
    const batch = await insertTestBatch(db, node.id, { gs1TraceId, name: "Rice Batch" });

    const result = await getBatchByTraceId(gs1TraceId);

    // Batch data must not be redacted
    expect(result?.batch.id).toBe(batch.id);
    expect(result?.batch.gs1TraceId).toBe(gs1TraceId);
    expect(result?.batch.name).toBe("Rice Batch");
    // Only node identity is masked
    expect(result?.node.name).toBe("***");
  });
});
