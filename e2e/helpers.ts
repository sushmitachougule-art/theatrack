import { Page, expect } from "@playwright/test";
import * as path from "path";

/**
 * Path to a real image file we can use for uploads in tests.
 * User-provided dog photo lives at e2e/dog.jpeg.
 */
export const TEST_IMAGE_PATH = path.resolve(__dirname, "./dog.jpeg");

/**
 * Unique marker for content created during a test run.
 * Use it in captions/messages/dog names so cleanup can find and delete only test data.
 */
export function testMarker(label: string): string {
  return `[E2E-${label}-${Date.now()}]`;
}

/**
 * Open /activity and switch to the Community tab.
 * The tab is a role="tab", not role="button".
 */
export async function gotoCommunity(page: Page) {
  await page.goto("/activity", { waitUntil: "domcontentloaded" });
  // Wait for auth profile to load — sidebar shows "User" placeholder until then.
  // We treat profile as loaded once that placeholder is gone (or we hit a soft timeout).
  await page
    .waitForFunction(
      () => {
        const paras = Array.from(
          document.querySelectorAll("aside p, header p"),
        );
        // Profile loaded once we see any paragraph that isn't the literal "User" placeholder
        return paras.some((p) => {
          const t = p.textContent?.trim() ?? "";
          return t.length > 0 && t !== "User" && t !== "Menu";
        });
      },
      { timeout: 15_000 },
    )
    .catch(() => {});

  const tab = page.getByRole("tab", { name: /community/i });
  await expect(tab).toBeVisible({ timeout: 15_000 });
  await tab.click();
  await expect(tab)
    .toHaveAttribute("aria-selected", "true", { timeout: 10_000 })
    .catch(() => {});
}

/**
 * Ensure the logged-in user has at least one dog. If not, create a minimal one.
 * Returns the dog's display name so callers can clean it up later.
 * Returns "" if a dog already existed (in which case we leave it alone).
 */
export async function ensureDog(page: Page, marker: string): Promise<string> {
  await page.goto("/dogs", { waitUntil: "domcontentloaded" });
  // Wait for either a dog card or the "Add Dog" link to appear (whichever renders first)
  await page
    .locator('a[href="/dogs/new"], a[href^="/dogs/"]:not([href="/dogs/new"])')
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });

  // If a dog card already exists, return sentinel
  const existingDog = page
    .locator('a[href^="/dogs/"]:not([href="/dogs/new"])')
    .first();
  if (await existingDog.isVisible().catch(() => false)) {
    return "";
  }

  // Open the new-dog form
  const addLink = page.locator('a[href="/dogs/new"]').first();
  if (await addLink.isVisible().catch(() => false)) {
    await addLink.click();
  } else {
    await page.goto("/dogs/new");
  }
  await page.waitForURL(/\/dogs\/new/, { timeout: 10_000 });

  const dogName = `E2E-Dog-${marker.replace(/\W+/g, "")}`.slice(0, 30);
  await page.getByPlaceholder(/e\.g\. max/i).fill(dogName);

  // Breed (required <select>) — pick first non-empty option
  await page.locator("select.form-select").first().selectOption({ index: 1 });

  // Date of Birth (required)
  await page.locator('input[type="date"]').first().fill("2022-01-15");

  // Submit
  await page.getByRole("button", { name: /add dog/i }).click();

  // Redirects to /dogs/<id>
  await page.waitForURL(/\/dogs\/[^/]+$/, { timeout: 20_000 });
  return dogName;
}

/**
 * Delete a dog whose name matches `dogName`. Idempotent.
 * No-op if dogName is empty (we didn't create it).
 */
