# CLAUDE.md — Claude's Session Context

> Read this at the start of every session.

---

## My Role

**Planning** → Write and update `PLAN.md` (task status, architecture decisions, risk register)
**Testing** → Write Vitest integration tests + Playwright E2E tests after Codex implements each feature
**CI/CD config** → Write and own GitHub Actions workflows (`.github/workflows/`) — no round-trip to Codex needed
**Review** → Review Codex diffs for correctness, security, business rule compliance
**UI / Claude Design** → Implement all frontend UI: Next.js web (marketing, B2C timeline, B2B merchant dashboard) + Expo mobile (all screens). Follow `CLAUDE_DESIGN_BRIEF.md` for design tokens, components, and constraints.

---

## Project: Vierify

Supply chain traceability app. B2B MerchantApp (scan/map product batches) + B2C web (QR → timeline). Blockchain proof via Polygon. Student startup project — all infrastructure is free tier.

**Current status:** Always check `PLAN.md` → "Current Sprint" table for task states.

---

## Key Files

| File | Purpose |
|---|---|
| `PLAN.md` | Task tracking, architecture, business rules — **source of truth** |
| `AGENTS.md` | Codex instructions (do not modify Codex's process section) |
| `apps/api/src/db/schema.ts` | Drizzle schema — verify all business rules are enforced here |
| `packages/api-client/src/router.ts` | tRPC root router — interface between all apps and API |
| `apps/api/src/queues/blockchain.worker.ts` | BullMQ Polygon worker — highest-risk component |

---

## Testing Responsibilities

### After T02 (schema) + T03 (API) are done → write integration tests
```
apps/api/src/tests/
  batches.test.ts        # CRUD, Mass Balance rejection (HTTP 409), GS1 format validation
  genealogy.test.ts      # parent→child linking, circular reference rejection
  auth.test.ts           # JWT validation, KYB gate enforcement
  blockchain.test.ts     # Queue job creation, txHash storage
  anonymisation.test.ts  # is_individual=true nodes are masked in B2C responses
```

### After T05–T06 (web) are done → write Playwright tests
```
apps/web/e2e/
  marketing.spec.ts      # Page loads, download links present
  qr-timeline.spec.ts    # QR URL resolves, timeline renders, blockchain badge shows
```

### Test standards
- Every business rule in `PLAN.md` must have at least one test
- Integration tests run against a real Supabase test project (not mocked)
- Tests must pass in GitHub Actions CI before Codex marks a task ✅

---

## How to Update PLAN.md

1. Change task status: `☐` → `🔄` → `✅` (or `❌` with a note)
2. Add new risks when discovered (Risk Register section)
3. Move completed sprint tasks to a `## Done` section at end of file (keep file scannable)
4. Never remove business rules — only add or clarify

---

## Planning Checklist (before each sprint)

- [ ] All previous sprint ✅ tasks have passing tests in CI
- [ ] New sprint tasks have clear acceptance criteria
- [ ] Risk register reviewed and updated
- [ ] AGENTS.md updated if implementation patterns changed
- [ ] No ❌ blocked tasks without a resolution plan

---

## Security Review Triggers

Run `/security-review` skill before any sprint that touches:
- Auth module changes
- Blockchain hash construction (must not include PII)
- B2C API responses (must anonymise `is_individual=true` nodes)
- File upload handling (Supabase Storage presigned URLs)
- Smart contract changes

---

## Do NOT

- Write backend implementation code (that is Codex's job — API, workers, schema migrations)
- Change tRPC router shape without coordinating with Codex
- Approve tasks as ✅ without passing tests in CI
- Delete or modify `audit_log` table — it is append-only by design
- Add new API routes or schema changes in UI work — all data must come from existing tRPC procedures or REST endpoints listed in `CLAUDE_DESIGN_BRIEF.md` Section 13
