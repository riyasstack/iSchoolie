import type { AppDate } from './identity';

/* ==========================================================================
   Academic records
   Grade-bearing documents are physically separate from student-writable
   documents so Security Rules can enforce field ownership without ambiguity:
     submissions/{uid}  -> student writes, teacher reads
     grades/{uid}       -> teacher writes, student reads when published
   ========================================================================== */

export type ClassRole = 'student' | 'assistant';

export interface ClassDoc {
  id: string;
  institutionId: string;
  /** Denormalised so a student enrolled by code needs no institution read. */
  institutionName: string;
  name: string;
  subject: string;
  level: string;
  term: string;
  teacherUid: string;
  teacherName: string;
  joinCode: string;
  allowSelfEnroll: boolean;
  archived: boolean;
  memberCount: number;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface ClassEnrollment {
  uid: string;
  displayName: string;
  role: ClassRole;
  addedAt: AppDate;
}

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface Assignment {
  id: string;
  classId: string;
  institutionId: string;
  title: string;
  instructions: string;
  dueAt: AppDate | null;
  maxScore: number;
  allowLateSubmission: boolean;
  status: AssignmentStatus;
  createdBy: string;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export type SubmissionStatus = 'submitted' | 'withdrawn';

/** Student-authored. One document per student per assignment (no duplicates). */
export interface Submission {
  studentUid: string;
  studentName: string;
  content: string;
  submittedAt: AppDate;
  updatedAt: AppDate;
  status: SubmissionStatus;
  attempt: number;
}

/** Teacher-authored. Students can read only when `published` is true. */
export interface Grade {
  studentUid: string;
  score: number;
  maxScore: number;
  feedback: string;
  published: boolean;
  gradedBy: string;
  gradedAt: AppDate;
  publishedAt: AppDate | null;
  /** Denormalised so an authorised guardian can render a result without
   *  reading the assignment (which guardians are not permitted to read). */
  assignmentTitle: string;
  assignmentId: string;
  classId: string;
  institutionId: string;
}

/* ==========================================================================
   Courses (teacher-published catalogue)
   ========================================================================== */

export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseVisibility = 'public' | 'institution';

export interface Course {
  id: string;
  title: string;
  summary: string;
  subject: string;
  level: string;
  teacherUid: string;
  teacherName: string;
  teacherVerified: boolean;
  institutionId: string | null;
  visibility: CourseVisibility;
  status: CourseStatus;
  enrollCount: number;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface CourseEnrollment {
  uid: string;
  displayName: string;
  enrolledAt: AppDate;
}

export interface CourseLesson {
  id: string;
  title: string;
  content: string;
  position: number;
  createdAt: AppDate;
}
