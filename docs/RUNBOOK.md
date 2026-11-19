# Operator runbook

Everything in this document runs on an operator machine with a Firebase service-account key. None of
it is reachable from the browser. Every command writes an `auditLogs` entry.

## 0. One-time setup

```bash
# service account: Firebase Console → Project settings → Service accounts → Generate new private key
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/service-account.json"   # never inside the repo
export FIREBASE_PROJECT_ID="your-project-id"

npm run admin -- --help
```

Against the emulator, no key is needed — export `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` instead.

Flags: `--uid` accepts a uid **or** an email. `--operator` is required and should be the operator's
own iSchoolie email so the audit trail names a person.

## 1. Bootstrap the first platform administrator

Run once, on a fresh project, after the human has signed up normally in the app:

```bash
npm run admin -- bootstrap --email founder@ischoolie.app --operator "Founder"
```

This sets the `platformAdmin` claim, grants the `platform_admin` role and writes an audit entry. It is
idempotent. There is no UI path to platform admin — this command is the only one.

## 2. Promote a second operator

Platform administration is a custom claim, not a document role, so a second operator is provisioned with
the same idempotent `bootstrap` command:

```bash
npm run admin -- bootstrap --email ops@ischoolie.app --operator founder@ischoolie.app
npm run admin -- role revoke --uid ops@ischoolie.app --role platform_admin --operator founder@ischoolie.app
```

Both commands revoke existing refresh tokens, so the user must sign in again. Only `bootstrap` can
confer platform admin; the browser has no path to it.

## 3. Institution application review

Applicants submit from `/onboarding/institution`; the queue is `/admin/institutions`.
The browser can only move an application to *under review* or add notes. Approval is CLI-only.

```bash
# inspect first
npm run admin -- audit list --limit 20

# approve, creating the institution and its owner membership
npm run admin -- institution approve --application <applicationId> \
  --owner owner@abcschool.edu --operator founder@ischoolie.app --note "Affiliation letter verified"

# reject
npm run admin -- institution reject --application <applicationId> \
  --reason "Domain does not match the institution" --operator founder@ischoolie.app
```

`--owner` accepts a uid or email. If the owner has no account yet, ask them to sign up, then re-run
with their email — approval and provisioning stay separate steps, so an approved institution can
exist before its owner does.

Add staff/teachers:

```bash
npm run admin -- institution member --institution <institutionId> \
  --uid teacher@abcschool.edu --role teacher --operator founder@ischoolie.app
```

Suspend / resume (suspension is checked live by Rules, so access stops on the next request):

```bash
npm run admin -- institution suspend --institution <institutionId> --operator founder@ischoolie.app
npm run admin -- institution resume  --institution <institutionId> --operator founder@ischoolie.app
```

## 4. Teacher verification

```bash
npm run admin -- teacher verify --uid teacher@example.com --operator founder@ischoolie.app --note "ID checked"
npm run admin -- teacher reject --uid teacher@example.com --operator founder@ischoolie.app --reject
```

Verification sets the `teacherVerified` claim. It does **not** grant institution membership.

## 5. Guardian relationships

Order matters: guardian requests → student confirms → team verifies.

```bash
npm run admin -- guardian approve --request <requestId> --operator founder@ischoolie.app
```

If a relationship is disputed, revoke the link from the guardian dashboard (student-side revocation
is also available); the audit entry records who ended it.

## 6. Account suspension and deletion

```bash
npm run admin -- user suspend --uid abusive@example.com --operator founder@ischoolie.app
npm run admin -- user restore --uid abusive@example.com --operator founder@ischoolie.app

# irreversible: deletes Auth user + Firestore docs
npm run admin -- user purge --uid leaver@example.com --operator founder@ischoolie.app --confirm
```

Suspension sets the `suspended` claim and revokes refresh tokens. Because Rules also check the claim
on every write, a suspended account cannot write even before its token expires.

