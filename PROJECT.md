# PawShield — Project Status & Architecture Document

> **Last updated:** 28 May 2026
> **Purpose:** Reference document for AI agents and developers to understand the full project state.

---

## 1. Project Overview

**PawShield** is a Progressive Web App (PWA) for tracking dog vaccinations, health records, and reminders. It supports multi-dog management, public shareable vaccination profiles, push notifications, and an admin dashboard.

**Live URL:** Deployed on Firebase App Hosting
**Firebase Project:** `theatrack-9016c`

---

## 2. Tech Stack

| Layer      | Technology                                       | Version                          |
| ---------- | ------------------------------------------------ | -------------------------------- |
| Framework  | Next.js (App Router, Turbopack)                  | 16.2.4                           |
| React      | React 19                                         | 19.2.4                           |
| Language   | TypeScript (strict)                              | 5.x                              |
| Backend/DB | Firebase (Auth, Firestore, Storage, FCM)         | 12.12.1 (client), 13.8.0 (admin) |
| Styling    | Tailwind CSS 4 + CSS Custom Properties           | 4.x                              |
| Icons      | Lucide React                                     | 1.8.0                            |
| PDF Gen    | jsPDF + jspdf-autotable                          | 4.2.1 / 5.0.7                    |
| QR Code    | qrcode.react                                     | 4.2.0                            |
| Dates      | date-fns                                         | 4.1.0                            |
| Toasts     | react-hot-toast                                  | 2.6.0                            |
| Linting    | ESLint 9 (flat config) + Prettier                | 9.x / 3.8.3                      |
| Git Hooks  | Husky 9 + lint-staged                            | 9.1.7 / 16.4.0                   |
| Node       | >=22 (enforced via engines + .nvmrc)             | 22                               |
| Hosting    | Firebase App Hosting + Vercel (security headers) | —                                |
| CI         | GitHub Actions (lint + build on push/PR to main) | —                                |

---

## 3. Project Structure

```
pawshield/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Landing page (public, redirects auth users)
│   │   ├── layout.tsx            # Root layout (fonts, providers, no-flash script)
│   │   ├── globals.css           # Full design system (3 themes + tokens)
│   │   ├── login/page.tsx        # Login/register (Google, Email, Demo)
│   │   ├── dashboard/page.tsx    # Main dashboard (stats, dog cards, reminders)
│   │   ├── dogs/
│   │   │   ├── page.tsx          # Dog list (all user's dogs)
│   │   │   ├── new/page.tsx      # Add new dog form
│   │   │   └── [dogId]/
│   │   │       ├── page.tsx      # Dog detail (profile + vaccination records)
│   │   │       └── edit/page.tsx # Edit dog form
│   │   ├── reminders/page.tsx    # Vaccination reminders + system notifications
│   │   ├── settings/page.tsx     # User settings (theme, name, notifications)
│   │   ├── admin/page.tsx        # Admin panel (full platform management)
│   │   ├── share/[token]/page.tsx# Public vaccination profile viewer
│   │   └── api/
│   │       ├── send-notification/route.ts    # POST: FCM broadcast (admin)
│   │       ├── admin/storage-stats/route.ts  # GET: Storage usage (admin)
│   │       └── share/[token]/route.ts        # GET: Public dog data
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Auth guard + sidebar/nav wrapper
│   │   │   ├── Sidebar.tsx       # Desktop sidebar navigation
│   │   │   ├── BottomNav.tsx     # Mobile bottom navigation
│   │   │   ├── PWAHeader.tsx     # Mobile top header bar
│   │   │   ├── FeedbackOverlay.tsx    # In-app bug/feature report modal
│   │   │   ├── GlobalNotification.tsx # System-wide notification banner
│   │   │   └── ThemedToaster.tsx      # Theme-aware toast notifications
│   │   ├── dashboard/
│   │   │   └── OnboardingWizard.tsx   # First-time user 3-step onboarding
│   │   └── PWAInstallBanner.tsx       # Install prompt for iOS/Android
│   ├── hooks/
│   │   ├── useAuth.tsx           # Auth context + provider (Firebase Auth)
│   │   ├── useDogs.ts            # Real-time Firestore dog subscription
│   │   ├── useVaccinations.ts    # Real-time vaccination records + types
│   │   ├── useFCM.ts             # Push notification permission + token
│   │   ├── usePWAInstall.ts      # PWA install prompt management
│   │   └── useTheme.tsx          # Theme context (light/dark/colorful)
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts         # Client SDK init (persistent cache + multi-tab)
│   │   │   ├── auth.ts           # Auth helpers (Google, email, demo, profile)
│   │   │   └── admin.ts          # Admin SDK (server-side: messaging, DB, storage)
│   │   ├── repositories/
│   │   │   └── index.ts          # ALL Firestore CRUD (dogs, records, users, etc.)
│   │   ├── utils/
│   │   │   ├── dateUtils.ts      # Date formatting, vaccination status calc
│   │   │   └── imageUtils.ts     # Client-side image compression (Canvas API)
│   │   ├── data/
│   │   │   └── vaccinationTypes.ts  # Default vaccination types (seeded)
│   │   ├── seed.ts               # DB seeding (vaccination types + demo account)
│   │   └── demo/                 # (reserved for demo data)
│   └── types/
│       └── index.ts              # ALL TypeScript interfaces & types
├── public/
│   ├── manifest.json             # PWA manifest (shortcuts, icons)
│   ├── firebase-messaging-sw.js  # FCM service worker
│   ├── icons/                    # App icons (192, 512)
│   └── images/                   # Onboarding illustrations
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Storage security rules (5MB, images/PDF only)
├── apphosting.yaml               # Firebase App Hosting config
├── vercel.json                   # Security headers
├── .github/workflows/ci.yml      # CI: lint + build on main
├── .husky/pre-commit             # Runs lint-staged
├── eslint.config.mjs             # ESLint 9 flat config
├── .prettierrc                   # Prettier config
├── .editorconfig                 # Editor standardization
└── .nvmrc                        # Node 22
```

