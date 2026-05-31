# PawShield Testing Guide

## TL;DR

```bash
# 1. One-time setup
cp .env.test.example .env.test     # fill in test credentials
npx playwright install chromium    # already done once

# 2. Run every time
npm run validate                   # typecheck + lint + format
npm run test:e2e                   # full E2E suite
npm run test:e2e:ui                # interactive UI mode (recommended for debugging)
npm run test:e2e:report            # open last HTML report
```

The dev server starts automatically via `playwright.config.ts → webServer`.
Set `E2E_BASE_URL=https://staging.example.com` to run against a deployed env instead.

---

## Test Accounts

Two account types are used so we catch bugs that only happen for specific user roles:

| Account    | Email                | How it's created                                              | What it exercises             |
| ---------- | -------------------- | ------------------------------------------------------------- | ----------------------------- |
| Demo       | `demo@theatrack.app` | Auto-created on first "Try Demo Mode" click; auto-seeded data | Anon-style flow, seeded posts |
| Email user | from `.env.test`     | You create it once manually in your test Firebase project     | Real registration flow        |

> **Why both?** Demo gets pre-seeded community posts (so we can test like/comment).
> Email user has empty state (so we catch zero-data UI bugs).

---

## What the E2E Suite Covers

| File                                                     | Coverage                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [e2e/01-auth.spec.ts](e2e/01-auth.spec.ts)               | Demo login, email login, redirects, console-error check                            |
| [e2e/02-navigation.spec.ts](e2e/02-navigation.spec.ts)   | Every nav route loads without runtime errors; mobile nav                           |
| [e2e/03-community.spec.ts](e2e/03-community.spec.ts)     | Like toggle, comment count, image rendering (regression tests for BUG-001/003/004) |
| [e2e/04-dogs.spec.ts](e2e/04-dogs.spec.ts)               | Dog list + new-dog form opens                                                      |
| [e2e/05-performance.spec.ts](e2e/05-performance.spec.ts) | Mobile horizontal-scroll check; aria-label coverage; render budget                 |

Tests run on both `Desktop Chrome` and `iPhone 13` viewports (configured in `playwright.config.ts`).

---

## Adding a New Test

1. **Reproduce the bug manually first.** If you can't, the test won't be reliable.
2. **Add the bug to [BUGS.md](BUGS.md)** under Open Bugs.
3. **Write a failing test** in `e2e/0X-feature.spec.ts` using helpers from [e2e/fixtures.ts](e2e/fixtures.ts).
4. **Fix the bug.**
5. **Move the bug to "Fixed Bugs"** in `BUGS.md` and reference the regression test.

### Selector strategy

- Prefer **role-based** selectors: `page.getByRole("button", { name: /save/i })`
- Use **aria-label / aria-pressed / aria-expanded** for stateful UI (already added on like/comment buttons)
- Avoid CSS classes — they break on refactors
- Add `data-testid` only when no semantic option exists

---

## Manual QA Checklist (release day)

Use this whenever the E2E suite passes but you want a human sanity check before deploy.

### Auth (5 min)

- [ ] Demo login works on mobile + desktop
- [ ] Email/password login works
- [ ] Google login works (manual — not in E2E)
- [ ] Logout returns to `/login`
- [ ] Direct hit to `/dashboard` when logged out → redirects to `/login`

### Dogs (5 min)

- [ ] Create a dog with photo
- [ ] Edit a dog
- [ ] Delete a dog (confirm modal works)
- [ ] Switching active dog updates the dashboard

### Activity → Community (5 min)

- [ ] Create a post with a portrait image → image displays fully, not cropped (desktop)
- [ ] Create a post with a landscape image → same
- [ ] Like a post → heart fills, count goes up, persists on refresh
- [ ] Unlike a post → heart unfills, count goes down
- [ ] Add a comment → count badge bumps immediately, comment shows up
- [ ] Report a post (non-owner) → confirm flow
- [ ] Delete own post → disappears from feed

### Activity → other tabs (5 min)

- [ ] Walks: log a walk, GPS tracker (if mobile)
- [ ] Journal: add an entry, calendar heatmap updates
- [ ] Playdates: schedule one

### Expenses (3 min)

- [ ] Add an expense, monthly summary updates
- [ ] Edit / delete an expense

### Reminders (3 min)

- [ ] Add a vaccination reminder, sees due date

### Training (3 min)

- [ ] Open a module, mark progress

### Messages (3 min)

- [ ] Open a chat from a post's DM button
- [ ] Send a message, receive in real time

### Settings (3 min)

- [ ] Toggle theme (light / dark / colorful) — no console errors
- [ ] Notification permission prompt
- [ ] Sign out

### Admin (admin account only, 3 min)

- [ ] All 6 tabs scroll horizontally on mobile and are reachable
- [ ] **Flags tab**: toggle `messagesEnabled` off → Messages disappears from nav for all users
- [ ] **Analytics tab**: see at least one page_view from your session

### Cross-cutting (3 min)

- [ ] No console errors on any page (open DevTools)
- [ ] PWA install banner shows on mobile after dismiss-then-revisit
- [ ] Offline: turn off network → cached pages still render

---

## CI Hookup (future)

Add this to your GitHub Actions workflow:

```yaml
- name: E2E tests
  env:
    E2E_DEMO_EMAIL: ${{ secrets.E2E_DEMO_EMAIL }}
    E2E_DEMO_PASSWORD: ${{ secrets.E2E_DEMO_PASSWORD }}
    E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
    E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
  run: |
    npx playwright install --with-deps chromium
    npm run test:e2e
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Debugging Failed Tests

```bash
# 1. Open the HTML report (auto-generated)
npm run test:e2e:report

# 2. Re-run a single test in headed mode
npx playwright test e2e/03-community.spec.ts --headed --debug

# 3. UI mode — best for iteration
npm run test:e2e:ui
```

Failed runs save screenshots, videos, and traces under `test-results/`.
