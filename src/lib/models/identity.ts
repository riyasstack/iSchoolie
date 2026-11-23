
/* ==========================================================================
   Identity
   The public profile document (`users/{uid}`) must never contain private
   contact or academic detail. Those live in `users/{uid}/private/*`.
   ========================================================================== */

/**
 * A point in time.
 *
 * Firestore documents carry a `Timestamp`; the Postgres-backed identity API
 * serialises ISO strings. Both shapes are accepted while the data layer
 * migrates domain by domain, so readers must not assume `.toDate()`.
 */
export type AppDate = Date | string;

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
  completedAt: AppDate | null;
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
  guardianConsentRecordedAt: AppDate | null;
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
  createdAt: AppDate;
  updatedAt: AppDate;
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
    acceptedTermsAt: AppDate | null;
    acceptedPrivacyAt: AppDate | null;
    guardianAcknowledgedAt: AppDate | null;
  };
  updatedAt: AppDate;
}

/**
 * `users/{uid}/roleRequests/{roleKey}` — the user's declared intent, kept as
 * an audit trail for reviewers. It never grants anything by itself.
 */
export interface RoleRequest {
  role: RoleKey;
  requestedAt: AppDate;
  note: string | null;
}

export interface TeacherVerificationRecord {
  status: TeacherVerificationStatus;
  note: string | null;
  decidedAt: AppDate | null;
}

/**
 * `userRoles/{uid}` — the single authoritative role record.
 *
 *  selfDeclared : non-privileged roles the person activated in onboarding
 *                 (the owner may edit this field only).
 *  granted      : privileged grants — institution_admin, verified teacher.
 *                 Written exclusively by a privileged server path.
 *  revoked      : hard denials; always win over selfDeclared/granted.
 *
 * Effective roles = (selfDeclared ∪ granted) − revoked.
 */
export interface UserRolesDoc {
  selfDeclared: RoleKey[];
  granted: RoleKey[];
  revoked: RoleKey[];
  teacherVerification: TeacherVerificationRecord;
  updatedAt: AppDate;
}

/** Computed on the server from the account row, never minted by the browser. */
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
  updatedAt: AppDate;
}

/**
 * The signed-in identity as the UI sees it.
 *
 * WorkOS owns credentials, so there is no client-side auth SDK object: this
 * is the serialisable shape of the session user. Field names mirror the old
 * Firebase `User` for the parts the UI reads (`uid`, `email`, `emailVerified`).
 */
export interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string | null;
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
  metadata: { lastSignInTime: string | null };
}

/** Everything `/api/account` needs to hand the client after sign-in. */
export interface AccountSnapshot {
  profile: UserProfile | null;
  roles: UserRolesDoc | null;
  memberships: Array<{
    institutionId: string;
    institutionName: string;
    role: 'owner' | 'admin' | 'teacher' | 'staff';
    status: 'active' | 'revoked';
  }>;
  requestedRoles: RoleKey[];
}
