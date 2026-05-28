import { initTRPC, TRPCError } from "@trpc/server";

import type { AuthRole, Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});

function requireRole(role: AuthRole | undefined, allowedRoles: readonly AuthRole[]) {
  if (!role || !allowedRoles.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${allowedRoles.join(" or ")} role required.`
    });
  }
}

function roleProcedure(allowedRoles: readonly AuthRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    requireRole(ctx.user.role, allowedRoles);

    return next({
      ctx
    });
  });
}

export const readProcedure = roleProcedure(["admin", "merchant", "viewer"]);
export const merchantProcedure = roleProcedure(["admin", "merchant"]);
export const adminProcedure = roleProcedure(["admin"]);
