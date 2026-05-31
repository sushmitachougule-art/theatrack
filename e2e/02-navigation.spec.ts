import { test, expect, loginAsDemo } from "./fixtures";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  const routes = [
    { path: "/dashboard", marker: /dashboard|today|welcome/i },
    { path: "/dogs", marker: /dog|pet/i },
    { path: "/activity", marker: /walk|journal|playdate|community/i },
    { path: "/expenses", marker: /expense|spend|cost/i },
    { path: "/reminders", marker: /reminder|vaccin/i },
    { path: "/training", marker: /training|module/i },
    { path: "/messages", marker: /message|chat/i },
    { path: "/settings", marker: /setting|profile|theme/i },
  ];

  for (const { path, marker } of routes) {
    test(`route ${path} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      await page.goto(path);
      // Page should render some content matching the marker
      await expect(page.locator("body")).toContainText(marker, {
        timeout: 15_000,
      });
      expect(errors).toEqual([]);
    });
  }

  test("bottom nav is reachable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // The bottom nav is the mobile-only <nav> with .md\:hidden — match its
    // Dogs link specifically (sidebar's link is hidden on mobile).
    const dogsLink = page.locator("nav.md\\:hidden a[href='/dogs']").first();
    await expect(dogsLink).toBeVisible({ timeout: 10_000 });
  });
});
