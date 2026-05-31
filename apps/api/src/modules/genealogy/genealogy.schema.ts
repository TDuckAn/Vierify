import { z } from "zod";

export const DEFAULT_WASTE_TOLERANCE = 0.05;

export const linkGenealogySchema = z.object({
  childBatchId: z.string().uuid(),
  parentBatchIds: z
    .array(z.string().uuid())
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Parent batch IDs must be unique."
    }),
  processStep: z.string().trim().min(1).max(100).optional(),
  productType: z.string().trim().min(1).max(100).optional(),
  wasteTolerance: z.number().min(0).max(1).default(DEFAULT_WASTE_TOLERANCE)
});

export const getGenealogySchema = z.object({
  batchId: z.string().uuid()
});
