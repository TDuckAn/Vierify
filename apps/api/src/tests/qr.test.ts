import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DbClient } from "../db/client";
import { buildTraceUrl, getBatchQrCode } from "../modules/qr/qr.service";
import {
  cleanupNodes,
  getTestDb,
  insertTestBatch,
  insertTestNode
} from "./helpers";

describe("qr", () => {
  let db: DbClient;
  const nodeIds: string[] = [];
  const originalTraceBaseUrl = process.env.CONSUMER_TRACE_BASE_URL;

  beforeEach(() => {
    db = getTestDb();
    process.env.CONSUMER_TRACE_BASE_URL = "https://consumer.example/trace/";
  });

  afterEach(async () => {
    await cleanupNodes(db, nodeIds.splice(0));

    if (originalTraceBaseUrl === undefined) {
      delete process.env.CONSUMER_TRACE_BASE_URL;
    } else {
      process.env.CONSUMER_TRACE_BASE_URL = originalTraceBaseUrl;
    }
  });

  it("generates a QR data URL that resolves to the batch trace page", async () => {
    const node = await insertTestNode(db);
    nodeIds.push(node.id);
    const batch = await insertTestBatch(db, node.id, {
      gs1TraceId: "010123456789012810LOT42"
    });

    const result = await getBatchQrCode(batch.id);

    expect(result.batchId).toBe(batch.id);
    expect(result.gs1TraceId).toBe(batch.gs1TraceId);
    expect(result.traceUrl).toBe(
      `https://consumer.example/trace/${batch.gs1TraceId}`
    );
    expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("URL-encodes GS1 batch values in trace URLs", () => {
    expect(buildTraceUrl("010123456789012810LOT/42")).toBe(
      "https://consumer.example/trace/010123456789012810LOT%2F42"
    );
  });

  it("rejects QR generation when the batch does not exist", async () => {
    await expect(
      getBatchQrCode("00000000-0000-0000-0000-000000000000")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
