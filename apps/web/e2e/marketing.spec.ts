import { expect, test } from "@playwright/test";

test.describe("Marketing landing page", () => {
  test.beforeEach(async ({ page }) => {
    // ScrollReveal starts elements at opacity:0 and only flips to opacity:1 once
    // IntersectionObserver fires — unreliable in headless CI, and Playwright's
    // toBeVisible treats opacity:0 as hidden. Pre-mark every .reveal node as
    // .visible (the same class IntersectionObserver would add) so the existing
    // .reveal.visible CSS makes them visible immediately.
    await page.addInitScript(() => {
      const apply = (root: Node) => {
        if (root.nodeType !== 1) return;
        const el = root as Element;
        if (el.classList.contains("reveal")) el.classList.add("visible");
        el.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible"));
      };
      const start = () => {
        apply(document.documentElement);
        new MutationObserver((muts) => {
          for (const m of muts) m.addedNodes.forEach(apply);
        }).observe(document.documentElement, { childList: true, subtree: true });
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
      } else {
        start();
      }
    });
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
    // Nav links are hidden behind a hamburger menu on mobile viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) return;
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Cách hoạt động" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Tính năng" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Bảng giá" })).toBeVisible();
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
    await expect(page.getByText("Lựa chọn tốt nhất").first()).toBeVisible();
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
    const features = page.locator("#features");
    await features.scrollIntoViewIfNeeded();
    await expect(features.getByText("Quét mã GS1 Barcode")).toBeVisible();
    await expect(features.getByText("Bằng chứng blockchain")).toBeVisible();
    await expect(features.getByText("Trang truy xuất B2C")).toBeVisible();
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
