import { describe, expect, it } from 'vitest';
import {
  buildWorkspaces,
  institutionWorkspaceId,
  resolveInstitutionAccess,
  resolvePostAuthRoute,
} from '@/lib/auth/workspaces';
import type { RoleKey, UserRolesDoc } from '@/lib/models';

const rolesDoc = (selfDeclared: RoleKey[], granted: RoleKey[] = []): UserRolesDoc =>
  ({
    selfDeclared,
    granted,
    revoked: [],
    teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
    updatedAt: null,
  }) as unknown as UserRolesDoc;

const baseProfile = {
  status: 'active' as const,
  onboarding: { complete: true, selectedRoles: [], completedAt: null },
  activeWorkspace: null as string | null,
};

const membership = (
  institutionId: string,
  role: 'owner' | 'admin' | 'teacher' | 'staff' = 'owner',
  status: 'active' | 'revoked' = 'active',
) => ({ institutionId, institutionName: `Inst ${institutionId}`, role, status });

describe('buildWorkspaces', () => {
  it('always includes the personal workspace', () => {
    const workspaces = buildWorkspaces({ roles: [], memberships: [] });
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]?.kind).toBe('personal');
  });

  it('adds one workspace per approved role and institution', () => {
    const workspaces = buildWorkspaces({
      roles: ['student_school', 'teacher', 'parent'],
      memberships: [membership('abc')],
    });
    expect(workspaces.map((workspace) => workspace.kind)).toEqual([
      'personal',
      'student_school',
      'teacher',
      'parent',
      'institution',
    ]);
    expect(workspaces.at(-1)?.href).toContain('institutionId=abc');
  });

  it('hides revoked memberships and staff rows', () => {
    const workspaces = buildWorkspaces({
      roles: [],
      memberships: [membership('revoked', 'owner', 'revoked'), membership('staffinst', 'staff')],
    });
    expect(workspaces).toHaveLength(1);
  });

  it('builds deterministic ids for the workspace switcher', () => {
    expect(institutionWorkspaceId('abc')).toBe('institution:abc');
  });
});

describe('resolvePostAuthRoute', () => {
  const base = {
    emailVerified: true,
    profile: baseProfile,
    rolesDoc: rolesDoc([]),
    memberships: [],
    platformAdmin: false,
  };

  it('requires email verification first', () => {
    expect(resolvePostAuthRoute({ ...base, emailVerified: false }).path).toBe('/verify-email');
  });

  it('sends a new user to social onboarding', () => {
    expect(
      resolvePostAuthRoute({
        ...base,
        profile: { ...baseProfile, onboarding: { complete: false, selectedRoles: [], completedAt: null } },
      }).path,
    ).toBe('/onboarding/social');
  });

  it('sends a suspended account to the restricted screen', () => {
    const decision = resolvePostAuthRoute({
      ...base,
      profile: { ...baseProfile, status: 'suspended' },
    });
    expect(decision.path).toBe('/access-denied?reason=suspended');
  });

  it('routes a user with exactly one role straight to that workspace', () => {
    const decision = resolvePostAuthRoute({
      ...base,
      rolesDoc: rolesDoc(['student_school']),
    });
    expect(decision.path).toBe('/dashboard/student');
    expect(decision.reason).toBe('workspace');
  });

  it('offers the selector when several roles exist and none is remembered', () => {
    const decision = resolvePostAuthRoute({
      ...base,
      rolesDoc: rolesDoc(['student_school', 'teacher']),
    });
    expect(decision.path).toBe('/feed');
    expect(decision.reason).toBe('workspace');
  });

  it('honours a remembered workspace that is still authorised', () => {
    const decision = resolvePostAuthRoute({
      ...base,
      profile: { ...baseProfile, activeWorkspace: institutionWorkspaceId('abc') },
      rolesDoc: rolesDoc(['student_school', 'teacher'], ['institution_admin']),
      memberships: [membership('abc')],
    });
    expect(decision.path).toContain('/dashboard/institution');
  });

  it('ignores a remembered workspace that was revoked', () => {
    const decision = resolvePostAuthRoute({
      ...base,
      profile: { ...baseProfile, activeWorkspace: institutionWorkspaceId('abc') },
      rolesDoc: rolesDoc(['student_school', 'teacher']),
      memberships: [membership('abc', 'owner', 'revoked')],
    });
    expect(decision.path).toBe('/feed');
  });

  it('keeps a user without roles in onboarding', () => {
    expect(resolvePostAuthRoute({ ...base, hasPendingRequests: true }).reason).toBe('no-roles');
  });

  it('sends platform admins without roles to the admin area', () => {
    expect(resolvePostAuthRoute({ ...base, platformAdmin: true }).path).toBe('/admin');
  });
});

describe('resolveInstitutionAccess', () => {
  it('allows active teaching members only', () => {
    expect(resolveInstitutionAccess([membership('a')], 'a')).toEqual({ allowed: true });
    expect(resolveInstitutionAccess([membership('a', 'staff')], 'a').allowed).toBe(false);
    expect(resolveInstitutionAccess([membership('a', 'owner', 'revoked')], 'a').allowed).toBe(false);
    expect(resolveInstitutionAccess([], 'a').allowed).toBe(false);
  });
});
