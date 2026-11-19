/**
 * Classes, assignments, submissions and grades.
 *
 * Reliability decisions that matter:
 *  - A submission lives in `submissions/{studentUid}` (student-writable) and a
 *    grade lives in `grades/{studentUid}` (teacher-writable). Security rules
 *    therefore express "students cannot edit official grades" structurally.
 *  - Final submission happens inside a transaction so a double tap cannot
 *    create two confirmed submissions.
 */
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { requireDb, docWithId, docsWithId } from '@/lib/firebase/db';
import { randomCode } from '@/lib/utils/dates';
import type {
  Assignment,
  ClassDoc,
  ClassEnrollment,
  Course,
  CourseEnrollment,
  Grade,
  Submission,
} from '@/lib/models';
import type { AssignmentValues, ClassValues, CourseValues, GradeValues } from '@/lib/schemas/academic';

export class DuplicateSubmissionError extends Error {
  constructor() {
    super('You have already submitted this assignment.');
    this.name = 'DuplicateSubmissionError';
  }
}

export class AssignmentClosedError extends Error {
  constructor(message = 'This assignment is no longer accepting submissions.') {
    super(message);
    this.name = 'AssignmentClosedError';
  }
}

/* -------------------------------------------------------------------------- */
/* Classes                                                                    */
/* -------------------------------------------------------------------------- */

export async function listInstitutionClasses(institutionId: string): Promise<ClassDoc[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'institutions', institutionId, 'classes'),
      where('archived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(30),
    ),
  );
  return docsWithId<ClassDoc>(snapshot);
}

export async function createClass(
  institutionId: string,
  values: ClassValues,
  teacher: { uid: string; displayName: string },
  institutionName: string,
): Promise<void> {
  const db = requireDb();
  const classRef = doc(collection(db, 'institutions', institutionId, 'classes'));
  const joinCode = randomCode(6);
  await setDoc(classRef, {
    institutionId,
    institutionName,
    name: values.name,
    subject: values.subject,
    level: values.level,
    term: values.term,
    teacherUid: teacher.uid,
    teacherName: teacher.displayName,
    joinCode,
    allowSelfEnroll: values.allowSelfEnroll,
    archived: false,
    memberCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // A join code is a capability: it reveals only where the class lives, never
  // its roster or assignments. The roster write itself is re-authorised.
  if (values.allowSelfEnroll) {
    await setDoc(doc(db, 'classCodes', joinCode), {
      code: joinCode,
      institutionId,
      classId: classRef.id,
      institutionName,
      className: values.name,
      createdBy: teacher.uid,
      createdAt: serverTimestamp(),
    });
  }
}

/** Resolve a join code, then enrol the signed-in student (rules re-check). */
export async function joinClassWithCode(
  code: string,
  student: { uid: string; displayName: string },
): Promise<{ institutionId: string; classId: string }> {
  const db = requireDb();
  const normalised = code.trim().toUpperCase();
  const codeSnap = await getDoc(doc(db, 'classCodes', normalised));
  if (!codeSnap.exists()) throw new Error('That class code is not valid.');
  const data = codeSnap.data() as { institutionId?: string; classId?: string };
  if (!data.institutionId || !data.classId) throw new Error('That class code is not valid.');
  await enrollSelfInClass(data.institutionId, data.classId, student);
  return { institutionId: data.institutionId, classId: data.classId };
}

export async function getClass(institutionId: string, classId: string): Promise<ClassDoc | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'institutions', institutionId, 'classes', classId));
  return docWithId<ClassDoc>(snapshot);
}

export async function listRoster(
  institutionId: string,
  classId: string,
): Promise<ClassEnrollment[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'institutions', institutionId, 'classes', classId, 'roster'),
      limit(300),
    ),
  );
  return docsWithId<ClassEnrollment>(snapshot);
}

/** Classes the signed-in student belongs to (one collection-group query). */
export async function listStudentClasses(uid: string): Promise<ClassDoc[]> {
  const db = requireDb();
  const rosterDocs = await getDocs(
    query(
      collectionGroup(db, 'roster'),
      where('uid', '==', uid),
      limit(20),
    ),
  );
  const classRefs = rosterDocs.docs
    .map((rosterDoc) => rosterDoc.ref.parent.parent)
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const classes = await Promise.all(
    classRefs.map((classRef) => getDoc(classRef).then((snap) => docWithId<ClassDoc>(snap))),
  );
  return classes.filter((value): value is ClassDoc => value !== null);
}

