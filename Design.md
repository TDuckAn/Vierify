# Vierify — Design Brief

> **For:** v0 / AI design tools. Feed this file directly to generate screens.
> **Stack:** Next.js 15 App Router · Tailwind CSS · Be Vietnam Pro font · Dark mode supported.
> **Platform:** Web only (mobile app archived). Desktop uses the web in an Electron wrapper.

---

## 1. Product in One Sentence

Vierify is a supply chain traceability platform for Vietnamese businesses — merchants create and link product batches (B2B dashboard), consumers scan a QR code to see the full origin story with Polygon blockchain proof (B2C trace page).

---

## 2. Surfaces

| Surface | Audience | Routes |
|---|---|---|
| **Marketing site** | B2B prospects + general public | `/` |
| **B2C Trace Timeline** | End consumers (QR scan) | `/trace/[id]`, `/trace/demo` |
| **Auth flow** | Merchants registering or logging in | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` |
| **Onboarding flow** | Newly registered merchants | `/onboarding/plan`, `/onboarding/profile` |
| **B2B Dashboard** | Authenticated merchants | `/dashboard`, `/batches/*`, `/dashboard/scan`, `/dashboard/subscription` |

---

## 3. Design Direction

### Personality
- **Professional, secure, trustworthy** — blockchain-grade product must look credible to Vietnamese SME buyers
- **Clean and data-forward** — information surfaces without decoration; whitespace earns its keep
- **Warm, not cold** — friendly empty states, micro-interactions; this is used by factory workers, not only developers
- Vietnamese-first copy by default; English toggle in nav

### Visual references
- Linear (tight typography, clean data tables)
- Stripe (trust, premium B2B feel)
- Vercel Dashboard (developer clarity without alienating non-technical users)

---

## 4. Color System

All brand colors are Tailwind custom tokens. Use token names — never raw hex.

### Brand Tokens (defined in `tailwind.config.ts`)

| Token | Class | Hex | Use |
|---|---|---|---|
| **chain** (primary) | `bg-chain` / `text-chain` / `border-chain` | `#14B8A6` | CTAs, active states, brand accent, nav logo |
| chain hover | `hover:bg-teal-600` | `#0D9488` | Button hover/pressed |
| **proof** (secondary) | `bg-proof` / `text-proof` / `border-proof` | `#2563EB` | Blockchain links, secondary actions |
| Verified / Success | `emerald-500` | `#10B981` | `bc_status=1` badge, success states |
| Pending / Warning | `amber-500` | `#F59E0B` | `bc_status=0` badge, KYB pending, processing |
| Destructive | `rose-500` | `#F43F5E` | Errors, delete confirmations, KYB rejected |
| Neutral text + borders | `slate-*` scale | — | All text, borders, backgrounds |

### Light / Dark Mode

Both modes required. Use `dark:` Tailwind prefix throughout.

| Role | Light | Dark |
|---|---|---|
| Page background | `bg-slate-50` | `bg-slate-950` |
| Card / surface | `bg-white` | `bg-slate-900` |
| Border | `border-slate-200` | `border-slate-800` |
| Text primary | `text-slate-950` | `text-slate-50` |
| Text secondary | `text-slate-500` | `text-slate-400` |
| Muted text | `text-slate-400` | `text-slate-600` |

---

## 5. Typography

| Role | Font | Weights | CSS variable |
|---|---|---|---|
| **All UI + headings** | Be Vietnam Pro | 400, 500, 600, 700, 800 | `--font-be-vietnam-pro` → `font-sans` |
| **Monospace** (hashes, IDs) | JetBrains Mono | 400, 500 | `--font-jetbrains-mono` → `font-mono` |

Vietnamese diacritics (ắ, ề, ộ, ử…) are fully supported by Be Vietnam Pro — always use it, never fall back to system sans.

### Type Scale

| Use | Class |
|---|---|
| Hero headline | `text-5xl lg:text-6xl font-extrabold tracking-tight` |
| Page / section H2 | `text-3xl lg:text-4xl font-bold tracking-tight` |
| Card heading H3 | `text-xl font-bold` |
| Body copy | `text-base` (16px minimum — never go below 14px for Vietnamese readability) |
| Label / caption | `text-sm text-slate-500 dark:text-slate-400` |
| GS1 IDs / tx hashes | `font-mono text-sm break-all` |
| Badge / chip | `text-xs font-semibold` |

---

## 6. Reusable Component Patterns

These patterns are used across all screens. Replicate exactly.

### Badge — Blockchain Status
```
Verified:  border-emerald-200 bg-emerald-50 text-emerald-800 (dark: border-emerald-800 bg-emerald-900/30 text-emerald-400)
           dot: bg-emerald-500
           label: "Đã xác minh trên Polygon"

Pending:   border-amber-200 bg-amber-50 text-amber-800 (dark: border-amber-800 bg-amber-900/30 text-amber-400)
           dot: bg-amber-400
           label: "Đang xử lý blockchain"
```
Shape: `rounded-full border px-4 py-1.5 text-sm font-semibold flex items-center gap-2`

### Card / Section Box
`rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900`

### Primary Button
`rounded-full bg-chain px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors`

### Secondary / Outline Button
`rounded-full border border-slate-300 text-slate-700 px-6 py-2.5 text-sm font-semibold hover:border-chain hover:text-chain transition-colors dark:border-slate-600 dark:text-slate-300`

### Input Field
`w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chain/30 focus:border-chain dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50`

Error state: `border-rose-400 focus:ring-rose-400/30`

### KYB Banner
Full-width banner below dashboard nav. Yellow for pending/suspended, red for rejected.
`rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-900/20`

### Subscription Tier Badge (new)
Small pill shown in dashboard nav / profile.
`rounded-full bg-chain/10 text-chain text-xs font-bold px-3 py-1`
Text: "Free", "Basic", "Advanced", "Professional", "Enterprise"

---

## 7. Marketing Site (`/`)

Single long-scroll page. All sections already built — use as reference for visual language.

### Nav
Sticky. `bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-950/80 dark:border-slate-800`
- Logo: "Vierify" in `text-chain font-extrabold text-xl`
- Links: How It Works · Features · Pricing
- Right: Language toggle (VI/EN) · Dark mode toggle · **"Bắt đầu miễn phí"** CTA → `/register`

### Hero
Two-column grid (text left, mockup right). Background: soft `bg-chain/5 blur-3xl` radial blobs (decorative, pointer-events-none).
- Badge: `"Powered by Polygon Blockchain"` — chain color pill
- H1: `"Truy xuất nguồn gốc minh bạch từ nông trại đến tay bạn"` (chain-colored accent word)
- Sub: value proposition paragraph
- CTAs: Primary `"Bắt đầu miễn phí"` → `/register` · Secondary `"Xem demo →"` → `/trace/demo`
- Right: clickable browser-frame mockup of the `/trace` page → `/trace/demo`

### Sections (in order)
1. Trust bar — standard badges (Polygon, GS1 Vietnam, TCVN 13274:2020, ISO 22000 Ready)
2. Problem → Solution — 2-column rose/teal card pair
3. How It Works — 3-step cards with numbered watermark
4. Feature highlights — 6-card grid with inline SVG icons
5. Demo section — CTA to `/trace/demo`
6. Pricing — see Section 10
7. CTA banner — chain background, white text
8. Footer — 4-column grid, dark border top

### CTAs that link to `/register`
- Hero primary CTA
- All pricing tier CTA buttons (Free → "Bắt đầu miễn phí", paid → "Chọn gói này")
- Footer CTA banner button

---

## 8. B2C Trace Timeline (`/trace/[id]`)

**Primary consumer surface.** No nav sidebar. Mobile-first (375px iPhone). Server-rendered.

### Layout
Sticky header + vertical scrolling `<main>` with `max-w-3xl mx-auto px-5 py-10 space-y-5`.

### Header
`sticky top-0 z-10 border-b bg-white/90 backdrop-blur dark:bg-slate-950/90`
Vierify logo (chain) + "Truy xuất nguồn gốc" label (right, hidden on mobile).

### Sections

**1. Batch Identity** (card)
- Label: "Vierify trace" (uppercase, muted)
- H1: batch name
- Origin node name (if not masked)
- GS1 ID in `font-mono text-xs text-slate-400`
- Blockchain status badge (top-right on desktop, below name on mobile)

**2. Stats Row**
3-column grid of small cards: Số lượng · Loại nút · Lượt quét
Each: `rounded-xl border p-4` with muted uppercase label + bold value.
"Lượt quét" updates in real-time via Supabase Realtime (`ScanCountValue` client component).

**3. Blockchain Proof** (card)
- Shield icon (`text-proof`)
- If confirmed: tx_hash box (`font-mono text-sm break-all bg-slate-50`) + Polygonscan external link button
- If pending: amber info box with hourglass emoji + explanation text

**4. Supply Chain Timeline** (card)
Vertical timeline with connector lines.
- Each parent batch: small chain-colored dot + batch name + node name + status badge
- Current batch: larger emerald dot with location pin icon, `isCurrent=true`
- Empty state: muted italic text

**5. Document Hash** (card, conditional)
Shown only if `doc_hash` exists. File icon + truncated SHA-256 hash in monospace.

**Footer**
`text-center text-sm text-slate-400` — "Được cung cấp bởi Vierify · Dữ liệu được xác thực trên Polygon blockchain"

---

## 9. Auth Flow

### 9.1 Login (`/login`) — EXISTING

Full-page centered layout. `min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950`

Card: `w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm dark:bg-slate-900`
- Vierify logo (chain, centered) + "Đăng nhập" heading
- Email + password inputs
- Primary button: "Đăng nhập"
- Below button: **"Quên mật khẩu?"** → `/forgot-password`
- Below that: **"Chưa có tài khoản? Bắt đầu miễn phí →"** → `/register`

Error states:
- Wrong credentials: inline `text-rose-600 text-sm` below button
- Account not activated: rose banner at top of card

---

### 9.2 Register (`/register`) — NEW

Same centered card layout as `/login`.

Card:
- Logo + "Tạo tài khoản" heading
- Sub: "Dùng thử miễn phí 3 tháng. Không cần thẻ tín dụng."
- Email input
- Password input (with show/hide toggle)
- Confirm password input
- Primary button: "Tạo tài khoản"
- "Bằng cách đăng ký, bạn đồng ý với [Điều khoản sử dụng] và [Chính sách bảo mật]" — links in chain color
- Divider + "Đã có tài khoản? [Đăng nhập]" → `/login`

Success state (inline, no redirect): card transitions to a "check your email" state:
- Large envelope icon (chain color)
- "Kiểm tra email của bạn"
- Sub: "Chúng tôi đã gửi link xác nhận đến [email]. Nhấp vào link để kích hoạt tài khoản."
- "Gửi lại email" secondary button (calls Supabase `auth.resend()`)

---

### 9.3 Verify Email (`/verify-email`) — NEW

Standalone page (not a card overlay). Shown when user lands after clicking the email confirmation link, or navigated to directly.

Full-page centered:
- Large animated checkmark (emerald) if `?token_hash` present and valid
- "Email đã được xác nhận!" heading
- Sub: "Tài khoản của bạn đã sẵn sàng. Tiếp theo, hãy chọn gói dịch vụ."
- Primary button: "Tiếp tục →" → `/onboarding/plan`

If token is invalid/expired:
- Rose X icon + "Liên kết đã hết hạn" heading
- "Gửi lại email xác nhận" button

---

### 9.4 Forgot Password (`/forgot-password`) — NEW

Same centered card layout.

Card:
- "Đặt lại mật khẩu" heading
- Sub: "Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu."
- Email input
- "Gửi link đặt lại" primary button
- "← Quay lại đăng nhập" text link → `/login`

Success state (inline): envelope icon + "Kiểm tra email của bạn" with same resend pattern as register.

---

### 9.5 Reset Password (`/reset-password`) — NEW

Same centered card layout. Only accessible via the reset link in email (contains Supabase token in URL hash).

Card:
- "Mật khẩu mới" heading
- New password input + confirm input (show/hide toggles)
- Password strength indicator (simple: weak/medium/strong colored bar)
- "Cập nhật mật khẩu" primary button
- On success: "Mật khẩu đã cập nhật!" + "Đến trang đăng nhập →" link

---

## 10. Onboarding Flow

Protected: requires session, but `app_metadata.role` must not yet be `"merchant"`. If already merchant, redirect to `/dashboard`.

Shared layout: `(onboarding)/layout.tsx` — centered column, Vierify logo top-left, no nav sidebar.
Progress indicator: simple 2-step: **1. Chọn gói** · **2. Hồ sơ doanh nghiệp**

---

### 10.1 Plan Selector (`/onboarding/plan`) — NEW

5-tier pricing cards in a responsive grid (horizontal scroll on mobile, grid on desktop).
Identical visual treatment to the marketing pricing section — use the same `PricingCard` component.

Below cards: feature comparison table (collapsible on mobile).

CTA per tier:
- **Free**: "Bắt đầu miễn phí" → navigates directly to `/onboarding/profile`
- **Basic / Advanced / Professional**: "Chọn gói này" → calls `billing.createCheckoutSession` → redirects to PayOS or MOMO payment page
- **Enterprise**: "Liên hệ với chúng tôi" → `mailto:` or contact form

Payment method selector (shown when paid tier selected):
- Two-button toggle: **PayOS** | **MoMo**
- PayOS: shows bank transfer / QR badge
- MoMo: shows MoMo purple logo

After returning from PayOS/MOMO with `?payment=success` query param: auto-advance to `/onboarding/profile`.

---

### 10.2 Business Profile (`/onboarding/profile`) — NEW

Step 2 of onboarding. Form to create the merchant's `supply_chain_node`.

Card layout with form:

**Heading:** "Hồ sơ doanh nghiệp"
**Sub:** "Thông tin này sẽ xuất hiện trên trang truy xuất nguồn gốc của lô hàng."

**Fields:**
| Field | Input type | Validation |
|---|---|---|
| Tên doanh nghiệp / cơ sở | Text | Required |
| Mã số thuế (MST) | Text | Regex `/^\d{10}(-\d{3})?$/` — 10 or 13 digits |
| Loại nút chuỗi cung ứng | Select | Nông trại / Nhà máy / Kho bãi / Nhà phân phối / Cửa hàng |
| Địa chỉ | Textarea | Required |
| Đây là hộ kinh doanh cá nhân | Checkbox | Sets `is_individual=true` — shows note about PII masking |

`is_individual` note (shown when checked):
`rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800` — "Thông tin nhận dạng của bạn sẽ được ẩn trên trang công khai theo quy định Nghị định 13/2023/NĐ-CP."

**Submit button:** "Hoàn tất đăng ký →"

On success: redirect to `/dashboard` with a welcome toast: "Chào mừng bạn đến với Vierify! Tài khoản đang chờ xét duyệt KYB."

---

## 11. B2B Merchant Dashboard

Authenticated layout. Session guard: redirect to `/login` if no session.

### Shared Layout (`(dashboard)/layout.tsx`)

**Top nav bar:**
`sticky top-0 z-50 border-b bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-14`
- Left: "Vierify" logo (chain) + org name (slate-600, truncated)
- Right: Subscription tier badge · Dark mode toggle · Avatar/menu → "Đăng xuất" + "Quản lý gói"

**KYB Banner** (shown below nav when `kybStatus !== "approved"`):
`rounded-xl border px-5 py-4 mx-6 mt-4`
- Pending: amber — "Tài khoản đang chờ xét duyệt KYB · Thường mất 24–48 giờ · Liên hệ support@vierify.vn"
- Rejected: rose — "Xét duyệt KYB bị từ chối · Liên hệ hỗ trợ"
- Suspended: amber — "Tài khoản bị tạm đình chỉ · Liên hệ admin"

**Batch limit warning** (shown when near limit):
`rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 mx-6 mt-4`
"Bạn đã dùng 28/30 lô hàng tháng này · [Nâng cấp gói] để tiếp tục"

---

### 11.1 Batch List (`/dashboard`) — EXISTING (Sprint 4 complete)

**Page heading:** "Lô hàng của tôi"
**Top-right CTA:** "＋ Tạo lô hàng mới" (chain color) → `/batches/new`

**Filter tabs:** Tất cả · Đã xác minh · Đang xử lý (chain underline on active)

**Search bar:** text input with search icon — filters by batch name

**Table (desktop):**
Columns: Tên lô hàng · GS1 Trace ID (mono, truncated) · Số lượng + UOM · Trạng thái (badge) · Ngày tạo · → (detail link)

**Card stack (mobile < 640px):**
Each card: name (bold) + GS1 ID (mono, truncated) + status badge + quantity + date

**Pagination:** Previous / Next buttons with page count. 20 items per page.

**Empty state:** chain-color icon + "Chưa có lô hàng nào" + create CTA

**Skeleton:** 5 skeleton rows while loading

---

### 11.2 Create Batch (`/batches/new`) — EXISTING (Sprint 4 complete)

Back link: `"← Lô hàng"` → `/dashboard`
**Heading:** "Tạo lô hàng mới"

**Form:**
| Field | Input | Notes |
|---|---|---|
| Tên lô hàng | Text | Required |
| GS1 Trace ID | Monospace text | Regex validated inline `^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$` |
| Node | Select dropdown | From `nodes.list`, only `kybStatus=approved` |
| Số lượng | Number | Positive |
| Đơn vị | Select | kg / tấn / lít / thùng / cái |
| Lô hàng cha (optional) | Multi-select search | Search existing batches; shows genealogy chain |

**Error states:**
- Mass balance violation (409): `rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800` — shows exact quantity difference
- KYB not approved (403): same style rose box — "Tài khoản chưa được phê duyệt KYB"
- Batch limit exceeded (429): amber box — "Đã đạt giới hạn lô hàng · [Nâng cấp gói]" with link to `/dashboard/subscription`

---

### 11.3 Batch Detail (`/batches/[id]`) — EXISTING (Sprint 4 complete)

Back link + batch name as page H1.

**Sections (top to bottom):**
1. Blockchain status badge (large, prominent)
2. Stats row: Số lượng · Loại nút · Ngày tạo · Lượt quét
3. QR code card: centered PNG image from `GET /batches/:id/qr` + "Tải xuống QR" button
4. Genealogy section: parent batch list + "＋ Liên kết lô hàng cha" button → modal
5. Document section: if `doc_hash` present, show hash + "Thay thế"; if not, drag-drop upload zone
   - Drag-drop zone: `border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-chain`
   - Active drag: `border-chain bg-chain/5`
6. Tx hash card (if `bc_status=1`): full hash in monospace + copy button + Polygonscan link

---

### 11.4 QR Scanner (`/dashboard/scan`) — EXISTING (Sprint 4 complete)

Full-viewport camera view. No nav — floating back button top-left.

**Scanner overlay:**
- Dark transparent backdrop with rounded-corner cutout in center
- Animated scan line (chain color, horizontal sweep)
- Label below cutout: "Căn mã QR vào khung"

**Success state:**
- Frame turns emerald + scale pulse
- Card slides up from bottom: batch name + GS1 ID + "Xem trang truy xuất →" button

**Error state:**
- Frame turns rose + shake animation
- Inline message: "Không nhận diện được mã QR. Thử lại."

**Permission denied:**
- Full card overlay: "Cần quyền truy cập camera" + instructions

---

### 11.5 Subscription Management (`/dashboard/subscription`) — NEW

Accessible from nav avatar menu "Quản lý gói".

**Page heading:** "Gói dịch vụ của bạn"

**Current plan card:**
- Large tier name (e.g., "Free") + status badge (Active / Trial / Expired)
- Trial expiry: amber notice — "Gói Free hết hạn vào [date] · Nâng cấp để tiếp tục"
- Batch usage: progress bar — "18 / 30 lô hàng đã dùng tháng này"
  Bar: chain color fill, slate background `rounded-full h-2`
- "Nâng cấp gói" button (chain) · "Hủy đăng ký" text link (rose, with confirmation dialog)

**Invoice history table:**
Columns: Kỳ thanh toán · Số tiền · Phương thức · Trạng thái · PDF
- Status badges: Đã thanh toán (emerald) · Chờ thanh toán (amber) · Thất bại (rose)

**Upgrade plan section:**
Same 5-tier pricing cards as `/onboarding/plan` (collapsed by default, "Xem tất cả gói" expands).
Currently active plan: chain border, "Gói hiện tại" badge.

---

## 12. Pricing Tiers (Fixed — Do Not Change)

| | Free | Basic | Advanced | Professional | Enterprise |
|---|---|---|---|---|---|
| **Giá** | 0đ | 99.000đ/tháng | 499.000đ/tháng | 4.999.999đ/tháng | Liên hệ |
| Trial | 3 tháng | — | — | — | — |
| Lô/tháng | 30 | 100 | 500–1.000 | Không giới hạn | Không giới hạn |
| Người dùng | 1 | 1 | 5 | 20 | Không giới hạn |
| Tần suất | Cuối ngày | 6–12 giờ | 1–2 giờ | Real-time | Real-time |
| Xác thực blockchain | — | ✓ | ✓ | ✓ | ✓ |
| GS1 Barcode | — | — | ✓ | ✓ | ✓ |
| KYB ưu tiên | — | — | — | ✓ | ✓ |
| Account Manager | — | — | — | — | ✓ |

**Highlighted tier:** Professional — `border-chain shadow-xl` + "Lựa chọn tốt nhất" badge (`absolute -top-3.5 left-1/2 -translate-x-1/2 bg-chain text-white text-xs font-bold px-4 py-1 rounded-full`)

**CTA buttons:** Free → "Bắt đầu miễn phí", Basic/Advanced/Pro → "Chọn gói này", Enterprise → "Liên hệ với chúng tôi"

---

## 13. API Surface

### tRPC — authenticated (B2B dashboard)

| Procedure | Returns |
|---|---|
| `batches.list({ limit, nodeId })` | Array of batches (org-scoped) |
| `batches.get({ id })` | Single batch with `bc_status`, `tx_hash`, `doc_hash` |
| `batches.create(input)` | Creates batch + queues blockchain job |
| `batches.getByTraceId({ gs1TraceId })` | Public — B2C trace |
| `nodes.list({ limit })` | Supply chain nodes for this org |
| `billing.getCurrentSubscription()` | `{ tier, status, trialEndsAt, batchesUsed, batchLimit }` |
| `billing.createCheckoutSession({ tier, paymentMethod })` | `{ checkoutUrl }` — redirect to PayOS or MoMo |
| `billing.cancelSubscription()` | Marks subscription canceled |
| `billing.listInvoices()` | Admin only — all invoices |
| `auth.me()` | `{ id, email, role }` |

### REST — server

| Endpoint | Purpose |
|---|---|
| `GET /batches/:id/qr` | `{ qrDataUrl, traceUrl, gs1TraceId }` — use `qrDataUrl` for `<img>` |
| `POST /batches/:id/document` | Multipart — returns `{ signedUrl, docHash }` |
| `POST /batches/:child_id/parents` | Links parent batch IDs |
| `PATCH /admin/nodes/:id/kyb` | Admin only — update KYB status |
| `POST /webhooks/payos` | PayOS payment webhook (public, signature-verified) |
| `POST /webhooks/momo` | MoMo payment webhook (public, HMAC-verified) |

### Supabase direct — B2C trace page (anon key)

| Query | Returns |
|---|---|
| `trace_batch.select("*, supply_chain_node(*)").eq("gs1_trace_id", id)` | Batch + node; PII masked server-side before render |

---

## 14. Payment Pages — Brand Notes

When redirecting to PayOS or MoMo, these are external pages (not designed by us). However, the **return page** after payment (`/onboarding/profile?payment=success` or `/dashboard/subscription?payment=success`) should show a brief success state before proceeding:

- Emerald checkmark icon (animated in)
- "Thanh toán thành công!"
- Sub: "Đang kích hoạt tài khoản của bạn…"
- Brief loading spinner, then auto-advance

On `?payment=cancelled`:
- Amber icon + "Thanh toán bị hủy" + "Thử lại" button

**MoMo color** (for the payment method toggle): `#ae2070` — use only for the MoMo button/logo badge, not as brand color.
**PayOS color**: `#1A56DB` — similarly isolated.

---

## 15. Animations

- **Scroll reveal:** All marketing sections below the hero use `opacity: 0 → 1` + `translateY(22px → 0)` via `IntersectionObserver` (see `ScrollReveal` component). Transition: `0.55s ease`.
- **Hero:** No animation on hero text (LCP optimization). Hero mockup card: `fade-in 0.8s delay-200ms`.
- **`prefers-reduced-motion`:** All animations disabled. Content is immediately visible.
- **Dashboard interactions:** Tailwind `transition-colors`, `transition-all` for hover states. No JS animation needed.
- **Loading states:** Skeleton loaders (not spinners) for list/table data.
- **Success transitions:** Checkmark + scale (`scale-100` from `scale-50`) for payment success, email verify.
- **Toast notifications:** Slide in from top-right, auto-dismiss 4s. Stack if multiple.

---

## 16. Hard Rules

1. `"use client"` only on interactive components (forms, modals, charts) — not on page-level layouts
2. Vietnamese is the default language. English toggle persists to `localStorage` key `vierify-lang`
3. PII masking: `is_individual=true` nodes show `"***"` for name and address everywhere in the B2C trace page
4. Never show `tax_code` on any B2C page
5. `audit_log` is append-only — never add delete or edit UI for it
6. All batch creation goes through the `batches.create` tRPC mutation — never write directly to Supabase from the frontend
7. All new pages must support dark mode (`dark:` prefix on all color classes)
8. Font: always `font-sans` (Be Vietnam Pro) for UI, `font-mono` (JetBrains Mono) for hashes/IDs
9. Minimum touch target: 44×44px for all interactive elements (factory-floor mobile use)
10. Do not call any new API endpoints not listed in Section 13 — flag the gap instead

---

## 17. File Locations (Web)

| Type | Location |
|---|---|
| Pages | `apps/web/app/` |
| Shared components | `apps/web/components/` |
| Global CSS + animations | `apps/web/app/globals.css` |
| Tailwind config + tokens | `apps/web/tailwind.config.ts` |
| Supabase client | `apps/web/lib/supabase.ts` |
| tRPC client | `apps/web/lib/trpc.ts` |
| Auth pages | `apps/web/app/(auth)/` |
| Onboarding pages | `apps/web/app/(onboarding)/` |
| Dashboard pages | `apps/web/app/(dashboard)/` |
| B2C trace page | `apps/web/app/trace/[id]/` |
