/**
 * Workspace derivation and post-authentication routing.
 *
 * These functions are pure and unit-tested: the redirect table in the spec is
 * business logic, not something to scatter across pages.
 */
import type { InstitutionMemberRole, RoleKey, UserProfile } from '@/lib/models';
import { effectiveRoles } from '@/lib/auth/permissions';
import type { UserRolesDoc } from '@/lib/models';

export type WorkspaceKind =
  | 'personal'
  | 'student_school'
  | 'student_college'
  | 'teacher'
  | 'parent'
  | 'institution';

export interface WorkspaceOption {
  id: string;
  kind: WorkspaceKind;
  label: string;
  description: string;
  href: string;
  institutionId?: string;
  memberRole?: InstitutionMemberRole;
}

export interface MembershipInput {
  institutionId: string;
  institutionName: string;
  role: InstitutionMemberRole;
  status: 'active' | 'revoked';
}

export function institutionWorkspaceId(institutionId: string): string {
  return `institution:${institutionId}`;
}

export function buildWorkspaces(input: {
  roles: RoleKey[];
  memberships: readonly MembershipInput[];
}): WorkspaceOption[] {
  const workspaces: WorkspaceOption[] = [
    {
      id: 'personal',
      kind: 'personal',
      label: 'Personal iSchoolie',
      description: 'Your profile, communities and network.',
      href: '/feed',
    },
  ];

  if (input.roles.includes('student_school')) {
    workspaces.push({
      id: 'student_school',
      kind: 'student_school',
      label: 'Student Learning',
      description: 'Classes, assignments and your academic record.',
      href: '/dashboard/student',
    });
  }
  if (input.roles.includes('student_college')) {
    workspaces.push({
      id: 'student_college',
      kind: 'student_college',
      label: 'Student Learning',
      description: 'Higher-education classes, assignments and results.',
      href: '/dashboard/student',
    });
  }
  if (input.roles.includes('teacher')) {
    workspaces.push({
      id: 'teacher',
      kind: 'teacher',
      label: 'Teacher Studio',
      description: 'Courses, classes and student submissions.',
      href: '/dashboard/teacher',
    });
  }
  if (input.roles.includes('parent')) {
    workspaces.push({
      id: 'parent',
      kind: 'parent',
      label: 'Parent / Guardian',
      description: 'Linked children, consent and announcements.',
      href: '/dashboard/parent',
    });
  }

  for (const membership of input.memberships) {
    if (membership.status !== 'active') continue;
    if (membership.role === 'staff') continue; // staff is server-managed only
    workspaces.push({
      id: institutionWorkspaceId(membership.institutionId),
      kind: 'institution',
      label: membership.institutionName,
      description:
        membership.role === 'teacher'
          ? 'Institution teaching workspace.'
          : 'Institution administration workspace.',
      href: `/dashboard/institution?institutionId=${encodeURIComponent(membership.institutionId)}`,
      institutionId: membership.institutionId,
      memberRole: membership.role,
    });
  }

  return workspaces;
}

export type RouteReason =
  | 'verify-email'
  | 'onboarding'
  | 'suspended'
  | 'workspace'
  | 'admin'
  | 'no-roles';

export interface RouteDecision {
  path: string;
  reason: RouteReason;
}

export interface RouteInput {
  emailVerified: boolean;
  profile: Pick<UserProfile, 'status' | 'onboarding' | 'activeWorkspace'> | null;
  rolesDoc: UserRolesDoc | null;
  memberships: readonly MembershipInput[];
  platformAdmin: boolean;
  /** Set when the user has submitted a role request but nothing is active yet. */
  hasPendingRequests?: boolean;
}

/**
 * Decide where a freshly authenticated user belongs.
 * Mirrors §14 (dashboard routing) of the specification.
 */
export function resolvePostAuthRoute(input: RouteInput): RouteDecision {
  if (!input.emailVerified) return { path: '/verify-email', reason: 'verify-email' };
  if (!input.profile) return { path: '/onboarding', reason: 'onboarding' };
  if (input.profile.status === 'suspended') {
    return { path: '/access-denied?reason=suspended', reason: 'suspended' };
  }
  if (!input.profile.onboarding.complete) {
    return { path: '/onboarding', reason: 'onboarding' };
  }

  const roles = effectiveRoles(input.rolesDoc);
  const workspaces = buildWorkspaces({ roles, memberships: input.memberships });

  if (workspaces.length === 1 && input.platformAdmin) {
    return { path: '/admin', reason: 'admin' };
  }
  if (workspaces.length === 1) {
    // Onboarding is already complete and the account data is saved; send the
    // user straight to the feed instead of back into onboarding.
    return { path: '/feed', reason: 'no-roles' };
  }

  const remembered = input.profile.activeWorkspace
    ? workspaces.find((workspace) => workspace.id === input.profile?.activeWorkspace)
    : undefined;
  if (remembered) return { path: remembered.href, reason: 'workspace' };

  if (workspaces.length === 2) {
    // Personal + exactly one role: go straight to the role workspace.
    const roleWorkspace = workspaces[1];
    if (roleWorkspace) return { path: roleWorkspace.href, reason: 'workspace' };
  }

  if (input.platformAdmin) return { path: '/admin', reason: 'admin' };

  return { path: '/feed', reason: 'workspace' };
}

/** Guard for institution-scoped pages. */
export function resolveInstitutionAccess(
  memberships: readonly MembershipInput[],
  institutionId: string,
): { allowed: boolean; reason?: string } {
  const membership = memberships.find(
    (candidate) => candidate.institutionId === institutionId && candidate.status === 'active',
  );
  if (!membership) return { allowed: false, reason: 'not-a-member' };
  if (membership.role === 'staff') return { allowed: false, reason: 'not-a-member' };
  return { allowed: true };
}
