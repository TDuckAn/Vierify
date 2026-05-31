import { z } from "zod";

const lossProfileFieldsSchema = z.object({
  maxLossPct: z.number().min(0).max(100),
  minLossPct: z.number().min(0).max(100),
  processStep: z.string().trim().min(1).max(100),
  productType: z.string().trim().min(1).max(100)
});

function validateLossBand<T extends { maxLossPct: number; minLossPct: number }>(
  schema: z.ZodType<T>
) {
  return schema.refine((data) => data.minLossPct <= data.maxLossPct, {
    message: "min must be <= max",
    path: ["minLossPct"]
  });
}

export const createLossProfileSchema = validateLossBand(lossProfileFieldsSchema);

export const updateLossProfileSchema = validateLossBand(
  lossProfileFieldsSchema.extend({
    id: z.string().uuid()
  })
);
