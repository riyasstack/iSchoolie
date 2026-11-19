/**
 * Guardian relationships.
 *
 * Discovery problem: a guardian knows a student's email, not their UID. So the
 * flow starts with a request document scoped by email, which the student (and
 * only the student) can claim. Rules compare `request.auth.token.email` with
 * the request's `studentEmail`, so no directory or email lookup is exposed.
 *
 *   requested --(student confirms)--> pending_verification
 *              --(platform admin verifies)--> approved
 *   any party may revoke.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import { guardianLinkId } from '@/lib/utils/dates';
import type { GuardianLink, GuardianLinkStatus } from '@/lib/models';
import type { GuardianRequestValues } from '@/lib/schemas/social';

export interface GuardianRequestDoc {
  id: string;
  guardianUid: string;
  guardianName: string;
  studentEmail: string;
  studentUid: string | null;
  relationship: GuardianRequestValues['relationship'];
  consent: GuardianRequestValues['consent'];
  status: GuardianLinkStatus;
  note: string | null;
  decidedBy: string | null;
  decidedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function requestGuardianLink(
  guardian: { uid: string; displayName: string },
  values: GuardianRequestValues,
): Promise<void> {
  const db = requireDb();
  await addDoc(collection(db, 'guardianLinkRequests'), {
    guardianUid: guardian.uid,
    guardianName: guardian.displayName,
    studentEmail: values.studentEmail.trim().toLowerCase(),
    studentUid: null,
    relationship: values.relationship,
    consent: values.consent,
    status: 'requested',
    note: null,
    decidedBy: null,
    decidedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listRequestsForGuardian(uid: string): Promise<GuardianRequestDoc[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'guardianLinkRequests'),
      where('guardianUid', '==', uid),
      limit(20),
    ),
  );
  return docsWithId<GuardianRequestDoc>(snapshot);
}

/** Requests addressed to the signed-in student's verified email. */
export async function listRequestsForStudentEmail(email: string): Promise<GuardianRequestDoc[]> {
  if (!email) return [];
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'guardianLinkRequests'),
      where('studentEmail', '==', email.toLowerCase()),
      limit(20),
    ),
  );
  return docsWithId<GuardianRequestDoc>(snapshot);
}

export async function confirmGuardianRequest(requestId: string, studentUid: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'guardianLinkRequests', requestId), {
    studentUid,
    status: 'pending_verification',
    updatedAt: serverTimestamp(),
  });
}

export async function cancelGuardianRequest(requestId: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'guardianLinkRequests', requestId), {
    status: 'rejected',
    decidedBy: 'guardian',
    decidedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Platform-admin verification. Creates the deterministic link document that
 * Security Rules consult when a guardian reads a child's academic record.
 */
export async function approveGuardianRequest(
  request: GuardianRequestDoc,
  student: { uid: string; displayName: string },
  adminUid: string,
): Promise<void> {
  if (!request.studentUid) throw new Error('The student has not confirmed this request yet.');
  const db = requireDb();
  const id = guardianLinkId(request.guardianUid, student.uid);

  await setDoc(doc(db, 'guardianLinks', id), {
    guardianUid: request.guardianUid,
    guardianName: request.guardianName,
    studentUid: student.uid,
    studentName: student.displayName,
    relationship: request.relationship,
    status: 'approved',
    requestedBy: request.guardianUid,
    requestedAt: request.createdAt,
    studentConfirmedAt: serverTimestamp(),
    verifiedBy: adminUid,
    verifiedAt: serverTimestamp(),
    revokedBy: null,
    revokedAt: null,
    note: null,
    consent: request.consent,
    expiresAt: null,
  });

  await updateDoc(doc(db, 'guardianLinkRequests', request.id), {
    status: 'approved',
    decidedBy: adminUid,
    decidedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function rejectGuardianRequest(
  requestId: string,
  adminUid: string,
  note: string,
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'guardianLinkRequests', requestId), {
    status: 'rejected',
    note,
    decidedBy: adminUid,
    decidedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listLinksForGuardian(uid: string): Promise<GuardianLink[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'guardianLinks'), where('guardianUid', '==', uid), limit(20)),
  );
  return docsWithId<GuardianLink>(snapshot);
}

export async function listLinksForStudent(uid: string): Promise<GuardianLink[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'guardianLinks'), where('studentUid', '==', uid), limit(20)),
  );
  return docsWithId<GuardianLink>(snapshot);
}

export async function listPendingLinks(): Promise<GuardianLink[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'guardianLinks'), where('status', '==', 'pending_verification'), limit(50)),
  );
  return docsWithId<GuardianLink>(snapshot);
}

/** Requests the student has confirmed and that await iSchoolie verification. */
export async function listPendingGuardianRequests(): Promise<GuardianRequestDoc[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'guardianLinkRequests'),
      where('status', '==', 'pending_verification'),
      limit(50),
    ),
  );
  return docsWithId<GuardianRequestDoc>(snapshot);
}

export async function revokeGuardianLink(linkId: string, actorUid: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'guardianLinks', linkId), {
    status: 'revoked',
    revokedBy: actorUid,
    revokedAt: serverTimestamp(),
  });
}

export async function getGuardianLink(linkId: string): Promise<GuardianLink | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'guardianLinks', linkId));
  return docWithId<GuardianLink>(snapshot);
}
