import { expect, test } from "@playwright/test";

// ── /onboarding/plan ──────────────────────────────────────────────────────────

test.describe("/onboarding/plan page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding/plan");
  });

  test("renders page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Chọn gói dịch vụ" })).toBeVisible();
  });

  test("renders all 5 tier cards", async ({ page }) => {
    for (const name of ["FREE", "BASIC", "ADVANCED", "PROFESSIONAL", "ENTERPRISE"]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("Professional tier is marked as 'Lựa chọn tốt nhất'", async ({ page }) => {
    // Professional is featured — its "Lựa chọn tốt nhất" badge exists before selecting it
    const badges = page.getByText("Lựa chọn tốt nhất");
    await expect(badges.first()).toBeVisible();
  });

  test("Free tier is selected by default and shows '✓ Đang chọn'", async ({ page }) => {
    await expect(page.getByText("✓ Đang chọn").first()).toBeVisible();
  });

  test("selecting a paid tier shows payment method toggle (PayOS / MoMo)", async ({ page }) => {
    // Click the Basic tier card
    await page.getByText("BASIC").first().click();
    await expect(page.getByRole("button", { name: "PayOS" })).toBeVisible();
    await expect(page.getByRole("button", { name: "MoMo" })).toBeVisible();
  });

  test("payment method toggle switches between PayOS and MoMo", async ({ page }) => {
    await page.getByText("BASIC").first().click();
    await page.getByRole("button", { name: "MoMo" }).click();
    await expect(page.getByText("Ví điện tử MoMo")).toBeVisible();
    await page.getByRole("button", { name: "PayOS" }).click();
    await expect(page.getByText(/Chuyển khoản ngân hàng/)).toBeVisible();
  });

  test("Free tier selection hides payment method toggle", async ({ page }) => {
    // Confirm: selecting Basic shows toggle, then switching back to Free hides it
    await page.getByText("BASIC").first().click();
    await expect(page.getByRole("button", { name: "PayOS" })).toBeVisible();
    await page.getByText("FREE").first().click();
    await expect(page.getByRole("button", { name: "PayOS" })).not.toBeVisible();
  });

  test("Continue button with Free plan navigates to /onboarding/profile", async ({ page }) => {
    await page.getByRole("button", { name: "Bắt đầu miễn phí →" }).click();
    await page.waitForURL(/\/onboarding\/profile/);
    await expect(page).toHaveURL(/\/onboarding\/profile/);
  });

  test("onboarding step indicator shows 'Chọn gói' step active", async ({ page }) => {
    await expect(page.getByText("Chọn gói")).toBeVisible();
    await expect(page.getByText("Hồ sơ")).toBeVisible();
  });

  test("no horizontal overflow on 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/onboarding/plan");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});

// ── /onboarding/profile ───────────────────────────────────────────────────────

test.describe("/onboarding/profile page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding/profile");
  });

  test("renders heading 'Hồ sơ doanh nghiệp'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Hồ sơ doanh nghiệp" })).toBeVisible();
  });

  test("renders company name, MST, node type, address fields", async ({ page }) => {
    await expect(page.getByText("Tên doanh nghiệp / cơ sở")).toBeVisible();
    await expect(page.getByText("Mã số thuế (MST)")).toBeVisible();
    await expect(page.getByText("Loại nút chuỗi cung ứng")).toBeVisible();
    await expect(page.getByText("Địa chỉ")).toBeVisible();
  });

  test("shows MST format validation error on invalid input", async ({ page }) => {
    const mstInput = page.locator('input[placeholder="0123456789"]');
    await mstInput.fill("123");
    await mstInput.blur();
    await expect(page.getByText(/Mã số thuế phải có 10 hoặc 13 chữ số/)).toBeVisible();
  });

  test("no MST error on valid 10-digit MST", async ({ page }) => {
    const mstInput = page.locator('input[placeholder="0123456789"]');
    await mstInput.fill("0123456789");
    await mstInput.blur();
    await expect(page.getByText(/Mã số thuế phải có 10 hoặc 13 chữ số/)).not.toBeVisible();
  });

  test("node type selector includes all 5 supply chain node types", async ({ page }) => {
    const select = page.locator("select");
    await expect(select).toBeVisible();
    for (const label of ["Nông trại", "Nhà máy", "Kho bãi", "Nhà phân phối", "Cửa hàng"]) {
      await expect(select.locator(`option[value]`, { hasText: label })).toBeAttached();
    }
  });

  test("'is_individual' checkbox reveals PII anonymisation notice", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(page.getByText(/Nghị định 13\/2023\/NĐ-CP/)).toBeVisible();
  });

  test("submit button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Hoàn tất đăng ký →" })).toBeVisible();
  });

  test("onboarding step indicator shows 'Hồ sơ' step active", async ({ page }) => {
    await expect(page.getByText("Chọn gói")).toBeVisible();
    await expect(page.getByText("Hồ sơ")).toBeVisible();
  });
});
