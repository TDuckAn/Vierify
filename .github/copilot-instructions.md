# GitHub Copilot Instructions — Vierify

## Project
Supply chain traceability app. TypeScript monorepo (Turborepo). B2B mobile/desktop + B2C web + Fastify API + Polygon blockchain.

## Stack
- **Mobile**: Expo 52, React Native, NativeWind v4, expo-router v3
- **Desktop**: Electron 32 + React 18
- **Web**: Next.js 15 App Router, Tailwind CSS
- **API**: Fastify 5 + tRPC v11 + Zod
- **ORM**: Drizzle ORM (PostgreSQL via Supabase)
- **Auth**: Supabase Auth (JWT)
- **Queue**: BullMQ + Upstash Redis
- **Blockchain**: ethers.js v6 + Polygon Amoy testnet
- **State**: Zustand + TanStack Query v5
- **Testing**: Vitest + Playwright

## Code Style
- TypeScript strict mode — no `any`, use `unknown` and narrow
- Zod schemas for all external inputs (tRPC procedures, API boundaries)
- Named exports only (no default exports except Next.js pages/layouts)
- Async/await, not `.then()` chains
- Error handling: throw `TRPCError` in procedures; never swallow errors silently
- Imports: absolute from package root (`@vierify/ui`, `~/lib/...`)

## Key Patterns

**tRPC procedure** — always validate with Zod, return immediately, queue side effects:
```typescript
create: protectedProcedure
  .input(CreateBatchSchema)
  .mutation(async ({ input, ctx }) => {
    const batch = await batchService.create(input, ctx.userId)
    await blockchainQueue.add('hash-batch', { batchId: batch.id })
    return batch  // do NOT await blockchain
  })
```

**Blockchain writes** — always async via BullMQ, never block API response:
```typescript
// In worker only — never in API route handlers
const hash = hashBatch(batch)  // SHA-256, strip PII before hashing
const tx = await contract.writeHash(batch.id, `0x${hash}`)
await tx.wait(1)
```

**PII rule** — nodes with `isIndividual = true` must have name/address masked in B2C responses:
```typescript
const safe = node.isIndividual ? { ...node, name: '***', nodeAddress: '***' } : node
```

**Drizzle queries** — use `eq`, `and`, `inArray` from `drizzle-orm`, not raw SQL:
```typescript
const batch = await db.query.traceBatch.findFirst({ where: eq(traceBatch.id, id) })
```

## Business Rules (enforce in code, not just UI)
- Mass Balance: output qty must not exceed sum of input qtys → return HTTP 409 if violated
- `gs1TraceId` must follow TCVN 13274:2020 format (GTIN + Batch), never plain UUID
- `audit_log` is append-only — never issue DELETE or UPDATE on it
- Batch can only be linked when parent batches exist with `kyb_status = 'approved'`

## Avoid
- `console.log` in production code — use a logger (pino in Fastify)
- Storing secrets in code — use env vars, never commit `.env`
- Awaiting blockchain transactions inside API handlers
- Exposing `service_role` Supabase key to client-side code
- Modifying architecture decisions — raise in PR comment for Claude to decide
