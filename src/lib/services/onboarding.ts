/**
 * Onboarding writes.
 *
 * One transaction keeps the public profile, private profile, role requests and
 * role document in step. If it fails, nothing is half-written and the user can
 * retry from the same screen without creating duplicate state.
 */
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { requireDb } from '@/lib/firebase/db';
import { SELF_SERVE_ROLES } from '@/lib/auth/permissions';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';
import type { RoleKey, UserRolesDoc } from '@/lib/models';
import { ageBand } from '@/lib/utils/dates';

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
  const db = requireDb();
  const allowedRoles = submission.roles.filter((role) =>
    SELF_SERVE_ROLES.includes(role),
  );
  if (allowedRoles.length === 0) {
    throw new Error('Select at least one role to continue.');
  }

  const band = ageBand(submission.dateOfBirth ?? null);
  if (band === 'under-13') {
    throw new Error('iSchoolie accounts are not available to children under 13.');
  }
  const isMinor = band === 'minor';

  const profileRef = doc(db, 'users', submission.uid);
  const rolesRef = doc(db, 'userRoles', submission.uid);
  const privateRef = doc(db, 'users', submission.uid, 'private', 'profile');

  await runTransaction(db, async (transaction) => {
    const rolesSnapshot = await transaction.get(rolesRef);
    const privateSnapshot = await transaction.get(privateRef);
    const existing = rolesSnapshot.exists()
      ? (rolesSnapshot.data() as Partial<UserRolesDoc>)
      : null;
    const existingConsent =
      privateSnapshot.exists()
        ? ((privateSnapshot.data()?.consent as Record<string, unknown> | undefined) ?? {})
        : {};

    // Preserve anything a reviewer has already granted or denied.
    const selfDeclared = Array.from(
      new Set<RoleKey>([
        ...((existing?.selfDeclared as RoleKey[] | undefined) ?? []),
        ...allowedRoles,
      ]),
    );

    transaction.set(
      rolesRef,
      {
        selfDeclared,
        granted: existing?.granted ?? [],
        revoked: existing?.revoked ?? [],
        teacherVerification:
          existing?.teacherVerification ?? {
            status: 'not_submitted',
            note: null,
            decidedAt: null,
          },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(
      profileRef,
      {
        uid: submission.uid,
        displayName: submission.displayName,
        onboarding: {
          complete: true,
          selectedRoles: allowedRoles,
          completedAt: serverTimestamp(),
        },
        studentLevel: submission.studentLevel ?? null,
        safeguarding: {
          isMinor,
          privateProfile: true,
          messagingEnabled: !isMinor,
          guardianConsentRecordedAt: null,
        },
        ...(submission.publicProfile ?? {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(
      privateRef,
      {
        ...(submission.privateProfile ?? {}),
        guardianEmail: submission.guardianEmail ?? null,
        // Merge explicitly: a nested map write replaces the whole map.
        consent: {
          ...existingConsent,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
          acceptedTermsAt: existingConsent.acceptedTermsAt ?? Timestamp.now(),
          acceptedPrivacyAt: existingConsent.acceptedPrivacyAt ?? Timestamp.now(),
          guardianAcknowledgedAt:
            submission.guardianAcknowledged && isMinor ? Timestamp.now() : null,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    for (const role of allowedRoles) {
      transaction.set(doc(collection(db, 'users', submission.uid, 'roleRequests'), role), {
        role,
        requestedAt: serverTimestamp(),
        note: null,
      });
    }
  });

  return { isMinor, roles: allowedRoles };
}

/** Whether the person may submit an institution-management request right now. */
export async function hasActiveInstitutionApplication(uid: string): Promise<boolean> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'users', uid, 'private', 'institutionApplication'));
  return snapshot.exists();
}
