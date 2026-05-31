import { test, expect, loginAsDemo, loginAsEmailUser } from "./fixtures";

test.describe("Authentication", () => {
  test("demo login navigates to dashboard", async ({ page }) => {
    await loginAsDemo(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("email/password login navigates to dashboard", async ({ page }) => {
    await loginAsEmailUser(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login page renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /try demo mode/i }),
    ).toBeVisible();
    // Allow firebase/network warnings; fail only on real script errors
    const real = errors.filter(
      (e) => !/firebase|fcm|messaging|favicon/i.test(e),
    );
    expect(real).toEqual([]);
  });

  test("unauthenticated users are redirected from /dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });
});
