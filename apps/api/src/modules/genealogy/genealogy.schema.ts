import { z } from "zod";

export const linkGenealogySchema = z.object({
  childBatchId: z.string().uuid(),
  parentBatchIds: z
    .array(z.string().uuid())
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Parent batch IDs must be unique."
    }),
  wasteTolerance: z.number().min(0).max(1).default(0)
});

export const getGenealogySchema = z.object({
  batchId: z.string().uuid()
});
