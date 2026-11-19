/**
 * Institution applications and memberships.
 *
 * Application documents use the applicant's UID as the id, which makes
 * duplicates structurally impossible and gives Security Rules a deterministic
 * path to check. Only the privileged admin CLI can create an `institutions`
 * document; the applicant can never promote themselves.
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
  type Timestamp,
} from 'firebase/firestore';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import type {
  Institution,
  InstitutionApplication,
  InstitutionApplicationEvent,
  InstitutionApplicationStatus,
  InstitutionMember,
} from '@/lib/models';
import type { InstitutionApplicationValues } from '@/lib/schemas/institution';

export const OPEN_APPLICATION_STATUSES: InstitutionApplicationStatus[] = [
  'submitted',
  'under_review',
  'more_information_required',
];

export async function getMyApplication(uid: string): Promise<InstitutionApplication | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'institutionApplications', uid));
  return docWithId<InstitutionApplication>(snapshot);
}

export interface SubmitApplicationOptions {
  submit: boolean;
  applicantName: string;
}

/** Create or update the caller's single application. */
export async function saveInstitutionApplication(
  uid: string,
  values: InstitutionApplicationValues,
  options: SubmitApplicationOptions,
): Promise<void> {
  const db = requireDb();
  const reference = doc(db, 'institutionApplications', uid);
  const existing = await getDoc(reference);

  if (existing.exists()) {
    const status = existing.data().status as InstitutionApplicationStatus;
    if (status === 'approved') {
      throw new Error('This application has already been approved.');
    }
    if (status === 'under_review' || status === 'submitted') {
      throw new Error(
        'Your application is already with the iSchoolie team. You will be able to edit it if more information is requested.',
      );
    }
    if (status === 'rejected' && options.submit) {
      // Re-applications reopen the same document; the history stays in events.
      await updateDoc(reference, {
        ...toApplicationPayload(values, true),
        updatedAt: serverTimestamp(),
        reviewerUid: null,
        reviewNote: null,
      });
      await recordEvent(uid, uid, 'resubmitted', 'applicant', 'Re-applied after a rejection');
      return;
    }
    await updateDoc(reference, {
      ...toApplicationPayload(values, options.submit),
      updatedAt: serverTimestamp(),
    });
    if (options.submit) {
      await recordEvent(uid, uid, 'submitted', 'applicant', 'Application submitted for review');
    }
    return;
  }

  await setDoc(reference, {
    id: uid,
    applicantUid: uid,
    ...toApplicationPayload(values, options.submit),
    status: options.submit ? 'submitted' : 'draft',
    submittedAt: options.submit ? serverTimestamp() : null,
    reviewerUid: null,
    reviewNote: null,
    institutionId: null,
    createdAt: serverTimestamp(),
  });
  await recordEvent(
    uid,
    uid,
    options.submit ? 'submitted' : 'draft_created',
    'applicant',
    `${options.applicantName} created the application`,
  );
}

function toApplicationPayload(values: InstitutionApplicationValues, submit: boolean) {
  return {
    institutionName: values.institutionName,
    category: values.category,
    officialEmail: values.officialEmail,
    contactName: values.contactName,
    contactDesignation: values.contactDesignation,
    contactPhone: values.contactPhone,
    website: values.website || null,
    country: values.country,
    city: values.city,
    registrationInfo: values.registrationInfo || null,
    declarations: {
      authorizedToApply: true,
      informationAccurate: true,
      acceptsTerms: true,
    },
    status: submit ? 'submitted' : 'draft',
  };
}

export async function recordEvent(
  applicationId: string,
  actorUid: string,
  action: string,
  actorKind: InstitutionApplicationEvent['actorKind'],
  note: string | null,
): Promise<void> {
  const db = requireDb();
  await addDoc(collection(db, 'institutionApplications', applicationId, 'events'), {
    action,
    actorUid,
    actorKind,
    note,
    createdAt: serverTimestamp(),
  });
}

export async function listApplicationEvents(
  applicationId: string,
): Promise<InstitutionApplicationEvent[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'institutionApplications', applicationId, 'events'),
      limit(50),
    ),
  );
  return docsWithId<InstitutionApplicationEvent>(snapshot).sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt),
  );
}

export function toMillis(value: Timestamp | null | undefined): number {
  return value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
}

export interface ReviewDecision {
  decision: 'under_review' | 'more_information_required' | 'reject';
  note: string;
  reviewerUid: string;
}

/**
 * Client-side reviews may only *pause* or *deny*. Approval (which creates the
 * institution, ownership and claims) is Admin-SDK-only — see
 * scripts/admin/index.ts. Security rules enforce the same split.
 */
export async function recordReviewDecision(
  applicationId: string,
  input: ReviewDecision,
): Promise<void> {
  const db = requireDb();
  const reference = doc(db, 'institutionApplications', applicationId);
  const status: InstitutionApplicationStatus =
    input.decision === 'reject'
      ? 'rejected'
      : input.decision === 'under_review'
        ? 'under_review'
        : 'more_information_required';

  await updateDoc(reference, {
    status,
    reviewerUid: input.reviewerUid,
    reviewNote: input.note,
    updatedAt: serverTimestamp(),
  });
  await recordEvent(applicationId, input.reviewerUid, `review:${status}`, 'platform_admin', input.note);
}

export async function listPendingApplications(): Promise<InstitutionApplication[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'institutionApplications'),
      where('status', 'in', OPEN_APPLICATION_STATUSES),
      limit(50),
    ),
  );
  return docsWithId<InstitutionApplication>(snapshot).sort(
    (a, b) => toMillis(a.submittedAt) - toMillis(b.submittedAt),
  );
}

export async function listAllApplications(): Promise<InstitutionApplication[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'institutionApplications'), limit(100)));
  return docsWithId<InstitutionApplication>(snapshot).sort(
    (a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt),
  );
}

export async function getApplication(applicationId: string): Promise<InstitutionApplication | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'institutionApplications', applicationId));
  return docWithId<InstitutionApplication>(snapshot);
}

export async function getInstitution(institutionId: string): Promise<Institution | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'institutions', institutionId));
  return docWithId<Institution>(snapshot);
}

export async function listInstitutionMembers(institutionId: string): Promise<InstitutionMember[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'institutions', institutionId, 'members'), limit(200)),
  );
  return docsWithId<InstitutionMember>(snapshot);
}

export async function listInstitutions(): Promise<Institution[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'institutions'), limit(100)));
  return docsWithId<Institution>(snapshot);
}

/** Members live at `institutions/{institutionId}/members/{uid}`. */
export function membershipDocId(_institutionId: string, uid: string): string {
  return uid;
}
