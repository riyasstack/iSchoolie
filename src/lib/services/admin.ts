/**
 * Platform administration reads.
 *
 * Deliberate split:
 *   - Reads (queues, audit trail) happen in the browser for platform admins.
 *   - Privilege-granting writes (approving institutions, granting roles,
 *     verifying teachers, provisioning owners) run only through the Admin SDK
 *     CLI in scripts/admin. The UI never pretends to be able to do them.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import type { AuditLog, Institution, InstitutionMember, UserProfile, UserRolesDoc } from '@/lib/models';

export interface AdminUserRow {
  profile: UserProfile;
  roles: UserRolesDoc | null;
}

/** Role documents carry their Firestore id (which is the user's uid). */
export type UserRolesEntry = UserRolesDoc & { id: string };

export async function listRecentUsers(max = 50): Promise<UserProfile[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return docsWithId<UserProfile>(snapshot);
}

export async function listTeacherVerificationQueue(): Promise<UserRolesEntry[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'userRoles'), limit(200)));
  return docsWithId<UserRolesEntry>(snapshot).filter(
    (roles) =>
      roles.teacherVerification?.status === 'pending' ||
      roles.teacherVerification?.status === 'verified',
  );
}

export async function getRoles(uid: string): Promise<UserRolesDoc | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'userRoles', uid));
  return docWithId<UserRolesDoc>(snapshot);
}

export async function listAuditLogs(max = 50): Promise<AuditLog[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return docsWithId<AuditLog>(snapshot);
}

export async function listInstitutionsForAdmin(): Promise<Institution[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'institutions'), limit(100)));
  return docsWithId<Institution>(snapshot);
}

export async function listMembersForAdmin(institutionId: string): Promise<InstitutionMember[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'institutions', institutionId, 'members'), limit(200)),
  );
  return docsWithId<InstitutionMember>(snapshot).map((member) => ({
    ...member,
    institutionId,
  }));
}

/** Human-readable equivalent of the privileged command an operator must run. */
export function approveInstitutionCommand(applicationId: string): string {
  return `npm run admin -- institutions approve --application ${applicationId} --operator you@ischoolie.app`;
}

export function verifyTeacherCommand(uid: string): string {
  return `npm run admin -- teachers verify --uid ${uid} --operator you@ischoolie.app`;
}

export function grantRoleCommand(uid: string, role: string): string {
  return `npm run admin -- roles grant --uid ${uid} --role ${role} --operator you@ischoolie.app`;
}
