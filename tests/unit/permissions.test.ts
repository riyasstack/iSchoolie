import { describe, expect, it } from 'vitest';
import {
  accessDeniedMessage,
  canAdministerInstitution,
  canAdministerInstitutionId,
  canPublishCourses,
  canTeachInstitution,
  canUseDirectMessaging,
  effectiveRoles,
  isSuspended,
  SELF_SERVE_ROLES,
} from '@/lib/auth/permissions';
import type { RoleKey, UserProfile, UserRolesDoc } from '@/lib/models';

const rolesDoc = (overrides: Partial<UserRolesDoc> = {}): UserRolesDoc =>
  ({
    selfDeclared: [],
    granted: [],
    revoked: [],
    teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
    updatedAt: null,
    ...overrides,
  }) as unknown as UserRolesDoc;

const profile = (overrides: Partial<UserProfile> = {}): UserProfile =>
  ({
    uid: 'u1',
    displayName: 'Test',
    handle: 'test',
    photoURL: null,
    headline: null,
    country: null,
    status: 'active',
    onboarding: { complete: true, selectedRoles: [], completedAt: null },
    activeWorkspace: null,
    teacher: null,
    studentLevel: null,
    safeguarding: {
      isMinor: false,
      privateProfile: false,
      messagingEnabled: true,
      guardianConsentRecordedAt: null,
    },
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }) as unknown as UserProfile;

describe('effectiveRoles', () => {
  it('merges self-declared and granted roles', () => {
    const doc = rolesDoc({ selfDeclared: ['teacher'], granted: ['institution_admin'] });
    expect(effectiveRoles(doc)).toEqual(['teacher', 'institution_admin']);
  });

  it('lets revocation win over any grant', () => {
    const doc = rolesDoc({
      selfDeclared: ['teacher'],
      granted: ['institution_admin'],
      revoked: ['teacher'],
    });
    expect(effectiveRoles(doc)).toEqual(['institution_admin']);
  });

  it('returns nothing without a role document', () => {
    expect(effectiveRoles(null)).toEqual([]);
    expect(effectiveRoles(undefined)).toEqual([]);
  });

  it('never self-serves a privileged role', () => {
    expect(SELF_SERVE_ROLES).not.toContain<RoleKey>('institution_admin');
  });
});

describe('institution permissions', () => {
  it('separates administration from teaching', () => {
    expect(canAdministerInstitution('owner')).toBe(true);
    expect(canAdministerInstitution('admin')).toBe(true);
    expect(canAdministerInstitution('teacher')).toBe(false);
    expect(canTeachInstitution('teacher')).toBe(true);
    expect(canTeachInstitution('staff')).toBe(false);
  });

  it('scopes checks to the institution id', () => {
    const memberships = [
      { institutionId: 'A', role: 'owner' as const, status: 'active' as const },
      { institutionId: 'B', role: 'teacher' as const, status: 'revoked' as const },
    ];
    expect(canAdministerInstitutionId(memberships, 'A')).toBe(true);
    expect(canAdministerInstitutionId(memberships, 'B')).toBe(false);
    expect(canAdministerInstitutionId(memberships, 'C')).toBe(false);
  });

  it('ignores revoked memberships entirely', () => {
    const memberships = [{ institutionId: 'A', role: 'owner' as const, status: 'revoked' as const }];
    expect(canAdministerInstitutionId(memberships, 'A')).toBe(false);
  });
});

describe('verification and safeguarding gates', () => {
  it('requires the verified claim or record to publish courses', () => {
    expect(canPublishCourses({ claims: null, roles: rolesDoc() })).toBe(false);
    expect(
      canPublishCourses({
        claims: {
          platformAdmin: false,
          teacherVerified: true,
          roles: [],
          suspended: false,
        },
        roles: rolesDoc(),
      }),
    ).toBe(true);
    expect(
      canPublishCourses({
        claims: null,
        roles: rolesDoc({
          teacherVerification: { status: 'verified', note: null, decidedAt: null },
        }),
      }),
    ).toBe(true);
  });

  it('blocks direct messaging for protected accounts', () => {
    expect(canUseDirectMessaging(profile())).toBe(true);
    expect(
      canUseDirectMessaging(
        profile({
          safeguarding: {
            isMinor: true,
            privateProfile: true,
            messagingEnabled: false,
            guardianConsentRecordedAt: null,
          },
        }),
      ),
    ).toBe(false);
  });

  it('detects suspension from claims or the profile document', () => {
    expect(
      isSuspended({
        claims: { platformAdmin: false, teacherVerified: false, roles: [], suspended: true },
        profile: null,
      }),
    ).toBe(true);
    expect(isSuspended({ claims: null, profile: profile({ status: 'suspended' }) })).toBe(true);
    expect(isSuspended({ claims: null, profile: profile() })).toBe(false);
  });

  it('explains denials without leaking resource details', () => {
    expect(accessDeniedMessage('institution-not-approved')).toMatch(/not been approved/i);
    expect(accessDeniedMessage('suspended')).toMatch(/suspended/i);
    expect(accessDeniedMessage(null)).toMatch(/permission/i);
    // The message must not embed an id or an email.
    expect(accessDeniedMessage('not-a-member')).not.toMatch(/@/);
  });
});
