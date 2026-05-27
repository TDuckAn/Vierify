import { TRPCError } from "@trpc/server";

import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
  createBatchSchema,
  getBatchByTraceIdSchema,
  getBatchSchema,
  listBatchesSchema
} from "./batches.schema";
import {
  createBatch,
  getBatch,
  getBatchByTraceId,
  listBatches
} from "./batches.service";

export const batchesRouter = router({
  create: protectedProcedure
    .input(createBatchSchema)
    .mutation(({ ctx, input }) => createBatch(input, ctx.user.id)),
  get: protectedProcedure.input(getBatchSchema).query(async ({ input }) => {
    const batch = await getBatch(input.id);

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trace batch not found."
      });
    }

    return batch;
  }),
  getByTraceId: publicProcedure.input(getBatchByTraceIdSchema).query(async ({ input }) => {
    const result = await getBatchByTraceId(input.gs1TraceId);

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trace batch not found."
      });
    }

    return result;
  }),
  list: protectedProcedure.input(listBatchesSchema).query(({ input }) => listBatches(input))
});
