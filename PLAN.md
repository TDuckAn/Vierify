# Vierify — Project Plan

> **Week 3 / 14** | MVP deadline: end of Week 4 | v1 deadline: end of Week 14
> Task legend: `☐` not started · `🔄` in progress · `✅` done · `❌` blocked

---

## What is Vierify

Supply chain traceability platform backed by Polygon blockchain.
- **MerchantApp** (B2B): factory workers scan/link product batches; data hashed to blockchain
- **Consumer Web** (B2C): end-users scan QR → see farm-to-table timeline with blockchain proof
- **Targets**: Website · Windows · macOS · Android · iOS

---

## AI Roles

| Agent | Responsibility |
|---|---|
| **Claude** | Planning, writing tests, code review, updating this file |
| **Codex** | All implementation (see AGENTS.md) |
| **GitHub Copilot** | In-editor code completion support |

---

## Tech Stack — Free Tier

| Layer | Technology | Free Tier Used |
|---|---|---|
| Monorepo | Turborepo | Open source |
| Mobile (iOS + Android) | Expo SDK 52 + React Native | EAS Build: 30 builds/month |
| Desktop (Win + macOS) | Electron 32 + React 18 | Open source; local builds |
| Web | Next.js 15 (App Router) | Vercel Hobby (free) |
| API | Fastify 5 + tRPC v11 | Render free web service |
| Database | Supabase PostgreSQL 15 | 500 MB, 2 projects free |
| Auth | Supabase Auth | Included in Supabase free |
| File storage | Supabase Storage | 1 GB free |
| Realtime | Supabase Realtime | 200 concurrent connections free |
| Queue / Cache | Upstash Redis + BullMQ | 10 K commands/day free |
| Blockchain | ethers.js v6 + Polygon Amoy testnet | Free testnet (mainnet at v1) |
| Smart contracts | Hardhat | Open source |
| State | Zustand + TanStack Query v5 | Open source |
| UI tokens | Tailwind CSS + NativeWind v4 | Open source |
| Testing | Vitest + Playwright | Open source |
| Error tracking | Sentry (free tier) | 5 K errors/month |
| CI/CD | GitHub Actions | 2 K min/month free (public repo) |

> **Upgrade path (when profitable):** Supabase Pro $25/mo → AWS RDS; Render paid → Railway; Vercel Pro $20/mo; EAS priority builds.

---

## Repository Structure

```
vierify/
├── apps/
│   ├── mobile/          # Expo — MerchantApp (iOS + Android)
│   ├── desktop/         # Electron — MerchantApp (Windows + macOS)
│   ├── web/             # Next.js — marketing site + B2C timeline
│   └── api/             # Fastify + tRPC backend
├── packages/
│   ├── ui/              # Shared React components (NativeWind + Tailwind)
│   ├── api-client/      # Shared tRPC router type exports
│   └── blockchain/      # ethers.js utilities + Hardhat contracts
├── PLAN.md              # ← you are here (Claude updates this)
├── CLAUDE.md            # Claude session context
├── AGENTS.md            # Codex session context
└── .github/
    ├── copilot-instructions.md
    └── workflows/
        ├── ci.yml
        └── release.yml
```

---

## Architecture (key decisions)

1. **One language**: TypeScript everywhere — monorepo shared types via `packages/api-client`
2. **API is thin**: Fastify validates + writes to Supabase PostgreSQL → returns immediately. No blocking on blockchain.
3. **Blockchain is async**: API publishes a job to BullMQ (Upstash Redis). A separate BullMQ worker (same Render service) SHA-256 hashes the record (PII stripped) and calls the Polygon smart contract. Stores `txHash` back to DB.
4. **Auth**: Supabase Auth JWTs. Mobile stores access token in `expo-secure-store`. API validates with Supabase JWT secret.
5. **B2C page**: Next.js SSR — reads from Supabase PostgreSQL, anonymises PII for `IS_INDIVIDUAL=true` nodes, renders timeline.
6. **Render free tier** spins down after 15 min of inactivity (~30 s cold start). Acceptable for dev; mitigate with `/health` ping from Next.js at build time.

---

## Database Schema (key tables — Drizzle ORM)

```
supply_chain_node  id · name · is_individual · tax_code · node_type · kyb_status · node_address
trace_batch        id · gs1_trace_id · name · quantity · uom · gps_lat · gps_lng
                   pin_hash · scan_count · node_id · doc_hash · bc_status(0=pending,1=confirmed) · tx_hash · version
batch_genealogy    id · parent_batch_id · child_batch_id · mapping_date · verifier_id
audit_log          id · actor_id · action · resource_id · created_at  ← append-only, never delete
```

---

## Business Rules (enforce in API, not just UI)

| Rule | Implementation |
|---|---|
| Mass Balance | Reject with HTTP 409 if `output_qty > sum(input_qty) × (1 + waste_tolerance)` |
| GS1 ID format | `gs1_trace_id` must follow TCVN 13274:2020 structure (GTIN + Batch), not plain UUID |
| Blockchain writes | ASYNC only — API never awaits Polygon. Hash must exclude all PII fields. |
| PII anonymisation | Nodes with `is_individual=true`: mask name + address in all B2C API responses |
| Node validity | B2B account cannot create batches until `kyb_status = approved` |
| Batch chain | A finished product batch is "Fully Verified" only if all parent batches exist in system |

