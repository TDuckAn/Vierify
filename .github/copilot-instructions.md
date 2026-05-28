# GitHub Copilot Instructions — Vierify

> **Current role:** Temporarily replacing Codex for backend implementation while quota refills.
> Implement only what is listed in `PLAN.md → Current Sprint` with status `☐` (assigned to Codex).
> Do NOT modify frontend files (`apps/web/`, `apps/mobile/`) — those belong to Claude.

---

## Project

Supply chain traceability app. TypeScript monorepo (Turborepo). B2B mobile/desktop + B2C web + Fastify API + Polygon blockchain.

---

## Stack (exact versions — do not upgrade)

- **Mobile**: Expo SDK 54, expo-router v6, NativeWind v4, React Native 0.81
- **Desktop**: Electron 32, web-wrapper (loads deployed Next.js URL)
- **Web**: Next.js 15 App Router, React 18, Tailwind CSS
- **API**: Fastify 5 + tRPC v11 + Zod — ESM (`"type": "module"`)
- **ORM**: Drizzle ORM (PostgreSQL via Supabase, port 6543 transaction mode)
- **Auth**: Supabase Auth (JWT validated server-side via `supabase.auth.getUser(token)`)
- **Queue**: BullMQ + Upstash Redis
- **Blockchain**: ethers.js v6, Polygon Amoy testnet
- **State**: Zustand + TanStack Query v5
- **Testing**: Vitest + Playwright — Claude writes these, do not touch test files

---

## Code Style

- TypeScript strict mode — no `any`, use `unknown` and narrow with type guards
- Zod schemas for all tRPC inputs and API boundaries
- Named exports preferred; default exports only for Next.js pages/layouts
- Async/await, never `.then()` chains
- Throw `TRPCError` in procedures; never swallow errors silently
- Always write to `audit_log` for any mutation (create/update operations)

---

## RBAC — Mandatory for Every New Route

Four procedure tiers exist in `apps/api/src/trpc.ts`. Use the correct one — wrong tier is a security bug.

```typescript
publicProcedure    // No auth — B2C read-only only
readProcedure      // Requires role: admin | merchant | viewer
merchantProcedure  // Requires role: admin | merchant
adminProcedure     // Requires role: admin only
```

**Which to use:**

| Operation | Procedure |
|---|---|
| B2C public trace read | `publicProcedure` |
| List/get resources (authenticated) | `readProcedure` |
| Create batch, link genealogy | `merchantProcedure` |
| KYB actions, node creation, admin | `adminProcedure` |

## Multi-Tenant Scoping — Mandatory for All Queries

Every read/write by a non-admin must be filtered to the user's org. Use `getTenantOrgId()`:

```typescript
import { getTenantOrgId } from "../../context";

// In router — pass orgId to service:
list: readProcedure
  .input(listSchema)
  .query(({ ctx, input }) => listItems(input, getTenantOrgId(ctx.user)))

// In service — filter by orgId when set; undefined = admin sees all:
export async function listItems(input: ListInput, orgId?: string) {
  if (orgId) {
    // JOIN with supply_chain_node and WHERE supply_chain_node.org_id = orgId
  }
  // No orgId = admin path, return everything
}
```

---

## Key Patterns

### tRPC route (3-file module pattern)

```typescript
// modules/kyb/kyb.router.ts
import { adminProcedure, router } from "../../trpc";
import { verifyKybTaxCodeSchema } from "./kyb.schema";
import { verifyKybTaxCode } from "./kyb.service";

export const kybRouter = router({
  verifyTaxCode: adminProcedure
    .input(verifyKybTaxCodeSchema)
    .mutation(({ ctx, input }) => verifyKybTaxCode(input, ctx.user.id))
});
```

### Service function (always write audit_log for mutations)

