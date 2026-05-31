# PawShield — UX Improvements, Feature Flags & Analytics Architecture

> **Created:** 31 May 2026  
> **Author:** UX Architect Agent  
> **Scope:** Full UI audit, feature flag system design, analytics architecture

---

## PART 1: Bug Fixes (Completed)

### Bug 1: Like Button Not Working (Demo/Non-Author Users)

**Root Cause:** `togglePostLike()` in `src/lib/repositories/index.ts` was including `updatedAt` in the Firestore update payload. The Firestore security rule for `communityPosts` only allows non-authors to modify `['likeCount', 'likedBy', 'commentCount']`. The extra `updatedAt` field caused a `permission-denied` error.

**Fix:** Removed `updatedAt: toISOString()` from both the like and unlike update calls. This is a rules compliance fix — the timestamp is not needed for likes anyway since `likedBy` array changes are the source of truth.

### Bug 2: Admin Tab Not Visible on Mobile

**Root Cause:** Admin gets 6 bottom nav items (Home, Activity, Chat, Dogs, Admin, More) but items had fixed `px-5` padding which overflowed on small screens (320-375px), pushing the last items off-screen.

**Fix:** Dynamic padding — `px-2` when >5 items (admin), `px-5` for normal users.

---

## PART 2: Full UI Analysis & Improvement Recommendations

### A. Critical UX Issues

| #   | Issue                                                                       | Page           | Impact                                    | Fix                                                        |
| --- | --------------------------------------------------------------------------- | -------------- | ----------------------------------------- | ---------------------------------------------------------- |
| 1   | **No empty state for Dashboard** when user has 0 dogs after onboarding skip | Dashboard      | Users see blank page → bounce             | Show illustrated CTA: "Add your first dog"                 |
| 2   | **Expenses page missing AppLayout wrapper**                                 | `/expenses`    | No sidebar, no header, inconsistent shell | Wrap in `<AppLayout>`                                      |
| 3   | **No loading state shown for community toggle-like**                        | Community      | Button feels unresponsive                 | Add optimistic UI toggle (instant visual, revert on error) |
| 4   | **No confirmation before destructive actions** on mobile                    | Community/Dogs | Accidental deletes                        | Use slide-to-confirm or modal instead of `confirm()`       |
| 5   | **Tab labels overflow on small phones**                                     | Activity tabs  | 4 tabs with text get cramped on 320px     | Show icon-only on xs screens, label on sm+                 |

### B. Navigation & Information Architecture

| #   | Recommendation                                               | Rationale                                                                                  |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | **Move Training & Expenses into bottom nav overflow menu**   | Currently only on sidebar desktop — mobile users must use the hamburger or can't find them |
| 2   | **Add "More" sheet** to Settings bottom nav tab              | Tap "More" → bottom sheet with Training, Expenses, Reminders, Settings links               |
| 3   | **Badge count on Activity tab** for unread community replies | Social engagement nudge                                                                    |
| 4   | **Deep-link push notifications** to correct tab              | E.g., comment notification → Activity?tab=community                                        |

### C. Visual & Interaction Improvements

| #   | Area             | Current                | Recommended                                                         |
| --- | ---------------- | ---------------------- | ------------------------------------------------------------------- |
| 1   | **Post Card**    | Static like count      | Animate heart (scale bounce + particle burst on like)               |
| 2   | **Walk logging** | Manual entry only      | Add quick "Start Walk" FAB on dashboard for one-tap access          |
| 3   | **Journal**      | Full form every day    | Show pre-filled quick-log card at dashboard top if today not logged |
| 4   | **Dog Profile**  | Basic info display     | Add health score ring (based on vaccination status + journal data)  |
| 5   | **Settings**     | Flat list              | Group into sections (Account, Preferences, Data, Support)           |
| 6   | **Admin**        | Tab overflow on mobile | Use scrollable horizontal tab bar or dropdown selector on mobile    |
| 7   | **Login**        | Fixed dark bg          | Respect system theme for returning-user login page                  |

### D. Mobile-Specific Improvements

