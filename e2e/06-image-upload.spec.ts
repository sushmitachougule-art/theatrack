import { test, expect, loginAsEmailUser, USER_EMAIL } from "./fixtures";
import {
  createPostWithImage,
  deleteOwnPostsByMarker,
  deleteDog,
  ensureDog,
  gotoCommunity,
  testMarker,
} from "./helpers";

/**
 * Real-account image upload tests.
 * Uses the email/password user (set in .env.test) so we get a clean,
 * non-shared account where we can create and delete our own posts.
 *
 * Cleanup: each test deletes posts it created via the marker pattern.
 * If we had to create a dog for the user, it's deleted at the end of the suite.
 */
test.describe.configure({ mode: "serial" });

test.describe("Community: image upload (real user)", () => {
  const marker = testMarker("IMG");
  let createdDogName = "";

  test.beforeAll(async ({ browser }) => {
    if (!USER_EMAIL) test.skip(true, "Set E2E_USER_EMAIL in .env.test");
    const page = await browser.newPage();
    try {
      await loginAsEmailUser(page);
      createdDogName = await ensureDog(page, marker);
    } finally {
      await page.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!createdDogName) return;
    const page = await browser.newPage();
    try {
      await loginAsEmailUser(page);
      await deleteOwnPostsByMarker(page, marker).catch(() => {});
      await deleteDog(page, createdDogName).catch(() => {});
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!USER_EMAIL) test.skip(true, "Set E2E_USER_EMAIL in .env.test");
    await loginAsEmailUser(page);
  });

  test.afterEach(async ({ page }) => {
    await deleteOwnPostsByMarker(page, marker).catch(() => {});
  });

  test("user can create a post with an uploaded image", async ({ page }) => {
    const caption = `${marker} A happy dog!`;
    await createPostWithImage(page, caption);

    const post = page
      .locator("article.post-card", { hasText: caption })
      .first();
    await expect(post).toBeVisible();

    const img = post.locator(".post-card__image img").first();
    await expect(img).toBeVisible({ timeout: 20_000 });
    // Image must actually load (naturalWidth > 0)
    await expect
      .poll(async () => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
  });

  test("uploaded image renders with object-fit: contain (no crop)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const caption = `${marker} portrait test`;
    await createPostWithImage(page, caption);

    const post = page
      .locator("article.post-card", { hasText: caption })
      .first();
    const img = post.locator(".post-card__image img").first();
    await expect(img).toBeVisible();
    const fit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    expect(fit).toBe("contain");
  });

  test("post can be deleted by its author", async ({ page }) => {
    const caption = `${marker} deletable post`;
    await createPostWithImage(page, caption);

    await gotoCommunity(page);
    const post = page
      .locator("article.post-card", { hasText: caption })
      .first();
    await expect(post).toBeVisible();

    page.once("dialog", (d) => d.accept().catch(() => {}));
    await post.locator("button.post-card__action--danger").first().click();

    await expect(post).toBeHidden({ timeout: 10_000 });
  });
});