---

## 4. Features (Complete)

### 4.1 Authentication

- **Google OAuth** sign-in (popup)
- **Email/password** sign-in + registration
- **Demo mode** — shared demo account with pre-seeded dogs and records
- **Auto profile creation** in Firestore on first sign-in
- **Human-readable error messages** for all Firebase Auth error codes
- **Roles:** `owner` (default), `admin`, `vet`
- **Plans:** `free`, `pro` (pro features not yet gated)

### 4.2 Dog Management

- **Create/Edit/Delete** dogs with:
  - Name, breed (autocomplete from list), DOB, gender, weight, color
  - Photo upload (compressed to 600×600px, max 300KB)
  - Optional: microchip number, insurance details, emergency vet info, notes
- **Multi-dog support** — no limit on number of dogs per user
- **Soft delete** (`isActive: false`) with hard delete option
- **Photo management** — old photos are automatically deleted from Storage when replaced or removed
- **Real-time subscriptions** via Firestore `onSnapshot`

### 4.3 Vaccination Tracking

- **Pre-loaded vaccination types** (seeded on first use):
  - Core: Rabies, DHPP, Leptospirosis
  - Non-core: Bordetella, Lyme Disease, Canine Influenza
  - Preventive: Heartworm, Flea & Tick
- **Custom vaccination types** — admins/users can create their own
- **Vaccination records** per dog:
  - Type, date administered, auto-calculated next due date
  - Vet name, clinic, batch number, manufacturer
  - Certificate upload (image or PDF, compressed to 1200×1600, max 500KB)
  - Side effects tracking, cost
- **Status system** (color-coded):
  - 🟢 Green: >30 days until due
  - 🟡 Yellow: ≤30 days until due
  - 🔴 Red: Overdue
- **Certificate preview** — lightbox viewer with PDF fallback
- **Storage cleanup** — deleting a record also deletes the certificate from Storage

### 4.4 Reminders

- **Automatic reminders** at 7, 3, and 1 day before due date
- **Visual reminder list** with calendar and list views
- **Overdue highlighting** with color-coded urgency
- **System notifications** (admin-broadcast) shown alongside reminders

### 4.5 Sharing (Public Profiles)

- **Shareable links** — generate a read-only URL valid for 30 days
- **No auth required** to view a shared profile
- **API route** (`/api/share/[token]`) fetches dog + records via Admin SDK
- **Public page** (`/share/[token]`) renders vaccination records for vets/groomers
- **Token management** — copy link, revoke, multiple active tokens per dog

### 4.6 PDF Export

- **Generate PDF** vaccination record from dog detail page
- **jsPDF + autoTable** — includes dog info table + full vaccination history
- **Auto-download** with dog name in filename

### 4.7 Admin Panel (`/admin`)

- **Role-gated** — only users with `role === "admin"` can access
- **6 tabs:** Overview, Users, Vaccinations, Feedback, Notifications, Audit Logs
- **Overview tab:**
  - Clickable stat cards (Total Users, Dogs, Vaccinations, Overdue) → navigate to relevant tab
  - Platform Health bar (up-to-date / due soon / overdue)
  - Quick stats (admin count, vaccine types)
  - Firestore Document Usage (per-collection bars vs soft ceiling)
  - **Live Cloud Storage Usage** — calls `/api/admin/storage-stats` for real-time 5GB gauge with per-folder breakdown (dogs, certificates, health, other)
  - Recent Activity log
