import type { Timestamp } from 'firebase/firestore';

/* ==========================================================================
   Identity
   The public profile document (`users/{uid}`) must never contain private
   contact or academic detail. Those live in `users/{uid}/private/*`.
   ========================================================================== */

export type UserStatus = 'active' | 'suspended' | 'pending_deletion';

export type RoleKey =
  | 'student_school'
  | 'student_college'
  | 'teacher'
  | 'parent'
  | 'institution_admin';

export type StudentLevel = 'school' | 'college';

export type TeacherVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended';

export interface OnboardingState {
  complete: boolean;
  selectedRoles: RoleKey[];
  completedAt: Timestamp | null;
}

export interface TeacherPublicInfo {
  subjects: string[];
  levels: string[];
  yearsExperience: number;
  bio: string;
  qualification: string | null;
  institutionName: string | null;
}

export interface SafeguardingState {
  /** Derived from date of birth at onboarding time (never from grade alone). */
  isMinor: boolean;
  /** Public discoverability for minors is always restricted. */
  privateProfile: boolean;
  /** Direct messaging between adults and unverified minors is disabled. */
  messagingEnabled: boolean;
  guardianConsentRecordedAt: Timestamp | null;
}

/** Public-safe identity document. Readable by any authenticated user. */
export interface UserProfile {
  uid: string;
  displayName: string;
  handle: string;
  photoURL: string | null;
  headline: string | null;
  country: string | null;
  status: UserStatus;
  onboarding: OnboardingState;
  activeWorkspace: string | null;
  teacher: TeacherPublicInfo | null;
  studentLevel: StudentLevel | null;
  safeguarding: SafeguardingState;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Private, owner + platform-admin only. */
export interface UserPrivateProfile {
  email: string;
  dateOfBirth: string | null; // ISO date (yyyy-mm-dd)
  schoolName: string | null;
  grade: number | null;
  collegeName: string | null;
  degree: string | null;
  department: string | null;
  academicStage: string | null;
  learningInterests: string[];
  guardianEmail: string | null;
  consent: {
    termsVersion: string;
    privacyVersion: string;
    acceptedTermsAt: Timestamp | null;
    acceptedPrivacyAt: Timestamp | null;
    guardianAcknowledgedAt: Timestamp | null;
  };
  updatedAt: Timestamp;
}

/**
 * `users/{uid}/roleRequests/{roleKey}` — the user's declared intent, kept as
 * an audit trail for reviewers. It never grants anything by itself.
 */
export interface RoleRequest {
  role: RoleKey;
  requestedAt: Timestamp;
  note: string | null;
}

export interface TeacherVerificationRecord {
  status: TeacherVerificationStatus;
  note: string | null;
  decidedAt: Timestamp | null;
}

/**
 * `userRoles/{uid}` — the single authoritative role document.
 *
 *  selfDeclared : non-privileged roles the person activated in onboarding
 *                 (rules allow the owner to edit this field only).
 *  granted      : privileged grants — institution_admin, verified teacher.
 *                 Written exclusively by the privileged Admin SDK CLI.
 *  revoked      : hard denials; always win over selfDeclared/granted.
 *
 * Effective roles = (selfDeclared ∪ granted) − revoked.
 */
export interface UserRolesDoc {
  selfDeclared: RoleKey[];
  granted: RoleKey[];
  revoked: RoleKey[];
  teacherVerification: TeacherVerificationRecord;
  updatedAt: Timestamp;
}

/** Custom claims minted by the admin CLI (never by the browser). */
export interface AccountClaims {
  platformAdmin: boolean;
  teacherVerified: boolean;
  roles: RoleKey[];
  suspended: boolean;
}

/** Lightweight owner-written cache. Never authoritative for permissions. */
export interface DashboardSummary {
  studentAssignmentCount: number;
  teacherClassCount: number;
  guardianChildCount: number;
  updatedAt: Timestamp;
}
