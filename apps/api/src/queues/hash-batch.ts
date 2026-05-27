import { createHash } from "node:crypto";

import type { traceBatch } from "../db/schema";

type TraceBatchRecord = typeof traceBatch.$inferSelect;

type HashableBatch = {
  docHash: TraceBatchRecord["docHash"];
  gpsLat: TraceBatchRecord["gpsLat"];
  gpsLng: TraceBatchRecord["gpsLng"];
  gs1TraceId: TraceBatchRecord["gs1TraceId"];
  id: TraceBatchRecord["id"];
  name: TraceBatchRecord["name"];
  nodeId: TraceBatchRecord["nodeId"];
  quantity: TraceBatchRecord["quantity"];
  uom: TraceBatchRecord["uom"];
  version: TraceBatchRecord["version"];
};

function canonicalise(value: HashableBatch): string {
  return JSON.stringify(value, Object.keys(value).sort());
}

export function buildHashableBatch(batch: TraceBatchRecord): HashableBatch {
  return {
    docHash: batch.docHash,
    gpsLat: batch.gpsLat,
    gpsLng: batch.gpsLng,
    gs1TraceId: batch.gs1TraceId,
    id: batch.id,
    name: batch.name,
    nodeId: batch.nodeId,
    quantity: batch.quantity,
    uom: batch.uom,
    version: batch.version
  };
}

export function hashBatch(batch: TraceBatchRecord): `0x${string}` {
  const canonicalBatch = canonicalise(buildHashableBatch(batch));
  const hash = createHash("sha256").update(canonicalBatch).digest("hex");

  return `0x${hash}`;
}
