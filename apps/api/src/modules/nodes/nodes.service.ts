import { desc, eq } from "drizzle-orm";

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

export async function getNode(id: string) {
  const db = getDb();
  const [node] = await db.select().from(supplyChainNode).where(eq(supplyChainNode.id, id));

  return node;
}

export async function listNodes(input: z.infer<typeof listNodesSchema>) {
  const db = getDb();

  if (input.kybStatus) {
    return db
      .select()
      .from(supplyChainNode)
      .where(eq(supplyChainNode.kybStatus, input.kybStatus))
      .orderBy(desc(supplyChainNode.createdAt))
      .limit(input.limit);
  }

  return db
    .select()
    .from(supplyChainNode)
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
