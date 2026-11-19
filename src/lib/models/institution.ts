import type { Timestamp } from 'firebase/firestore';

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
  submittedAt: Timestamp | null;
  reviewerUid: string | null;
  reviewNote: string | null;
  /** Set by the admin CLI when the application is approved. */
  institutionId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Append-only review trail. Clients cannot write this subcollection. */
export interface InstitutionApplicationEvent {
  id: string;
  action: string;
  actorUid: string;
  actorKind: 'applicant' | 'platform_admin' | 'admin_cli';
  note: string | null;
  createdAt: Timestamp;
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
  createdAt: Timestamp;
  approvedAt: Timestamp;
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
  addedAt: Timestamp;
  revokedAt: Timestamp | null;
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
  requestedAt: Timestamp;
  studentConfirmedAt: Timestamp | null;
  verifiedBy: string | null;
  verifiedAt: Timestamp | null;
  revokedBy: string | null;
  revokedAt: Timestamp | null;
  note: string | null;
  consent: GuardianConsent;
  expiresAt: Timestamp | null;
}
