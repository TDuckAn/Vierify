import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { auditLog, supplyChainNode, traceBatch } from "../../db/schema";
import { enqueueHashBatchJob } from "../../queues/blockchain.queue";
import type {
  createBatchSchema,
  listBatchesSchema,
  manualOverrideSchema
} from "./batches.schema";
import type { z } from "zod";

type NodeProjection = typeof supplyChainNode.$inferSelect;

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
