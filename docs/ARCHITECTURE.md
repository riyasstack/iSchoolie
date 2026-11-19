# Architecture

## 1. Shape of the system

```
Browser (Next.js static export, React 19)
  │  Firebase JS SDK (modular v12)
  ├─ Firebase Authentication ── ID token / custom claims
  └─ Cloud Firestore ────────── Security Rules enforce every read and write

Operator machine (Node, not deployed)
  └─ scripts/admin/index.ts ── Firebase Admin SDK, bypasses rules, writes auditLogs
```

There is no application server. Authorisation therefore has exactly two enforcement points:

1. **Firestore Security Rules** — the only place that can allow or deny data access.
2. **The Admin CLI** — the only place that can *grant* privilege.

Route guards, hidden buttons and UI state are conveniences, never enforcement.

## 2. Why static export

Firebase Hosting on Spark cannot run Cloud Functions, and Next.js server rendering would need one.
`next.config.ts` sets `output: 'export'`, so `npm run build` emits `./out` (45 prerendered routes)
that Hosting serves directly. Consequences:

- Every page is a client component; data loads after hydration from Firestore.
- No dynamic route segments. Identifiers travel as query parameters
  (`/dashboard/class?institutionId=…&classId=…`) and are read with `useQueryParam` inside
  `<Suspense>`.
- Metadata (`robots: noindex` on authenticated routes) is exported from server-only files.

## 3. Identity model

One Firebase user = one person. `users/{uid}` holds the public profile; `userPrivate/{uid}` holds
email, date of birth, consent record and safeguarding flags. Both are keyed by the same uid, created
idempotently by `ensureUserDocuments()` on first successful sign-in (a failed write is retried on the
next sign-in; no duplicate account is created because the uid is the key).

Additional providers are attached to the existing account with `linkWithPopup`. When Firebase
returns `auth/account-exists-with-different-credential` the pending credential is stashed and the
user is asked to sign in with the original method; only then is the credential linked. Display names
and unverified email claims are never used to merge accounts.

## 4. Roles, memberships and workspaces

```
userRoles/{uid}
  selfDeclared: Role[]        # student_school | student_college | teacher | parent — user may edit
  granted:      Role[]        # institution_admin only — Admin CLI writes, rules forbid client writes
  revoked:      Role[]
  teacherVerification: { status: pending | verified | rejected | suspended }

institutions/{institutionId}                      # approval status is CLI-only
institutions/{institutionId}/members/{uid}        # role: owner | admin | teacher | staff | student
```

Effective roles = `(selfDeclared ∪ granted) − revoked`, computed in
`src/lib/auth/permissions.ts` and unit-tested. Workspaces are derived from effective roles plus
active institution memberships (`src/lib/auth/workspaces.ts`), and the post-login destination is a
pure function (`resolvePostAuthRoute`) so the routing table is testable without a browser.

Selecting a workspace changes navigation only. It never mints a permission; every query re-checks
membership server-side through Rules.

## 5. Academic data split

```
institutions/{i}/classes/{c}
  assignments/{a}
  submissions/{studentUid}      # student-writable, own document only
  grades/{studentUid}           # teacher-writable, student read-only
  roster/{uid}
  courseEnrollments/{uid}
```

Submissions and grades are separate collections on purpose: a student who can write their answer
structurally cannot write a score, because no `allow write` exists on `grades` for them. Teachers can
read submissions for classes they own; students can read only their own submission and published
grades.

Duplicate final submissions are prevented by making the submission document id the student uid and
by requiring the existing document to still be a draft before accepting a final answer (a
transaction in `src/lib/services/academics.ts`). Offline writes are never treated as confirmation;
the UI shows the confirmed server state.

## 6. Institutions: request vs access

`institutionApplications/{id}` is the request. `institutions/{id}` is the granted entity. They are
different documents with different writers:

- Applicant writes name, category, official email, contact details, declarations. Status transitions
  available to them: `draft → submitted`, and re-submission after `more_info_required`.
- The iSchoolie team (Admin CLI) writes `approved | rejected | suspended` and creates the institution
  document plus the owner membership.
- `institution_admin` is a `granted` role, so the browser has no write path to it at all.

Institution-only onboarding (Scenario B in the brief) is handled by inviting the owner after
approval: the CLI creates or attaches the membership for an existing account, or the team invites the
person to sign up first and then runs `institution approve --owner <uid|email>`. Nothing about that
flow depends on the applicant hiding a route.

## 7. Guardians

```
guardianLinkRequests/{id}   guardian creates (email must equal the student's verified token email)
  status: requested → pending_verification → approved | rejected | revoked | expired
guardianLinks/{guardianUid}_{studentUid}
  consent: { grades, attendance, announcements, contactTeacher }
```

The student confirms the request (moving it to `pending_verification`), then the team verifies the
relationship and creates the link with explicit per-category consent. Rules for guardian reads
require an existing link document whose consent flag is true — never a request, never a name match.

## 8. Design system

`src/app/globals.css` defines CSS custom properties for brand, surfaces, ink, lines, semantic states
and radii; Tailwind maps them in `tailwind.config.ts`. Components consume semantic classes
(`text-ink`, `bg-surface`, `border-line`) so dark mode is a token swap. `buttonClass` lives in
`button-styles.ts`, outside the client boundary, because a pure helper exported from a `'use client'`
module cannot be called during prerender.

## 9. Deliberate non-goals

- No Cloud Functions: every privileged transition is an auditable operator command.
- No file uploads: Spark has no Cloud Storage; institution verification is a manual, evidence-based
  review with text declarations.
- No realtime listeners on feeds: paginated one-shot queries keep read counts predictable.
- No push notifications: `notifications/{uid}/items` is written by the CLI only.
