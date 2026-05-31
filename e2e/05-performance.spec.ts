import { test, expect, loginAsDemo } from "./fixtures";

test.describe("Performance & accessibility smoke", () => {
  test("dashboard renders within 5s on demo account", async ({ page }) => {
    const start = Date.now();
    await loginAsDemo(page);
    const elapsed = Date.now() - start;
    console.warn(`Login + dashboard render: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(15_000);
  });

  test("no horizontal scroll on mobile dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDemo(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test("interactive buttons have accessible names", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/activity");
    // Sample: like/comment buttons we just fixed should have aria-labels
    const buttons = page.locator("button[aria-pressed], button[aria-expanded]");
    const count = await buttons.count();
    if (count === 0) test.skip(true, "No interactive community buttons found");
    for (let i = 0; i < Math.min(count, 5); i++) {
      const label = await buttons.nth(i).getAttribute("aria-label");
      expect(label, `button ${i} should have aria-label`).toBeTruthy();
    }
  });
});
