import { TRPCError } from "@trpc/server";

import { adminProcedure, protectedProcedure, router } from "../../trpc";
import {
  createNodeSchema,
  getNodeSchema,
  listNodesSchema,
  updateKybStatusSchema
} from "./nodes.schema";
import { createNode, getNode, listNodes, updateKybStatus } from "./nodes.service";

export const nodesRouter = router({
  create: protectedProcedure
    .input(createNodeSchema)
    .mutation(({ ctx, input }) => createNode(input, ctx.user.id)),
  get: protectedProcedure.input(getNodeSchema).query(async ({ input }) => {
    const node = await getNode(input.id);

    if (!node) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Supply chain node not found."
      });
    }

    return node;
  }),
  list: protectedProcedure.input(listNodesSchema).query(({ input }) => listNodes(input)),
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
