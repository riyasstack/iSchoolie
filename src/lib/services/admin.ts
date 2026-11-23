import type { UserProfile, UserRolesDoc } from '@/lib/models';

export interface AdminUserRow {
  profile: UserProfile;
  roles: UserRolesDoc | null;
}

export type UserRolesEntry = UserRolesDoc & { id: string };

export async function listRecentUsers(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }
export async function listTeacherVerificationQueue(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }
export async function getRoles(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }
export async function listAuditLogs(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }
export async function listInstitutionsForAdmin(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }
export async function listMembersForAdmin(..._args: any[]): Promise<any> { throw new Error('Admin domain is not available yet.'); }

export function approveInstitutionCommand(applicationId: string): string {
  return `npm run admin -- institutions approve --application ${applicationId} --operator you@ischoolie.app`;
}
export function verifyTeacherCommand(uid: string): string {
  return `npm run admin -- teachers verify --uid ${uid} --operator you@ischoolie.app`;
}
export function grantRoleCommand(uid: string, role: string): string {
  return `npm run admin -- roles grant --uid ${uid} --role ${role} --operator you@ischoolie.app`;
}