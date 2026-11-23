/**
 * Onboarding writes.
 *
 * The public signature is unchanged, but the implementation no longer writes to
 * Firestore. The shape accepted here still matches the forms in
 * `src/components/onboarding/*`, and the server enforces the same eligibility
 * rules the client-side schemas describe.
 *
 * `hasActiveInstitutionApplication` is intentionally not ported here: it reads
 * a Firestore subdocument that the institution-application domain has not moved
 * to Postgres yet.
 */
import type { RoleKey } from '@/lib/models';

export interface OnboardingSubmission {
  uid: string;
  displayName: string;
  roles: RoleKey[];
  publicProfile?: Record<string, unknown>;
  privateProfile?: Record<string, unknown>;
  studentLevel?: 'school' | 'college' | null;
  dateOfBirth?: string | null;
  guardianEmail?: string | null;
  guardianAcknowledged?: boolean;
}

export interface OnboardingResult {
  isMinor: boolean;
  roles: RoleKey[];
}

export async function completeOnboarding(
  submission: OnboardingSubmission,
): Promise<OnboardingResult> {
  const response = await fetch('/api/account/onboarding', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      displayName: submission.displayName,
      roles: submission.roles,
      publicProfile: submission.publicProfile,
      privateProfile: submission.privateProfile,
      studentLevel: submission.studentLevel,
      dateOfBirth: submission.dateOfBirth,
      guardianEmail: submission.guardianEmail,
      guardianAcknowledged: submission.guardianAcknowledged,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { account?: unknown; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `Could not save your profile (${response.status}).`);
  }

  // The response body is the server's real result; do not recompute it
  // client-side — the server already enforced the eligibility rules.
  return (payload as { isMinor: boolean; roles: RoleKey[] }) ?? {
    isMinor: false,
    roles: [],
  };
}

/** Whether the person may submit an institution-management request right now. */
export async function hasActiveInstitutionApplication(uid: string): Promise<boolean> {
  throw new Error(
    'hasActiveInstitutionApplication still reads Firestore. Port the institution domain before using it.',
  );
}
