import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { getDb } from "../../db/client";
import { lossProfile } from "../../db/schema";
import type {
  createLossProfileSchema,
  updateLossProfileSchema
} from "./loss-profiles.schema";
import type { z } from "zod";

function requireOrgId(orgId: string | undefined): string {
  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization scope required."
    });
  }

  return orgId;
}

export async function listLossProfiles(orgId?: string) {
  const db = getDb();

  if (orgId) {
    return db
      .select()
      .from(lossProfile)
      .where(eq(lossProfile.orgId, orgId))
      .orderBy(desc(lossProfile.createdAt));
  }

  return db.select().from(lossProfile).orderBy(desc(lossProfile.createdAt));
}

export async function createLossProfile(
  input: z.infer<typeof createLossProfileSchema>,
  orgId: string | undefined
) {
  const db = getDb();
  const scopedOrgId = requireOrgId(orgId);

  const [profile] = await db
    .insert(lossProfile)
    .values({
      maxLossPct: input.maxLossPct.toFixed(2),
      minLossPct: input.minLossPct.toFixed(2),
      orgId: scopedOrgId,
      processStep: input.processStep,
      productType: input.productType
    })
    .returning();

  return profile;
}

export async function updateLossProfile(
  input: z.infer<typeof updateLossProfileSchema>,
  orgId: string | undefined
) {
  const db = getDb();
  const scopedOrgId = requireOrgId(orgId);

  const [profile] = await db
    .update(lossProfile)
    .set({
      maxLossPct: input.maxLossPct.toFixed(2),
      minLossPct: input.minLossPct.toFixed(2),
      processStep: input.processStep,
      productType: input.productType
    })
    .where(and(eq(lossProfile.id, input.id), eq(lossProfile.orgId, scopedOrgId)))
    .returning();

  if (!profile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Loss profile not found."
    });
  }

  return profile;
}

export async function deleteLossProfile(id: string, orgId: string | undefined) {
  const db = getDb();
  const scopedOrgId = requireOrgId(orgId);

  const [profile] = await db
    .delete(lossProfile)
    .where(and(eq(lossProfile.id, id), eq(lossProfile.orgId, scopedOrgId)))
    .returning();

  if (!profile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Loss profile not found."
    });
  }

  return profile;
}
