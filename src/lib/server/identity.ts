import 'server-only';
import type { Prisma, User as PrismaUser } from '@prisma/client';
import type { User as WorkosUser } from '@workos-inc/node';
import { prisma } from '@/lib/prisma';
import { effectiveRoles } from '@/lib/auth/permissions';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';
import { slugify } from '@/lib/utils/dates';
import { ageBand, ageFromDate } from '@/lib/utils/dates';
import { SELF_SERVE_ROLES } from '@/lib/auth/permissions';
import { MIN_INDEPENDENT_AGE, ADULT_AGE } from '@/lib/constants';
import type {
  AccountClaims,
  AccountSnapshot,
  AppNotification,
  RoleKey,
  UserPrivateProfile,
  UserProfile,
  UserRolesDoc,
} from '@/lib/models';

/**
 * Identity domain, Postgres-backed.
 *
 * Replaces `src/lib/services/users.ts` (Firestore). Every function here takes
 * the *server-resolved* user id; callers must never pass a client-supplied id.
 * Access control lives in the route handlers that call this module, which is
 * how `firestore.rules` used to work for these collections.
 */

const iso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

/* -------------------------------------------------------------------------- */
/* Provisioning                                                               */
/* -------------------------------------------------------------------------- */

function randomSuffix(length = 6): string {
  return Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, length).padEnd(length, '0');
}

async function ensureRelatedRows(userId: string, email: string): Promise<void> {
  await prisma.userPrivate.upsert({
    where: { userId },
    create: {
      userId,
      email,
      learningInterests: [],
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
    },
    update: { email },
  });
  await prisma.userRoles.upsert({
    where: { userId },
    create: { userId, selfDeclared: [], granted: [], revoked: [] },
    update: {},
  });
  await prisma.teacherVerification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/**
 * Idempotent bootstrap of the rows a signed-in identity needs.
 *
 * Keyed on the WorkOS user id, so a retry can never create a second account.
 * An existing row with the same email is adopted instead of duplicated.
 */
export async function provisionAccount(workosUser: WorkosUser): Promise<PrismaUser> {
  const email = workosUser.email.trim().toLowerCase();
  const displayName =
    (workosUser.name?.trim() ||
      [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ').trim() ||
      email.split('@')[0] ||
      'iSchoolie member').slice(0, 80);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ workosUserId: workosUser.id }, { email }] },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        workosUserId: workosUser.id,
        email,
        photoUrl: workosUser.profilePictureUrl ?? existing.photoUrl,
      },
    });
    await ensureRelatedRows(updated.id, email);
    return updated;
  }

  const handleBase = slugify(displayName) || 'member';
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await prisma.user.create({
        data: {
          workosUserId: workosUser.id,
          email,
          displayName,
          handle: `${handleBase}-${attempt === 0 ? randomSuffix() : randomSuffix(8)}`,
          photoUrl: workosUser.profilePictureUrl,
          roles: { create: { selfDeclared: [], granted: [], revoked: [] } },
          privateProfileRecord: {
            create: {
              email,
              learningInterests: [],
              termsVersion: TERMS_VERSION,
              privacyVersion: PRIVACY_VERSION,
              acceptedTermsAt: new Date(),
              acceptedPrivacyAt: new Date(),
            },
          },
          teacherVerification: { create: {} },
        },
      });
      return created;
    } catch (error) {
      lastError = error;
      // A handle collision is retried with a wider suffix; anything else
      // (for example a concurrent create of the same WorkOS id) is re-read.
      const conflict = await prisma.user.findUnique({ where: { workosUserId: workosUser.id } });
      if (conflict) {
        await ensureRelatedRows(conflict.id, email);
        return conflict;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not create your iSchoolie account.');
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export function toUserProfile(user: PrismaUser): UserProfile {
  const teacher =
    user.teacherSubjects.length > 0 ||
    user.teacherBio !== '' ||
    user.teacherQualification !== null ||
    user.teacherInstitutionName !== null
      ? {
          subjects: user.teacherSubjects,
          levels: user.teacherLevels,
          yearsExperience: user.teacherExperience,
          bio: user.teacherBio,
          qualification: user.teacherQualification,
          institutionName: user.teacherInstitutionName,
        }
      : null;

  return {
    uid: user.id,
    displayName: user.displayName,
    handle: user.handle,
    photoURL: user.photoUrl,
    headline: user.headline,
    country: user.country,
    status: user.status,
    onboarding: {
      complete: user.onboarded,
      selectedRoles: user.selectedRoles as RoleKey[],
      completedAt: iso(user.onboardedAt),
    },
    activeWorkspace: user.activeWorkspace,
    teacher,
    studentLevel: user.studentLevel,
    safeguarding: {
      isMinor: user.isMinor,
      privateProfile: user.privateProfile,
      messagingEnabled: user.messagingEnabled,
      guardianConsentRecordedAt: iso(user.guardianConsentRecordedAt),
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function loadAccount(userId: string): Promise<AccountSnapshot> {
  const [profileRow, rolesRow, verification, memberships, roleRequests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userRoles.findUnique({ where: { userId } }),
    prisma.teacherVerification.findUnique({ where: { userId } }),
    prisma.institutionMember.findMany({ where: { userId, status: 'active' }, take: 25 }),
    prisma.roleRequest.findMany({ where: { userId } }),
  ]);

  const profile = profileRow ? toUserProfile(profileRow) : null;

  const roles: UserRolesDoc | null = rolesRow
    ? {
        selfDeclared: rolesRow.selfDeclared as RoleKey[],
        granted: rolesRow.granted as RoleKey[],
        revoked: rolesRow.revoked as RoleKey[],
        teacherVerification: {
          status: verification?.status ?? 'not_submitted',
          note: verification?.note ?? null,
          decidedAt: iso(verification?.decidedAt),
        },
        updatedAt: rolesRow.updatedAt.toISOString(),
      }
    : null;

  return {
    profile,
    roles,
    memberships: memberships.map((membership) => ({
      institutionId: membership.institutionId,
      institutionName: membership.institutionName,
      role: membership.role,
      status: membership.status,
    })),
    requestedRoles: roleRequests.map((request) => request.role as RoleKey),
  };
}

/** Claims used to be WorkOS-agnostic custom claims; now they are derived. */
export async function loadClaims(userId: string): Promise<AccountClaims> {
  const [user, roles, verification] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { status: true, platformAdmin: true } }),
    prisma.userRoles.findUnique({ where: { userId } }),
    prisma.teacherVerification.findUnique({ where: { userId } }),
  ]);

  const effective = effectiveRoles(
    roles
      ? ({
          selfDeclared: roles.selfDeclared as RoleKey[],
          granted: roles.granted as RoleKey[],
          revoked: roles.revoked as RoleKey[],
          teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
          updatedAt: roles.updatedAt,
        } as UserRolesDoc)
      : null,
  );

  return {
    platformAdmin: user?.platformAdmin === true,
    teacherVerified: verification?.status === 'verified',
    roles: effective,
    suspended: user?.status === 'suspended',
  };
}

