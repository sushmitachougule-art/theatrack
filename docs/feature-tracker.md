# PawShield — Feature Ideas Tracker

> **Created:** 28 May 2026
> **Purpose:** Track all discussed feature ideas, implementation status, and risk assessment
> **Last Updated:** 28 May 2026

---

## Implementation Status Legend

- ✅ = Fully implemented
- 🔨 = Foundation/scaffolding done (types, routes, repo functions)
- ⬜ = Not started
- 🚫 = Rejected / Deprioritized

---

## TIER 1: Daily Engagement Drivers (Build Now)

### 1. Daily Health Journal

| Aspect         | Details                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Status**     | 🔨 Foundation done (Phase 1A)                                         |
| **What**       | 30-second daily check-in: mood, energy, appetite, poop quality, notes |
| **Engagement** | Daily (creates habit loop)                                            |
| **Phase**      | 1B                                                                    |

| ✅ Done | Item                                                                    |
| ------- | ----------------------------------------------------------------------- |
| ✅      | TypeScript interfaces (`DailyJournal`, mood/energy/appetite/poop types) |
| ✅      | Firestore repository functions (save, get, getByMonth, subscribe)       |
| ✅      | CSS design tokens (mood colors, streak colors)                          |
| ✅      | Activity page route + tab navigation                                    |
| ⬜      | QuickLogCard UI component                                               |
| ⬜      | MoodSelector (emoji row)                                                |
| ⬜      | EnergySelector / AppetiteSelector / PoopSelector (radio pills)          |
| ⬜      | CalendarHeatmap (month grid colored by mood)                            |
| ⬜      | StreakBadge (🔥 N days)                                                 |
| ⬜      | Streak logic (break tolerance, milestones)                              |
| ⬜      | JournalHistory (recent 7 entries)                                       |
| ⬜      | Push notification for streak reminder                                   |
| ⬜      | Dashboard "Today's Activity" widget                                     |

**Pros:**

- Extremely low friction (30 seconds)
- Creates daily habit → users open app every day
- Builds valuable health data over time → patterns emerge
- Gamification via streaks increases retention
- Zero storage cost (text-only data)

**Cons:**

- Users might find it repetitive after weeks
- No immediate "reward" for logging (delayed gratification)
- Multi-dog users need to log each dog separately

**Benefits:**

