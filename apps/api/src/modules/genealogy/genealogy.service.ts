import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import {
  auditLog,
  batchGenealogy,
  lossProfile,
  supplyChainNode,
  traceBatch
} from "../../db/schema";
import { DEFAULT_WASTE_TOLERANCE } from "./genealogy.schema";
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

async function hasCircularReference(
  childBatchId: string,
  parentBatchIds: string[]
): Promise<boolean> {
  const db = getDb();
  const targetParentIds = new Set(parentBatchIds);
  const visitedBatchIds = new Set<string>();
  let frontier = [childBatchId];

  while (frontier.length > 0) {
    const currentBatchIds = frontier.filter((batchId) => !visitedBatchIds.has(batchId));
    frontier = [];

    if (currentBatchIds.length === 0) {
      continue;
    }

    for (const batchId of currentBatchIds) {
      visitedBatchIds.add(batchId);
    }

    const childLinks = await db
      .select({ childBatchId: batchGenealogy.childBatchId })
      .from(batchGenealogy)
      .where(inArray(batchGenealogy.parentBatchId, currentBatchIds));

    for (const link of childLinks) {
      if (targetParentIds.has(link.childBatchId)) {
        return true;
      }

      if (!visitedBatchIds.has(link.childBatchId)) {
        frontier.push(link.childBatchId);
      }
    }
  }

  return false;
}

async function getBatchOrgRows(batchIds: string[]) {
  const db = getDb();

  return db
    .select({
      batchId: traceBatch.id,
      orgId: supplyChainNode.orgId
    })
    .from(traceBatch)
    .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
    .where(inArray(traceBatch.id, batchIds));
}

async function getLossThreshold(
  orgId: string,
  productType?: string,
  processStep?: string
) {
  const db = getDb();

  if (productType && processStep) {
    const [profile] = await db
      .select()
      .from(lossProfile)
      .where(
        and(
          eq(lossProfile.orgId, orgId),
          eq(lossProfile.productType, productType),
          eq(lossProfile.processStep, processStep)
        )
      )
      .limit(1);

    if (profile) {
      return {
        max: Number(profile.maxLossPct) / 100,
        min: Number(profile.minLossPct) / 100
      };
    }
  }

  return {
    max: DEFAULT_WASTE_TOLERANCE,
    min: 0
  };
}

export async function linkGenealogy(
  input: z.infer<typeof linkGenealogySchema>,
  actorId: string,
  orgId?: string
) {
  if (input.parentBatchIds.includes(input.childBatchId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A batch cannot be linked to itself."
    });
  }

  if (await hasCircularReference(input.childBatchId, input.parentBatchIds)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Circular batch genealogy is not allowed."
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

  const batchOrgRows = await getBatchOrgRows([
    input.childBatchId,
    ...input.parentBatchIds
  ]);
  const linkedOrgIds = new Set(batchOrgRows.map((row) => row.orgId));
  const linkedOrgId = batchOrgRows[0]?.orgId;

  if (linkedOrgIds.size > 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Batch genealogy cannot cross organization boundaries."
    });
  }

  if (orgId && !linkedOrgIds.has(orgId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Batch genealogy is outside the user's organization."
    });
  }

  if (!linkedOrgId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Batch organization not found."
    });
  }

  const childQuantity = parseQuantity(childBatch.quantity);
  const parentQuantity = parentBatches.reduce(
    (sum, batch) => sum + parseQuantity(batch.quantity),
    0
  );
  const { max, min } = await getLossThreshold(
    linkedOrgId,
    input.productType,
    input.processStep
  );
  const actualLoss = (parentQuantity - childQuantity) / parentQuantity;

  if (actualLoss < min) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Loss below minimum — possible phantom input"
    });
  }

  if (actualLoss > max) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Loss ${(actualLoss * 100).toFixed(1)}% exceeds profile maximum ${(
        max * 100
      ).toFixed(1)}%`
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

export async function getGenealogy(batchId: string, orgId?: string) {
  const db = getDb();

  if (orgId) {
    const [batchOrg] = await getBatchOrgRows([batchId]);

    if (!batchOrg || batchOrg.orgId !== orgId) {
      return {
        children: [],
        parents: []
      };
    }
  }

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
