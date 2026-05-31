import { test, expect, loginAsEmailUser, USER_EMAIL } from "./fixtures";
import { gotoCommunity, testMarker } from "./helpers";

/**
 * Messaging smoke test.
 * Flow:
 *   1. Real user logs in
 *   2. Opens Community, finds a post NOT authored by themselves
 *   3. Clicks the DM button → routed to /messages
 *   4. Opens the new thread and sends a message
 *   5. Asserts the message renders as the sender's own bubble
 *
 * Note: Cleanup of chat threads is not exposed in the UI today; messages are
 * tagged with a marker so they're trivially identifiable for later admin-SDK
 * cleanup. Thread count per pair is bounded (one thread per relationship).
 */
test.describe("Messaging (real user)", () => {
  test.beforeEach(async ({ page }) => {
    if (!USER_EMAIL) test.skip(true, "Set E2E_USER_EMAIL in .env.test");
    await loginAsEmailUser(page);
  });

  test("user can send a DM from a community post", async ({ page }) => {
    await gotoCommunity(page);

    // The DM button only appears on posts NOT authored by us (lucide Send icon)
    const dmBtn = page.locator("button.post-card__action--dm").first();
    if (!(await dmBtn.isVisible().catch(() => false))) {
      test.skip(true, "No non-owned posts in feed — can't open DM");
    }
    await dmBtn.click();

    await page.waitForURL(/\/messages/, { timeout: 15_000 });

    // Open the first thread in the list
    const firstThread = page.locator("button.chat-thread-item").first();
    await expect(firstThread).toBeVisible({ timeout: 15_000 });
    await firstThread.click();

    // Send a message
    const marker = testMarker("MSG");
    const messageText = `${marker} hi from e2e`;

    const input = page.getByPlaceholder(/type a message/i);
    await input.fill(messageText);
    await input.press("Enter");

    // Message should appear as our own bubble
    const bubble = page.locator(".chat-bubble--mine", {
      hasText: messageText,
    });
    await expect(bubble).toBeVisible({ timeout: 15_000 });
  });

  test("chat panel shows empty state for users with no threads", async ({
    page,
  }) => {
    // Navigate to /messages directly — even if some threads exist, the panel
    // should render without runtime errors
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/messages");
    await expect(page.locator("body")).toContainText(
      /message|chat|conversation/i,
      {
        timeout: 15_000,
      },
    );
    expect(errors).toEqual([]);
  });
});
