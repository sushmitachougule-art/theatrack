# PawShield — Phase 1 UX Architecture

## Daily Health Journal + Walk Log + Community Feed

> **Author:** UX Architect Agent
> **Date:** 28 May 2026
> **Status:** Ready for Frontend Development
> **Handoff to:** Frontend Developer (coding agent)

---

## 1. Navigation Architecture

### Current Navigation (4 items)

```
Desktop Sidebar:  Dashboard · My Dogs · Reminders · Settings · [Admin]
Mobile Bottom:    Dashboard · Dogs · [Admin] · Settings
```

### New Navigation (5 items — adds "Activity" hub)

```
Desktop Sidebar:  Dashboard · My Dogs · Activity · Reminders · Settings · [Admin]
Mobile Bottom:    Dashboard · Dogs · Activity · Settings
```

**Key decision:** All 3 new features live under a single **"Activity"** tab. This avoids nav bloat while creating a clear engagement hub.

### Route Structure

```
/activity                    → Activity hub (tabbed: Journal · Walks · Community)
/activity/journal            → Daily Health Journal (deep link)
/activity/walks              → Walk History (deep link)
/activity/community          → Community Feed (deep link)
/activity/community/new      → New Post form
/activity/community/[postId] → Single post detail
```

### Navigation Icon

- **Lucide icon:** `Activity` or `Heart` (Activity preferred — represents daily engagement)
- **Mobile:** `Activity` icon in bottom nav between Dogs and Settings
- **Desktop:** Between "My Dogs" and "Reminders" in sidebar

---

## 2. Activity Hub Page (`/activity`)

### Layout

```
┌─────────────────────────────────────────────────┐
│  ● Journal    ● Walks    ● Community            │  ← Segmented tab bar
├─────────────────────────────────────────────────┤
│                                                 │
│  [Tab content renders here]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tab Bar Component (`ActivityTabs`)

- **Style:** Pill-shaped segmented control (matches existing UI patterns)
- **Behavior:** URL-synced tabs via query param `?tab=journal|walks|community`
- **Default tab:** Journal (most frequent daily action)
- **Swipe support:** On mobile, swipe left/right between tabs
- **Persistence:** Last-viewed tab stored in localStorage

---

## 3. Feature 1: Daily Health Journal

### 3.1 Purpose

30-second daily check-in that creates a habit loop. Dog owners log mood, appetite, energy, and quick notes.

### 3.2 Wireframe — Journal Tab

```
┌──────────────────────────────────────────────────┐
│  Today's Check-in                     [Streak 🔥7] │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─ Dog Selector (if multi-dog) ─────────────┐   │
│  │  [🐕 Buddy ▼]                              │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ Quick Log Card ──────────────────────────┐   │
│  │                                            │   │
│  │  Mood:    😊  😐  😢  😴  🤒              │   │
│  │                                            │   │
│  │  Energy:  ○ Low   ● Medium   ○ High       │   │
│  │                                            │   │
│  │  Appetite: ○ Poor  ● Normal  ○ Excessive  │   │
│  │                                            │   │
│  │  Poop:   ✅ Normal  ⚠️ Soft  🚨 Concerning │   │
│  │                                            │   │
│  │  ┌─ Notes (optional) ──────────────────┐  │   │
│  │  │  "Scratching ears a lot today"      │  │   │
│  │  └────────────────────────────────────┘  │   │
│  │                                            │   │
│  │  [💾 Save Check-in]                       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ─── History ─────────────────────────────────    │
│                                                    │
│  ┌─ Calendar Heatmap ────────────────────────┐   │
│  │  May 2026                                  │   │
│  │  M  T  W  T  F  S  S                      │   │
│  │  🟢 🟢 🟢 🟡 🟢 ⚪ ⚪                       │   │
│  │  🟢 🟢 🟢 🟢 🟢 🟢 🟢                       │   │
│  │  🟡 🟢 🟢 🟢 ⬜ ⬜ ⬜                       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ Recent Entries ──────────────────────────┐   │
│  │  📅 May 27 — 😊 Normal | High energy      │   │
│  │  📅 May 26 — 😐 Poor appetite | Notes...  │   │
│  │  📅 May 25 — 😊 Normal | Medium energy    │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 3.3 Component Tree

