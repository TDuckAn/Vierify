import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db/client";
import { auditLog, supplyChainNode } from "../../db/schema";
import type { VerifyKybTaxCodeInput } from "./kyb.schema";

// Vietnamese tax code: 10 digits (enterprise) or 10 digits + hyphen + 3 digits (branch)
const VN_TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

export async function verifyKybTaxCode(
  input: VerifyKybTaxCodeInput,
  actorId: string
): Promise<{ valid: boolean; taxCode: string | null; reason?: string }> {
  const db = getDb();
  const [node] = await db
    .select()
    .from(supplyChainNode)
    .where(eq(supplyChainNode.id, input.nodeId));

  if (!node) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Supply chain node not found." });
  }

  const valid = node.taxCode !== null && VN_TAX_CODE_REGEX.test(node.taxCode);

  await db.insert(auditLog).values({
    action: "kyb.tax_code.verify",
    actorId,
    resourceId: node.id
  });

  return {
    valid,
    taxCode: node.taxCode,
    ...(valid
      ? {}
      : {
          reason:
            node.taxCode === null
              ? "Node has no tax code on record."
              : "Tax code format invalid. Expected 10 digits or 10 digits + hyphen + 3 digits."
        })
  };
}
