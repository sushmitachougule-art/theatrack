# PawShield — Bug & Feature Tracker

Single source of truth for known bugs, fixed bugs, and feature status.
Update this file whenever a bug is filed, fixed, or a feature ships.

---

## 🔴 Open Bugs

_None right now — file new bugs here using the template below._

### Bug template

```
### [BUG-ID] Short title
- **Severity:** P0 / P1 / P2 / P3
- **Reported:** YYYY-MM-DD by <who>
- **Account:** demo / email-user / both
- **Viewport:** mobile / desktop / both
- **Steps:**
  1. ...
  2. ...
- **Expected:** ...
- **Actual:** ...
- **Files suspected:** path/to/file.tsx
- **Workaround:** ...
```

---

## ✅ Fixed Bugs

### [BUG-001] Like button does not update on community posts

- **Fixed:** 2026-05-30
- **Cause:** `togglePostLike` sent `updatedAt` in the Firestore update, but the
  security rule for non-authors only allows `['likeCount', 'likedBy', 'commentCount']`.
- **Fix:** [src/lib/repositories/index.ts](src/lib/repositories/index.ts) — removed `updatedAt`.
  Added optimistic UI in [src/components/activity/community/PostCard.tsx](src/components/activity/community/PostCard.tsx).
- **Regression test:** [e2e/03-community.spec.ts](e2e/03-community.spec.ts) → "like button increments count and toggles state"

### [BUG-002] Admin tabs overflow on mobile

- **Fixed:** 2026-05-30
- **Cause:** 6 fixed-padding tabs overflowed mobile width after adding Flags/Analytics.
- **Fix:** [src/app/admin/page.tsx](src/app/admin/page.tsx) — horizontal scroll + dynamic padding.

### [BUG-003] Comment count stays at 0 after posting a comment

- **Fixed:** 2026-05-31
- **Cause:** Same root cause as BUG-001 — `addComment` sent `updatedAt` alongside
  `commentCount`, blocked by Firestore rules.
- **Fix:** [src/lib/repositories/index.ts](src/lib/repositories/index.ts) — removed `updatedAt` from the comment-count update.
  Added optimistic increment in [src/components/activity/community/PostCard.tsx](src/components/activity/community/PostCard.tsx).
- **Regression test:** [e2e/03-community.spec.ts](e2e/03-community.spec.ts) → "comment count increments after posting a comment"

### [BUG-004] Post images cropped on desktop, fine on mobile

- **Fixed:** 2026-05-31
- **Cause:** `.post-card__image img { object-fit: cover; max-height: 400px }` cropped
  portrait photos on wider viewports. Mobile width hid the issue.
- **Fix:** [src/app/globals.css](src/app/globals.css) — switched to `object-fit: contain`, removed duplicate rule,
  added background fill so empty space matches the card.
- **Regression test:** [e2e/03-community.spec.ts](e2e/03-community.spec.ts) → "post images are contained, not cropped"

---

## 🚀 Shipped Features

| Feature               | Status | Files                                                                                                                                                |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature flag system   | ✅     | [src/hooks/useFeatureFlags.tsx](src/hooks/useFeatureFlags.tsx), [src/components/admin/FeatureFlagsTab.tsx](src/components/admin/FeatureFlagsTab.tsx) |
| Analytics (batched)   | ✅     | [src/hooks/useAnalytics.ts](src/hooks/useAnalytics.ts), [src/components/admin/AnalyticsTab.tsx](src/components/admin/AnalyticsTab.tsx)               |
| Maintenance banner    | ✅     | [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx)                                                                           |
| Optimistic like UI    | ✅     | [src/components/activity/community/PostCard.tsx](src/components/activity/community/PostCard.tsx)                                                     |
| Optimistic comment UI | ✅     | [src/components/activity/community/PostCard.tsx](src/components/activity/community/PostCard.tsx)                                                     |
| E2E test harness      | ✅     | [e2e/](e2e/), [playwright.config.ts](playwright.config.ts)                                                                                           |

---

## 🧪 How to Verify

Run before every release:

```bash
npm run validate     # typecheck + lint + format
npm run test:e2e     # full E2E suite (demo + email account)
```

See [TESTING.md](TESTING.md) for the manual QA checklist and detailed test plan.