| #   | Issue                                       | Fix                                                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Bottom nav covers content at page bottom    | Add `pb-24` to pages or use scroll-aware hide-on-scroll-down nav          |
| 2   | PWAHeader + BottomNav both render on mobile | Already handled, but safe-area padding should be audited on notch devices |
| 3   | Forms hard to use on small screens          | Increase tap targets to minimum 44×44px, add proper autofocus             |
| 4   | Image uploads on community                  | Add crop/preview before upload, show upload progress bar                  |

### E. Accessibility Gaps

| #   | Issue                                           | WCAG Level | Fix                                                           |
| --- | ----------------------------------------------- | ---------- | ------------------------------------------------------------- |
| 1   | Like button has no aria-label                   | A          | `aria-label="Like post by {name}"` + `aria-pressed={isLiked}` |
| 2   | Color-only status indicators (green/yellow/red) | A          | Already has icon + text — good. But check mood selectors      |
| 3   | Focus management on tab switch                  | AA         | Focus first content element after tab change                  |
| 4   | Bottom nav items lack aria-current              | AA         | Add `aria-current="page"` to active link                      |

---

## PART 3: Feature Flags System Design

### Architecture Decision

**Where to store flags:** Firestore `appConfig/featureFlags` document (single document, real-time updates to all clients via snapshot listener).

**Why not environment variables?** Flags need to be toggle-able from admin UI without redeploy.

### Data Model

```typescript
// src/types/index.ts — add to existing types

export interface FeatureFlags {
  // Section visibility
  activityJournal: boolean;
  activityWalks: boolean;
  activityCommunity: boolean;
  activityPlaydates: boolean;
  training: boolean;
  expenses: boolean;
  messages: boolean;

  // Auth controls
  demoLoginEnabled: boolean;
  registrationEnabled: boolean;

  // Feature-specific
  gpsTracking: boolean;
  communityPhotos: boolean;
  pushNotifications: boolean;

  // Maintenance mode
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Updated metadata
  updatedAt: string;
  updatedBy: string;
}

// Defaults (used when document doesn't exist yet)
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  activityJournal: true,
  activityWalks: true,
  activityCommunity: true,
  activityPlaydates: true,
  training: true,
  expenses: true,
  messages: true,
  demoLoginEnabled: true,
  registrationEnabled: true,
  gpsTracking: true,
  communityPhotos: true,
  pushNotifications: true,
  maintenanceMode: false,
  maintenanceMessage: "",
  updatedAt: "",
  updatedBy: "",
};
```

### Hook Implementation

```typescript
// src/hooks/useFeatureFlags.ts

"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from "@/types";

const FeatureFlagContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "appConfig", "featureFlags"),
      (snap) => {
        if (snap.exists()) {
          setFlags({ ...DEFAULT_FEATURE_FLAGS, ...snap.data() } as FeatureFlags);
        }
      },
      () => {
        // On error (e.g., offline), use defaults — everything enabled
        setFlags(DEFAULT_FEATURE_FLAGS);
      }
    );
    return unsub;
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
```

### Admin UI — "Feature Flags" Tab

Add a 7th tab to admin panel: **"Flags"**

```
┌──────────────────────────────────────────────────────┐
│  Feature Flags                                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  SECTIONS                                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☑ Journal        ☑ Walks       ☑ Community     │ │
│  │ ☑ Playdates      ☑ Training    ☑ Expenses      │ │
│  │ ☑ Messages                                      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  AUTH CONTROLS                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☑ Demo Login Button                             │ │
│  │ ☑ Email Registration                            │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  FEATURES                                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☑ GPS Tracking    ☑ Photo Uploads               │ │
│  │ ☑ Push Notifications                            │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  MAINTENANCE                                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☐ Maintenance Mode                              │ │
│  │ Message: [________________________]              │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Last updated: 31 May 2026 by admin@pawshield.app    │
└──────────────────────────────────────────────────────┘
```

### Integration Points