export async function loadPrivateProfile(userId: string): Promise<UserPrivateProfile | null> {
  const row = await prisma.userPrivate.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    email: row.email,
    dateOfBirth: row.dateOfBirth,
    schoolName: row.schoolName,
    grade: row.grade,
    collegeName: row.collegeName,
    degree: row.degree,
    department: row.department,
    academicStage: row.academicStage,
    learningInterests: row.learningInterests,
    guardianEmail: row.guardianEmail,
    consent: {
      termsVersion: row.termsVersion,
      privacyVersion: row.privacyVersion,
      acceptedTermsAt: iso(row.acceptedTermsAt),
      acceptedPrivacyAt: iso(row.acceptedPrivacyAt),
      guardianAcknowledgedAt: iso(row.guardianAcknowledgedAt),
    },
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listNotifications(userId: string, max = 20): Promise<AppNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(max, 1), 100),
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function setActiveWorkspace(userId: string, workspaceId: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { activeWorkspace: workspaceId ? workspaceId.slice(0, 120) : null },
  });
}

export async function updatePublicProfile(
  userId: string,
  values: { displayName?: string; headline?: string | null; country?: string | null },
): Promise<void> {
  const data: Prisma.UserUpdateInput = {};
  if (values.displayName !== undefined) data.displayName = values.displayName.trim().slice(0, 80);
  if (values.headline !== undefined) {
    data.headline = values.headline ? values.headline.trim().slice(0, 120) : null;
  }
  if (values.country !== undefined) data.country = values.country ? values.country.slice(0, 80) : null;
  if (Object.keys(data).length === 0) return;
  await prisma.user.update({ where: { id: userId }, data });
}

