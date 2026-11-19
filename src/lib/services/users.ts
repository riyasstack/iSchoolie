/**
 * Account read/write services.
 *
 * Read budget per session restore (Spark): 2 fixed documents
 * (`users/{uid}`, `userRoles/{uid}`) + one membership query + one read per
 * institution for its display name. That is the whole cost of knowing who a
 * person is and what they may open.
 */
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import { slugify } from '@/lib/utils/dates';
import type {
  AppNotification,
  InstitutionMember,
  RoleKey,
  UserPrivateProfile,
  UserProfile,
  UserRolesDoc,
} from '@/lib/models';
import type { MembershipInput } from '@/lib/auth/workspaces';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';

export interface AccountSnapshot {
  profile: UserProfile | null;
  roles: UserRolesDoc | null;
  memberships: MembershipInput[];
  requestedRoles: RoleKey[];
}

function emptySafeguarding() {
  return {
    isMinor: false,
    privateProfile: true,
    messagingEnabled: false,
    guardianConsentRecordedAt: null,
  };
}

/**
 * Idempotent bootstrap of the documents a signed-in identity needs.
 *
 * The UID is the document id, so a retry can never create a second profile.
 * If this fails (offline, rules misconfigured) the caller surfaces a recovery
 * screen instead of leaving the user on a spinner.
 */
export async function ensureAccountDocuments(user: User): Promise<void> {
  const db = requireDb();
  const profileRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) return;

  const displayName = (user.displayName || user.email?.split('@')[0] || 'iSchoolie member').trim();
  const handleBase = slugify(displayName) || 'member';

  await setDoc(profileRef, {
    uid: user.uid,
    displayName,
    handle: `${handleBase}-${user.uid.slice(0, 4)}`,
    photoURL: user.photoURL ?? null,
    headline: null,
    country: null,
    status: 'active',
    onboarding: { complete: false, selectedRoles: [], completedAt: null },
    activeWorkspace: null,
    teacher: null,
    studentLevel: null,
    safeguarding: emptySafeguarding(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
    email: user.email ?? '',
    dateOfBirth: null,
    schoolName: null,
    grade: null,
    collegeName: null,
    degree: null,
    department: null,
    academicStage: null,
    learningInterests: [],
    guardianEmail: null,
    consent: {
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      acceptedTermsAt: serverTimestamp(),
      acceptedPrivacyAt: serverTimestamp(),
      guardianAcknowledgedAt: null,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function loadAccount(uid: string): Promise<AccountSnapshot> {
  const db = requireDb();
  const [profile, roles] = await Promise.all([
    getDoc(doc(db, 'users', uid)).then((snap) => docWithId<UserProfile>(snap)),
    getDoc(doc(db, 'userRoles', uid)).then((snap) => docWithId<UserRolesDoc>(snap)),
  ]);

  // One collection-group query covers every institution membership the person
  // holds. Institution name is denormalised onto the member document, so this
  // costs no additional reads.
  const memberDocs = await getDocs(
    query(collectionGroup(db, 'members'), where('uid', '==', uid), limit(25)),
  );
  const memberships: MembershipInput[] = memberDocs.docs
    .map((memberDoc) => {
      const data = memberDoc.data() as InstitutionMember;
      const institutionId = memberDoc.ref.parent.parent?.id ?? '';
      return {
        institutionId,
        institutionName: data.institutionName ?? 'Institution',
        role: data.role,
        status: data.status,
      };
    })
    .filter((membership) => membership.institutionId !== '' && membership.status === 'active');

  const requestDocs = await getDocs(collection(db, 'users', uid, 'roleRequests'));
  const requestedRoles = requestDocs.docs
    .map((requestDoc) => requestDoc.data().role as RoleKey | undefined)
    .filter((role): role is RoleKey => Boolean(role));

  return { profile, roles, memberships, requestedRoles };
}

export async function loadPrivateProfile(uid: string): Promise<UserPrivateProfile | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
  return docWithId<UserPrivateProfile>(snapshot);
}

export async function setActiveWorkspace(uid: string, workspaceId: string | null): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'users', uid), {
    activeWorkspace: workspaceId,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePublicProfile(
  uid: string,
  values: { displayName?: string; headline?: string | null; country?: string | null },
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'users', uid), { ...values, updatedAt: serverTimestamp() });
}

export async function updatePrivateProfile(
  uid: string,
  values: Partial<Omit<UserPrivateProfile, 'email' | 'updatedAt'>>,
): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, 'users', uid, 'private', 'profile'),
    { ...values, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listNotifications(uid: string, max = 20): Promise<AppNotification[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
  );
  return docsWithId<AppNotification>(snapshot);
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(uid: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = requireDb();
  const batch = writeBatch(db);
  for (const id of ids.slice(0, 400)) {
    batch.update(doc(db, 'users', uid, 'notifications', id), { read: true });
  }
  await batch.commit();
}

/** Best-effort cache. Never consulted for permissions or grades. */
export async function writeDashboardSummary(
  uid: string,
  summary: { studentAssignmentCount: number; teacherClassCount: number; guardianChildCount: number },
): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, 'users', uid, 'summaries', 'overview'),
    { ...summary, updatedAt: serverTimestamp() },
    { merge: true },
  );
}


