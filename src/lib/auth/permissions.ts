/**
 * Authorisation helpers used by the UI *and* mirrored by Firestore rules.
 *
 * Client-side checks decide what to render. They are never the security
 * boundary: every protected read/write is re-checked by `firestore.rules`.
 */
import type {
  AccountClaims,
  InstitutionMember,
  InstitutionMemberRole,
  RoleKey,
  UserProfile,
  UserRolesDoc,
} from '@/lib/models';

export const ROLE_KEYS: RoleKey[] = [
  'student_school',
  'student_college',
  'teacher',
  'parent',
  'institution_admin',
];

/** Roles a person may activate for themselves during onboarding. */
export const SELF_SERVE_ROLES: RoleKey[] = [
  'student_school',
  'student_college',
  'teacher',
  'parent',
];

/** Roles that only a privileged grant can produce. */
export const PRIVILEGED_ROLES: RoleKey[] = ['institution_admin'];

export function effectiveRoles(roles: UserRolesDoc | null | undefined): RoleKey[] {
  if (!roles) return [];
  const revoked = new Set(roles.revoked ?? []);
  const merged = new Set<RoleKey>([...(roles.granted ?? []), ...(roles.selfDeclared ?? [])]);
  return ROLE_KEYS.filter((role) => merged.has(role) && !revoked.has(role));
}

export function isPrivilegedRole(role: RoleKey): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

export interface MembershipLike {
  institutionId: string;
  institutionName?: string;
  role: InstitutionMemberRole;
  status: 'active' | 'revoked';
}

/** Membership roles that may administer an institution workspace. */
export function canAdministerInstitution(role: InstitutionMemberRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Membership roles that may create classes and grade work. */
export function canTeachInstitution(role: InstitutionMemberRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'teacher';
}

export function activeMemberships(memberships: readonly MembershipLike[]): MembershipLike[] {
  return memberships.filter((membership) => membership.status === 'active');
}

export function canAdministerInstitutionId(
  memberships: readonly MembershipLike[],
  institutionId: string,
): boolean {
  return activeMemberships(memberships).some(
    (membership) =>
      membership.institutionId === institutionId && canAdministerInstitution(membership.role),
  );
}

export function canTeachInstitutionId(
  memberships: readonly MembershipLike[],
  institutionId: string,
): boolean {
  return activeMemberships(memberships).some(
    (membership) => membership.institutionId === institutionId && canTeachInstitution(membership.role),
  );
}

export interface PermissionContext {
  uid: string;
  claims: AccountClaims | null;
  profile: UserProfile | null;
  roles: UserRolesDoc | null;
  memberships: readonly MembershipLike[];
}

export function isPlatformAdmin(context: Pick<PermissionContext, 'claims'>): boolean {
  return context.claims?.platformAdmin === true;
}

export function isSuspended(context: Pick<PermissionContext, 'claims' | 'profile'>): boolean {
  return context.claims?.suspended === true || context.profile?.status === 'suspended';
}

/** Course publishing requires an iSchoolie-verified teacher. */
export function canPublishCourses(context: Pick<PermissionContext, 'claims' | 'roles'>): boolean {
  return (
    context.claims?.teacherVerified === true ||
    context.roles?.teacherVerification.status === 'verified'
  );
}

/** Minors with an unverified guardian relationship cannot start direct chats. */
export function canUseDirectMessaging(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.safeguarding.messagingEnabled;
}

export function memberToLike(institutionId: string, member: InstitutionMember): MembershipLike {
  return {
    institutionId,
    role: member.role,
    status: member.status,
  };
}

/** Human-readable reason shown on the Access Denied screen. */
export function accessDeniedMessage(reason: string | null): string {
  switch (reason) {
    case 'institution-not-approved':
      return 'Your institution application has not been approved yet, so institution tools stay locked. You can keep using your personal workspaces.';
    case 'institution-suspended':
      return 'This institution has been suspended by the iSchoolie team. Institution tools are unavailable while the suspension is in place.';
    case 'not-a-member':
      return 'Your account is not an active member of this institution.';
    case 'suspended':
      return 'This account is suspended. Contact iSchoolie support if you believe this is a mistake.';
    case 'role-revoked':
      return 'This workspace was revoked. If you think that is wrong, ask your institution administrator.';
    default:
      return 'You do not have permission to view this page.';
  }
}