const PRIVATE_PROFILE_FIELDS = [
  'dateOfBirth',
  'schoolName',
  'grade',
  'collegeName',
  'degree',
  'department',
  'academicStage',
  'learningInterests',
  'guardianEmail',
] as const;

export type PrivateProfileUpdate = Partial<
  Pick<UserPrivateProfile, (typeof PRIVATE_PROFILE_FIELDS)[number]>
>;

export async function updatePrivateProfile(
  userId: string,
  values: PrivateProfileUpdate,
): Promise<void> {
  const data: Record<string, unknown> = {};
  for (const field of PRIVATE_PROFILE_FIELDS) {
    const value = values[field];
    if (value === undefined) continue;
    if (field === 'learningInterests') {
      data[field] = Array.isArray(value) ? value.slice(0, 30).map((item) => String(item).slice(0, 60)) : [];
    } else if (field === 'grade') {
      data[field] = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null;
    } else {
      data[field] = value === null || value === '' ? null : String(value).slice(0, 160);
    }
  }
  if (Object.keys(data).length === 0) return;
  await prisma.userPrivate.update({ where: { userId }, data });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.notification.updateMany({
    where: { userId, id: { in: ids.slice(0, 400) } },
    data: { read: true },
  });
}

export async function writeDashboardSummary(
  userId: string,
  summary: { studentAssignmentCount: number; teacherClassCount: number; guardianChildCount: number },
): Promise<void> {
  await prisma.dashboardSummary.upsert({
    where: { userId },
    create: { userId, ...summary },
    update: summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Onboarding                                                                 */
/* -------------------------------------------------------------------------- */

interface OnboardingSubmission {
  // Kept for the caller contract; the server ignores it and sources identity
  // from the WorkOS session, never from this field.
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
  userId: string,
  submission: OnboardingSubmission,
): Promise<OnboardingResult> {
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

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existingRoles = await tx.userRoles.findUnique({ where: { userId } });
    const existingPrivate = await tx.userPrivate.findUnique({ where: { userId } });

    const existingConsent =
      existingPrivate?.termsVersion != null
        ? {
            termsVersion: existingPrivate.termsVersion,
            privacyVersion: existingPrivate.privacyVersion,
            acceptedTermsAt: existingPrivate.acceptedTermsAt,
            acceptedPrivacyAt: existingPrivate.acceptedPrivacyAt,
            guardianAcknowledgedAt: existingPrivate.guardianAcknowledgedAt,
          }
        : null;

    const selfDeclared = Array.from(
      new Set<RoleKey>([
        ...(existingRoles?.selfDeclared ?? []),
        ...allowedRoles,
      ]),
    );

    await tx.userRoles.upsert({
      where: { userId },
      create: {
        userId,
        selfDeclared,
        granted: existingRoles?.granted ?? [],
        revoked: existingRoles?.revoked ?? [],
      },
      update: { selfDeclared },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        displayName: submission.displayName.trim().slice(0, 80),
        onboarded: true,
        selectedRoles: allowedRoles,
        onboardedAt: now,
        studentLevel: submission.studentLevel ?? null,
        isMinor,
        privateProfile: true,
        messagingEnabled: !isMinor,
        guardianConsentRecordedAt: null,
        ...(submission.publicProfile ?? {}),
      },
    });

    await tx.userPrivate.upsert({
      where: { userId },
      create: {
        userId,
        email: '',
        learningInterests: [],
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        guardianAcknowledgedAt:
          submission.guardianAcknowledged && isMinor ? now : null,
        ...(submission.privateProfile ?? {}),
      },
      update: {
        ...(submission.privateProfile ?? {}),
        guardianEmail:
          submission.guardianEmail !== undefined
            ? submission.guardianEmail ?? null
            : undefined,
        acceptedTermsAt:
          existingConsent?.acceptedTermsAt ?? now,
        acceptedPrivacyAt:
          existingConsent?.acceptedPrivacyAt ?? now,
        guardianAcknowledgedAt:
          submission.guardianAcknowledged && isMinor ? now : existingConsent?.guardianAcknowledgedAt ?? null,
      },
    });

    const existingRequests = await tx.roleRequest.findMany({
      where: { userId },
    });
    const existingRequestRoles = new Set(existingRequests.map((r) => r.role));

    for (const role of allowedRoles) {
      if (existingRequestRoles.has(role)) continue;
      await tx.roleRequest.create({
        data: { userId, role, note: null },
      });
    }
  });

  return { isMinor, roles: allowedRoles };
}
