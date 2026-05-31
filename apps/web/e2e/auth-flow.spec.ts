import { expect, test } from "@playwright/test";

// ── /register ────────────────────────────────────────────────────────────────

test.describe("/register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders Vierify logo", async ({ page }) => {
    await expect(page.getByText("Vierify").first()).toBeVisible();
  });

  test("renders heading and free-trial copy", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tạo tài khoản" })).toBeVisible();
    await expect(page.getByText(/Dùng thử miễn phí/)).toBeVisible();
  });

  test("has email, password, and confirm-password fields", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const pwFields = page.locator('input[type="password"]');
    await expect(pwFields.first()).toBeVisible();
    await expect(pwFields.nth(1)).toBeVisible();
  });

  test("submit button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Tạo tài khoản" })).toBeVisible();
  });

  test("password-strength meter appears after typing", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("abcdefgh");
    await expect(page.getByText("Yếu")).toBeVisible();
  });

  test("strength meter shows Trung bình at 10 chars", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("abcdefghij");
    await expect(page.getByText("Trung bình")).toBeVisible();
  });

  test("strength meter shows Mạnh at 12+ chars with uppercase and number", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("Abcdefghij12");
    await expect(page.getByText("Mạnh")).toBeVisible();
  });

  test("shows password-mismatch error when confirm differs", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("password123");
    await page.locator('input[type="password"]').nth(1).fill("different");
    await expect(page.getByText("Mật khẩu không khớp")).toBeVisible();
  });

  test("Terms and Privacy policy links are present", async ({ page }) => {
    await expect(page.getByText("Điều khoản sử dụng")).toBeVisible();
    await expect(page.getByText("Chính sách bảo mật")).toBeVisible();
  });

  test("'Đã có tài khoản?' link points to /login", async ({ page }) => {
    const link = page.getByRole("link", { name: "Đăng nhập" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/login");
  });

  test("logo links back to /", async ({ page }) => {
    const logoLink = page.getByRole("link", { name: /Vierify/ }).first();
    await expect(logoLink).toHaveAttribute("href", "/");
  });
});

// ── /forgot-password ─────────────────────────────────────────────────────────

test.describe("/forgot-password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders Vierify logo", async ({ page }) => {
    await expect(page.getByText("Vierify").first()).toBeVisible();
  });

  test("renders heading and description", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Đặt lại mật khẩu" })).toBeVisible();
    await expect(page.getByText(/Nhập email để nhận link/)).toBeVisible();
  });

  test("has email input and submit button", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi link đặt lại" })).toBeVisible();
  });

  test("'← Quay lại đăng nhập' link points to /login", async ({ page }) => {
    const link = page.getByRole("link", { name: /Quay lại đăng nhập/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/login");
  });
});

// ── /reset-password ───────────────────────────────────────────────────────────

test.describe("/reset-password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password");
  });

  test("renders Vierify logo", async ({ page }) => {
    await expect(page.getByText("Vierify").first()).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Mật khẩu mới" })).toBeVisible();
  });

  test("has new-password and confirm-password fields", async ({ page }) => {
    const pwFields = page.locator('input[type="password"]');
    await expect(pwFields.first()).toBeVisible();
    await expect(pwFields.nth(1)).toBeVisible();
  });

  test("has submit button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Cập nhật mật khẩu" })).toBeVisible();
  });

  test("shows password-strength meter after typing", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("abcdefgh");
    await expect(page.getByText("Yếu")).toBeVisible();
  });

  test("shows mismatch error when submitting non-matching passwords", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("password123");
    await page.locator('input[type="password"]').nth(1).fill("different99");
    await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
  });

  test("shows short-password error when submitting < 8 chars", async ({ page }) => {
    await page.locator('input[type="password"]').first().fill("short");
    await page.locator('input[type="password"]').nth(1).fill("short");
    await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    await expect(page.getByText(/ít nhất 8 ký tự/)).toBeVisible();
  });
});

// ── /verify-email ─────────────────────────────────────────────────────────────

test.describe("/verify-email page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/verify-email");
  });

  test("renders Vierify logo", async ({ page }) => {
    await expect(page.getByText("Vierify").first()).toBeVisible();
  });

  test("shows success state (no error param — valid link click)", async ({ page }) => {
    // Without an error param Supabase treats the landing as a successful click
    // and the page renders the success state (email confirmed)
    await expect(page.getByText(/Email đã được xác nhận|Kiểm tra/)).toBeVisible();
  });

  test("shows error state when ?error= param is present", async ({ page }) => {
    await page.goto("/verify-email?error=access_denied&error_code=otp_expired");
    await expect(page.getByText(/Liên kết đã hết hạn/)).toBeVisible();
    const link = page.getByRole("link", { name: "Đăng ký lại" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/register");
  });
});

// ── Login page: register CTA (new Sprint 5 link) ─────────────────────────────

test.describe("Login page — Sprint 5 additions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("'Quên mật khẩu?' link points to /forgot-password", async ({ page }) => {
    const link = page.getByRole("link", { name: "Quên mật khẩu?" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/forgot-password");
  });

  test("'Bắt đầu miễn phí' CTA links to /register", async ({ page }) => {
    const link = page.getByRole("link", { name: /Bắt đầu miễn phí/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/register");
  });
});
