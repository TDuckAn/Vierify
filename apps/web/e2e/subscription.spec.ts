import { expect, test } from "@playwright/test";

import { TEST_MERCHANT_EMAIL, TEST_MERCHANT_PASSWORD } from "./global-setup";

const hasMerchantData = !!process.env.SUPABASE_SERVICE_KEY;

async function loginAsMerchant(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(TEST_MERCHANT_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_MERCHANT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("/dashboard");
}

// ── Unauthenticated guard ─────────────────────────────────────────────────────

test.describe("Subscription page — auth guard", () => {
  test("/dashboard/subscription redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard/subscription");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Authenticated subscription page ──────────────────────────────────────────

test.describe("Subscription page — authenticated", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard/subscription");
  });

  test("renders heading 'Gói dịch vụ của bạn'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Gói dịch vụ của bạn" })).toBeVisible();
  });

  test("shows current plan label (Free on seeded account)", async ({ page }) => {
    await expect(page.getByText("Free").first()).toBeVisible();
  });

  test("shows 'Đang hoạt động' status badge", async ({ page }) => {
    await expect(page.getByText("Đang hoạt động")).toBeVisible();
  });

  test("shows trial expiry message for Free plan", async ({ page }) => {
    await expect(page.getByText(/Gói Free hết hạn vào/)).toBeVisible();
  });

  test("shows batch usage progress bar", async ({ page }) => {
    await expect(page.getByText("Lô hàng đã dùng tháng này")).toBeVisible();
  });

  test("'Nâng cấp gói' button expands upgrade plan cards", async ({ page }) => {
    await page.getByRole("button", { name: "Nâng cấp gói" }).click();
    await expect(page.getByText("Chọn gói nâng cấp:")).toBeVisible();
    // Professional is featured with "Lựa chọn tốt nhất" badge
    await expect(page.getByText("Lựa chọn tốt nhất").first()).toBeVisible();
  });

  test("upgrade tier cards link to /onboarding/plan", async ({ page }) => {
    await page.getByRole("button", { name: "Nâng cấp gói" }).click();
    const cards = page.getByRole("link", { name: /Chọn gói này/ });
    await expect(cards.first()).toHaveAttribute("href", "/onboarding/plan");
  });

  test("invoice history section is visible", async ({ page }) => {
    await expect(page.getByText("Lịch sử thanh toán")).toBeVisible();
  });

  test("Free plan shows 'Chưa có hóa đơn nào' in invoice section", async ({ page }) => {
    await expect(page.getByText("Chưa có hóa đơn nào")).toBeVisible();
  });

  test("'← Quay lại' link returns to /dashboard", async ({ page }) => {
    const link = page.getByRole("link", { name: "← Quay lại" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/dashboard");
  });

  test("no horizontal overflow on 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/subscription");
    await page.waitForURL(/\/login|\/dashboard\/subscription/);
    if (page.url().includes("/login")) return; // not seeded
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});

// ── Avatar menu — subscription link ──────────────────────────────────────────

test.describe("Dashboard nav — subscription link", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY");

  test("avatar menu contains 'Quản lý gói' link pointing to /dashboard/subscription", async ({ page }) => {
    await loginAsMerchant(page);
    const avatarBtn = page.getByRole("button", { name: "Tài khoản" });
    await avatarBtn.click();
    const link = page.getByRole("link", { name: "Quản lý gói" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/dashboard/subscription");
  });
});
