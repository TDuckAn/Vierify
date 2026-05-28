# Vierify — Project Plan

> **Week 8 / 14** | Sprint 2 ✅ complete | Sprint 3 ✅ complete | Sprint 4 starts Week 11 | v1 deadline: end of Week 14
> **CI status (2026-05-28):** ✅ green
> **Agent note:** Codex quota exhausted — GitHub Copilot (GPT 5.2) available for backend tasks via `.github/copilot-instructions.md`
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
| **Claude** | Planning, writing tests, code review, CI/CD config, updating this file, **all UI implementation** (web + mobile — was "Claude Design") |
| **Codex** | Backend implementation: API, schema migrations, workers, queues (see AGENTS.md) |
| **GitHub Copilot** | In-editor code completion support |

---

## Tech Stack — Free Tier

| Layer | Technology | Free Tier Used |
|---|---|---|
| Monorepo | Turborepo | Open source |
| Mobile (iOS + Android) | Expo SDK 54 + React Native 0.81 | EAS Build: 30 builds/month |
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
7. **Desktop is a web-wrapper** (decided Week 4): Electron `main.ts` loads the deployed Next.js Vercel URL via `app.isPackaged` guard. `renderer.tsx` and the Vite pipeline are deleted — Claude Design builds one UI (Next.js only), desktop inherits it for free. Offline is mobile's responsibility (Sprint 2 expo-sqlite), not desktop.

---

## Database Schema (key tables — Drizzle ORM)