| Where              | What it controls                                   |
| ------------------ | -------------------------------------------------- |
| `ActivityTabs.tsx` | Filter out disabled tabs from TABS array           |
| `BottomNav.tsx`    | Hide nav items for disabled sections               |
| `Sidebar.tsx`      | Same — hide sidebar links                          |
| `LoginPage`        | Conditionally render demo button & register form   |
| `WalksTab.tsx`     | Disable GPS button if `gpsTracking: false`         |
| `NewPostForm.tsx`  | Disable photo upload if `communityPhotos: false`   |
| `AppLayout.tsx`    | Show maintenance banner if `maintenanceMode: true` |

### Firestore Rules Addition

```
// Add to firestore.rules
match /appConfig/{configId} {
  allow read: if isAuth();
  allow write: if isAdmin();
}
```

### Firestore Cost

**Reads:** 1 read per app session (snapshot listener keeps it alive with no additional reads until document changes). Negligible cost.

---

## PART 4: Analytics System Design

### Approach: Lightweight Client-Side + Firestore Events

**Why not Google Analytics 4?** GA4 is fine for marketing but heavy, complex, and privacy-invasive for a PWA. A lightweight custom system gives you exactly the data you need with zero external dependencies and full control.

**Hybrid Approach:** Use custom events for product analytics + optional GA4 for marketing attribution.

### Data Model

```typescript
// src/types/index.ts — add

export interface AnalyticsEvent {
  id?: string;
  userId: string;
  sessionId: string;
  event: string; // e.g., "page_view", "button_click", "feature_used"
  category: string; // e.g., "navigation", "community", "journal"
  label?: string; // e.g., "like_button", "new_post", "tab_switch"
  value?: number; // e.g., duration in seconds
  metadata?: Record<string, string | number | boolean>;
  page: string; // current route
  timestamp: string; // ISO
  deviceType: "mobile" | "tablet" | "desktop";
  isDemo: boolean;
}

export interface SessionAnalytics {
  id?: string;
  userId: string;
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number; // seconds
  pageViews: number;
  interactions: number;
  pages: string[]; // ordered list of pages visited
  deviceType: "mobile" | "tablet" | "desktop";
  isDemo: boolean;
  isPWA: boolean;
}
```

### Key Metrics to Track

#### Engagement Metrics

| Metric                    | Event                            | Why                                  |
| ------------------------- | -------------------------------- | ------------------------------------ |
| **Daily Active Users**    | `session_start`                  | Core health metric                   |
| **Session Duration**      | `session_end` (duration field)   | Are users spending time or bouncing? |
| **Pages per Session**     | Count of `page_view` per session | Depth of engagement                  |
| **Feature Adoption**      | `feature_used` by category       | Which features drive retention?      |
| **Retention (D1/D7/D30)** | Derived from session dates       | Are users coming back?               |

#### Feature-Specific Metrics

| Feature       | Events to Track                                                 |
| ------------- | --------------------------------------------------------------- |
| **Journal**   | `journal_logged`, `streak_continued`, `streak_broken`           |
| **Walks**     | `walk_started`, `walk_completed`, `gps_enabled`                 |
| **Community** | `post_created`, `post_liked`, `comment_posted`, `post_reported` |
| **Training**  | `module_started`, `module_completed`, `challenge_joined`        |
| **Expenses**  | `expense_added`, `summary_viewed`                               |
| **Dogs**      | `dog_added`, `vaccination_logged`, `profile_shared`             |

#### Conversion Funnel

| Step                     | Event                                      |
| ------------------------ | ------------------------------------------ |
| 1. Visit login page      | `page_view` (login)                        |
| 2. Click demo / register | `auth_attempt` (method: demo/google/email) |
| 3. Complete signup       | `auth_success`                             |
| 4. Add first dog         | `dog_added` (first: true)                  |
| 5. First activity        | `feature_used` (first: true)               |
| 6. Return D1             | `session_start` (day_since_signup: 1)      |
| 7. Return D7             | `session_start` (day_since_signup: 7)      |

#### Click Tracking (UI Elements)

| Element                  | What to Track                                   |
| ------------------------ | ----------------------------------------------- |
| Bottom nav items         | Which tabs are most used                        |
| Activity sub-tabs        | Journal vs Walks vs Community preference        |
| CTA buttons              | "Add Dog", "New Post", "Start Walk" click rates |
| Settings sections        | What settings users change most                 |
| Demo → Signup conversion | Did demo user click "Sign Up"?                  |

