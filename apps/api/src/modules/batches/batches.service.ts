import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { auditLog, batchGenealogy, supplyChainNode, traceBatch } from "../../db/schema";
import { enqueueHashBatchJob } from "../../queues/blockchain.queue";
import type {
  createBatchSchema,
  listBatchesSchema,
  manualOverrideSchema
} from "./batches.schema";
import type { z } from "zod";

type NodeProjection = typeof supplyChainNode.$inferSelect;
type TraceForwardNode = Pick<
  typeof traceBatch.$inferSelect,
  "id" | "name" | "gs1TraceId" | "nodeId" | "bcStatus" | "scanCount"
> & {
  hop: number;
};

function anonymiseNode(node: NodeProjection): NodeProjection {
  if (!node.isIndividual) {
    return node;
  }

  // Mask all personal identifiers for individual suppliers (Decree 13/2023/NĐ-CP)
  return {
    ...node,
    name: "***",
    nodeAddress: "***",
    taxCode: null
  };
}

export async function createBatch(
  input: z.infer<typeof createBatchSchema>,
  actorId: string,
  orgId?: string
) {
  const db = getDb();
  const [node] = await db
    .select()
    .from(supplyChainNode)
    .where(eq(supplyChainNode.id, input.nodeId));

  if (!node) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Supply chain node not found."
    });
  }

  if (orgId && node.orgId !== orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Batch node is outside the user's organization."
    });
  }

  if (node.kybStatus !== "approved") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "B2B account cannot create batches until KYB is approved."
    });
  }

  const [batch] = await db
    .insert(traceBatch)
    .values({
      docHash: input.docHash,
      expiresAt: input.expiresAt,
      gpsLat: input.gpsLat?.toString(),
      gpsLng: input.gpsLng?.toString(),
      gs1TraceId: input.gs1TraceId,
      name: input.name,
      nodeId: input.nodeId,
      pinHash: input.pinHash,
      quantity: input.quantity.toString(),
      uom: input.uom
    })
    .returning();

  await db.insert(auditLog).values({
    action: "batch.create",
    actorId,
    resourceId: batch.id
  });

  await enqueueHashBatchJob({ batchId: batch.id });

  return batch;
}

export async function getBatch(id: string, orgId?: string) {
  const db = getDb();

  if (orgId) {
    const [row] = await db
      .select({ batch: traceBatch })
      .from(traceBatch)
      .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
      .where(and(eq(traceBatch.id, id), eq(supplyChainNode.orgId, orgId)));

    return row?.batch;
  }

  const [batch] = await db.select().from(traceBatch).where(eq(traceBatch.id, id));

  return batch;
}

export async function getBatchByTraceId(gs1TraceId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      batch: traceBatch,
      node: supplyChainNode
    })
    .from(traceBatch)
    .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
    .where(eq(traceBatch.gs1TraceId, gs1TraceId));

  if (!row) {
    return undefined;
  }

  return {
    batch: row.batch,
    node: anonymiseNode(row.node)
  };
}

export async function listBatches(input: z.infer<typeof listBatchesSchema>, orgId?: string) {
  const db = getDb();

  if (orgId) {
    const filters = [
      eq(supplyChainNode.orgId, orgId),
      input.nodeId ? eq(traceBatch.nodeId, input.nodeId) : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await db
      .select({ batch: traceBatch })
      .from(traceBatch)
      .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
      .where(and(...filters))
      .orderBy(desc(traceBatch.createdAt))
      .limit(input.limit);

    return rows.map((row) => row.batch);
  }

  if (input.nodeId) {
    return db
      .select()
      .from(traceBatch)
      .where(eq(traceBatch.nodeId, input.nodeId))
      .orderBy(desc(traceBatch.createdAt))
      .limit(input.limit);
  }

  return db.select().from(traceBatch).orderBy(desc(traceBatch.createdAt)).limit(input.limit);
}

export async function manualOverrideBatch(
  input: z.infer<typeof manualOverrideSchema>,
  actorId: string,
  orgId?: string
) {
  const db = getDb();
  const partialIdFilter = sql`${traceBatch.id}::text ILIKE ${`%${input.partialBatchId}`}`;

  const rows = orgId
    ? await db
        .select({ batch: traceBatch })
        .from(traceBatch)
        .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
        .where(and(partialIdFilter, eq(supplyChainNode.orgId, orgId)))
        .limit(2)
    : await db
        .select({ batch: traceBatch })
        .from(traceBatch)
        .where(partialIdFilter)
        .limit(2);

  if (rows.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trace batch not found."
    });
  }

  if (rows.length > 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Partial ID matches multiple batches"
    });
  }

  const batch = rows[0].batch;

  await db.insert(auditLog).values({
    action: "batch.manual_override",
    actorId,
    resourceId: batch.id
  });

  return batch;
}

export async function traceForwardBatch(batchId: string, orgId?: string): Promise<TraceForwardNode[]> {
  const db = getDb();
  const visited = new Set<string>([batchId]);
  const result: TraceForwardNode[] = [];
  const queue: Array<{ batchId: string; hop: number }> = [{ batchId, hop: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || current.hop >= 10) {
      continue;
    }

    const childLinks = await db
      .select({ childBatchId: batchGenealogy.childBatchId })
      .from(batchGenealogy)
      .where(eq(batchGenealogy.parentBatchId, current.batchId));

    for (const { childBatchId } of childLinks) {
      if (visited.has(childBatchId)) {
        continue;
      }

      visited.add(childBatchId);
      const childHop = current.hop + 1;
      queue.push({ batchId: childBatchId, hop: childHop });

      const rows = orgId
        ? await db
            .select({
              bcStatus: traceBatch.bcStatus,
              gs1TraceId: traceBatch.gs1TraceId,
              id: traceBatch.id,
              name: traceBatch.name,
              nodeId: traceBatch.nodeId,
              scanCount: traceBatch.scanCount
            })
            .from(traceBatch)
            .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
            .where(and(eq(traceBatch.id, childBatchId), eq(supplyChainNode.orgId, orgId)))
            .limit(1)
        : await db
            .select({
              bcStatus: traceBatch.bcStatus,
              gs1TraceId: traceBatch.gs1TraceId,
              id: traceBatch.id,
              name: traceBatch.name,
              nodeId: traceBatch.nodeId,
              scanCount: traceBatch.scanCount
            })
            .from(traceBatch)
            .where(eq(traceBatch.id, childBatchId))
            .limit(1);

      if (rows[0]) {
        result.push({ ...rows[0], hop: childHop });
      }
    }
  }

  return result;
}

export async function notifyRecall(batchIds: string[], actorId: string) {
  const db = getDb();

  await db.insert(auditLog).values(
    batchIds.map((batchId) => ({
      action: "batch.recall_notified",
      actorId,
      resourceId: batchId
    }))
  );

  return { notified: batchIds.length };
}