```
ActivityPage
├── ActivityTabs (Journal | Walks | Community)
└── JournalTab
    ├── StreakBadge (🔥 count)
    ├── DogSelector (dropdown — multi-dog users)
    ├── QuickLogCard
    │   ├── MoodSelector (emoji row — single select)
    │   ├── EnergySelector (radio pills: Low/Medium/High)
    │   ├── AppetiteSelector (radio pills: Poor/Normal/Excessive)
    │   ├── PoopSelector (radio pills: Normal/Soft/Concerning)
    │   ├── NotesInput (optional textarea, max 200 chars)
    │   └── SubmitButton
    ├── CalendarHeatmap (month grid — colored by mood)
    └── RecentEntries (last 7 entries, expandable)
```

### 3.4 Interaction Design

| Action                   | Behavior                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Tap mood emoji           | Select (radio — only one active), haptic feedback on mobile    |
| Tap energy/appetite/poop | Radio-pill selection with color transition                     |
| Save Check-in            | Optimistic UI → toast "Saved! 🔥8 day streak" → card collapses |
| Already logged today     | Card shows "✅ Logged today" with edit option                  |
| Tap calendar day         | Show that day's entry in a bottom sheet                        |
| Multi-dog                | Dog selector at top; each dog has independent journal          |

### 3.5 Gamification — Streak System

- **Streak counter** visible on journal tab (🔥 N days)
- **Streak rules:** Log at least 1 dog per day to maintain streak
- **Break tolerance:** Miss 1 day → "streak at risk" warning. Miss 2 → reset
- **Milestones:** 7-day, 30-day, 100-day badges (shown on dashboard)
- **Push notification:** "Don't break your 15-day streak! Log today 🐾" at 8 PM if not logged

### 3.6 Data Model

```typescript
// New collection: dailyJournals
interface DailyJournal {
  id: string;
  dogId: string;
  ownerId: string;
  date: string; // ISO date (YYYY-MM-DD) — one per dog per day
  mood: "happy" | "neutral" | "sad" | "sleepy" | "sick";
  energy: "low" | "medium" | "high";
  appetite: "poor" | "normal" | "excessive";
  poop: "normal" | "soft" | "concerning";
  notes: string; // max 200 chars
  createdAt: string;
  updatedAt: string;
}

// New fields on UserProfile
interface UserProfile {
  // ...existing fields
  streakCount: number; // current streak
  streakLastDate: string; // last journal date (ISO)
  longestStreak: number; // all-time best
}
```

### 3.7 Firestore Reads/Writes Estimate

