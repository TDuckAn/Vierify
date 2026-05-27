import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { auditLog, batchGenealogy, traceBatch } from "../../db/schema";
import type { linkGenealogySchema } from "./genealogy.schema";
import type { z } from "zod";

function parseQuantity(value: string): number {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stored batch quantity is invalid."
    });
  }

  return parsed;
}

export async function linkGenealogy(
  input: z.infer<typeof linkGenealogySchema>,
  actorId: string
) {
  if (input.parentBatchIds.includes(input.childBatchId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A batch cannot be linked to itself."
    });
  }

  const db = getDb();
  const [childBatch] = await db
    .select()
    .from(traceBatch)
    .where(eq(traceBatch.id, input.childBatchId));

  if (!childBatch) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Child batch not found."
    });
  }

  const parentBatches = await db
    .select()
    .from(traceBatch)
    .where(inArray(traceBatch.id, input.parentBatchIds));

  if (parentBatches.length !== input.parentBatchIds.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "One or more parent batches were not found."
    });
  }

  const childQuantity = parseQuantity(childBatch.quantity);
  const parentQuantity = parentBatches.reduce(
    (sum, batch) => sum + parseQuantity(batch.quantity),
    0
  );

  if (childQuantity > parentQuantity * (1 + input.wasteTolerance)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Mass Balance violation: output quantity exceeds allowed input quantity."
    });
  }

  const links = await db
    .insert(batchGenealogy)
    .values(
      input.parentBatchIds.map((parentBatchId) => ({
        childBatchId: input.childBatchId,
        parentBatchId,
        verifierId: actorId
      }))
    )
    .returning();

  await db.insert(auditLog).values({
    action: "genealogy.link",
    actorId,
    resourceId: input.childBatchId
  });

  return links;
}

export async function getGenealogy(batchId: string) {
  const db = getDb();

  const parents = await db
    .select({
      link: batchGenealogy,
      parentBatch: traceBatch
    })
    .from(batchGenealogy)
    .innerJoin(traceBatch, eq(batchGenealogy.parentBatchId, traceBatch.id))
    .where(eq(batchGenealogy.childBatchId, batchId));

  const children = await db
    .select({
      childBatch: traceBatch,
      link: batchGenealogy
    })
    .from(batchGenealogy)
    .innerJoin(traceBatch, eq(batchGenealogy.childBatchId, traceBatch.id))
    .where(eq(batchGenealogy.parentBatchId, batchId));

  return {
    children,
    parents
  };
}
