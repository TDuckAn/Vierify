import { TRPCError } from "@trpc/server";

import { getTenantOrgId } from "../../context";
import { adminProcedure, readProcedure, router } from "../../trpc";
import {
  createNodeSchema,
  getNodeSchema,
  listNodesSchema,
  updateKybStatusSchema
} from "./nodes.schema";
import { createNode, getNode, listNodes, updateKybStatus } from "./nodes.service";

export const nodesRouter = router({
  create: adminProcedure
    .input(createNodeSchema)
    .mutation(({ ctx, input }) => createNode(input, ctx.user.id)),
  get: readProcedure.input(getNodeSchema).query(async ({ ctx, input }) => {
    const node = await getNode(input.id, getTenantOrgId(ctx.user));

    if (!node) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Supply chain node not found."
      });
    }

    return node;
  }),
  list: readProcedure
    .input(listNodesSchema)
    .query(({ ctx, input }) => listNodes(input, getTenantOrgId(ctx.user))),
  updateKybStatus: adminProcedure
    .input(updateKybStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const node = await updateKybStatus(input, ctx.user.id);

      if (!node) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supply chain node not found."
        });
      }

      return node;
    })
});
