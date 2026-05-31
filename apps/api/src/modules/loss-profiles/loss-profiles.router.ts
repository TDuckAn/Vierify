import { z } from "zod";

import { getTenantOrgId } from "../../context";
import { adminProcedure, router } from "../../trpc";
import {
  createLossProfile,
  deleteLossProfile,
  listLossProfiles,
  updateLossProfile
} from "./loss-profiles.service";
import {
  createLossProfileSchema,
  updateLossProfileSchema
} from "./loss-profiles.schema";

function getScopedOrgId(user: Parameters<typeof getTenantOrgId>[0]) {
  return getTenantOrgId(user) ?? user.orgId;
}

export const lossProfilesRouter = router({
  create: adminProcedure
    .input(createLossProfileSchema)
    .mutation(({ ctx, input }) => createLossProfile(input, getScopedOrgId(ctx.user))),
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteLossProfile(input.id, getScopedOrgId(ctx.user))),
  list: adminProcedure.query(({ ctx }) => listLossProfiles(getScopedOrgId(ctx.user))),
  update: adminProcedure
    .input(updateLossProfileSchema)
    .mutation(({ ctx, input }) => updateLossProfile(input, getScopedOrgId(ctx.user)))
});
