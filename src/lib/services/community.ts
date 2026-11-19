/** Communities, posts, comments and moderation reports. */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import { slugify } from '@/lib/utils/dates';
import type { Comment, Community, Post, Report } from '@/lib/models';
import type { ReportValues } from '@/lib/schemas/social';

export async function listCommunities(): Promise<Community[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'communities'),
      where('visibility', '==', 'public'),
      orderBy('memberCount', 'desc'),
      limit(20),
    ),
  );
  return docsWithId<Community>(snapshot);
}

export async function getCommunity(communityId: string): Promise<Community | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'communities', communityId));
  return docWithId<Community>(snapshot);
}

export async function createCommunity(
  values: { name: string; description: string; visibility: 'public' | 'institution' },
  author: { uid: string; displayName: string },
  institutionId: string | null,
): Promise<string> {
  const db = requireDb();
  const reference = doc(collection(db, 'communities'));
  await setDoc(reference, {
    name: values.name,
    slug: slugify(values.name),
    description: values.description,
    visibility: values.visibility,
    institutionId: values.visibility === 'institution' ? institutionId : null,
    createdBy: author.uid,
    memberCount: 1,
    postCount: 0,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(reference, 'participants', author.uid), {
    uid: author.uid,
    displayName: author.displayName,
    joinedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function joinCommunity(communityId: string, member: { uid: string; displayName: string }): Promise<void> {
  const db = requireDb();
  const communityRef = doc(db, 'communities', communityId);
  const memberRef = doc(communityRef, 'participants', member.uid);
  const existing = await getDoc(memberRef);
  if (existing.exists()) return;
  await setDoc(memberRef, {
    uid: member.uid,
    displayName: member.displayName,
    joinedAt: serverTimestamp(),
  });
  await updateDoc(communityRef, { memberCount: increment(1) });
}

export async function isCommunityMember(communityId: string, uid: string): Promise<boolean> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'communities', communityId, 'participants', uid));
  return snapshot.exists();
}

export async function listPosts(communityId: string, max = 20): Promise<Post[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'communities', communityId, 'posts'),
      where('status', '==', 'visible'),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
  );
  return docsWithId<Post>(snapshot);
}

export async function createPost(
  communityId: string,
  body: string,
  author: { uid: string; displayName: string },
): Promise<void> {
  const db = requireDb();
  const communityRef = doc(db, 'communities', communityId);
  await addDoc(collection(communityRef, 'posts'), {
    communityId,
    authorUid: author.uid,
    authorName: author.displayName,
    body,
    status: 'visible',
    commentCount: 0,
    likeCount: 0,
    createdAt: serverTimestamp(),
  });
  await updateDoc(communityRef, { postCount: increment(1) });
}

export async function listComments(
  communityId: string,
  postId: string,
): Promise<Comment[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'communities', communityId, 'posts', postId, 'comments'),
      limit(100),
    ),
  );
  return docsWithId<Comment>(snapshot).sort(
    (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
  );
}

export async function addComment(
  communityId: string,
  postId: string,
  body: string,
  author: { uid: string; displayName: string },
): Promise<void> {
  const db = requireDb();
  const postRef = doc(db, 'communities', communityId, 'posts', postId);
  await addDoc(collection(postRef, 'comments'), {
    authorUid: author.uid,
    authorName: author.displayName,
    body,
    createdAt: serverTimestamp(),
  });
  await updateDoc(postRef, { commentCount: increment(1) });
}

export async function reportContent(
  reporterUid: string,
  values: ReportValues,
): Promise<void> {
  const db = requireDb();
  await addDoc(collection(db, 'reports'), {
    reporterUid,
    targetType: values.targetType,
    targetPath: values.targetPath,
    targetOwnerUid: values.targetOwnerUid,
    reason: values.reason,
    details: values.details || null,
    status: 'open',
    handledBy: null,
    handledAt: null,
    action: null,
    createdAt: serverTimestamp(),
  });
}

export async function listReports(): Promise<Report[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'reports'), where('status', '==', 'open'), limit(50)),
  );
  return docsWithId<Report>(snapshot);
}

export async function resolveReport(
  reportId: string,
  adminUid: string,
  action: string,
  outcome: 'actioned' | 'dismissed',
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, 'reports', reportId), {
    status: outcome,
    handledBy: adminUid,
    handledAt: serverTimestamp(),
    action,
  });
}