- **Users tab:** search, view roles/plans, role toggle, suspend
- **Vaccinations tab:** view/create/delete vaccination types
- **Feedback tab:** view user feedback, change status (new → in-progress → reviewed → resolved), delete
- **Notifications tab:** broadcast system notifications (saved to Firestore + sent via FCM)
- **Audit Logs tab:** track admin actions

### 4.8 Push Notifications (FCM)

- **VAPID-based** web push via Firebase Cloud Messaging
- **Permission flow** in Settings page
- **FCM tokens** stored per user (array — supports multiple devices)
- **Admin broadcast** — sends to all registered tokens via `/api/send-notification`
- **Service worker** (`public/firebase-messaging-sw.js`) for background notifications

### 4.9 PWA Features

- **Installable** (manifest.json with icons, shortcuts, splash)
- **Install banner** — smart detection for iOS (manual instructions) and Android/Chrome (native prompt)
- **Offline cache** — Firestore persistent local cache with multi-tab manager
- **App shortcuts** — "Add New Dog", "Reminders", "My Dogs"
- **Display modes:** standalone, minimal-ui fallback
- **Portrait-only** orientation

### 4.10 Theming

- **3 themes:** Light (teal), Dark (navy/teal), Colorful (purple — default)
- **CSS custom properties** system — all colors via `var(--token)`
- **No-flash script** in `<head>` reads localStorage before paint
- **Theme picker** in Settings page with live previews
- **Theme-aware** — all UI components use CSS variables, not hardcoded colors

### 4.11 UI/UX

- **Responsive layout** — sidebar (desktop) + bottom nav (mobile)
- **Glass-morphism cards** with theme-aware transparency
- **Skeleton loading states** throughout
- **Smooth animations** (fade-in, scale-in, stagger)
- **Accessible** — focus-visible outlines, prefers-reduced-motion, touch feedback
- **Onboarding wizard** — 3-step carousel for new users
- **Feedback overlay** — floating bug report button on all pages

### 4.12 Settings Page

- **Display name** edit (updates Firebase Auth + Firestore)
- **Theme selection** (3 themes with visual previews)
- **Push notification** enable/disable
- **Account info** display

---

## 5. Data Model (Firestore Collections)

| Collection           | Document ID | Key Fields                                                                       |
| -------------------- | ----------- | -------------------------------------------------------------------------------- |
| `users`              | `{uid}`     | email, displayName, role, plan, settings, fcmTokens[]                            |
| `dogs`               | auto        | ownerId, name, breed, dateOfBirth, gender, weight, photoUrl, isActive            |
| `vaccinationTypes`   | auto        | name, category, defaultIntervalDays, isSystem, isActive                          |
| `vaccinationRecords` | auto        | dogId, ownerId, vaccinationTypeId, dateAdministered, nextDueDate, certificateUrl |
| `healthRecords`      | auto        | dogId, ownerId, type, title, date, attachmentUrl                                 |
| `reminders`          | auto        | dogId, ownerId, vaccinationRecordId, reminderDate, dueDate, type                 |
| `feedback`           | auto        | userId, type (bug/feature/other), message, status                                |
| `notifications`      | auto        | title, message, type, isActive, createdBy                                        |
| `adminLogs`          | auto        | adminId, action, targetType, targetId, details, timestamp                        |
| `shareTokens`        | `{token}`   | dogId, ownerId, expiresAt (30 days)                                              |

---

## 6. Storage Structure (Firebase Storage)

```
/dogs/{userId}/{uuid}                     — Dog profile photos
/certificates/{userId}/{dogId}/{uuid}     — Vaccination certificates
/health/{userId}/{dogId}/{uuid}           — Health record attachments
```

**Rules:** Authenticated users can read all; only owner can write; max 5MB; images only for dog photos; images+PDF for certificates and health records.

**Cleanup:** Old files are automatically deleted when:

- Dog photo is replaced (new upload)
- Dog photo is explicitly removed
- A dog is deleted
- A vaccination record is deleted (certificate removed)

---

## 7. API Routes (Server-Side)

| Route                      | Method | Auth                 | Purpose                             |
| -------------------------- | ------ | -------------------- | ----------------------------------- |
| `/api/send-notification`   | POST   | Bearer token (admin) | Broadcast FCM push to all users     |
| `/api/admin/storage-stats` | GET    | Bearer token (admin) | Live storage usage breakdown        |
| `/api/share/[token]`       | GET    | None (public)        | Fetch dog + records for shared link |

---

## 8. Security

### Firestore Rules

