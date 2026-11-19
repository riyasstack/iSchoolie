# iSchoolie

**Learn. Teach. Connect. Grow.**

A premium education-networking application for school students (Class 8+), college students, teachers,
guardians, institutions and the iSchoolie platform team. One Firebase Authentication identity per
person; roles, workspaces and institution membership are layered on top of that single account.

- Next.js 15 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind CSS
- Firebase Authentication · Cloud Firestore (Standard edition, Spark plan)
- Firestore Security Rules + Vitest unit tests + Rules tests + Playwright E2E
- Privileged operations run only through a local Firebase Admin SDK CLI (`npm run admin`)

Read `docs/ARCHITECTURE.md`, `docs/SECURITY-MODEL.md`, `docs/CAPACITY.md`, `docs/PROVIDERS.md` and
`docs/RUNBOOK.md` before operating the project.

---

## 1. What is implemented

| Area | Status |
| --- | --- |
| Email/password signup, login, verification, reset, change | Implemented |
| Google and GitHub sign-in + linking | Implemented (needs console setup) |
| Apple and LinkedIn | Code paths exist and are hidden unless enabled in the console/env; **not verified working** |
| Account linking / `account-exists-with-different-credential` recovery | Implemented |
| Role selection, multi-role support, workspace switching | Implemented |
| School (Class 8+), college, teacher, guardian onboarding | Implemented |
| Institution application → team-only approval → scoped access | Implemented (rules + CLI) |
| Courses, classes, assignments, submissions, grades, communities, posts | Implemented |
| Guardian relationship request → student confirm → team verify → consent-scoped access | Implemented |
| Platform admin console (overview, users, institutions, teacher verification, guardians, moderation, audit, settings) | Implemented; grants are CLI-only |
| Dark mode, responsive design, accessible components | Implemented |
| Spark quota model (`src/lib/ops/capacity.ts`) | Implemented and unit-tested |

Deliberately **not** implemented: file/document uploads (Cloud Storage is Blaze-only on Spark),
Cloud Functions, push notifications (written only by the Admin CLI), payments, native apps.

---

## 2. Prerequisites

- Node.js ≥ 20 (verified on 24.20.0) and npm
- A Firebase project on the **Spark** plan
- Java 11+ **only if** you want to run the Firestore/Storage emulators (`npm run emulators`,
  `npm run test:rules`). The app and unit tests do not need Java.

```bash
npm install
```

---

## 3. Firebase project setup

1. Create a project at <https://console.firebase.google.com>, then add a **Web app**.
2. Authentication → Sign-in method → enable **Email/Password**, **Google**, **GitHub**.
3. Authentication → Settings → Authorized domains: add your hosting domain and `localhost`.
4. Firestore Database → create in production mode, then choose a region close to your users
   (for example `asia-south1`). Region cannot be changed later.
5. Copy the web-app config into `.env.local` (see below).
6. `firebase login` and `firebase use --add` to select your project (`.firebaserc` already points at
   a placeholder project id `ischoolie`).

### Environment variables

Copy `.env.local.example` to `.env.local` and fill it in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | Web config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | Web config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | Web config (unused features still need it) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes | Web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | Web config |
| `NEXT_PUBLIC_APP_ORIGIN` | recommended | Canonical origin used in email action links |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | local only | `true` connects to the emulator suite |
| `NEXT_PUBLIC_FCM_VAPID_KEY` | optional | Web Push certificate public key; enables browser notifications |
| `NEXT_PUBLIC_AUTH_APPLE_ENABLED` | optional | `true` shows the Apple button |
| `NEXT_PUBLIC_AUTH_LINKEDIN_ENABLED` | optional | `true` shows the LinkedIn button |
| `GOOGLE_APPLICATION_CREDENTIALS` | operator only | Path to a service-account JSON for the Admin CLI |

Everything prefixed `NEXT_PUBLIC_` is public by definition. **Never** put a service-account key in a
`NEXT_PUBLIC_` variable, in the repo, or in the browser.

Without a config the app renders normally and shows a "Firebase is not configured" banner instead of
throwing.

For a production build, start from `.env.production.example` instead (copy it to `.env.production`).
Note that `.env.local` wins over `.env.production`, so it must be removed or emptied before building
— see `docs/RUNBOOK.md` §10 for the full switch-over checklist.

---

## 4. Local development

```bash
npm run dev          # http://localhost:3000
npm run emulators    # Firestore 8080, Auth 9099, UI 4000 (needs Java on PATH)
```

