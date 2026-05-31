import { TRPCError } from "@trpc/server";

import type { AuthUser } from "../../context";
import { getTenantOrgId } from "../../context";
import { readProcedure, router } from "../../trpc";
import { getCurrentSubscription, getInvoices } from "./billing.service";

function getBillingOrgId(user: AuthUser) {
  if (user.role === "admin") {
    if (!user.orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Admin billing reads require an organization id in app metadata."
      });
    }

    return user.orgId;
  }

  const orgId = getTenantOrgId(user);

  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization membership required."
    });
  }

  return orgId;
}

export const billingRouter = router({
  getCurrentSubscription: readProcedure.query(({ ctx }) =>
    getCurrentSubscription(getBillingOrgId(ctx.user))
  ),
  getInvoices: readProcedure.query(({ ctx }) => getInvoices(getBillingOrgId(ctx.user)))
});
