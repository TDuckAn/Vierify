import { z } from "zod";

export const verifyKybTaxCodeSchema = z.object({
  nodeId: z.string().uuid()
});

export type VerifyKybTaxCodeInput = z.infer<typeof verifyKybTaxCodeSchema>;