```
supply_chain_node  id · org_id · name · is_individual · tax_code · node_type · kyb_status · node_address
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

## Sprint 2 — Week 5–7 (Complete)

### Backend (Codex — complete before UI work starts)

| # | Task | Owner | Status | Acceptance criteria |
|---|---|---|---|---|
| T15 | Genealogy API: parent→child batch linking | Codex | ✅ | Reviewed by Claude · `POST /batches/:child_id/parents` REST + tRPC · BFS circular detection · mass balance enforced · audit_log written · DEFAULT_WASTE_TOLERANCE=0.05 |
| T16 | Document upload: Supabase Storage + doc_hash | Codex | ✅ | Reviewed by Claude · Multipart upload → Storage bucket · SHA-256 of file stored in `trace_batch.doc_hash` · presigned URL returned · 10 MB limit enforced · audit_log written · `enqueueHashBatchJob` triggered post-upload · ⚠️ bucket must be private; name must match `SUPABASE_DOCUMENTS_BUCKET` env var (default: `batch-documents`) |
| T17 | QR code generation (GS1 GTIN format) | Codex | ✅ | Reviewed by Claude · `GET /batches/:id/qr` returns PNG data URL · `encodeURIComponent` on gs1TraceId (handles `/` in GS1 batch codes) · `CONSUMER_TRACE_BASE_URL` env override · public endpoint (no auth) · Codex shipped 3 tests: generation, URL-encoding, NOT_FOUND |
| T18 | B2C timeline: blockchain proof display | Codex | ✅ | Reviewed by Claude · `tx_hash` + Polygonscan Amoy link (`amoy.polygonscan.com/tx/{txHash}`) · emerald/amber `bc_status` badge (confirmed only when `bc_status===1 && tx_hash`) · pending state with explanatory text · PII anonymisation enforced in `data.ts` ✅ · mobile data wired via `bc_status`/`tx_hash` in API response (visual badge by Claude Design) · ⚠️ DEPENDENCY: Supabase anon RLS policy needed on `trace_batch` + `supply_chain_node` (pre-existing T06 debt) |
| T19 | B2B KYB approval flow + admin endpoint | Codex | ✅ | Reviewed by Claude · `PATCH /admin/nodes/:id/kyb` · `requireAdminUser` is first line of handler ✅ · `adminProcedure` middleware gates tRPC route ✅ · merchant blocked until `kyb_status=approved` ✅ · `audit_log` entry on each status change ✅ · Security fix applied: admin role reads `app_metadata.role` only |
| T20 | Mobile offline mode: expo-sqlite queue | Codex | ✅ | `expo-sqlite` queue for offline batch creates · queued work survives crashes · app flushes on launch/foreground/interval · duplicate GS1 retries are treated as already synced · queued batches appear in mobile list |

### Testing (Claude — written after each backend task ships)

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T21 | Vitest: genealogy + mass balance + circular ref | Claude | ✅ | Written by Claude · augmented Codex baseline · added: exact boundary cases, DEFAULT_WASTE_TOLERANCE assertion, audit_log verification, full getGenealogy coverage (4 cases: orphan / parent view / child view / middle-chain) |
| T22 | Vitest: document upload + doc_hash + KYB flow | Claude | ✅ | Written by Claude · 13 cases in `documents-kyb.test.ts` · upload: happy path, empty file, >10 MB, NOT_FOUND, audit_log, enqueueHashBatchJob · KYB: updateKybStatus + audit_log, NOT_FOUND, createBatch blocked for pending/rejected/suspended (it.each), unblocked after approval · RBAC: admin access, FORBIDDEN (no role), UNAUTHORIZED (no token / bad token) |
| T14 | Playwright smoke tests (web flows) | Claude | ✅ | Written by Claude · `marketing.spec.ts`: 12 cases — page load, nav CTA, all 5 pricing tiers, "Lựa chọn tốt nhất" badge, dark mode toggle + localStorage persistence, dark mode survives reload, how-it-works 3 steps, features section, footer branding · `qr-timeline.spec.ts`: 16 cases — header always visible (incl. "Hành trình chuỗi cung ứng" smoke test), not-found heading + error detail + home link, confirmed batch (skip if no `SUPABASE_SERVICE_KEY`): name/GS1 ID/emerald badge/tx_hash/Polygonscan link/stats/footer/blockchain section heading/journey heading/current batch in timeline/empty-parent fallback, 375px mobile no horizontal overflow · `playwright.config.ts` with `webServer` + globalSetup/Teardown · CI `playwright` job added (needs `quality` to pass; uploads HTML report artifact) |

### Claude Design (Sprint 2 — shipped)

> Brief: `CLAUDE_DESIGN_BRIEF.md`. Implemented 2026-05-28.

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| — | Web: marketing landing + pricing + light/dark mode | Claude Design | ✅ | Be Vietnam Pro + JetBrains Mono via next/font · FOUC-safe dark mode (localStorage + inline script) · Nav/Hero/TrustBar/Problem-Solution/HowItWorks/Features/Pricing/CTA/Footer · 5-tier pricing table with feature comparison · `chain`/`proof` tokens throughout · `ScrollReveal` component (IntersectionObserver) wraps all below-fold sections — stagger-free, unobserves after first reveal |
| — | Web B2C: trace timeline visual | Claude Design | ✅ | Full visual treatment · emerald/amber bc_status badge · Polygonscan link · stats row · supply chain timeline skeleton · doc_hash section · Vietnamese copy |
| — | Mobile MerchantApp: all screens | Claude Design | ✅ | NativeWind v4 · `global.css` import fixed · `(app)` Tab group (Lô hàng/Quét mã/Hồ sơ) · Login with KYB-blocked banner · Batch list FlatList + pull-to-refresh + empty state · Scan screen with frame overlay · Profile with KYB badge + plan info |
| — | Mobile: batch detail `(batches)/[id].tsx` | Claude | ✅ | QR modal (REST `/batches/:id/qr`) · blockchain badge (emerald/amber) · tx_hash share + Polygonscan Linking · doc_hash section · parent batch genealogy list · NativeWind throughout |
| — | Mobile: create batch `(batches)/new.tsx` | Claude | ✅ | KYB-approved node selector (trpc.nodes.list) · name/qty/UOM chips/GS1 form · inline GS1 regex validation · trpc.batches.create.mutate · navigates to detail on success · GPS auto-detect placeholder section (device location recorded on submit) · "Kết nối lô hàng cha" UI stub (+ Thêm CTA, links after batch creation) |

---

## Sprint 3 — Week 8–10 ✅ Complete

> All Sprint 3 tasks ✅. Outstanding debt items below carry into Sprint 4.

---

## Roadmap

### Sprint 3 — Week 8–10

#### Immediate (Week 8) — Complete Sprint 2 tail

| # | Task | Owner | Priority | Acceptance criteria |
|---|---|---|---|---|
| T14 | Playwright smoke tests (web) | Claude | P0 | ✅ Done — see Sprint 2 Testing row for full 28-case breakdown |
| T20 | Mobile offline: expo-sqlite queue | Codex | P0 | ✅ Done · scan/create flows tolerate no network · SQLite queue auto-flushes on launch/foreground/interval · crash-safe · duplicate GS1 retries treated as synced |
| T23 | Supabase RLS: anon SELECT on `trace_batch` + `supply_chain_node` | Codex | P0 | ✅ Done · anon SELECT policy applied · B2C trace page confirmed working with anon key · PII anonymisation enforced in `data.ts` |

#### Core Sprint 3 (Week 8–10)

| # | Task | Owner | Status | Priority | Acceptance criteria |
|---|---|---|---|---|---|
| T24 | RBAC: admin / merchant / viewer roles | Codex | ✅ | P1 | Reviewed by Claude (2026-05-28) · `app_metadata.role` controls access ✅ · viewer: read-only via `readProcedure` ✅ · merchant: `merchantProcedure` gates create/link ✅ · admin: `adminProcedure` gates KYB + node create ✅ · impersonation impossible (role from server-controlled `app_metadata`) ✅ · `rbac.test.ts` 5 cases (viewer reads, viewer blocked, merchant blocked from KYB, admin all, unassigned blocked) ✅ |
| T25 | Multi-tenant orgs: node membership | Codex | ✅ | P1 | Reviewed by Claude (2026-05-28) · `org_id NOT NULL` on `supply_chain_node` ✅ · `getTenantOrgId()` returns undefined for admins (see-all) ✅ · `getBatch`/`listBatches`/`getNode`/`listNodes` all JOIN-filter by orgId ✅ · cross-org genealogy rejected (CONFLICT) before mass-balance ✅ · `multitenant.test.ts` 3 integration cases ✅ · Minor gaps for T29: `nodes.list` scoping + admin see-all real-DB case |
| T26 | Supabase Realtime: live scan count | Codex | ✅ | P2 | `trace_batch.scan_count` increments via Realtime channel on B2C page · no full page reload · graceful fallback if Realtime is unavailable |
| T27 | Sentry: web + API error tracking | Claude | ✅ | P2 | Completed by Claude (2026-05-28) · **Web**: Session Replay added (`replayIntegration`, session 10% / error 100%); `enableLogs: true` on all 3 runtimes; `includeLocalVariables: true` on server; `tunnelRoute: "/monitoring"` in `next.config.mjs` (ad-blocker bypass); `global-error.tsx` UTF-8 encoding bug fixed · **API**: `includeLocalVariables: true` + `enableLogs: true` in `sentry.ts`; `fastifyIntegration` (5xx filter) already present · **CI**: `SENTRY_AUTH_TOKEN`/`SENTRY_DSN`/`SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_RELEASE` already wired in build step; source maps deleted after upload |
| T28 | Oracle / Vietnam Tax Authority KYB stub | Copilot | ✅ | P3 | Reviewed by Claude (2026-05-28) · tRPC `kyb.verifyTaxCode` mutation (consistent with codebase — supersedes REST spec) · `adminProcedure` gates endpoint ✅ · Vietnamese tax code regex `/^\d{10}(-\d{3})?$/` (10-digit enterprise + hyphen branch) ✅ · NOT_FOUND if node missing ✅ · `audit_log` entry `kyb.tax_code.verify` ✅ · returns `{ valid, taxCode, reason? }` ✅ · no external API calls (stub only) ✅ · no schema changes ✅ · wired as `kyb: kybRouter` in root router ✅ · real VTA integration deferred to Sprint 4 |
| T29 | Vitest: RBAC + multi-tenant tests | Claude | ✅ | P1 | Written by Claude (2026-05-28) · augmented `multitenant.test.ts` with 3 new integration cases: `nodes.list` org scoping, admin (orgId=undefined) sees all orgs/batches, `getGenealogy` returns empty (not 404) for wrong-org batch · Codex `rbac.test.ts` (5 mocked cases) + `multitenant.test.ts` (6 real-DB cases) now cover all T24/T25 acceptance criteria |
| T31 | Web B2B merchant dashboard (Next.js) | Claude | ✅ | P2 | Shipped by Claude (2026-05-28) · `lib/trpc.ts` + `lib/trpc-provider.tsx` · `(auth)/login` · `(dashboard)/layout.tsx` (auth guard, nav, sign-out) · `(dashboard)/dashboard` (table desktop / cards mobile) · `(dashboard)/batches/new` (inline GS1 validation) · `(dashboard)/batches/[id]` (stats, badge, tx_hash, QR, genealogy) · async server wrapper `page.tsx` + `BatchDetailClient.tsx` (Next.js 15 PageProps fix) · CI ✅ green |
| T30 | Playwright: authenticated B2B flows | Claude | ✅ | P2 | Written by Claude (2026-05-28) · `b2b-dashboard.spec.ts` · login page structure (logo, fields, CTA, contact link) · unauthenticated redirect guard (`/dashboard` + `/batches/new` → `/login`) · authenticated dashboard (heading, CTA, nav logo, sign-out) · create form (all fields, GS1 invalid/valid validation, back link, submit disabled on invalid GS1) · skips gracefully if no `SUPABASE_SERVICE_KEY` · globalSetup seeds test merchant via `supabase.auth.admin.createUser` with `app_metadata.role=merchant` |

#### Outstanding debt carried from Sprint 2

| Item | Owner | Note |
|---|---|---|
| `(app)` router types auto-regen | Codex | Run `expo start` once on CI to regenerate `.expo/types/router.d.ts` — currently manually patched |
| Language toggle (vi/en) full i18n | Claude Design | Stubbed in UI — wire `next-intl` or React context in Sprint 3 |

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

## Sprint 2 Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Mass balance rounding causes false HTTP 409 | Legitimate batches rejected | Define `waste_tolerance` as a named constant (suggest 5%); add a dedicated Vitest case at the boundary |
| Supabase Storage 1 GB free tier exhausted by document uploads | Uploads fail silently | Enforce 10 MB file size limit at API layer; warn in dashboard when bucket > 800 MB |
| expo-sqlite offline sync conflict (client vs server state) | Duplicate or lost records | Last-write-wins + `audit_log` entry on every sync flush; surface conflict errors in UI |
| GS1 GTIN validation too strict / too loose | Invalid IDs accepted or valid IDs rejected | Unit test with real TCVN 13274:2020 sample GTINs; reuse regex from T02 |
| Apple Developer account still not enrolled | No TestFlight distribution for Sprint 2 preview | Expo Go covers dev testing; escalate enrollment — needed before Sprint 3 |
| reanimated v4 API breaks Claude Design animations | UI regression in mobile | Claude Design must use v4 APIs (`useSharedValue`, `useAnimatedStyle`); no v3 patterns |
| Admin KYB endpoint lacks RBAC check | Any authenticated user can approve KYB | ✅ Role check is first line of REST handler; T22 tests verify 403 for non-admin |
| `getUserRole` falls back to `user_metadata` (user-controlled) | Attacker sets `user_metadata.role="admin"` at signup → bypasses admin gate | ✅ Fixed: `context.ts` reads role from `app_metadata` only; regression test rejects spoofed `user_metadata.role="admin"` |
| Supabase anon RLS not configured | B2C `/trace/[id]` returns empty — QR scanning is broken in production | ✅ Fixed — anon SELECT policy applied on `trace_batch` + `supply_chain_node` |
| Mobile `(app)` router types stale | TypeScript misses new routes until `expo start` regenerates `.expo/types/router.d.ts` | Manually patched for now; add `expo export` step to CI to keep types fresh |
| Batch detail + create screens missing | Merchants can view list but cannot create or inspect a batch from the app | ✅ Fixed — `(batches)/[id].tsx` + `(batches)/new.tsx` shipped; BatchCard is tappable; `+` routes to create form |
| Be Vietnam Pro/JetBrains Mono font load fails in CI | Build succeeds but fonts fall back to system fonts silently | Next.js `next/font` caches at build time — verify with a Vercel preview deploy before Sprint 3 |

---

## Sprint 3 Risk Register

| Risk | Impact | Mitigation / Status |
|---|---|---|
| Codex schema migrations add NOT NULL columns without updating globalSetup | E2E globalSetup fails to seed test data → all confirmed-batch tests skip | ✅ Fixed: `globalSetup.ts` now supplies `node_type`, `org_id` for every new NOT NULL column. **Rule: when Codex adds a NOT NULL column to `supply_chain_node` or `trace_batch`, globalSetup must be updated in the same PR.** |
| `TEST_GS1_TRACE_ID` must match DB check constraint `^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$` | globalSetup batch insert fails silently; confirmed-batch tests all fail | ✅ Fixed: sentinel changed to `011234567890123410E2ETEST01`. Any future change to the GS1 regex must be reflected here. |
| Pricing section renders cards twice (mobile scroll + desktop grid) | `getByText(...).first()` picks the DOM-first copy which is `display:none` on the opposite viewport → hidden assertion failure | ✅ Fixed: pricing tests now use `[class*="grid-cols-5"]` (desktop) or `[class*="overflow-x-auto"]` (mobile) based on `viewportSize()`. **Rule: when adding duplicate-rendered sections for responsive layout, tests must scope to the visible container.** |
| New UI features that repeat a badge/text in multiple DOM locations cause Playwright strict-mode violations | `toBeVisible()` without `.first()` throws when 2 elements match | ✅ Fixed: added `.first()` to badge locator in `qr-timeline.spec.ts`. **Rule: whenever Codex adds a second occurrence of a UI element that existing tests target, the test must be updated.** |
| `locator("section, div").filter(...)` matches outer page-wrapper divs | Strict-mode violation — locator resolves to 2+ elements | ✅ Fixed: narrowed to `locator("section")`. **Rule: always prefer semantic element selectors (`section`, `article`, `nav`) over generic `div` when scoping Playwright locators.** |
| T24 RBAC / T25 multi-tenant schema changes have been partially shipped (commit evidence: `org_id NOT NULL`, `node_type NOT NULL`) but full acceptance criteria unconfirmed | Claude cannot write T29 tests without knowing what RBAC middleware and org-scoping logic exists | ✅ Resolved: Claude reviewed all RBAC + multi-tenant code on 2026-05-28 (context.ts, trpc.ts, all service + router files) — both tasks marked ✅; T29 written and complete. |

---

## Done — Sprint 1 (Week 3–4)

| # | Task | Notes |
|---|---|---|
| T01 | Turborepo monorepo scaffold + shared configs | Reviewed by Claude |
| T02 | Supabase project + Drizzle schema + migrations | Migration applied · Web helpers complete |
| T03 | Fastify API + tRPC router + Render deploy | CORS origin:true OK for MVP |
| T04 | Supabase Auth (email/password, JWT) | KYB gate enforced · RBAC deferred to Sprint 3 |
| T09 | BullMQ worker: SHA-256 hash → Polygon Amoy | Contract deployed to Amoy |
| T10 | GitHub Actions CI (lint + type-check + test) | ci.yml + release.yml |
| T13 | Vitest integration tests (API routes) | 5 files · 25 cases · all business rules covered |
| T05 | Next.js web: route skeleton + Vercel deploy | Landing page + layout |
| T06 | Next.js web: B2C timeline data layer | PII anonymised · ⚠️ RLS policy still needed on Supabase |
| T07 | Expo mobile: nav skeleton + tRPC client wired | expo-router groups correct |
| T08 | Electron desktop: shell loading web renderer | Resolved: web-wrapper architecture adopted |
| T11 | EAS Build: iOS + Android | SDK 54 · expo-router v6 · React 19 · RN 0.81.5 · Expo Go on iPhone confirmed · NativeWind wired |
| T12 | Electron Builder: .exe + .dmg GitHub Release | app.isPackaged guard · vierify.vercel.app · Vite/renderer deleted |
