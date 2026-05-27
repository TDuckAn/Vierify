import { expect, test } from "@playwright/test";

test.describe("Marketing landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── Page load ────────────────────────────────────────────────────────────

  test("loads with the hero headline visible", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Key brand word in hero
    await expect(page.getByText("minh bạch").first()).toBeVisible();
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle(/Vierify/);
  });

  // ── Navigation ───────────────────────────────────────────────────────────

  test("nav bar shows primary CTA", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Bắt đầu miễn phí/ }).first()
    ).toBeVisible();
  });

  test("nav bar shows section links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Cách hoạt động" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tính năng" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bảng giá" })).toBeVisible();
  });

  // ── Pricing section ──────────────────────────────────────────────────────

  test("pricing section shows all 5 tiers", async ({ page }) => {
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    for (const tierName of ["Free", "Basic", "Advanced", "Professional", "Enterprise"]) {
      await expect(page.getByText(tierName).first()).toBeVisible();
    }
  });

  test("Professional tier has 'Lựa chọn tốt nhất' badge", async ({ page }) => {
    await page.locator("#pricing").scrollIntoViewIfNeeded();
    await expect(page.getByText("Lựa chọn tốt nhất")).toBeVisible();
  });

  test("pricing shows correct prices for each tier", async ({ page }) => {
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    await expect(page.getByText("0đ").first()).toBeVisible();
    await expect(page.getByText("99.000đ").first()).toBeVisible();
    await expect(page.getByText("499.000đ").first()).toBeVisible();
    await expect(page.getByText("4.999.999đ").first()).toBeVisible();
    await expect(page.getByText("Liên hệ").first()).toBeVisible();
  });

  test("feature comparison table is rendered", async ({ page }) => {
    await page.locator("#pricing").scrollIntoViewIfNeeded();
    // A feature that spans all tiers
    await expect(page.getByText("Xác thực blockchain (Polygon)")).toBeVisible();
    // An enterprise-only feature
    await expect(page.getByText("White-label trang truy xuất")).toBeVisible();
  });

  // ── Dark mode toggle ─────────────────────────────────────────────────────

  test("dark mode toggle switches html class and persists to localStorage", async ({
    page
  }) => {
    // Force light mode as baseline so the test is deterministic
    await page.evaluate(() => {
      localStorage.setItem("vierify-theme", "light");
      document.documentElement.classList.remove("dark");
    });

    const toggle = page.getByRole("button", { name: /chế độ/ });
    await expect(toggle).toBeVisible();

    // Click once → dark mode
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const stored = await page.evaluate(() => localStorage.getItem("vierify-theme"));
    expect(stored).toBe("dark");

    // Click again → back to light
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    const storedBack = await page.evaluate(() =>
      localStorage.getItem("vierify-theme")
    );
    expect(storedBack).toBe("light");
  });

  test("dark mode preference survives page reload", async ({ page }) => {
    // Set dark mode via localStorage then reload
    await page.evaluate(() => {
      localStorage.setItem("vierify-theme", "dark");
    });
    await page.reload();
    // The inline script in layout.tsx should apply the class before paint
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  // ── Content sections ─────────────────────────────────────────────────────

  test("'How it works' section has 3 steps", async ({ page }) => {
    await page.locator("#how-it-works").scrollIntoViewIfNeeded();
    await expect(page.getByText("Quét và tạo lô hàng")).toBeVisible();
    await expect(page.getByText("Kết nối chuỗi cung ứng")).toBeVisible();
    await expect(page.getByText("Người tiêu dùng xác minh")).toBeVisible();
  });

  test("features section is present", async ({ page }) => {
    await page.locator("#features").scrollIntoViewIfNeeded();
    await expect(page.getByText("Quét mã GS1 Barcode")).toBeVisible();
    await expect(page.getByText("Bằng chứng blockchain")).toBeVisible();
    await expect(page.getByText("Trang truy xuất B2C")).toBeVisible();
  });

  // ── Footer ───────────────────────────────────────────────────────────────

  test("footer shows copyright and technology credits", async ({ page }) => {
    const footer = page.locator("footer").last();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByText(/© 2026 Vierify/)).toBeVisible();
    await expect(footer.getByText("Polygon")).toBeVisible();
    await expect(footer.getByText("Supabase")).toBeVisible();
  });

  test("footer shows legal and product links", async ({ page }) => {
    const footer = page.locator("footer").last();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByText("Chính sách bảo mật")).toBeVisible();
    await expect(footer.getByText("Điều khoản sử dụng")).toBeVisible();
  });

  // ── Mobile layout ────────────────────────────────────────────────────────

  test("pricing cards are horizontally scrollable on mobile", async ({
    page,
    browserName
  }) => {
    // Only meaningful on the mobile-chrome project; skip on desktop
    if (browserName !== "chromium") return;

    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 1024) return;

    await page.locator("#pricing").scrollIntoViewIfNeeded();
    // Snap scroll container should exist (overflow-x-auto)
    const scrollContainer = page
      .locator("#pricing .overflow-x-auto")
      .first();
    await expect(scrollContainer).toBeVisible();
  });
});
