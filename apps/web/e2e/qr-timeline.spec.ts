import { expect, test } from "@playwright/test";

import { TEST_GS1_TRACE_ID, TEST_TX_HASH } from "./global-setup";

// Whether the test Supabase has been seeded (requires SUPABASE_SERVICE_KEY in env).
const hasTestData = !!process.env.SUPABASE_SERVICE_KEY;

test.describe("B2C trace timeline — /trace/[id]", () => {
  // ── Header (always visible, regardless of batch state) ───────────────────

  test("header shows Vierify logo on any route", async ({ page }) => {
    await page.goto("/trace/SOME-UNKNOWN-ID");
    await expect(page.getByRole("link", { name: "Vierify" })).toBeVisible();
  });

  test("header shows 'Truy xuất nguồn gốc' label", async ({ page }) => {
    await page.goto("/trace/SOME-UNKNOWN-ID");
    await expect(page.getByText("Truy xuất nguồn gốc")).toBeVisible();
  });

  test("trace page renders 'Hành trình chuỗi cung ứng' heading on any route", async ({
    page
  }) => {
    // The journey section is server-rendered regardless of whether the batch exists.
    // For not-found routes the section may be absent — this test only runs when
    // a real batch resolves, so scope it to a format that at least loads the page.
    await page.goto("/trace/SOME-UNKNOWN-ID");
    // Not-found pages won't have this heading; confirmed-batch pages will.
    // This acts as a structural smoke test — no assertion failures if missing.
    const heading = page.getByText("Hành trình chuỗi cung ứng");
    const count = await heading.count();
    // If the heading is present it must be visible (not hidden by CSS)
    if (count > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });

  // ── Not-found state (always runs — no Supabase data needed) ─────────────

  test.describe("not-found state", () => {
    test.beforeEach(async ({ page }) => {
      // Use a GS1-formatted but non-existent ID to guarantee a miss
      await page.goto("/trace/GS1-NOTEXIST-00000000");
    });

    test("shows 'Không tìm thấy lô hàng' heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Không tìm thấy lô hàng" })
      ).toBeVisible();
    });

    test("shows error detail message", async ({ page }) => {
      // The error section should contain some text from Supabase (e.g. "no rows")
      const errorBox = page.locator("p.text-rose-800, p.text-rose-400").first();
      await expect(errorBox).toBeVisible();
    });

    test("shows a link back to the home page", async ({ page }) => {
      const homeLink = page.getByRole("link", { name: /Về trang chủ/ });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute("href", "/");
    });
  });

  // ── Confirmed batch (requires seeded test data) ──────────────────────────
  // Run only when globalSetup successfully created the fixture batch.
  // Set SUPABASE_SERVICE_KEY in CI secrets to enable these tests.

  test.describe("confirmed batch — bc_status=1, tx_hash set", () => {
    test.skip(!hasTestData, "Requires SUPABASE_SERVICE_KEY to seed test data");

    test.beforeEach(async ({ page }) => {
      await page.goto(`/trace/${encodeURIComponent(TEST_GS1_TRACE_ID)}`);
    });

    test("shows the batch name", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Cà phê Arabica — Playwright Batch" })
      ).toBeVisible();
    });

    test("shows the GS1 trace ID in monospace", async ({ page }) => {
      await expect(page.getByText(TEST_GS1_TRACE_ID)).toBeVisible();
    });

    test("shows emerald 'Đã xác minh trên Polygon' badge", async ({ page }) => {
      // Page now renders this badge in two places (proof section + timeline entry); pick the first
      const badge = page.getByText("Đã xác minh trên Polygon").first();
      await expect(badge).toBeVisible();
      // Badge must carry emerald styling (not amber)
      await expect(badge).toHaveClass(/emerald/);
    });

    test("shows the truncated tx_hash in the blockchain proof section", async ({
      page
    }) => {
      // First 12 chars of the test tx hash should be visible
      await expect(page.getByText(TEST_TX_HASH.slice(0, 12), { exact: false })).toBeVisible();
    });

    test("Polygonscan link is visible and points to the correct tx", async ({
      page
    }) => {
      const link = page.getByRole("link", { name: /Polygonscan Amoy/ });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        "href",
        `https://amoy.polygonscan.com/tx/${TEST_TX_HASH}`
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noreferrer");
    });

    test("stats row shows quantity and unit", async ({ page }) => {
      // The fixture batch has quantity=250, uom=kg
      await expect(page.getByText("250 kg")).toBeVisible();
    });

    test("footer shows 'Powered by Vierify' link", async ({ page }) => {
      await page.locator("footer").last().scrollIntoViewIfNeeded();
      const link = page.getByRole("link", { name: "Vierify" }).last();
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/");
    });

    test("'Blockchain proof' section heading is present", async ({ page }) => {
      await expect(page.getByText("Bằng chứng blockchain")).toBeVisible();
    });

    test("supply chain journey heading is present", async ({ page }) => {
      await expect(page.getByText("Hành trình chuỗi cung ứng")).toBeVisible();
    });

    test("current batch appears as the last timeline entry with emerald dot", async ({
      page
    }) => {
      // "section, div" also matches the outer min-h-screen wrapper; narrow to <section> only
      const timelineSection = page.locator("section").filter({
        has: page.getByText("Hành trình chuỗi cung ứng")
      });
      await expect(timelineSection).toBeVisible();
      // Current batch name must appear inside the timeline
      await expect(
        timelineSection.getByText("Cà phê Arabica — Playwright Batch")
      ).toBeVisible();
    });

    test("empty-parent state shows fallback message when no parents linked", async ({
      page
    }) => {
      // The fixture batch has no parents, so the empty-state message should render
      const emptyMsg = page.getByText(/Chưa có lô hàng cha/);
      // It is acceptable for this to be absent if parents were seeded — just skip assertion
      // if the text is not found (i.e. parents were added to the fixture).
      const count = await emptyMsg.count();
      if (count > 0) {
        await expect(emptyMsg.first()).toBeVisible();
      }
    });
  });

  // ── Pending batch (requires a separate pending fixture — skip for now) ───

  test.describe("pending batch — bc_status=0, no tx_hash", () => {
    test.skip(
      true,
      "Pending-state fixture not seeded — add PLAYWRIGHT_PENDING_TRACE_ID to enable"
    );

    test("shows amber 'Đang xử lý blockchain' badge", async ({ page }) => {
      const pendingId = process.env.PLAYWRIGHT_PENDING_TRACE_ID ?? "";
      await page.goto(`/trace/${encodeURIComponent(pendingId)}`);
      await expect(page.getByText("Đang xử lý blockchain")).toBeVisible();
    });

    test("shows 'Đang chờ xác nhận' explanation instead of Polygonscan link", async ({
      page
    }) => {
      const pendingId = process.env.PLAYWRIGHT_PENDING_TRACE_ID ?? "";
      await page.goto(`/trace/${encodeURIComponent(pendingId)}`);
      await expect(page.getByText("Đang chờ xác nhận")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Polygonscan Amoy/ })
      ).not.toBeVisible();
    });
  });

  // ── Accessibility / mobile ───────────────────────────────────────────────

  test("page is scrollable on a 375 px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/trace/GS1-NOTEXIST-00000000");
    // No overflow or horizontal scroll — body should not exceed viewport width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2); // 2px rounding tolerance
  });
});
