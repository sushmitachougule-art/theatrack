import { test, expect, loginAsDemo } from "./fixtures";

/**
 * Regression tests for the community section bugs that have been fixed:
 *   1. Like button updates count (Firestore rules + updatedAt issue)
 *   2. Comment count increments when a comment is posted
 *   3. Post images are not awkwardly cropped on desktop
 *
 * These tests rely on demo-seeded community posts. If the seed creates none,
 * the like/comment tests will be skipped.
 */
test.describe("Community", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/activity");
    // Switch to Community tab if it isn't already active. The activity page
    // exposes Community as a tab (role="tab"), not a plain button.
    const communityTab = page.getByRole("tab", { name: /community/i });
    if (await communityTab.isVisible().catch(() => false)) {
      await communityTab.click();
    }
    // Wait for either a post card or the empty-state copy. Next 15 dev mode
    // never reaches networkidle because HMR keeps a long-poll connection open.
    await page
      .locator("article.post-card, .community-tab__empty")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {
        /* leave to individual tests to assert / skip */
      });
  });

  test("like button increments count and toggles state", async ({ page }) => {
    // Scope to post-card; the Journal tab's dog-pill also uses aria-pressed
    const firstLike = page
      .locator("article.post-card button[aria-pressed]")
      .first();
    if (!(await firstLike.isVisible().catch(() => false))) {
      test.skip(true, "No community posts in demo seed");
    }

    const pressedBefore = await firstLike.getAttribute("aria-pressed");
    const countBefore = parseInt(
      (await firstLike.innerText()).trim().split(/\s+/).pop() || "0",
      10,
    );

    await firstLike.click();

    // Optimistic update should flip immediately
    await expect(firstLike).toHaveAttribute(
      "aria-pressed",
      pressedBefore === "true" ? "false" : "true",
      { timeout: 3_000 },
    );

    // Count should change by exactly 1 once server syncs
    await expect
      .poll(
        async () => {
          const txt = await firstLike.innerText();
          return parseInt(txt.trim().split(/\s+/).pop() || "0", 10);
        },
        { timeout: 10_000 },
      )
      .toBe(pressedBefore === "true" ? countBefore - 1 : countBefore + 1);
  });

  test("comment count increments after posting a comment", async ({ page }) => {
    const firstPost = page.locator("article.post-card").first();
    if (!(await firstPost.isVisible().catch(() => false))) {
      test.skip(true, "No community posts in demo seed");
    }

    const commentButton = firstPost
      .locator("button[aria-expanded], button:has(svg.lucide-message-circle)")
      .first();
    const countBefore = parseInt(
      (await commentButton.innerText()).trim().split(/\s+/).pop() || "0",
      10,
    );

    await commentButton.click();

    const input = page.getByPlaceholder(/add a comment/i).first();
    await input.fill(`E2E test ${Date.now()}`);
    await input.press("Enter").catch(async () => {
      // Fallback: click the send button
      await page.locator(".comments-section__send").first().click();
    });

    // Comment count should bump by 1
    await expect
      .poll(
        async () => {
          const txt = await commentButton.innerText();
          return parseInt(txt.trim().split(/\s+/).pop() || "0", 10);
        },
        { timeout: 10_000 },
      )
      .toBe(countBefore + 1);
  });

  test("post images are contained, not cropped, on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const img = page.locator(".post-card__image img").first();
    if (!(await img.isVisible().catch(() => false))) {
      test.skip(true, "No post images to verify");
    }
    const objectFit = await img.evaluate(
      (el) => getComputedStyle(el).objectFit,
    );
    expect(objectFit).toBe("contain");
  });
});
