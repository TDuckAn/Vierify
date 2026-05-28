import { z } from "zod";

export const kybStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended"
]);

export const createNodeSchema = z.object({
  isIndividual: z.boolean().default(false),
  name: z.string().trim().min(1).max(256),
  nodeAddress: z.string().trim().min(1).max(1024).optional(),
  nodeType: z.string().trim().min(1).max(64),
  orgId: z.string().uuid(),
  taxCode: z.string().trim().min(1).max(64).optional()
});

export const listNodesSchema = z.object({
  kybStatus: kybStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50)
});

export const getNodeSchema = z.object({
  id: z.string().uuid()
});

export const updateKybStatusSchema = z.object({
  id: z.string().uuid(),
  kybStatus: kybStatusSchema
});