export async function deleteDog(page: Page, dogName: string): Promise<void> {
  if (!dogName) return;
  await page.goto("/dogs", { waitUntil: "domcontentloaded" });

  const dogLink = page
    .locator('a[href^="/dogs/"]', { hasText: dogName })
    .first();
  if (!(await dogLink.isVisible({ timeout: 10_000 }).catch(() => false)))
    return;
  await dogLink.click();
  await page.waitForURL(/\/dogs\/[^/]+$/, { timeout: 10_000 }).catch(() => {});

  page.once("dialog", (d) => d.accept().catch(() => {}));
  const deleteBtn = page
    .getByRole("button", { name: /delete|remove/i })
    .first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await page.waitForURL(/\/dogs(\?|$)/, { timeout: 10_000 }).catch(() => {});
  }
}

/**
 * Create a community post with the given caption + the shared test image.
 * Requires: logged in + has at least one dog.
 */
export async function createPostWithImage(
  page: Page,
  caption: string,
): Promise<void> {
  await gotoCommunity(page);

  // Diagnostics
  page.on("pageerror", (err) => console.warn("[page error]", err.message));
  page.on("console", (msg) => {
    console.warn(`[browser ${msg.type()}]`, msg.text());
  });
  page.on("requestfailed", (req) =>
    console.warn("[request failed]", req.url(), req.failure()?.errorText),
  );

  // Make sure the "New Post" button is present (requires dogs loaded + profile loaded)
  const newPostBtn = page.getByRole("button", { name: /^new post$/i });
  await expect(newPostBtn).toBeVisible({ timeout: 15_000 });
  await newPostBtn.click();

  const textarea = page.getByPlaceholder(/what's your pup up to/i);
  await expect(textarea).toBeVisible({ timeout: 10_000 });

  const fileInput = page.locator('input[type="file"][accept*="image"]').first();
  await fileInput.setInputFiles(TEST_IMAGE_PATH);

  await expect(page.locator(".new-post-form__preview img")).toBeVisible({
    timeout: 10_000,
  });

  await textarea.fill(caption);

  const shareBtn = page.getByRole("button", { name: /share post/i });
  await expect(shareBtn).toBeEnabled({ timeout: 10_000 });

  // Snapshot useful state right before click for debug
  const preState = await page.evaluate(() => ({
    sidebarText: document.querySelector("aside")?.textContent?.slice(0, 200),
  }));
  console.warn("[pre-share]", JSON.stringify(preState));

  // Capture the createCommunityPost flow: wait for the firestore add request
  const addDocReq = page
    .waitForResponse(
      (r) =>
        r.url().includes("firestore.googleapis.com") &&
        r.request().method() === "POST",
      { timeout: 60_000 },
    )
    .catch(() => null);

  await shareBtn.click();

  // Wait for either success toast or error toast (react-hot-toast renders inside [role=status])
  const successToast = page.locator('text="Posted! 📷"');
  const errorToast = page.locator("text=/Failed to post/i");
  await Promise.race([
    successToast.waitFor({ state: "visible", timeout: 60_000 }),
    errorToast.waitFor({ state: "visible", timeout: 60_000 }).then(async () => {
      throw new Error("createPost surfaced a 'Failed to post' toast");
    }),
  ]);

  await addDocReq;

  await expect(textarea).toBeHidden({ timeout: 10_000 });

  await expect(
    page.locator("article.post-card", { hasText: caption }),
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * Delete every post on the current user's feed whose caption contains `marker`.
 * Uses the trash button visible only to authors (own posts). Idempotent.
 */
export async function deleteOwnPostsByMarker(
  page: Page,
  marker: string,
): Promise<number> {
  await gotoCommunity(page);
  let deleted = 0;
  for (let i = 0; i < 20; i++) {
    const post = page.locator("article.post-card", { hasText: marker }).first();
    if (!(await post.isVisible().catch(() => false))) break;

    page.once("dialog", (d) => d.accept().catch(() => {}));

    const deleteBtn = post.locator("button.post-card__action--danger").first();
    if (!(await deleteBtn.isVisible().catch(() => false))) break;
    await deleteBtn.click();
    await expect(post)
      .toBeHidden({ timeout: 10_000 })
      .catch(() => {});
    deleted++;
  }
  return deleted;
}
