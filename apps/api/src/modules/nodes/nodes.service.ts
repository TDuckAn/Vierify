import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../../db/client";
import { auditLog, supplyChainNode } from "../../db/schema";
import type {
  createNodeSchema,
  listNodesSchema,
  updateKybStatusSchema
} from "./nodes.schema";
import type { z } from "zod";

export async function createNode(input: z.infer<typeof createNodeSchema>, actorId: string) {
  const db = getDb();
  const [node] = await db
    .insert(supplyChainNode)
    .values({
      isIndividual: input.isIndividual,
      name: input.name,
      nodeAddress: input.nodeAddress,
      nodeType: input.nodeType,
      orgId: input.orgId,
      taxCode: input.taxCode
    })
    .returning();

  await db.insert(auditLog).values({
    action: "node.create",
    actorId,
    resourceId: node.id
  });

  return node;
}

export async function getNode(id: string, orgId?: string) {
  const db = getDb();
  const [node] = await db
    .select()
    .from(supplyChainNode)
    .where(
      orgId
        ? and(eq(supplyChainNode.id, id), eq(supplyChainNode.orgId, orgId))
        : eq(supplyChainNode.id, id)
    );

  return node;
}

export async function listNodes(input: z.infer<typeof listNodesSchema>, orgId?: string) {
  const db = getDb();

  const filters = [
    input.kybStatus ? eq(supplyChainNode.kybStatus, input.kybStatus) : undefined,
    orgId ? eq(supplyChainNode.orgId, orgId) : undefined
  ].filter((filter) => filter !== undefined);
  const where = filters.length > 0 ? and(...filters) : undefined;

  if (input.kybStatus) {
    return db
      .select()
      .from(supplyChainNode)
      .where(where)
      .orderBy(desc(supplyChainNode.createdAt))
      .limit(input.limit);
  }

  return db
    .select()
    .from(supplyChainNode)
    .where(where)
    .orderBy(desc(supplyChainNode.createdAt))
    .limit(input.limit);
}

export async function updateKybStatus(
  input: z.infer<typeof updateKybStatusSchema>,
  actorId: string
) {
  const db = getDb();
  const [node] = await db
    .update(supplyChainNode)
    .set({
      kybStatus: input.kybStatus,
      updatedAt: new Date()
    })
    .where(eq(supplyChainNode.id, input.id))
    .returning();

  if (node) {
    await db.insert(auditLog).values({
      action: "node.kyb.update",
      actorId,
      resourceId: node.id
    });
  }

  return node;
}
