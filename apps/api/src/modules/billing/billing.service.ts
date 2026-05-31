import { and, count, desc, eq, gte, lt } from "drizzle-orm";

import { getDb } from "../../db/client";
import { invoice, subscription, supplyChainNode, traceBatch } from "../../db/schema";

function getCurrentMonthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { end, start };
}

export async function getCurrentSubscription(orgId: string) {
  const db = getDb();
  const monthBounds = getCurrentMonthBounds();
  const [{ batchesUsed }] = await db
    .select({ batchesUsed: count(traceBatch.id) })
    .from(traceBatch)
    .innerJoin(supplyChainNode, eq(traceBatch.nodeId, supplyChainNode.id))
    .where(
      and(
        eq(supplyChainNode.orgId, orgId),
        gte(traceBatch.createdAt, monthBounds.start),
        lt(traceBatch.createdAt, monthBounds.end)
      )
    );

  const [currentSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.orgId, orgId));

  return {
    batchesUsed,
    startedAt: currentSubscription?.startedAt ?? null,
    tier: currentSubscription?.tier ?? "free",
    trialEndsAt: currentSubscription?.trialEndsAt ?? null
  };
}

export async function getInvoices(orgId: string) {
  return getDb()
    .select()
    .from(invoice)
    .where(eq(invoice.orgId, orgId))
    .orderBy(desc(invoice.createdAt));
}
