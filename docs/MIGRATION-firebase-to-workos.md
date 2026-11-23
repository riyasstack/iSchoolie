# Firebase → WorkOS AuthKit + Postgres

Firebase is being removed from this project entirely: Authentication, Firestore,
Cloud Messaging and the emulator tooling. WorkOS AuthKit becomes the only
credential store and Postgres (Prisma) becomes the only data store.

The work is staged so the app keeps working until the switch-over, because
Firebase Auth is not separable from Firestore: `firestore.rules` authorises
every read and write on the Firebase token, so deleting Auth before the data
layer moves would break the whole app.

## Why a backend is unavoidable

The app is currently a static export (`output: 'export'`) served by Firebase
Hosting on the Spark plan, with all data access in the browser. WorkOS AuthKit
needs server code: PKCE exchange, a sealed session cookie, and a place to hold
the API key. So the export goes away and the app is served by a Node runtime.

| Concern | Before | After |
| --- | --- | --- |
| Identity | Firebase Auth | WorkOS AuthKit (hosted UI) |
| Session | Firebase ID token | AuthKit cookie + server-side session |
| Data | Firestore + rules | Postgres + Prisma, authorised in route handlers |
| Push | FCM | not in scope yet |
| Hosting | Firebase Hosting (static) | Node server (`next start`) |

## Stages

| # | Stage | State |
| --- | --- | --- |
| 0 | Baseline commit, no Firebase deleted yet | done — `c1476cf` |
| 1 | Postgres schema + Prisma client + initial migration | done — `prisma/schema.prisma` |
| 2 | Server mode, WorkOS AuthKit sign-in/callback/session | done — `middleware.ts`, `/callback`, `/sign-in`, `/sign-up`, `/sign-out` |
| 3 | Identity domain: users, roles, onboarding, institutions | users/roles/notifications done (`/api/account`, `/api/notifications`); institutions next |
| 4 | Academic domain: classes, assignments, submissions, grades, courses | |
| 5 | Social domain: communities, posts, comments, reports, notifications | |
| 6 | Admin CLI ported from the Firebase Admin SDK to Prisma | |
| 7 | Delete `firebase`, `firebase-admin`, rules, emulators, rules tests; move hosting | |

Stages 3–6 each port one service file in `src/lib/services/` (84 exported
functions, ~240 Firestore call sites) plus the matching route handlers.

## What stage 2 changed

- `output: 'export'` removed; `npm start` now runs `next start`.
- `src/middleware.ts` refreshes the AuthKit session; `/callback` provisions the
  account row once, keyed on the WorkOS user id.
- `/login` and `/signup` redirect into AuthKit; `/forgot-password`,
  `/reset-password`, `/verify-email` and `/auth/*` explain the hosted flows.
- `src/lib/services/users.ts` is an HTTP client for `/api/account`,
  `/api/account/profile`, `/api/account/workspace` and `/api/notifications`.
  One consequence to be aware of: **only identity data works until stages 3–6
  port the remaining domains**, because every Firestore read still depends on a
  Firebase ID token, which no longer exists after an AuthKit sign-in.

## Schema mapping

Firestore collection → Postgres table:

| Collection | Table |
| --- | --- |
| `users/{uid}` | `users` |
| `users/{uid}/private/profile` | `user_private_profiles` |
| `userRoles/{uid}` | `user_roles` |
| `users/{uid}/roleRequests` | `role_requests` |
| `users/{uid}/notifications` | `notifications` |
| `users/{uid}/summaries/overview` | `dashboard_summaries` |
| `institutions/{id}/members` | `institution_members` |
| `institutionApplications/{id}` (+ events) | `institution_applications`, `institution_application_events` |
| `guardianLinks/{id}` | `guardian_links` |
| `classes/{id}` (+ roster) | `classes`, `class_enrollments` |
| `assignments/{id}` (+ submissions, grades) | `assignments`, `submissions`, `grades` |
| `courses/{id}` (+ enrollments, lessons) | `courses`, `course_enrollments`, `course_lessons` |
| `communities/{id}` (+ members, posts, comments) | `communities`, `community_members`, `posts`, `comments` |
| `reports/{id}` | `reports` |
| `auditLogs/{id}` | `audit_logs` |

Fields that Firestore kept "private by subcollection" are separate tables, so a
query cannot leak them by accident. Grades stay in their own table so a student
account can never write its own score.

## Environment

Prisma CLI reads `.env`; Next.js reads `.env.local`. Keep `DATABASE_URL` in both.

```dotenv
# Postgres
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5433/ischoolie_pg?schema=public"

# WorkOS AuthKit (stage 2)
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_test_...
WORKOS_COOKIE_PASSWORD=<32+ character secret>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

## Commands

```bash
npm run db:generate    # regenerate the Prisma client after schema edits
npm run db:migrate     # create + apply a migration in development
npm run db:deploy      # apply committed migrations (CI / production)
npm run db:studio      # browse the data
```

## WorkOS dashboard checklist

1. Redirect URI: `http://localhost:3000/callback` (plus the deployed origin).
2. Sign-out URI: `http://localhost:3000/`.
3. Initiate login URI: `http://localhost:3000/sign-in`.
4. Email/password method enabled, so verification and reset mail come from WorkOS.
