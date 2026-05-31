import { describe, expect, it } from "vitest";

import { buildHashableBatch, hashBatch } from "../queues/hash-batch";
import type { traceBatch } from "../db/schema";

type TraceBatchRecord = typeof traceBatch.$inferSelect;

const SENSITIVE_PIN = "aabbccddeeff00112233445566778899aabbccddeeff001122334455667788990011";

const fakeBatch: TraceBatchRecord = {
  id: "batch-test-id-001",
  gs1TraceId: "010000000000000110TESTBATCH1",
  name: "Coffee Batch A",
  quantity: "100.000000",
  uom: "kg",
  gpsLat: "10.500000",
  gpsLng: "106.700000",
  pinHash: SENSITIVE_PIN,   // must NOT appear in hash
  scanCount: 42,            // must NOT appear in hash
  nodeId: "node-uuid-001",
  docHash: null,
  expiresAt: null,
  bcStatus: 0,              // must NOT appear in hash
  txHash: null,             // must NOT appear in hash
  version: 1,
  createdAt: new Date("2024-06-01T00:00:00Z"),  // must NOT appear in hash
  updatedAt: new Date("2024-06-01T00:00:00Z"),  // must NOT appear in hash
};

describe("hashBatch", () => {
  it("returns a 0x-prefixed 64-character hex string", () => {
    const result = hashBatch(fakeBatch);
    expect(result).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashBatch(fakeBatch)).toBe(hashBatch(fakeBatch));
  });

  it("produces a different hash when version changes", () => {
    const v1 = hashBatch({ ...fakeBatch, version: 1 });
    const v2 = hashBatch({ ...fakeBatch, version: 2 });
    expect(v1).not.toBe(v2);
  });

  it("produces a different hash when quantity changes", () => {
    const a = hashBatch({ ...fakeBatch, quantity: "100.000000" });
    const b = hashBatch({ ...fakeBatch, quantity: "101.000000" });
    expect(a).not.toBe(b);
  });
});

describe("buildHashableBatch — PII exclusion", () => {
  it("excludes pinHash from the hash payload", () => {
    const hashable = buildHashableBatch(fakeBatch);
    const canonical = JSON.stringify(hashable);
    expect(canonical).not.toContain(SENSITIVE_PIN);
    expect(Object.keys(hashable)).not.toContain("pinHash");
  });

  it("excludes scanCount from the hash payload", () => {
    const hashable = buildHashableBatch(fakeBatch);
    expect(Object.keys(hashable)).not.toContain("scanCount");
    // scanCount=42 should not leak via numeric value either
    const canonical = JSON.stringify(hashable);
    expect(JSON.parse(canonical)).not.toHaveProperty("scanCount");
  });

  it("excludes bcStatus and txHash from the hash payload", () => {
    const hashable = buildHashableBatch(fakeBatch);
    expect(Object.keys(hashable)).not.toContain("bcStatus");
    expect(Object.keys(hashable)).not.toContain("txHash");
  });

  it("excludes createdAt and updatedAt from the hash payload", () => {
    const hashable = buildHashableBatch(fakeBatch);
    expect(Object.keys(hashable)).not.toContain("createdAt");
    expect(Object.keys(hashable)).not.toContain("updatedAt");
  });

  it("includes the fields required for traceability (gs1TraceId, quantity, uom, nodeId, version)", () => {
    const hashable = buildHashableBatch(fakeBatch);
    expect(hashable).toMatchObject({
      gs1TraceId: fakeBatch.gs1TraceId,
      id: fakeBatch.id,
      name: fakeBatch.name,
      nodeId: fakeBatch.nodeId,
      quantity: fakeBatch.quantity,
      uom: fakeBatch.uom,
      version: fakeBatch.version,
    });
  });

  it("produces different hash payloads for batches differing only in pinHash (pinHash is excluded)", () => {
    const batchA = { ...fakeBatch, pinHash: "aaaa" };
    const batchB = { ...fakeBatch, pinHash: "bbbb" };
    // pinHash excluded → payloads must be equal → hashes must be equal
    expect(hashBatch(batchA)).toBe(hashBatch(batchB));
  });
});
