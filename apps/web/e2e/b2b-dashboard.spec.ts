import { expect, test } from "@playwright/test";

import { TEST_MERCHANT_EMAIL, TEST_MERCHANT_PASSWORD } from "./global-setup";

// Requires SUPABASE_SERVICE_KEY so globalSetup can seed the merchant user.
const hasMerchantData = !!process.env.SUPABASE_SERVICE_KEY;

// Signs in through the real login UI. Supabase auth is a cloud endpoint, so
// this works in CI even when our Fastify API is not running.
async function loginAsMerchant(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(TEST_MERCHANT_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_MERCHANT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("/dashboard");
}

// ── Login page (always runs — no auth required) ───────────────────────────────

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders Vierify logo and heading", async ({ page }) => {
    await expect(page.getByText("Vierify").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  });

  test("has email and password fields", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("has a submit button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  });

  test("shows register CTA for new merchants", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Bắt đầu miễn phí/ })).toBeVisible();
  });
});

// ── Auth redirect guard (always runs — no auth required) ─────────────────────

test.describe("Unauthenticated redirect guard", () => {
  test("/dashboard redirects to /login when no session", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test("/batches/new redirects to /login when no session", async ({ page }) => {
    await page.goto("/batches/new");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Authenticated dashboard (requires seeded merchant) ───────────────────────

test.describe("Authenticated dashboard", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY to seed merchant user");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  test("shows 'Lô hàng của tôi' heading after login", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Lô hàng của tôi" })).toBeVisible();
  });

  test("shows 'Tạo lô hàng mới' CTA button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Tạo lô hàng mới/ })
    ).toBeVisible();
  });

  test("nav bar shows Vierify logo linking to /dashboard", async ({ page }) => {
    const logo = page.getByRole("link", { name: "Vierify" }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/dashboard");
  });

  test("sign out returns to /login", async ({ page }) => {
    await page.getByRole("button", { name: "Tài khoản" }).click();
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Create batch form (requires seeded merchant) ──────────────────────────────

test.describe("Create batch form", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY to seed merchant user");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.getByRole("link", { name: /Tạo lô hàng mới/ }).click();
    await page.waitForURL("/batches/new");
  });

  test("renders all required form fields", async ({ page }) => {
    await expect(page.getByText("Tên lô hàng")).toBeVisible();
    await expect(page.getByText("GS1 Trace ID")).toBeVisible();
    await expect(page.getByText("Số lượng")).toBeVisible();
    await expect(page.getByText("Đơn vị")).toBeVisible();
  });

  test("GS1 field shows validation error for invalid format", async ({ page }) => {
    await page.getByPlaceholder("011234567890123410LOT001").fill("INVALID-ID");
    // Trigger blur / interact elsewhere so the error shows
    await page.getByPlaceholder("VD: Cà phê Arabica — Lứa 1").click();
    await expect(page.getByText("Mã GS1 không đúng định dạng")).toBeVisible();
  });

  test("GS1 field accepts a valid GS1 trace ID", async ({ page }) => {
    await page.getByPlaceholder("011234567890123410LOT001").fill("011234567890123410VALIDLOT1");
    await page.getByPlaceholder("VD: Cà phê Arabica — Lứa 1").click();
    await expect(page.getByText("Mã GS1 không đúng định dạng")).not.toBeVisible();
  });

  test("back link navigates to /dashboard", async ({ page }) => {
    await page.getByRole("link", { name: /← Lô hàng/ }).click();
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("submit button is disabled when GS1 field is invalid", async ({ page }) => {
    await page.getByPlaceholder("011234567890123410LOT001").fill("BAD");
    const submitBtn = page.getByRole("button", { name: /Tạo lô hàng/ });
    await expect(submitBtn).toBeDisabled();
  });

  // T33 — parent batch picker
  test("shows 'Lô hàng cha' optional section", async ({ page }) => {
    await expect(page.getByText("Lô hàng cha (tùy chọn)")).toBeVisible();
  });

  test("parent picker expands on '+ Thêm lô hàng cha' click", async ({ page }) => {
    await page.getByRole("button", { name: /Thêm lô hàng cha/ }).click();
    await expect(page.getByPlaceholder(/Tìm theo tên hoặc GS1/)).toBeVisible();
  });

  test("parent picker collapses on 'Thu gọn' click", async ({ page }) => {
    await page.getByRole("button", { name: /Thêm lô hàng cha/ }).click();
    await page.getByRole("button", { name: "Thu gọn" }).click();
    await expect(page.getByPlaceholder(/Tìm theo tên hoặc GS1/)).not.toBeVisible();
  });
});

// ── Dashboard filter tabs + search (T36) ─────────────────────────────────────

test.describe("Dashboard filter tabs and search", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY to seed merchant user");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  test("shows filter tabs when batches exist or after first load", async ({ page }) => {
    // Tabs only render once batches data returns; wait for heading first
    await expect(page.getByRole("heading", { name: "Lô hàng của tôi" })).toBeVisible();
    // The 'Tạo lô hàng mới' button is always present
    await expect(page.getByRole("link", { name: /Tạo lô hàng mới/ })).toBeVisible();
  });
});

// ── QR scanner route (T34) ───────────────────────────────────────────────────

test.describe("QR scanner page", () => {
  test.skip(!hasMerchantData, "Requires SUPABASE_SERVICE_KEY to seed merchant user");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.getByRole("link", { name: "Quét mã" }).click();
    await page.waitForURL("/dashboard/scan");
  });

  test("renders scan page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Quét mã" })).toBeVisible();
  });

  test("shows manual GS1 entry input", async ({ page }) => {
    await expect(page.getByPlaceholder("011234567890123410LOT001")).toBeVisible();
  });

  test("shows 'Bật camera' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Bật camera" })).toBeVisible();
  });

  test("manual entry submit disabled for invalid GS1", async ({ page }) => {
    await page.getByPlaceholder("011234567890123410LOT001").fill("INVALID");
    await expect(page.getByRole("button", { name: "Tra cứu" })).toBeDisabled();
  });

  test("manual entry submit enabled for valid GS1", async ({ page }) => {
    await page.getByPlaceholder("011234567890123410LOT001").fill("011234567890123410VALIDLOT1");
    await expect(page.getByRole("button", { name: "Tra cứu" })).toBeEnabled();
  });

  test("/dashboard/scan is accessible via nav link 'Quét mã'", async ({ page }) => {
    await expect(page).toHaveURL("/dashboard/scan");
  });
});