| Action                     | Reads                                              | Writes                                          |
| -------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Open journal tab           | 1 (today's entry) + 30 (calendar month) = 31 reads | 0                                               |
| Save check-in              | 0                                                  | 1 (journal) + 1 (user streak update) = 2 writes |
| Switch dog                 | 31 reads                                           | 0                                               |
| **Daily per user (1 dog)** | ~31 reads                                          | 2 writes                                        |

---

## 4. Feature 2: Walk Log

### 4.1 Purpose

Track daily walks with duration, distance (manual for Phase 1), and notes. Creates 1-3× daily touchpoints.

### 4.2 Wireframe — Walks Tab

```
┌──────────────────────────────────────────────────┐
│  Walk Log                         [+ Log Walk]    │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─ Today's Summary Card ────────────────────┐   │
│  │  🐾 2 walks today    │  ⏱️ 45 min total    │   │
│  │  📏 2.3 km           │  🔥 Walk streak: 12  │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ This Week Bar Chart ─────────────────────┐   │
│  │  M   T   W   T   F   S   S               │   │
│  │  ▓▓  ▓▓  ▓▓  ▓▓  ▓   ░   ░              │   │
│  │  45  50  30  45  20  —   —   (minutes)    │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ─── Recent Walks ───────────────────────────    │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  🐕 Buddy • Today 7:30 AM                  │   │
│  │  ⏱️ 25 min  📏 1.5 km  😊 Happy           │   │
│  │  📝 "Found a new trail by the lake"        │   │
│  ├────────────────────────────────────────────┤   │
│  │  🐕 Buddy • Today 5:00 PM                  │   │
│  │  ⏱️ 20 min  📏 0.8 km  😊 Happy           │   │
│  ├────────────────────────────────────────────┤   │
│  │  🐕 Buddy • Yesterday 7:15 AM             │   │
│  │  ⏱️ 30 min  📏 2.0 km  😊 Happy           │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 4.3 Log Walk Modal/Sheet

```
┌──────────────────────────────────────────────────┐
│  Log a Walk                              [✕]      │
├──────────────────────────────────────────────────┤
│                                                    │
│  Dog:  [🐕 Buddy ▼]                              │
│                                                    │
│  Duration:                                        │
│  ┌─ Quick Select ────────────────────────────┐   │
│  │  [10m]  [15m]  [20m]  [30m]  [45m]  [60m+]│   │
│  └────────────────────────────────────────────┘   │
│  or custom: [__|  min                             │
│                                                    │
│  Distance (optional):  [__|  km                   │
│                                                    │
│  Dog's mood after walk:                           │
│  😊 Happy   😴 Tired   🤪 Hyper   😐 Same        │
│                                                    │
│  Notes (optional):                                │
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [💾 Save Walk]                                   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 4.4 Component Tree

```
ActivityPage
├── ActivityTabs
└── WalksTab
    ├── TodaySummaryCard (walks count, total mins, total km, streak)
    ├── WeeklyBarChart (7-day bar chart of walk minutes)
    ├── LogWalkButton (floating or header — opens modal)
    ├── LogWalkModal
    │   ├── DogSelector
    │   ├── DurationQuickSelect (preset buttons + custom input)
    │   ├── DistanceInput (optional number field)
    │   ├── MoodAfterWalk (emoji row)
    │   ├── NotesInput
    │   └── SaveButton
    └── WalkHistory (infinite scroll list, grouped by day)
        └── WalkCard (dog, time, duration, distance, mood, notes)
```

### 4.5 Interaction Design

| Action               | Behavior                                                          |
| -------------------- | ----------------------------------------------------------------- |
| Tap "+ Log Walk"     | Bottom sheet (mobile) or modal (desktop) slides up                |
| Quick duration tap   | Selects preset (e.g., 30m), highlights button                     |
| Custom duration      | Number input with "min" suffix                                    |
| Save walk            | Optimistic → toast "Walk logged! 🐾" → modal closes, list updates |
| Tap walk in history  | Expand inline to show full notes                                  |
| Swipe walk card left | Delete with confirm                                               |

### 4.6 Phase 2 (Future): GPS Tracking

- **Start/Stop walk button** with live timer
- GPS route recording using browser Geolocation API
- Map rendering (Leaflet.js — free, no API key)
- Route saved as encoded polyline string
- Share route to community feed

### 4.7 Data Model

```typescript
// New collection: walkLogs
interface WalkLog {
  id: string;
  dogId: string;
  ownerId: string;
  date: string; // ISO date
  startTime: string; // ISO datetime
  durationMinutes: number;
  distanceKm: number | null; // optional manual entry
  moodAfter: "happy" | "tired" | "hyper" | "same";
  notes: string; // max 200 chars
  // Phase 2:
  // routePolyline: string | null;
  // gpsPoints: { lat: number; lng: number; timestamp: string }[];
  createdAt: string;
}
```

### 4.8 Firestore Reads/Writes Estimate

| Action                       | Reads                                                 | Writes   |
| ---------------------------- | ----------------------------------------------------- | -------- |
| Open walks tab               | 7 (this week for chart) + 10 (recent list) = 17 reads | 0        |
| Log a walk                   | 0                                                     | 1 write  |
| Scroll more history          | 10 per page                                           | 0        |
| **Daily per user (2 walks)** | ~17 reads                                             | 2 writes |

---

## 5. Feature 3: Community Feed

### 5.1 Purpose

Instagram-style photo feed where dog owners share photos, milestones, and connect with other users. The social loop that drives daily return visits.

### 5.2 Wireframe — Community Tab

```
┌──────────────────────────────────────────────────┐
│  Community                         [📷 New Post]  │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─ Post Card ───────────────────────────────┐   │
│  │  ┌──────┐  Buddy's Dad • 2h ago           │   │
│  │  │ 🐕📷 │  @buddy_golden                   │   │
│  │  └──────┘                                  │   │
│  │  ┌────────────────────────────────────┐    │   │
│  │  │                                    │    │   │
│  │  │          [Photo]                   │    │   │
│  │  │                                    │    │   │
│  │  └────────────────────────────────────┘    │   │
│  │                                            │   │
│  │  "First beach day of summer! 🏖️🐾"         │   │
│  │                                            │   │
│  │  ❤️ 12    💬 3    🔗 Share                  │   │
│  │                                            │   │
│  │  ── Top Comment ──                         │   │
│  │  @maxs_mom: "So cute! Which beach?"        │   │
│  │  View all 3 comments                       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ Post Card ───────────────────────────────┐   │
│  │  ┌──────┐  Luna's Human • 5h ago          │   │
│  │  │ 🐕📷 │  @luna_husky                     │   │
│  │  └──────┘                                  │   │
│  │  ...                                       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [Load More...]                                   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 5.3 New Post Flow

```
┌──────────────────────────────────────────────────┐
│  New Post                                [✕]      │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─ Photo Upload ────────────────────────────┐   │
│  │                                            │   │
│  │      [📷 Tap to add photo]                │   │
│  │      (or drag & drop)                     │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Which dog?  [🐕 Buddy ▼]                        │
│                                                    │
│  Caption:                                         │
│  ┌────────────────────────────────────────────┐   │
│  │  "Write something about your pup..."      │   │
│  └────────────────────────────────────────────┘   │
│  140/280 characters                               │
│                                                    │
│  Tags (optional):                                 │
│  [#beachdog] [#goldenretriever] [+ Add]          │
│                                                    │
│  [📤 Post to Community]                           │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 5.4 Component Tree

```
ActivityPage
├── ActivityTabs
└── CommunityTab
    ├── NewPostButton (header action)
    ├── FeedList (virtualized scroll)
    │   └── PostCard (repeated)
    │       ├── PostHeader (avatar, display name, time ago)
    │       ├── PostImage (compressed photo — max 800px, lazy loaded)
    │       ├── PostCaption (text with expand for long captions)
    │       ├── PostActions (like button + count, comment count, share)
    │       └── TopComment (latest 1 comment preview)
    ├── EmptyFeed (illustration + "Be the first to post!")
    └── LoadMoreButton (pagination)

NewPostPage (/activity/community/new)
├── PhotoUpload (camera/gallery + preview + compression)
├── DogSelector
├── CaptionInput (max 280 chars with counter)
├── TagInput (autocomplete from popular tags)
└── PostButton

PostDetailPage (/activity/community/[postId])
├── PostCard (full)
└── CommentSection
    ├── CommentList (all comments, oldest first)
    │   └── CommentItem (avatar, name, text, time)
    └── CommentInput (text field + submit)
```

### 5.5 Interaction Design

| Action           | Behavior                                             |
| ---------------- | ---------------------------------------------------- |
| Scroll feed      | Load 10 posts at a time (most recent first)          |
| Tap ❤️           | Toggle like — optimistic UI, count updates instantly |
| Double-tap photo | Like animation (heart pop-up like Instagram)         |
| Tap 💬           | Navigate to post detail with full comments           |
| Tap "New Post"   | Navigate to /activity/community/new                  |
| Post photo       | Compress to 800px max, upload to Storage, save doc   |
| Tap user avatar  | (Phase 2) Navigate to user profile                   |
| Pull to refresh  | Reload feed from top                                 |
| Tap 🔗 Share     | Copy link to post / native share sheet               |

### 5.6 Content Moderation (Phase 1 — Simple)

- Admin can delete any post from admin panel
- Report button on each post (saves to `reports` collection)
- No automated moderation in Phase 1
- Posts are public to all authenticated PawShield users

### 5.7 Data Model

```typescript
// New collection: communityPosts
interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string; // denormalized
  authorPhotoUrl: string | null; // denormalized (dog photo)
  dogId: string;
  dogName: string; // denormalized
  dogBreed: string; // denormalized
  photoUrl: string; // required — compressed to 800px max
  caption: string; // max 280 chars
  tags: string[]; // hashtags without #
  likeCount: number; // denormalized counter
  commentCount: number; // denormalized counter
  likedBy: string[]; // userId array (for checking if current user liked)
  isActive: boolean; // soft delete by admin
  createdAt: string;
  updatedAt: string;
}

// New collection: communityComments
interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string; // denormalized
  text: string; // max 280 chars
  createdAt: string;
}

// New collection: reports (for moderation)
interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reason: "spam" | "inappropriate" | "harassment" | "other";
  details: string;
  status: "new" | "reviewed" | "dismissed";
  createdAt: string;
}
```

### 5.8 Storage Structure

```
/community/{userId}/{postId}/{uuid}.jpg   — Community post photos
```

- Compressed client-side to 800px max width, ~150-200KB each
- Storage rules: auth required, 2MB max, images only

### 5.9 Firestore Reads/Writes Estimate

| Action                    | Reads                          | Writes                                              |
| ------------------------- | ------------------------------ | --------------------------------------------------- |
| Open community tab        | 10 (posts) = 10 reads          | 0                                                   |
| Like a post               | 0                              | 1 write (update likeCount + likedBy)                |
| View comments             | N reads (all comments on post) | 0                                                   |
| Post comment              | 0                              | 1 (comment) + 1 (increment commentCount) = 2 writes |
| Create post               | 0                              | 1 write + 1 storage upload                          |
| Load more                 | 10 reads                       | 0                                                   |
| **Daily per active user** | ~50 reads                      | ~5 writes                                           |

### 5.10 Scaling Concern

With community features, `likedBy: string[]` array will grow. At scale (>100 likes per post), switch to a subcollection `likes/{userId}` pattern. For Phase 1 with limited users, the array approach is simpler and fits within a single read.

---

## 6. Dashboard Integration

### New Dashboard Card — "Today's Activity"

Add to the dashboard page between the stats grid and dog cards:

```
┌─ Today's Activity ──────────────────────────────┐
│                                                  │
│  ┌── Journal ──┐  ┌── Walks ───┐  ┌── Feed ──┐ │
│  │ ✅ Logged   │  │ 🐾 2 walks │  │ 📷 3 new  │ │
│  │ 🔥 Streak 7 │  │ ⏱️ 45 min  │  │   posts   │ │
│  └─────────────┘  └────────────┘  └──────────┘ │
│                                                  │
│  [Quick Log] [Log Walk] [View Feed]             │
└──────────────────────────────────────────────────┘
```

This widget on the dashboard provides quick access and visibility into daily engagement.

---

## 7. Push Notification Strategy

| Trigger                | Time                                     | Message                                                       |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Daily journal reminder | 8:00 PM (if not logged today)            | "🐾 How was Buddy today? Don't break your 7-day streak!"      |
| Walk reminder          | 6:00 PM (if no walks logged)             | "🚶 Time for an evening walk with Buddy?"                     |
| Community engagement   | When someone likes/comments on your post | "❤️ @luna_mom liked your post!"                               |
| Streak milestone       | On achievement                           | "🔥 Amazing! 30-day journal streak! You're a super paw-rent!" |

---

## 8. CSS Design Tokens (New)

Add to `globals.css` under existing token system:

```css
/* ─── Activity Feature Tokens ─── */
--mood-happy: #10b981;
--mood-neutral: #f59e0b;
--mood-sad: #6366f1;
--mood-sleepy: #8b5cf6;
--mood-sick: #ef4444;

--energy-low: #94a3b8;
--energy-medium: #f59e0b;
--energy-high: #10b981;

--streak-fire: #f97316;
--streak-bg: rgba(249, 115, 22, 0.1);

--community-like: #ef4444;
--community-comment: #3b82f6;

/* Walk chart */
--walk-bar: var(--color-primary);
--walk-bar-today: var(--color-primary-light);
--walk-bar-empty: var(--bg-input);
```

Dark theme overrides:

```css
[data-theme="dark"] {
  --mood-happy: #34d399;
  --mood-neutral: #fbbf24;
  --mood-sad: #818cf8;
  --mood-sleepy: #a78bfa;
  --mood-sick: #f87171;
  --streak-bg: rgba(249, 115, 22, 0.15);
}
```

---

## 9. Responsive Behavior

| Breakpoint          | Journal                                  | Walks                                      | Community                                       |
| ------------------- | ---------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Mobile (<768px)     | Full-width cards, stacked                | Full-width, bar chart scrolls horizontally | Single-column feed, full-width photos           |
| Tablet (768-1024px) | 2-col: log card + calendar side by side  | Same as mobile but wider bars              | Single-column feed, max-width 600px centered    |
| Desktop (>1024px)   | 2-col: log left + calendar/history right | Summary + chart top, history list below    | Feed centered, max-width 600px (like Instagram) |

---

## 10. Accessibility Requirements

| Feature          | Requirement                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Mood selectors   | `role="radiogroup"` with `aria-label`, each emoji has `aria-label` ("Happy", "Neutral", etc.) |
| Streak badge     | `aria-live="polite"` for updates                                                              |
| Walk chart       | Labeled bars with `aria-label="Monday: 45 minutes"`                                           |
| Community images | `alt` text = caption or "Photo posted by {name}"                                              |
| Like button      | `aria-pressed="true/false"`, `aria-label="Like, 12 likes"`                                    |
| Tab navigation   | Arrow keys to switch between Journal/Walks/Community                                          |
| Form validation  | Error messages linked via `aria-describedby`                                                  |

---

## 11. File Structure (New Files)

```
src/
├── app/
│   └── activity/
│       ├── page.tsx                    # Activity hub with tabs
│       └── community/
│           ├── new/page.tsx            # New post form
│           └── [postId]/page.tsx       # Post detail + comments
├── components/
│   └── activity/
│       ├── ActivityTabs.tsx            # Tab bar component
│       ├── journal/
│       │   ├── QuickLogCard.tsx        # Daily check-in form
│       │   ├── MoodSelector.tsx        # Emoji mood picker
│       │   ├── CalendarHeatmap.tsx     # Month heatmap grid
│       │   ├── StreakBadge.tsx         # 🔥 N days badge
│       │   └── JournalHistory.tsx      # Recent entries list
│       ├── walks/
│       │   ├── TodaySummary.tsx        # Today's walk stats
│       │   ├── WeeklyChart.tsx         # 7-day bar chart
│       │   ├── LogWalkModal.tsx        # Walk logging form
│       │   ├── WalkCard.tsx            # Single walk entry
│       │   └── WalkHistory.tsx         # Walk list with pagination
│       └── community/
│           ├── PostCard.tsx            # Feed post component
│           ├── PostActions.tsx         # Like, comment, share buttons
│           ├── CommentSection.tsx      # Comments list + input
│           ├── NewPostForm.tsx         # Photo upload + caption
│           └── FeedList.tsx            # Scrollable post list
├── hooks/
│   ├── useJournal.ts                   # Journal CRUD + streak logic
│   ├── useWalks.ts                     # Walk log CRUD + stats
│   └── useCommunity.ts                 # Posts, likes, comments
└── types/
    └── index.ts                        # Add new interfaces (above)
```

---

## 12. Implementation Priority & Dependencies

```
Phase 1A (Week 1-2): Foundation
├── 1. Add Activity route + tab component
├── 2. Update navigation (Sidebar + BottomNav)
├── 3. Add new types to types/index.ts
├── 4. Add new CSS tokens to globals.css
└── 5. Add Firestore collections + repository functions

Phase 1B (Week 2-3): Daily Health Journal
├── 1. QuickLogCard with all selectors
├── 2. CalendarHeatmap component
├── 3. Streak logic + badge
├── 4. Journal history list
└── 5. Push notification for streak reminder

Phase 1C (Week 3-4): Walk Log
├── 1. LogWalkModal with duration presets
├── 2. TodaySummary card
├── 3. WeeklyChart (pure CSS bars — no charting lib needed)
├── 4. WalkHistory with pagination
└── 5. Walk streak counter

Phase 1D (Week 4-5): Community Feed
├── 1. Feed list with post cards
├── 2. Like/unlike with optimistic UI
├── 3. New post form with photo upload + compression
├── 4. Comment system (post detail page)
├── 5. Report feature + admin moderation tab
└── 6. Storage rules update for community photos
```

---

## 13. Firestore Rules Update

```
// Add to firestore.rules
match /dailyJournals/{journalId} {
  allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
  allow update: if request.auth != null && resource.data.ownerId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
}

match /walkLogs/{walkId} {
  allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
}

match /communityPosts/{postId} {
  allow read: if request.auth != null;  // All authenticated users can read
  allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
  allow update: if request.auth != null && (
    resource.data.authorId == request.auth.uid ||  // Author can edit
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likeCount', 'likedBy', 'commentCount'])  // Anyone can like/comment
  );
  allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
}

match /communityComments/{commentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
}

match /reports/{reportId} {
  allow create: if request.auth != null && request.resource.data.reporterId == request.auth.uid;
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 14. Storage Rules Update

```
// Add to storage.rules
match /community/{userId}/{postId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.size < 2 * 1024 * 1024  // 2MB max
    && request.resource.contentType.matches('image/.*');
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

---

## 15. Handoff Checklist

| ✅  | Deliverable                            | Status   |
| --- | -------------------------------------- | -------- |
| ✅  | Information Architecture (routes, nav) | Complete |
| ✅  | Wireframes (all 3 features)            | Complete |
| ✅  | Component hierarchy                    | Complete |
| ✅  | Interaction specs                      | Complete |
| ✅  | Data models (TypeScript)               | Complete |
| ✅  | Firestore rules                        | Complete |
| ✅  | Storage rules                          | Complete |
| ✅  | CSS design tokens                      | Complete |
| ✅  | Responsive behavior                    | Complete |
| ✅  | Accessibility specs                    | Complete |
| ✅  | File structure                         | Complete |
| ✅  | Implementation order                   | Complete |
| ✅  | Read/Write estimates (Firebase budget) | Complete |

---

**Total estimated daily Firebase cost per active user:**

- Reads: ~98/day (31 journal + 17 walks + 50 community)
- Writes: ~9/day (2 journal + 2 walks + 5 community)
- At 50 daily active users: 4,900 reads/day + 450 writes/day (well within Spark limits)
- At 500 daily active users: 49,000 reads/day → approaches 50K limit → time to upgrade to Blaze

---

_Ready for Frontend Developer implementation. Follow Phase order strictly._