### Implementation: Analytics Hook

```typescript
// src/hooks/useAnalytics.ts

"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { usePathname } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const DEMO_EMAIL = "demo@theatrack.app";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  let id = sessionStorage.getItem("pawshield_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("pawshield_session_id", id);
  }
  return id;
}

export function useAnalytics() {
  const { user } = useAuth();
  const pathname = usePathname();
  const sessionDocRef = useRef<string | null>(null);
  const pageViewCount = useRef(0);
  const interactionCount = useRef(0);
  const sessionStart = useRef<string>(new Date().toISOString());

  // Track page views automatically
  useEffect(() => {
    if (!user) return;
    pageViewCount.current++;
    trackEvent("page_view", "navigation", pathname);
  }, [pathname, user]);

  // Session start + end
  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      const sessionDoc = await addDoc(collection(db, "analytics_sessions"), {
        userId: user.uid,
        sessionId: getSessionId(),
        startedAt: new Date().toISOString(),
        pageViews: 0,
        interactions: 0,
        pages: [pathname],
        deviceType: getDeviceType(),
        isDemo: user.email === DEMO_EMAIL,
        isPWA: window.matchMedia("(display-mode: standalone)").matches,
      });
      sessionDocRef.current = sessionDoc.id;
    };

    startSession();

    // End session on unload
    const endSession = () => {
      if (sessionDocRef.current) {
        const duration = Math.round(
          (Date.now() - new Date(sessionStart.current).getTime()) / 1000,
        );
        // Use sendBeacon for reliable delivery on page close
        navigator.sendBeacon(
          "/api/analytics/session-end",
          JSON.stringify({
            sessionId: sessionDocRef.current,
            duration,
            pageViews: pageViewCount.current,
            interactions: interactionCount.current,
          }),
        );
      }
    };

    window.addEventListener("beforeunload", endSession);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") endSession();
    });

    return () => {
      window.removeEventListener("beforeunload", endSession);
    };
  }, [user]);

  const trackEvent = useCallback(
    async (
      event: string,
      category: string,
      label?: string,
      value?: number,
      metadata?: Record<string, string | number | boolean>,
    ) => {
      if (!user) return;
      interactionCount.current++;

      try {
        await addDoc(collection(db, "analytics_events"), {
          userId: user.uid,
          sessionId: getSessionId(),
          event,
          category,
          label,
          value,
          metadata,
          page: pathname,
          timestamp: new Date().toISOString(),
          deviceType: getDeviceType(),
          isDemo: user.email === DEMO_EMAIL,
        });
      } catch {
        // Analytics should never break the app — fail silently
      }
    },
    [user, pathname],
  );

  return { trackEvent };
}
```

### Admin Analytics Dashboard (New Tab)

Add an **"Analytics"** tab to the admin panel showing:

```
┌──────────────────────────────────────────────────────┐
│  Analytics Overview                    [7d ▾] [30d]  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ DAU │  │ Avg  │  │Pages│  │ New │                 │
│  │  12 │  │ 4:32│  │ 6.2 │  │  3  │                 │
│  │     │  │sess.│  │/sess│  │users│                 │
│  └─────┘  └─────┘  └─────┘  └─────┘                │
│                                                       │
│  FEATURE USAGE (last 7 days)                         │
│  ─────────────────────────────                       │
│  Journal      ████████████████░░░░  78%              │
│  Walks        ██████████████░░░░░░  65%              │
│  Community    ████████████░░░░░░░░  55%              │
│  Training     ██████░░░░░░░░░░░░░░  32%              │
│  Expenses     ████░░░░░░░░░░░░░░░░  18%              │
│                                                       │
│  TOP ACTIONS                                          │
│  1. page_view (dashboard)    — 234                   │
│  2. journal_logged           — 89                    │
│  3. walk_completed           — 67                    │
│  4. post_liked               — 54                    │
│  5. post_created             — 23                    │
│                                                       │
│  CONVERSION FUNNEL                                    │
│  Login → Signup: 34%                                 │
│  Signup → First Dog: 89%                             │
│  First Dog → First Activity: 67%                     │
│  D1 Retention: 45%                                   │
│  D7 Retention: 28%                                   │
│                                                       │
│  DEVICE BREAKDOWN                                     │
│  Mobile: 72% | Desktop: 23% | Tablet: 5%            │
│  PWA: 41% | Browser: 59%                             │
└──────────────────────────────────────────────────────┘
```

