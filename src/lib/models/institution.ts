import type { AppDate } from './identity';

/* ==========================================================================
   Institutions and the approval workflow
   ========================================================================== */

export type InstitutionCategory =
  | 'school'
  | 'college'
  | 'university'
  | 'coaching_centre'
  | 'training_institution';

export type InstitutionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_information_required'
  | 'approved'
  | 'rejected';

export type InstitutionStatus = 'active' | 'suspended';

export type InstitutionMemberRole = 'owner' | 'admin' | 'teacher' | 'staff';
export type InstitutionMemberStatus = 'active' | 'revoked';

export interface InstitutionDeclarations {
  authorizedToApply: boolean;
  informationAccurate: boolean;
  acceptsTerms: boolean;
}

/**
 * `institutionApplications/{appId}`
 * The applicant may only create/update their own application while it is in
 * `draft`/`more_information_required`, and may never set decision fields.
 */
export interface InstitutionApplication {
  id: string;
  applicantUid: string;
  institutionName: string;
  category: InstitutionCategory;
  officialEmail: string;
  contactName: string;
  contactDesignation: string;
  contactPhone: string;
  website: string | null;
  country: string;
  city: string;
  registrationInfo: string | null;
  declarations: InstitutionDeclarations;
  status: InstitutionApplicationStatus;
  submittedAt: AppDate | null;
  reviewerUid: string | null;
  reviewNote: string | null;
  /** Set by the admin CLI when the application is approved. */
  institutionId: string | null;
  createdAt: AppDate;
  updatedAt: AppDate;
}

/**
 * The applicant's own application as the API returns it: same fields, but the
 * Firestore `AppDate`s are ISO strings so client components stay free of the
 * Firestore SDK.
 */
export interface InstitutionApplicationView
  extends Omit<InstitutionApplication, 'submittedAt' | 'createdAt' | 'updatedAt'> {
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Append-only review trail. Clients cannot write this subcollection. */
export interface InstitutionApplicationEvent {
  id: string;
  action: string;
  actorUid: string;
  actorKind: 'applicant' | 'platform_admin' | 'admin_cli';
  note: string | null;
  createdAt: AppDate;
}

/** `institutions/{instId}` — created only by the privileged admin CLI. */
export interface Institution {
  id: string;
  name: string;
  slug: string;
  category: InstitutionCategory;
  officialEmail: string;
  website: string | null;
  country: string;
  city: string;
  status: InstitutionStatus;
  ownerUid: string;
  sourceApplicationId: string | null;
  createdAt: AppDate;
  approvedAt: AppDate;
  approvedBy: string;
}

/** `institutions/{instId}/members/{uid}` — the authoritative access record. */
export interface InstitutionMember {
  uid: string;
  institutionId: string;
  institutionName: string;
  displayName: string;
  email: string;
  role: InstitutionMemberRole;
  status: InstitutionMemberStatus;
  addedBy: string;
  addedAt: AppDate;
  revokedAt: AppDate | null;
}

/* ==========================================================================
   Guardian relationships
   ========================================================================== */

export type GuardianLinkStatus =
  | 'requested'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'revoked'
  | 'expired';

export type GuardianRelationship =
  | 'mother'
  | 'father'
  | 'legal_guardian'
  | 'grandparent'
  | 'sibling'
  | 'other';

export interface GuardianConsent {
  academic: boolean;
  attendance: boolean;
  announcements: boolean;
}

/**
 * `guardianLinks/{guardianUid}_{studentUid}` — deterministic id makes the
 * relationship cheap to check in Security Rules (`get()` on a known path).
 */
export interface GuardianLink {
  id: string;
  guardianUid: string;
  guardianName: string;
  studentUid: string;
  studentName: string;
  relationship: GuardianRelationship;
  status: GuardianLinkStatus;
  requestedBy: string;
  requestedAt: AppDate;
  studentConfirmedAt: AppDate | null;
  verifiedBy: string | null;
  verifiedAt: AppDate | null;
  revokedBy: string | null;
  revokedAt: AppDate | null;
  note: string | null;
  consent: GuardianConsent;
  expiresAt: AppDate | null;
}