```typescript
// modules/kyb/kyb.service.ts
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db/client";
import { auditLog, supplyChainNode } from "../../db/schema";

export async function verifyKybTaxCode(input: { nodeId: string }, actorId: string) {
  const db = getDb();
  const [node] = await db.select().from(supplyChainNode).where(eq(supplyChainNode.id, input.nodeId));

  if (!node) throw new TRPCError({ code: "NOT_FOUND", message: "Node not found." });

  // ... business logic ...

  await db.insert(auditLog).values({ action: "kyb.tax_code.verify", actorId, resourceId: node.id });

  return { valid: true };
}
```

### Blockchain writes — always async, never await in API handler

```typescript
// In worker only (blockchain.worker.ts) — never in route handlers:
const hash = hashBatch(batch); // SHA-256, strip ALL PII fields before hashing
const tx = await contract.writeHash(batch.id, `0x${hash}`);
await tx.wait(1);
```

### PII anonymisation — mandatory for all B2C responses

```typescript
function anonymiseNode(node: NodeProjection): NodeProjection {
  if (!node.isIndividual) return node;
  return { ...node, name: "***", nodeAddress: "***" };
}
```

### Drizzle migration (after changing schema.ts)

```bash
pnpm --filter @vierify/api drizzle-kit generate
pnpm --filter @vierify/api drizzle-kit migrate
# Commit BOTH schema.ts AND the generated migration file
```

---

## T28 — Current Task: KYB Tax Code Stub

**What:** A stub tRPC endpoint that validates a Vietnamese tax code format. Does NOT call any real government API. Real VTA integration is Sprint 4.

**Files to create** in `apps/api/src/modules/kyb/`:

### `kyb.schema.ts`

```typescript
import { z } from "zod";

export const verifyKybTaxCodeSchema = z.object({
  nodeId: z.string().uuid()
});

export type VerifyKybTaxCodeInput = z.infer<typeof verifyKybTaxCodeSchema>;
```

### `kyb.service.ts`

```typescript
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
    ...(valid ? {} : {
      reason: node.taxCode === null
        ? "Node has no tax code on record."
        : "Tax code format invalid. Expected 10 digits or 10 digits + hyphen + 3 digits."
    })
  };
}
```

### `kyb.router.ts`

```typescript
import { adminProcedure, router } from "../../trpc";
import { verifyKybTaxCodeSchema } from "./kyb.schema";
import { verifyKybTaxCode } from "./kyb.service";

export const kybRouter = router({
  verifyTaxCode: adminProcedure
    .input(verifyKybTaxCodeSchema)
    .mutation(({ ctx, input }) => verifyKybTaxCode(input, ctx.user.id))
});
```

### Wire into `apps/api/src/router.ts`

Find the existing `appRouter` definition and add `kyb: kybRouter` to it alongside the other sub-routers.

**T28 constraints:**
- Do NOT call any external HTTP or government API
- Do NOT change KYB status — that stays in `nodes.updateKybStatus`
- Do NOT add new DB columns — `tax_code` already exists on `supply_chain_node`
- Do NOT modify `apps/api/src/db/schema.ts`

---

## Business Rules (enforce in code, not just UI)

- **Mass Balance**: output qty must not exceed sum of input qtys × (1 + waste_tolerance) → HTTP 409 if violated
- `gs1TraceId` must match `^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$` — never plain UUID
- `audit_log` is append-only — never DELETE or UPDATE it
- KYB gate: batch creation blocked unless node `kyb_status = 'approved'`
- Blockchain hashes must exclude ALL PII fields

## Do NOT

- Use `console.log` — use Fastify's logger (`request.log.info(...)`)
- Commit `.env` files — use `.env.example` with empty values
- Await blockchain transactions inside API handlers — always enqueue via BullMQ
- Expose `SUPABASE_SERVICE_ROLE_KEY` to any client-side code
- Use `publicProcedure` for mutations or user-scoped reads
- Skip `getTenantOrgId()` for merchant/admin queries — cross-org data leak
- Modify architecture decisions without Claude's approval (raise in PR comment)
- Touch `apps/web/` or `apps/mobile/` — Claude owns all UI