/** Classes taught by the signed-in teacher (collection-group query). */
export async function listTeachingClasses(uid: string): Promise<ClassDoc[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collectionGroup(db, 'classes'), where('teacherUid', '==', uid), limit(20)),
  );
  return docsWithId<ClassDoc>(snapshot);
}

export async function enrollSelfInClass(
  institutionId: string,
  classId: string,
  student: { uid: string; displayName: string },
): Promise<void> {
  const db = requireDb();
  const classRef = doc(db, 'institutions', institutionId, 'classes', classId);
  const enrollmentRef = doc(classRef, 'roster', student.uid);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(enrollmentRef);
    if (existing.exists()) return;
    transaction.set(enrollmentRef, {
      uid: student.uid,
      displayName: student.displayName,
      role: 'student',
      addedAt: serverTimestamp(),
    });
    transaction.update(classRef, { memberCount: increment(1), updatedAt: serverTimestamp() });
  });
}

/* -------------------------------------------------------------------------- */
/* Assignments                                                                */
/* -------------------------------------------------------------------------- */

export async function listAssignments(
  institutionId: string,
  classId: string,
  options: { publishedOnly: boolean },
): Promise<Assignment[]> {
  const db = requireDb();
  const base = collection(db, 'institutions', institutionId, 'classes', classId, 'assignments');
  const snapshot = options.publishedOnly
    ? await getDocs(query(base, where('status', '==', 'published'), limit(50)))
    : await getDocs(query(base, limit(50)));
  return docsWithId<Assignment>(snapshot).sort(
    (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
  );
}

export async function createAssignment(
  institutionId: string,
  classId: string,
  values: AssignmentValues,
  author: { uid: string },
): Promise<string> {
  const db = requireDb();
  const reference = doc(
    collection(db, 'institutions', institutionId, 'classes', classId, 'assignments'),
  );
  await setDoc(reference, {
    classId,
    institutionId,
    title: values.title,
    instructions: values.instructions,
    dueAt: values.dueAt ? new Date(values.dueAt) : null,
    maxScore: values.maxScore,
    allowLateSubmission: values.allowLateSubmission,
    status: values.publish ? 'published' : 'draft',
    createdBy: author.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function getAssignment(
  institutionId: string,
  classId: string,
  assignmentId: string,
): Promise<Assignment | null> {
  const db = requireDb();
  const snapshot = await getDoc(
    doc(db, 'institutions', institutionId, 'classes', classId, 'assignments', assignmentId),
  );
  return docWithId<Assignment>(snapshot);
}

export async function closeAssignment(
  institutionId: string,
  classId: string,
  assignmentId: string,
): Promise<void> {
  const db = requireDb();
  await updateDoc(
    doc(db, 'institutions', institutionId, 'classes', classId, 'assignments', assignmentId),
    { status: 'closed', updatedAt: serverTimestamp() },
  );
}

/* -------------------------------------------------------------------------- */
/* Submissions & grades                                                       */
/* -------------------------------------------------------------------------- */

export async function getSubmission(
  institutionId: string,
  classId: string,
  assignmentId: string,
  studentUid: string,
): Promise<Submission | null> {
  const db = requireDb();
  const snapshot = await getDoc(
    doc(
      db,
      'institutions',
      institutionId,
      'classes',
      classId,
      'assignments',
      assignmentId,
      'submissions',
      studentUid,
    ),
  );
  return docWithId<Submission>(snapshot);
}

export async function submitAssignment(
  institutionId: string,
  classId: string,
  assignment: Assignment,
  student: { uid: string; displayName: string },
  content: string,
): Promise<void> {
  const db = requireDb();
  if (assignment.status !== 'published') throw new AssignmentClosedError();
  const due = assignment.dueAt as unknown as { toDate?: () => Date } | null;
  if (
    due &&
    typeof due.toDate === 'function' &&
    due.toDate().getTime() < Date.now() &&
    !assignment.allowLateSubmission
  ) {
    throw new AssignmentClosedError('The deadline has passed and late submissions are not allowed.');
  }

  const submissionRef = doc(
    db,
    'institutions',
    institutionId,
    'classes',
    classId,
    'assignments',
    assignment.id,
    'submissions',
    student.uid,
  );

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(submissionRef);
    const previous = existing.exists() ? (existing.data() as Partial<Submission>) : null;
    if (previous?.status === 'submitted') throw new DuplicateSubmissionError();

    transaction.set(submissionRef, {
      studentUid: student.uid,
      studentName: student.displayName,
      content,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'submitted',
      attempt: (previous?.attempt ?? 0) + 1,
    });
  });
}

export async function listSubmissions(
  institutionId: string,
  classId: string,
  assignmentId: string,
): Promise<Submission[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(
        db,
        'institutions',
        institutionId,
        'classes',
        classId,
        'assignments',
        assignmentId,
        'submissions',
      ),
      limit(300),
    ),
  );
  return docsWithId<Submission>(snapshot);
}