If `java` is not on PATH, or temp/home live on a drive without room for the emulator
binaries, use `npm run emulators:local` instead. It starts the same emulators through
`scripts/dev/local-firebase.mjs`, which discovers a JRE under `../.tools/jre21`, prepends it
to PATH, caps the emulator JVM heap, and points `TMP`/`TEMP`/`TMPDIR` and `HOME`/`USERPROFILE`
at `../.tools/tmp` and `../.tools/home`. Override the toolchain location with
`ISCHOOLIE_TOOLS_DIR`, the JRE with `ISCHOOLIE_JAVA_HOME`, and JVM flags with
`ISCHOOLIE_JAVA_OPTS`. `npm run test:rules` uses the same wrapper, so the emulator-backed
rules tests need no shell exports either. Extra arguments are forwarded:
`npm run emulators:local -- --import=./emulator-data`.

To develop fully offline:

```bash
# terminal 1
npm run emulators         # or: npm run emulators:local
# terminal 2 — load the demo data (emulator only; refuses to run against a real project)
npm run seed
# terminal 3
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true npm run dev
```

Demo accounts (password `iSchoolie!2026`): `admin@ischoolie.test`, `teacher@ischoolie.test`,
`student@ischoolie.test`, `guardian@ischoolie.test`. Demo institution `demo-greenfield`, class join
code `DEMO01`.

---

## 5. Tests

```bash
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run test:rules   # Firestore Rules matrix inside the emulator (local JRE, no exports needed)
npm run test:e2e     # Playwright against the built app (needs Firebase config or emulators)
npm run verify       # typecheck && unit tests && production build
```

`tests/unit` covers redirect sanitising, password policy, age/eligibility maths, effective roles,
workspace routing, Zod schemas and the Spark capacity model. `tests/rules/security.test.ts` contains
the full authorisation matrix (self-approval, cross-institution access, grade tampering, guardian
access, suspension, client-side claim forgery). `tests/e2e/auth.spec.ts` covers the public auth
surfaces, validation, keyboard reachability and layout.

---

## 6. Build and deploy

The app is a **static export** (`output: 'export'`), so it deploys to Firebase Hosting on Spark with
no Cloud Functions. Dynamic identifiers are carried in query strings (`?institutionId=…&classId=…`)
because a static export cannot generate runtime path segments.

```bash
npm run build           # writes ./out
firebase deploy --only firestore    # rules + indexes
firebase deploy --only hosting
```

Human-only steps that cannot be automated: creating the Firebase project, enabling providers,
configuring GitHub's OAuth callback (`https://<project>.firebaseapp.com/__/auth/handler`), adding
authorized domains, and any Apple/LinkedIn developer-account work.

Full step-by-step deployment, including bootstrapping the first platform administrator, is in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md).

---

## 7. Repository layout

```
src/app/                 routes (all pages are client components; metadata on server pages)
src/components/          ui/ design system, auth/, onboarding/, academics/, institution/, layout/
src/lib/auth/            providers, linking, errors, redirects, permissions, workspace routing
src/lib/firebase/        client init, typed db helpers
src/lib/models/          identity, institution, academic, social types
src/lib/services/        every Firestore read/write in one place
src/lib/schemas/         Zod schemas shared by forms and services
src/lib/ops/capacity.ts  Spark cost/limit model
firestore.rules          614-line security boundary
firestore.indexes.json   composite + collection-group indexes
scripts/admin/           privileged CLI and emulator seed
tests/                   unit, rules, e2e
docs/                    architecture, security, capacity, providers, runbook
```

---

## 8. Known limitations

- **Spark plan**: no Cloud Functions, no Cloud Storage, no server-side rendering of user data.
  Privileged workflows are operator-driven CLI commands, not automated queues.
- **Rules and E2E tests were authored but not executed in this environment** — the machine has no
  Java runtime, so the emulator cannot start, and no Firebase project credentials were supplied.
  Run `npm run test:rules` and `npm run test:e2e` on a machine with Java and a project.
- **Apple and LinkedIn** are wired but unverified; they stay hidden until their env flags are true
  and the providers are configured. See `docs/PROVIDERS.md`.
- **Suspension and role revocation are enforced twice**: claims (fast path) and live document
  checks (authoritative). Claims lag until the next token refresh (≤ 1 hour) or forced refresh;
  the document checks do not. Documented in `docs/SECURITY-MODEL.md`.
- Capacity: Spark is viable to roughly **1,500 daily active users** with the default assumptions and
  **not** viable at 10,000 DAU. See `docs/CAPACITY.md`.