- All reads/writes require authentication (except shareTokens which are public-read)
- Owner-based access control (ownerId match)
- Admin override for management operations
- Share tokens use the token itself as the secret (public read, owner create/delete)

### Storage Rules

- 5MB max upload size
- Content-type validation (images only for photos, images+PDF for certs)
- Owner-only writes (path-based: `/dogs/{userId}/...`)

### HTTP Security Headers (vercel.json)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Authentication

- Firebase Auth handles all auth (Google OAuth + email/password)
- API routes verify Firebase ID tokens via Admin SDK
- Admin endpoints verify `role === "admin"` in Firestore after token verification

---

## 9. Environment Variables

### Client-side (exposed via `NEXT_PUBLIC_*`)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

### Server-side only

```
FIREBASE_ADMIN_CREDENTIALS  — JSON service account (for Admin SDK)
```

---

## 10. Development Workflow

### Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all
npm run format:check # Prettier check
npm run typecheck    # TypeScript check (no emit)
npm run validate     # typecheck + lint + format:check
npm run deploy:rules # Deploy Firestore rules
```

### Pre-commit Hook (Husky + lint-staged)

- `*.{ts,tsx}` → `prettier --write` + `eslint --fix --max-warnings 0`
- `*.{css,json,md}` → `prettier --write`

### CI (GitHub Actions)

- Runs on push/PR to `main`
- Steps: checkout → Node 20 → npm ci → lint → build

---

## 11. Firebase Plan Constraints (Spark — Free Tier)

| Resource          | Limit                 |
| ----------------- | --------------------- |
| Storage           | 5 GB                  |
| Firestore Storage | 1 GiB                 |
| Firestore Reads   | 50K/day               |
| Firestore Writes  | 20K/day               |
| Auth Users        | Unlimited             |
| Hosting           | 10 GB/month bandwidth |

The admin panel displays live storage usage against the 5 GB limit.

---

## 12. What's NOT Yet Implemented (Potential TODOs)

- [ ] Pro plan features (billing, gated features)
- [ ] Vet role functionality (vet-specific views)
- [ ] Multi-user sharing (sharedWith[] on dogs — field exists but no UI)
- [ ] Cloud Functions for automated reminders (currently manual)
- [ ] Email notifications (only push currently)
- [ ] Dog weight history tracking/graphing
- [ ] Health record detail page
- [ ] Export all data (GDPR compliance)
- [ ] Account deletion flow
- [ ] Testing (no test suite exists)
- [ ] Performance monitoring / analytics
- [ ] Rate limiting on API routes
- [ ] Pagination for admin lists (currently loads all)

---

## 13. Key Design Decisions

1. **All client components** — Next.js App Router with `"use client"` throughout (except API routes). No RSC data fetching; all data flows through Firestore real-time subscriptions.

2. **Repository pattern** — Single `src/lib/repositories/index.ts` handles ALL Firestore operations. No direct Firestore calls in components.

3. **CSS Variables for theming** — No Tailwind theme extension. All theming via `data-theme` attribute on `<html>` + CSS custom properties in `globals.css`.

4. **Image compression** — Client-side Canvas API compression before upload. Dogs: 600px, certs: 1200px. Keeps Storage costs low.

5. **Storage cleanup** — Automatic deletion of orphaned files when docs are updated/deleted. No orphan cleanup job needed.

6. **Admin SDK for API routes** — Server-side Admin SDK accesses Firestore/Storage without client-side security rules. Used for push notifications, storage stats, and public share endpoints.

7. **No SSR data fetching** — `use(params)` for dynamic route params (Next.js 16 pattern), but all data is fetched client-side via hooks.

8. **Persistent local cache** — Firestore `persistentLocalCache` with `persistentMultipleTabManager` enables offline-first experience.

---

## 14. Quick Reference: File Locations

| Need to...                    | File                                                  |
| ----------------------------- | ----------------------------------------------------- |
| Add a new Firestore operation | `src/lib/repositories/index.ts`                       |
| Add a new type/interface      | `src/types/index.ts`                                  |
| Add a new page                | `src/app/{route}/page.tsx`                            |
| Add a new API endpoint        | `src/app/api/{route}/route.ts`                        |
| Modify theming/colors         | `src/app/globals.css`                                 |
| Add a new hook                | `src/hooks/`                                          |
| Modify navigation             | `src/components/layout/Sidebar.tsx` + `BottomNav.tsx` |
| Add a vaccination type        | `src/lib/data/vaccinationTypes.ts`                    |
| Modify security rules         | `firestore.rules` or `storage.rules`                  |
| Add environment variables     | `.env.example` + `apphosting.yaml`                    |

---

_This document should be updated whenever significant features are added or architectural decisions change._