## 7. Deploying

```bash
npm run typecheck && npm test && npm run build
firebase deploy --only firestore          # rules + indexes (index build takes minutes)
firebase deploy --only hosting            # uploads ./out
```

After deploying rules for the first time, run the rules tests against the emulator on a machine with
Java:

```bash
npm run test:rules
```

## 8. Monitoring quota

Firebase Console → Firestore → Usage. Watch reads first — they are the binding constraint
(`docs/CAPACITY.md`). Symptoms of exhaustion: `RESOURCE_EXHAUSTED` errors in the browser console,
dashboard summaries failing to load while auth still works.

Emergency levers, in order of preference:

1. Reduce page size (`limit(20)` → `limit(10)`) in the list services.
2. Temporarily disable the community feed (`listPublishedCommunities`) for non-members.
3. Upgrade the project to Blaze — the code needs no changes.

## 9. Incident: suspected privilege escalation

1. `npm run admin -- audit list --limit 100` — every grant, approval, suspension and purge is here.
2. If an institution was wrongly approved: `institution suspend`, then investigate the application
   document (it records the submitting uid and timestamp).
3. If a role was wrongly granted: `role revoke --role <role>`, which also revokes refresh tokens.
4. If a service-account key leaked: disable it in Google Cloud IAM immediately, generate a new one,
   and rotate `GOOGLE_APPLICATION_CREDENTIALS` on every operator machine.

## 10. Switching from the emulator to a real Firebase project

The emulator never sends email and has no FCM service. Password-reset and verification links come out
of the Dev notices card instead. To use real delivery, do these once:

1. **Create the project.** Firebase Console → add a Web app → copy its SDK config.
2. **Enable the providers** you want under Authentication → Sign-in method (Email/Password at minimum).
3. **Authorize the origin.** Authentication → Settings → Authorized domains: add the deployed domain
   (`your-domain.example`) and `localhost` if you also test against the real project locally. Reset and
   verification links are rejected with `auth/unauthorized-continue-uri` if `NEXT_PUBLIC_APP_ORIGIN`
   is not listed here, or if it differs by scheme, subdomain or trailing slash.
4. **Write the environment.** `cp .env.production.example .env.production` and fill it in, with
   `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`. Then **remove or empty `.env.local`** — Next.js gives it
   precedence, and leaving it in place bakes the emulator settings into the bundle.
5. **Customize the emails.** Authentication → Templates: reset password and email verification. Check
   the sender address; without a custom SMTP setup the default quota is small, so watch it if you
   onboard a class at once.
6. **Build and deploy.** `npm run build`, `firebase deploy --only firestore`, then
   `firebase deploy --only hosting`. Deploy before step 7 so the authorized domain is live.
7. **Test with a real mailbox**, on the deployed origin — not localhost:
   - Sign up → the verification mail arrives → the link lands on `/verify-email` and the account
     becomes verified.
   - Forgot password → the mail arrives → the link lands on `/auth/action` → `/reset-password` with the
     address pre-filled → set a new password → sign in with it.
   - A denied send (provider disabled, origin not authorized) now surfaces as an honest error instead of
     a fake "check your inbox".
8. **Push notifications (optional).** Authentication → Settings → Cloud Messaging → Web Push
   certificates → generate a key pair, put the **public** key in `NEXT_PUBLIC_FCM_VAPID_KEY`, redeploy.
   On `/account` press "Enable notifications" and accept the prompt; the card shows the device token.
   Paste that token into Firebase Console → Messaging → "Send test message" to confirm delivery.

What the app cannot do on its own: **originate** a push. Obtaining a token is client work, but sending
requires a trusted sender holding project credentials — Cloud Functions (Blaze plan), your own server, or
the console's test message. Firestore writes cannot trigger a push on Spark. The device token is
therefore shown in `/account` for manual testing, and is not stored in Firestore until a sender exists to
use it.
