# Security model

## 1. Threat model in one table

| Threat | Enforcement | Test |
| --- | --- | --- |
| Read another student's private profile | `users`/`userPrivate` owner-only reads | `tests/rules/security.test.ts` |
| Read another student's submission or unpublished grade | Rules require self or the class teacher | Rules tests |
| Student edits an official grade | `grades` has no client write path | Rules tests |
| Student submits as someone else | Submission doc id must equal `request.auth.uid` | Rules tests |
| Self-assign `platformAdmin` / `institution_admin` | Custom claims + `granted` array are unwritable by clients | Rules tests + unit (permissions) |
| Self-approve an institution | `institutions` create/update is CLI-only; application status transitions restricted | Rules tests |
| Access an unrelated institution | Membership doc must exist and be `active`; role scoped to that institution | Rules tests |
| Rejected/suspended institution keeps access | Membership rules check institution `status == 'active'` | Rules tests |
| Guardian reads a child without a verified link | `guardianLinks/{g}_{s}` document + consent flag | Rules tests |
| Suspended user keeps writing | `suspended` claim check on every write helper | Rules tests |
| Open redirect after login | `safeRedirectPath` rejects absolute/scheme-relative/`//` targets and auth screens | `tests/unit/redirect.test.ts` |
| Privileged action from a stolen browser session | Grants are impossible from the client at all | Rules + code review |

## 2. Where authority lives

Three independent stores, never conflated:

1. **Firebase Auth claims** — `platformAdmin`, `teacherVerified`, `suspended`, `roles`,
   `institutions`. Fast, cached in the ID token, only writable by the Admin SDK.
2. **`userRoles/{uid}.granted`** — privileged client-visible role grants; Admin CLI only.
3. **`institutions/{id}/members/{uid}`** — scoped institutional membership; Admin CLI creates,
   institutional admins may update only non-privileged fields.

Because claims can lag behind revocation (up to the token lifetime), anything that must revoke
*immediately* also checks the live document. The rules do this for institution membership and
suspension; the client re-reads membership on navigation. The trade-off is documented in
`docs/CAPACITY.md` (rules `get()` calls are billed reads).

## 3. What the browser is allowed to do

| Write | Allowed |
| --- | --- |
| Own public/private profile fields (name, headline, interests) | yes |
| Own onboarding answers and `selfDeclared` roles | yes |
| Create a guardian link *request* | yes |
| Confirm a guardian request addressed to their own verified email | yes |
| Create/modify their own submission while it is a draft | yes |
| Read their own published grade | yes |
| Create a post/comment in a community they belong to | yes |
| Create an institution *application* | yes |
| Move an application to `under review` or add review notes | yes (deny/pause only) |
| Approve/reject an application, create an institution, grant a role, verify a teacher, verify a guardian link, suspend an account, publish an announcement | **no** |
| Change `platformAdmin`, `teacherVerified`, `suspended` claims | **no** |

The asymmetry is intentional: a client may *withdraw* or *pause* privilege (withdraw an application,
reject a guardian request they received, mark a post as reported) but may never *confer* it.

## 4. Students, minors and safeguarding

- Eligibility: Class 8 and above; `src/lib/utils/dates.ts` + `src/lib/schemas/onboarding.ts` compute
  age and reject under-13 independent accounts.
- Under-18 accounts require guardian acknowledgement during onboarding; the acknowledgement and its
  timestamp are written to `userPrivate/{uid}.consent`.
- `safeguarding.privateProfile` restricts discoverability; the privacy page explains exactly what is
  public and what is never public (email, DOB, school, grade, guardian email).
- Adult–minor direct messaging is not exposed in this release; communities are the only shared
  surface and are moderated.

## 5. Rules testing

`tests/rules/security.test.ts` runs against `@firebase/rules-unit-testing` v5 inside
`firebase emulators:exec` (`npm run test:rules`). Each case asserts both the allow and the deny
direction, because a test that only proves the happy path proves nothing about isolation.

> **Status:** the suite is written but has **not been executed here** — this machine has no Java
> runtime, so the Firestore emulator cannot start. `npm run test:rules` must be run before deploying
> rules. Do not treat the rules as verified until that command passes.

## 6. Session and account security

- Persistence: `browserLocalPersistence` by default, with a documented shared-device warning on the
  login page; no academic data is cached in `localStorage` by the app itself.
- Sensitive operations (password change, email change, account deletion, unlinking a provider) use
  `reauthenticateWithCredential` first and surface `auth/requires-recent-login` as a recoverable
  state.
- Email change uses `verifyBeforeUpdateEmail`; the address only changes once the new one is verified.
- Password reset uses an out-of-band action link handled on `/reset-password` via `oobCode`.
- Removing the last remaining sign-in method is blocked in the UI and by Firebase.
- Account deletion requests are recorded for operator follow-up; `npm run admin -- user purge
  --confirm` performs the irreversible step.
- Instant revocation: `refresh({ forceToken: true })` after every privileged change, plus
  `revokeRefreshTokens` in the CLI so an old token cannot be refreshed.

## 7. Secrets handling

- The service-account JSON stays on the operator machine; `GOOGLE_APPLICATION_CREDENTIALS` is read
  only by `scripts/admin/index.ts`.
- No `NEXT_PUBLIC_*` variable holds a secret; the Firebase web config is public by design and
  protected by Rules, authorised domains and API-key restrictions.
- `.env.local`, service-account files and `.firebase/` are git-ignored.
- CSP, `X-Frame-Options: DENY`, `nosniff` and a restrictive `Permissions-Policy` are set in
  `firebase.json` for the deployed site.
