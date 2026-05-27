import { z } from "zod";

export const gs1TraceIdSchema = z
  .string()
  .trim()
  .regex(/^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/, {
    message: "gs1_trace_id must use GTIN + batch format."
  });

export const sha256HexSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{64}$/, {
    message: "Hash fields must be SHA-256 hex strings."
  });

export const createBatchSchema = z.object({
  docHash: sha256HexSchema.optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  gs1TraceId: gs1TraceIdSchema,
  name: z.string().trim().min(1).max(256),
  nodeId: z.string().uuid(),
  pinHash: sha256HexSchema.optional(),
  quantity: z.number().positive(),
  uom: z.string().trim().min(1).max(32)
});

export const getBatchSchema = z.object({
  id: z.string().uuid()
});

export const getBatchByTraceIdSchema = z.object({
  gs1TraceId: gs1TraceIdSchema
});

export const listBatchesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  nodeId: z.string().uuid().optional()
});