- Transforms app from "open once a year" to "open every day"
- Early warning system for health issues (3 days of poor appetite → vet alert)
- Data can feed future AI health assistant feature
- Streaks create psychological commitment (users won't delete an app with a 30-day streak)

**Risks:**

- LOW: Minimal Firebase cost (~31 reads + 2 writes per day per user)
- LOW: No storage needed (text only)
- MEDIUM: Streak notifications could annoy users → need opt-out

---

### 2. Walk Log / Tracker

| Aspect         | Details                                                           |
| -------------- | ----------------------------------------------------------------- |
| **Status**     | 🔨 Foundation done (Phase 1A)                                     |
| **What**       | Log daily walks with duration, distance (manual), mood after walk |
| **Engagement** | 1-3× daily                                                        |
| **Phase**      | 1C                                                                |

| ✅ Done | Item                                                                       |
| ------- | -------------------------------------------------------------------------- |
| ✅      | TypeScript interfaces (`WalkLog`, `WalkMood`)                              |
| ✅      | Firestore repository functions (create, delete, subscribe, getByDateRange) |
| ✅      | CSS design tokens (walk bar chart colors)                                  |
| ✅      | Activity page tab                                                          |
| ⬜      | LogWalkModal (duration presets + custom input)                             |
| ⬜      | TodaySummary card (walks count, total mins, streak)                        |
| ⬜      | WeeklyChart (7-day bar chart, pure CSS)                                    |
| ⬜      | WalkHistory (scrollable list grouped by day)                               |
| ⬜      | WalkCard component                                                         |
| ⬜      | Walk streak counter                                                        |
| ✅      | GPS tracking (Phase 3A — battery-optimized watchPosition, Haversine calc)  |
| ⬜      | Map rendering with route (Phase 4 — needs Leaflet/Mapbox)                  |
| ⬜      | Share walk to community (Phase 4)                                          |

**Pros:**

- Most natural daily action — dog owners walk 1-3× per day regardless
- Quick to log (tap preset duration → save)
- Visual weekly chart gives satisfying progress view
- Lays groundwork for GPS feature (big differentiator later)

**Cons:**

- Manual logging creates friction vs. automatic GPS trackers (Fi collar, Apple Watch)
- Without GPS, distance is guesswork
- May feel redundant to users who already track walks via Apple Health/Google Fit

**Benefits:**

- 1-3 touchpoints per day (highest engagement frequency of all features)
- Combined with journal → app becomes a daily companion
- Walk data can trigger insights ("Buddy walked 30% less this week — check energy levels")
- Streak gamification works naturally with walks

**Risks:**

- LOW: Minimal Firebase cost (~17 reads + 2 writes per day)
- LOW: No storage needed
- MEDIUM: Users may abandon if GPS isn't added relatively quickly (Phase 2 priority)

---

### 3. Community Feed (Dog Social Media)

| Aspect         | Details                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| **Status**     | 🔨 Foundation done (Phase 1A)                                                |
| **What**       | Instagram-style photo feed for dog owners: post photos, like, comment, share |
| **Engagement** | Multiple times daily (social media habit loop)                               |
| **Phase**      | 1D                                                                           |

| ✅ Done | Item                                                                                      |
| ------- | ----------------------------------------------------------------------------------------- |
| ✅      | TypeScript interfaces (`CommunityPost`, `CommunityComment`, `Report`)                     |
| ✅      | Firestore repository functions (create, like/unlike, delete, subscribe, comments, report) |
| ✅      | CSS design tokens (like/comment colors)                                                   |
| ✅      | Activity page tab                                                                         |
| ⬜      | PostCard component (header, image, caption, actions)                                      |
| ⬜      | FeedList (scrollable, load-more pagination)                                               |
| ⬜      | PostActions (like with optimistic UI, comment count, share)                               |
| ⬜      | NewPostForm (photo upload + compression + caption + tags)                                 |
| ⬜      | PostDetailPage (`/activity/community/[postId]`)                                           |
| ⬜      | CommentSection (list + input)                                                             |
| ⬜      | Report button + admin moderation tab                                                      |
| ⬜      | Double-tap to like animation                                                              |
| ⬜      | Storage rules for community photos                                                        |
| ⬜      | Firestore rules for community collections                                                 |

**Pros:**

- Social features are THE #1 retention driver in consumer apps
- Dog owners LOVE sharing photos (natural behavior)
- Creates network effects (more users → more content → more value)
- Drives word-of-mouth growth ("check out my dog on PawShield!")
- Makes the app feel alive and dynamic

**Cons:**

- Highest complexity of all 3 Phase 1 features
- Requires content moderation (spam, inappropriate content)
- Storage-heavy (photos use Firebase Storage quota)
- Cold start problem (empty feed = no value until users post)
- `likedBy[]` array doesn't scale past ~100 likes per post

**Benefits:**

- Viral growth potential (users invite friends to see their posts)
- Stickiest feature — social apps have highest retention
- Creates emotional connection to the platform
- Can monetize later (promoted posts, brand partnerships)
- Community data informs other features (popular breeds, trending topics)

**Risks:**

- **HIGH: Storage consumption** — Each photo ~150-200KB. 100 users × 1 post/week = 800KB/week. At scale, hits 5GB free tier fast
- **MEDIUM: Moderation burden** — Inappropriate content, spam, harassment. No automated moderation in Phase 1
- **MEDIUM: Cold start** — Need to seed with demo content or first-mover incentives
- **LOW-MEDIUM: Read costs** — 10 reads per feed load × many loads/day. Community drives most of the read budget
- **SCALING:** `likedBy[]` array → subcollection needed at >100 likes/post (Phase 2 refactor)

---

## TIER 2: Weekly Engagement Drivers (Build Next)

### 4. Training Tracker & Challenges

| Aspect         | Details                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Fully implemented                                                                        |
| **What**       | Gamified training progress: modules (sit, stay, recall), weekly challenges, video tutorials |
| **Engagement** | 3-5× per week                                                                               |

**Pros:**

- Training is an ongoing activity (months/years for each dog)
- Natural gamification (progress bars, completion badges)
- Weekly challenges create recurring engagement hooks
- Content can be curated (link to YouTube) — no video hosting cost

**Cons:**

- Requires content creation (training modules, challenge descriptions)
- Competitive space (Pupford, Dogo, GoodPup are dedicated training apps)
- Hard to validate that training actually happened (honor system)

**Benefits:**

- Fills the gap between daily journal and annual vaccinations
- Appeals to new dog owners (puppies need the most training)
- Community integration: share training wins to feed

**Risks:**

- MEDIUM: Content curation effort (not a pure code task)
- LOW: Firebase cost (text-only, minimal reads)
- LOW: No storage needed unless adding user training videos (don't)

---

### 5. Dog Park & Places Finder

| Aspect         | Details                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| **Status**     | ⬜ Not started                                                                        |
| **What**       | Map of dog-friendly locations (parks, cafes, vets, groomers), user reviews, check-ins |
| **Engagement** | 2-3× per week                                                                         |

**Pros:**

- High utility — dog owners constantly search for new places
- User-generated content creates network effects
- Check-ins drive community engagement
- "Playdate Finder" (match dogs by size/temperament) is unique differentiator

**Cons:**

- Requires map integration (Leaflet is free, but map tiles need loading)
- Cold start: need initial location data (or crowdsource from users)
- Location-based features need GPS permissions (some users deny)
- Geolocation queries are complex in Firestore (geohashing)

**Benefits:**

- High utility keeps users coming back
- Natural social feature (see who's at the park)
- Revenue opportunity (local businesses pay for featured listings)

**Risks:**

- **HIGH: Complexity** — Maps, geolocation queries, geohashing in Firestore
- **MEDIUM: Firebase reads** — Geo queries can be expensive (multiple reads per radius search)
- **LOW: Storage** — Minimal (location data is text + user review photos)
- **MEDIUM: Data sourcing** — Need initial seed data for parks/places

---

### 6. Expense Tracker

| Aspect         | Details                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Fully implemented (Phase 2B)                                                                      |
| **What**       | Log all dog expenses (vet, food, toys, grooming, insurance), monthly/yearly summaries, budget alerts |
| **Engagement** | Weekly                                                                                               |

**Pros:**

- Simple to build (CRUD + charts)
- Genuinely useful (dogs cost $1,000-3,000/year)
- No storage needed (text/numbers only)
- Builds value over time (yearly comparisons)
- Low Firebase cost

**Cons:**

- Not "fun" — feels like admin work
- Lower engagement driver than social features
- Competitive with general budgeting apps (Mint, YNAB)

**Benefits:**

- Sticky data — once you have 6 months of expenses, you won't switch apps
- Insights ("You spent $500 more on food this year — consider bulk buying")
- Supports multi-dog comparison

**Risks:**

- LOW: Very simple to implement, minimal Firebase cost
- LOW: No storage, no complex queries
- MEDIUM: May not drive daily engagement (weekly at best)

---

## TIER 3: Retention & Stickiness Features (Build Later)

### 7. AI Health Assistant (Chat)

| Aspect         | Details                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Status**     | ⬜ Not started                                                                           |
| **What**       | "Ask PawShield AI" — symptom checker, breed-specific health alerts, diet recommendations |
| **Engagement** | As-needed (but high retention value)                                                     |

**Pros:**

- Dog owners constantly Google symptoms — bring that in-app
- Can use journal data to provide personalized insights
- Breed-specific advice is a strong differentiator
- "When should I worry?" triaging reduces vet anxiety

**Cons:**

- Requires LLM API integration (OpenAI/Anthropic) — costs money per query
- Medical liability risk — must include strong disclaimers
- Quality of responses must be high (bad medical advice = trust destroyed)

**Benefits:**

- Major retention moat (users trust the AI → won't leave)
- Personalized health insights using accumulated journal/walk data
- Reduces "should I call the vet?" anxiety

**Risks:**

- **HIGH: API costs** — LLM calls cost $0.01-0.10 per query. 100 users × 5 queries/day = $15-150/day
- **HIGH: Liability** — Medical advice for animals. Need strong "not a vet" disclaimers
- **MEDIUM: Quality** — Bad responses erode trust permanently
- **MEDIUM: Implementation** — Needs server-side API route + rate limiting
- **CONSIDERATION:** Could start with rule-based alerts (no LLM) before upgrading to AI

---

### 8. Lost Dog Network

| Aspect         | Details                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Status**     | ⬜ Not started                                                                           |
| **What**       | Mark dog as lost → instant alert to nearby users. Sighting reports with location + photo |
| **Engagement** | Rare but massive stickiness                                                              |

**Pros:**

- Every dog owner's worst nightmare → emotional value is immense
- Users will NEVER delete an app that could find their lost dog
- Creates strong community bonds
- Drives word-of-mouth ("download PawShield so we can alert you if a dog is lost nearby")
- Microchip number already in dog profile

**Cons:**

- Rarely used (most dogs don't get lost)
- Requires location-based alerting (complex)
- False alerts could annoy users
- Need critical mass of users in same geographic area to be useful

**Benefits:**

- The #1 reason users WON'T uninstall the app
- Strong community goodwill and PR potential
- Integrates with existing microchip data
- Drives user acquisition (safety = compelling reason to join)

**Risks:**

- **MEDIUM: Geolocation complexity** — Same as Dog Park feature (geohashing)
- **LOW: Firebase cost** — Rare writes, push notifications to nearby users
- **HIGH: Critical mass needed** — Useless with 10 users in a city. Need density
- **LOW: Liability** — No promise of finding the dog, just community alerts

---

### 9. Events & Meetups

| Aspect         | Details                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| **Status**     | ⬜ Not started                                                                       |
| **What**       | Local dog events, user-created meetups, RSVP, recurring events, event photos to feed |
| **Engagement** | Weekly-Monthly                                                                       |

**Pros:**

- In-person connections drive long-term platform loyalty
- User-generated events = free content
- Integration with community feed (event photos)
- Recurring events create habitual engagement

**Cons:**

- Needs geographic density (same problem as Lost Dog)
- Requires calendar/date-time UX (complex)
- Low value in areas with few users
- Competition with Facebook Groups, Meetup.com

**Benefits:**

- Deepens community relationships beyond digital
- Creates content for community feed (event photos)
- Revenue opportunity (promoted events, ticketed events)

**Risks:**

- **MEDIUM: Cold start** — Need enough users in one area
- **LOW: Firebase cost** — Text data, minimal reads
- **MEDIUM: Moderation** — Ensure events are legitimate/safe

---

### 10. Breed-Specific Content Hub

| Aspect         | Details                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| **Status**     | ⬜ Not started                                                                        |
| **What**       | Weekly articles/tips based on user's dog breed, seasonal alerts, age-based milestones |
| **Engagement** | Weekly (push notification driven)                                                     |

**Pros:**

- Personalized content feels premium
- Push notifications drive weekly re-engagement
- Seasonal alerts are genuinely useful (heat safety, holiday hazards)
- Age-based milestones are relevant and timely

**Cons:**

- Requires content creation/curation (editorial effort)
- Content can become stale without regular updates
- Not interactive — passive consumption

**Benefits:**

- Low-effort weekly touchpoint via push notifications
- Builds trust ("PawShield knows about my breed")
- Content can be AI-generated (low ongoing cost)
- Seasonal alerts create timely urgency

**Risks:**

- **LOW: Firebase cost** — Read-only content, served to many
- **MEDIUM: Content effort** — Need initial library + ongoing additions
- **LOW: Storage** — Text content, maybe a few images
- **CONSIDERATION:** Can be AI-generated with human review

---

## Already Implemented Features (Core Platform)

| Feature                                        | Status  |
| ---------------------------------------------- | ------- |
| ✅ Google + Email auth + Demo mode             | Shipped |
| ✅ Multi-dog management (CRUD + photos)        | Shipped |
| ✅ Vaccination tracking + status system        | Shipped |
| ✅ Vaccination reminders (7/3/1 day)           | Shipped |
| ✅ PDF export of vaccination records           | Shipped |
| ✅ Shareable public vaccination profiles       | Shipped |
| ✅ Admin panel (6 tabs)                        | Shipped |
| ✅ Push notifications (FCM)                    | Shipped |
| ✅ PWA install + offline cache                 | Shipped |
| ✅ 3-theme system (light/dark/colorful)        | Shipped |
| ✅ Storage auto-cleanup on image update/delete | Shipped |
| ✅ Live storage usage visualization (admin)    | Shipped |
| ✅ Onboarding wizard                           | Shipped |
| ✅ Feedback overlay (bug/feature reports)      | Shipped |

---

## Firebase Budget Impact Summary

| Feature          | Daily Reads/User | Daily Writes/User | Storage Impact           |
| ---------------- | ---------------- | ----------------- | ------------------------ |
| Current Platform | ~20              | ~3                | Low (dog photos, certs)  |
| Daily Journal    | ~31              | ~2                | None                     |
| Walk Log         | ~17              | ~2                | None                     |
| Community Feed   | ~50              | ~5                | **HIGH** (photos)        |
| Training Tracker | ~10              | ~2                | None                     |
| Dog Park Finder  | ~30              | ~1                | Low (review photos)      |
| Expense Tracker  | ~5               | ~2                | None                     |
| AI Assistant     | ~2               | ~1                | None (but LLM API cost!) |
| Lost Dog Network | ~1 (rare)        | ~1 (rare)         | Low                      |
| Events           | ~10              | ~1                | None                     |
| Content Hub      | ~5               | ~0                | Low                      |

**Break-even point (Spark → Blaze):**

- At ~500 daily active users with all Tier 1 features → hits 50K read limit
- Community photos at ~200 active posters → approaches 5GB storage limit
- **Recommendation:** Plan Blaze upgrade when reaching 200+ active users

---

## Implementation Roadmap

| Phase  | Features                                        | Timeline      | Status |
| ------ | ----------------------------------------------- | ------------- | ------ |
| **1A** | Foundation (types, routes, nav, repo functions) | Done          | ✅     |
| **1B** | Daily Health Journal (full UI)                  | Done          | ✅     |
| **1C** | Walk Log (full UI)                              | Done          | ✅     |
| **1D** | Community Feed (full UI)                        | Done          | ✅     |
| **2A** | Training Tracker                                | Done          | ✅     |
| **2B** | Expense Tracker                                 | Done          | ✅     |
| **3A** | GPS Walk Tracking (Phase 2 of walks)            | Done          | ✅     |
| **3B** | Playdate Requests + Lightweight DM Chat         | Done          | ✅     |
| **3C** | Lost Dog Network                                | After Phase 3 | ⬜     |
| **3D** | AI Health Assistant                             | After Phase 3 | ⬜     |
| **3E** | Dog Park Finder                                 | After Phase 3 | ⬜     |
| **3F** | Events & Meetups                                | After Phase 4 | ⬜     |
| **3G** | Breed-Specific Content                          | After Phase 4 | ⬜     |

---

## Key Strategic Decisions Pending

1. **When to upgrade to Firebase Blaze?** — Before or after community feature launch?
2. **Content moderation approach** — Manual only (Phase 1) vs. automated (AI flagging)?
3. ~~**GPS tracking library**~~ — Resolved: Using Browser Geolocation API with battery-optimized watchPosition (5m min distance, 3s interval, 50m accuracy filter)
4. **AI Assistant provider** — OpenAI vs. Anthropic vs. rule-based first?
5. **Monetization model** — Pro plan features? Ads? Brand partnerships?

---

_Update this document as features are implemented or new ideas arise._
