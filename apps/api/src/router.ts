import { z } from "zod";

import { authRouter } from "./modules/auth/auth.router";
import { batchesRouter } from "./modules/batches/batches.router";
import { genealogyRouter } from "./modules/genealogy/genealogy.router";
import { kybRouter } from "./modules/kyb/kyb.router";
import { nodesRouter } from "./modules/nodes/nodes.router";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  batches: batchesRouter,
  genealogy: genealogyRouter,
  kyb: kybRouter,
  health: publicProcedure
    .input(z.void())
    .query(() => ({ ok: true, service: "vierify-api" })),
  nodes: nodesRouter
});

export type AppRouter = typeof appRouter;