---

## Focus — Backend-First

> **Current priority:** Complete backend + blockchain layer fully. Frontend is skeleton-only
> (routing stubs, data wiring, no visual polish) — real UI handed off to **Claude Design**
> after backend is stable. Playwright tests (T14) are written after Claude Design ships UI.

---

## Current Sprint — Week 3–4 (MVP)

### Backend (priority — complete first)

| # | Task | Status | Notes |
|---|---|---|---|
| T01 | Turborepo monorepo scaffold + shared configs | ✅ | Reviewed by Claude |
| T02 | Supabase project + Drizzle schema + migrations | ✅ | Migration applied · Web helpers complete |
| T03 | Fastify API + tRPC router + Render deploy | ✅ | Reviewed by Claude · CORS origin:true OK for MVP |
| T04 | Supabase Auth (email/password, JWT) | ✅ | Reviewed by Claude · KYB gate enforced · RBAC Sprint 3 |
| T09 | BullMQ worker: SHA-256 hash → Polygon Amoy | ✅ | Reviewed by Claude · Contract deployed to Amoy · worker.ts entry point present |
| T13 | Vitest integration tests (API routes) | ✅ | Written by Claude — 5 files, 25 cases covering all business rules |
| T10 | GitHub Actions CI (lint + type-check + test) | ✅ | Written by Claude — ci.yml (quality + test jobs) + release.yml skeleton for T11/T12 |

### Frontend Skeleton (Codex — stub only, no design work)

> Skeleton scope: routing, layout wiring, tRPC calls stubbed, no visual polish.
> Output is handed to **Claude Design** who will own all UI/UX from this point.

| # | Task | Status | Notes |
|---|---|---|---|
| T05 | Next.js web: route skeleton + Vercel deploy | ✅ | Reviewed by Claude — landing page + layout done; trace page wiring is T06 scope |
| T06 | Next.js web: B2C timeline data layer | ✅ | Reviewed by Claude · PII anonymised server-side · ⚠️ RLS policy needed on Supabase (anon SELECT on trace_batch + supply_chain_node) |
| T07 | Expo mobile: nav skeleton + tRPC client wired | ✅ | Reviewed by Claude · expo-router groups correct · Switch to createTRPCReact in Sprint 2 |
| T08 | Electron desktop: shell loading web renderer | ✅ | Reviewed by Claude · ⚠️ Claude Design must decide: wrap Next.js web (delete renderer.tsx) OR own Vite renderer (delete web URL fallback) |

### Builds & Releases (after skeleton + T09 done)

| # | Task | Status | Notes |
|---|---|---|---|
| T11 | EAS Build: Android .apk | ✅ | Reviewed by Claude · eas.json in apps/mobile/ · expo-router v3→v4 fix · ⚠️ Set EAS_TOKEN secret in GitHub + confirm owner:"tduckan" matches Expo account before first build |
| T12 | Electron Builder: .exe + .dmg GitHub Release | 🔄 | Unsigned builds OK for MVP |

### Claude Design Handoff (after T05–T08 skeleton done)

| # | Task | Status | Notes |
|---|---|---|---|
| T14 | Playwright smoke tests (web flows) | ☐ | Claude writes after Claude Design ships real UI |
| — | Full UI/UX implementation | ☐ | Claude Design takes over all visual work from skeleton |

---

## Roadmap

### Sprint 2 — Week 5–7
- Genealogy mapping (parent→child linking + Mass Balance enforcement)
- Document upload to Supabase Storage + doc_hash verification
- Full blockchain proof display on B2C timeline (txHash + block explorer link)
- QR code generation (GS1 GTIN + batch format)
- B2B partner registration + admin KYB approval flow
- Offline mode: expo-sqlite local queue, sync on reconnect

### Sprint 3 — Week 8–10
- Multi-tenant organisations (B2B node management)
- Role-based access control (admin / merchant / viewer)
- Oracle API integration (Vietnam Tax Authority for KYB)
- Supabase Realtime: live scan count updates
- Sentry on all platforms
- E2E tests: Playwright (web) + Vitest integration (API)

### Sprint 4 — Week 11–13
- Play Store submission via EAS Submit
- App Store submission via EAS Submit
- Windows code signing (apply for cert Week 11)
- Performance pass: Next.js PageSpeed > 85
- Data anonymisation audit (Decree 13/2023/NĐ-CP compliance)
- Security review (Claude runs security-review skill)

### v1 Launch — Week 14
- Migrate Polygon Amoy → PoS Mainnet
- All platforms live and store-approved
- 50 B2B partner onboarding pipeline ready
- Monitoring: Sentry alerts + uptime checks
- Runbook documented

---

## Week 4 Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Apple Developer account not provisioned | iOS build fails | Set up Week 3 Day 1; use Android-only MVP if needed |
| Windows code signing cert (3–5 day lead time) | SmartScreen blocks .exe | Unsigned build for MVP; apply cert in Week 5 |
| Render cold start (30 s) breaks demo | Bad first impression | Add `/health` ping from Next.js ISR; or keep a browser tab open |
| BullMQ worker crashes on Polygon error | Silent data loss | Dead-letter queue + Bull Board dashboard from Day 1 |
| tRPC router changes break mobile mid-sprint | Type errors cascade | Freeze core procedures by T03 completion |