### Firestore Rules for Analytics

```
// Add to firestore.rules
match /analytics_events/{eventId} {
  allow create: if isAuth();
  allow read: if isAdmin();
}

match /analytics_sessions/{sessionId} {
  allow create: if isAuth();
  allow update: if isAuth() && resource.data.userId == request.auth.uid;
  allow read: if isAdmin();
}
```

### Firebase Cost Estimate

| Metric                      | Writes/Day (100 users) | Monthly Cost   |
| --------------------------- | ---------------------- | -------------- |
| Events                      | ~2,000                 | ~$0.02 (Blaze) |
| Sessions                    | ~200                   | Negligible     |
| **Reads (admin dashboard)** | ~500/view              | Negligible     |

**Optimization:** Batch events client-side (queue 10 events, flush every 30s or on page leave) to reduce write operations.

### Alternative: Zero-Cost Analytics with Batching

Instead of writing every event individually, batch them:

```typescript
// Queue events in memory, flush periodically
const eventQueue: AnalyticsEvent[] = [];
const FLUSH_INTERVAL = 30000; // 30 seconds
const FLUSH_SIZE = 10;

function flushEvents() {
  if (eventQueue.length === 0) return;
  // Write as single batch document
  addDoc(collection(db, "analytics_batches"), {
    events: eventQueue.splice(0),
    userId: user.uid,
    flushedAt: new Date().toISOString(),
  });
}
```

This reduces writes from ~2000/day to ~200/day (10× reduction).

---

## PART 5: Implementation Priority

| Priority | Task                                    | Effort        | Impact                      |
| -------- | --------------------------------------- | ------------- | --------------------------- |
| **P0**   | ✅ Fix like button bug                  | Done          | High — broken feature       |
| **P0**   | ✅ Fix admin nav overflow               | Done          | High — admin can't navigate |
| **P1**   | Feature flags (types + hook + admin UI) | Medium (4-6h) | High — operational control  |
| **P1**   | Firestore rules for appConfig           | Small (5min)  | Required for flags          |
| **P2**   | Analytics hook + session tracking       | Medium (3-4h) | High — data for decisions   |
| **P2**   | Analytics admin dashboard tab           | Medium (4-6h) | High — visibility           |
| **P3**   | Optimistic UI for likes                 | Small (1h)    | Medium — UX polish          |
| **P3**   | Activity tab badge counts               | Small (1h)    | Medium — engagement         |
| **P3**   | Accessibility fixes (aria labels)       | Small (2h)    | Medium — compliance         |
| **P4**   | Dashboard quick-log widget              | Medium (3h)   | Medium — daily engagement   |
| **P4**   | Session batching optimization           | Small (1h)    | Low — cost optimization     |

---

## PART 6: Files to Create/Modify

### New Files

- `src/hooks/useFeatureFlags.ts` — Feature flag context + hook
- `src/hooks/useAnalytics.ts` — Analytics tracking hook
- `src/components/admin/FeatureFlagsTab.tsx` — Admin flags UI
- `src/components/admin/AnalyticsTab.tsx` — Admin analytics dashboard
- `src/app/api/analytics/session-end/route.ts` — Beacon endpoint for session close

### Modified Files

- `src/types/index.ts` — Add FeatureFlags + Analytics types
- `src/app/layout.tsx` — Wrap with FeatureFlagProvider
- `src/app/admin/page.tsx` — Add "Flags" and "Analytics" tabs
- `src/components/activity/ActivityTabs.tsx` — Filter by flags
- `src/components/layout/BottomNav.tsx` — Filter by flags
- `src/components/layout/Sidebar.tsx` — Filter by flags
- `src/app/login/page.tsx` — Conditional demo button
- `firestore.rules` — Add appConfig + analytics rules

---

_Ready for implementation. Proceed with P1 (Feature Flags) next?_