export async function listGrades(
  institutionId: string,
  classId: string,
  assignmentId: string,
): Promise<Grade[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(
        db,
        'institutions',
        institutionId,
        'classes',
        classId,
        'assignments',
        assignmentId,
        'grades',
      ),
      limit(300),
    ),
  );
  return docsWithId<Grade>(snapshot);
}

export async function getGrade(
  institutionId: string,
  classId: string,
  assignmentId: string,
  studentUid: string,
): Promise<Grade | null> {
  const db = requireDb();
  const snapshot = await getDoc(
    doc(
      db,
      'institutions',
      institutionId,
      'classes',
      classId,
      'assignments',
      assignmentId,
      'grades',
      studentUid,
    ),
  );
  return docWithId<Grade>(snapshot);
}

export async function saveGrade(
  institutionId: string,
  classId: string,
  assignment: Assignment,
  studentUid: string,
  values: GradeValues,
  graderUid: string,
): Promise<void> {
  if (values.score > assignment.maxScore) {
    throw new Error(`Score cannot exceed the maximum of ${assignment.maxScore}.`);
  }
  const db = requireDb();
  await setDoc(
    doc(
      db,
      'institutions',
      institutionId,
      'classes',
      classId,
      'assignments',
      assignment.id,
      'grades',
      studentUid,
    ),
    {
      studentUid,
      score: values.score,
      maxScore: assignment.maxScore,
      feedback: values.feedback,
      published: values.publish,
      gradedBy: graderUid,
      gradedAt: serverTimestamp(),
      publishedAt: values.publish ? serverTimestamp() : null,
      assignmentTitle: assignment.title,
      assignmentId: assignment.id,
      classId,
      institutionId,
    },
    { merge: true },
  );
}

/**
 * Published results for one student, read by the student or an approved
 * guardian. Uses a collection-group query so no class ids need to be known.
 */
export async function listPublishedGradesForStudent(studentUid: string): Promise<Grade[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collectionGroup(db, 'grades'),
      where('studentUid', '==', studentUid),
      where('published', '==', true),
      limit(20),
    ),
  );
  return docsWithId<Grade>(snapshot);
}

/* -------------------------------------------------------------------------- */
/* Courses                                                                    */
/* -------------------------------------------------------------------------- */

export async function listPublishedCourses(max = 24): Promise<Course[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, 'courses'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
  );
  return docsWithId<Course>(snapshot);
}

export async function listMyCourses(uid: string): Promise<Course[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, 'courses'), where('teacherUid', '==', uid), limit(20)),
  );
  return docsWithId<Course>(snapshot);
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, 'courses', courseId));
  return docWithId<Course>(snapshot);
}

export async function createCourse(
  values: CourseValues,
  teacher: { uid: string; displayName: string; verified: boolean },
  options: { publish: boolean; institutionId?: string | null },
): Promise<string> {
  const db = requireDb();
  const reference = doc(collection(db, 'courses'));
  await setDoc(reference, {
    title: values.title,
    summary: values.summary,
    subject: values.subject,
    level: values.level,
    description: values.description || '',
    teacherUid: teacher.uid,
    teacherName: teacher.displayName,
    teacherVerified: teacher.verified,
    institutionId: options.institutionId ?? null,
    visibility: 'public',
    status: options.publish ? 'published' : 'draft',
    enrollCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function enrollInCourse(
  courseId: string,
  student: { uid: string; displayName: string },
): Promise<void> {
  const db = requireDb();
  const courseRef = doc(db, 'courses', courseId);
  const enrollmentRef = doc(courseRef, 'courseEnrollments', student.uid);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(enrollmentRef);
    if (existing.exists()) return;
    transaction.set(enrollmentRef, {
      uid: student.uid,
      displayName: student.displayName,
      enrolledAt: serverTimestamp(),
    });
    transaction.update(courseRef, { enrollCount: increment(1) });
  });
}

export async function listMyCourseEnrollments(uid: string): Promise<Course[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collectionGroup(db, 'courseEnrollments'), where('uid', '==', uid), limit(20)),
  );
  const refs = snapshot.docs
    .map((item) => item.ref.parent.parent)
    .filter((value): value is NonNullable<typeof value> => value !== null);
  const courses = await Promise.all(
    refs.map((ref) => getDoc(ref).then((snap) => docWithId<Course>(snap))),
  );
  return courses.filter((value): value is Course => value !== null);
}

export type { CourseEnrollment };
