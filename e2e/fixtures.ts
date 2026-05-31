import { test as base, expect, Page } from "@playwright/test";

/**
 * Shared test fixtures and helpers.
 * Two account types:
 *   - "demo": shared demo account (built into the app, gets auto-seeded data)
 *   - "user": real email/password account from .env.test
 */

export const test = base.extend({});
export { expect };

export const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL || "demo@theatrack.app";
export const DEMO_PASSWORD =
  process.env.E2E_DEMO_PASSWORD || "DemoUser@TheaTrack2024!";
export const USER_EMAIL = process.env.E2E_USER_EMAIL || "";
export const USER_PASSWORD = process.env.E2E_USER_PASSWORD || "";

export async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /try demo mode/i }).click();
  await expectDashboardLoaded(page);
}

export async function loginAsEmailUser(
  page: Page,
  email = USER_EMAIL,
  password = USER_PASSWORD,
) {
  if (!email || !password) {
    test.skip(true, "E2E_USER_EMAIL/PASSWORD not set in .env.test");
  }
  await page.goto("/login");
  await page.getByPlaceholder(/you@example/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in to dashboard/i }).click();
  await expectDashboardLoaded(page);
}

export async function expectDashboardLoaded(page: Page) {
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  // Wait for app shell to render
  await expect(page.locator("body")).toBeVisible();
}

export async function logout(page: Page) {
  await page.goto("/settings");
  const signOut = page.getByRole("button", { name: /sign out|logout/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  }
}
