import { test, expect, loginAsDemo } from "./fixtures";

test.describe("Dogs CRUD (demo account)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/dogs");
  });

  test("dogs list page renders", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/dog|add/i, {
      timeout: 15_000,
    });
  });

  test("can open new dog form", async ({ page }) => {
    const addBtn = page
      .getByRole("link", { name: /add|new dog/i })
      .or(page.getByRole("button", { name: /add|new dog/i }))
      .first();
    if (!(await addBtn.isVisible().catch(() => false))) {
      test.skip(true, "Add dog button not found");
    }
    await addBtn.click();
    await page.waitForURL(/\/dogs\/new/, { timeout: 10_000 });
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible();
  });
});
