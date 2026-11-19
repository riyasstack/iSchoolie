/**
 * Firestore Security Rules tests.
 *
 * Run with the emulator (requires a JRE on the machine):
 *   npm run test:rules
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const INST = 'inst-greenfield';
const OTHER_INST = 'inst-lakeside';
const TEACHER = 'teacher-uid';
const OUTSIDER_TEACHER = 'teacher-other';
const STUDENT_A = 'student-a';
const STUDENT_B = 'student-b';
const GUARDIAN = 'guardian-uid';
const APPLICANT = 'applicant-uid';
const ADMIN = 'platform-admin';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-ischoolie-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'institutions', INST), {
      name: 'Greenfield Public School',
      slug: 'greenfield',
      category: 'school',
      officialEmail: 'office@greenfield.test',
      website: null,
      country: 'IN',
      city: 'Pune',
      status: 'active',
      ownerUid: TEACHER,
      sourceApplicationId: null,
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: ADMIN,
    });

    await setDoc(doc(db, 'institutions', OTHER_INST), {
      name: 'Lakeside College',
      slug: 'lakeside',
      category: 'college',
      officialEmail: 'office@lakeside.test',
      website: null,
      country: 'IN',
      city: 'Pune',
      status: 'active',
      ownerUid: OUTSIDER_TEACHER,
      sourceApplicationId: null,
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: ADMIN,
    });

    await setDoc(doc(db, 'institutions', INST, 'members', TEACHER), {
      uid: TEACHER,
      institutionId: INST,
      institutionName: 'Greenfield Public School',
      displayName: 'Priya Nair',
      email: 'priya@greenfield.test',
      role: 'owner',
      status: 'active',
      addedBy: ADMIN,
      addedAt: serverTimestamp(),
      revokedAt: null,
    });

    await setDoc(doc(db, 'institutions', OTHER_INST, 'members', OUTSIDER_TEACHER), {
      uid: OUTSIDER_TEACHER,
      institutionId: OTHER_INST,
      institutionName: 'Lakeside College',
      displayName: 'Other Teacher',
      email: 'other@lakeside.test',
      role: 'owner',
      status: 'active',
      addedBy: ADMIN,
      addedAt: serverTimestamp(),
      revokedAt: null,
    });

    const classPath = ['institutions', INST, 'classes', 'class-1'];
    await setDoc(doc(db, ...(classPath as [string, ...string[]])), {
      institutionId: INST,
      institutionName: 'Greenfield Public School',
      name: 'Physics 10A',
      subject: 'Physics',
      level: 'Class 10',
      term: '2026-27',
      teacherUid: TEACHER,
      teacherName: 'Priya Nair',
      joinCode: 'ABC123',
      allowSelfEnroll: false,
      archived: false,
      memberCount: 2,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'institutions', INST, 'classes', 'class-1', 'roster', STUDENT_A), {
      uid: STUDENT_A,
      displayName: 'Aarav',
      role: 'student',
      addedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'institutions', INST, 'classes', 'class-1', 'roster', STUDENT_B), {
      uid: STUDENT_B,
      displayName: 'Bela',
      role: 'student',
      addedAt: serverTimestamp(),
    });

    const assignmentPath = [
      'institutions',
      INST,
      'classes',
      'class-1',
      'assignments',
      'asg-1',
    ] as const;
    await setDoc(doc(db, ...assignmentPath), {
      classId: 'class-1',
      institutionId: INST,
      title: 'Problem set',
      instructions: 'Answer all questions.',
      dueAt: null,
      maxScore: 20,
      allowLateSubmission: true,
      status: 'published',
      createdBy: TEACHER,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, ...assignmentPath, 'grades', STUDENT_B),
      {
        studentUid: STUDENT_B,
        score: 17,
        maxScore: 20,
        feedback: 'Good working',
        published: true,
        gradedBy: TEACHER,
        gradedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        assignmentTitle: 'Problem set',
        assignmentId: 'asg-1',
        classId: 'class-1',
        institutionId: INST,
      },
    );

    // Private profiles
    await setDoc(doc(db, 'users', STUDENT_A), {
      uid: STUDENT_A,
      displayName: 'Aarav',
      handle: 'aarav',
      photoURL: null,
      headline: null,
      country: 'IN',
      status: 'active',
      onboarding: { complete: true, selectedRoles: ['student_school'], completedAt: null },
      activeWorkspace: null,
      teacher: null,
      studentLevel: 'school',
      safeguarding: {
        isMinor: true,
        privateProfile: true,
        messagingEnabled: false,
        guardianConsentRecordedAt: null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', STUDENT_B), {
      uid: STUDENT_B,
      displayName: 'Bela',
      handle: 'bela',
      photoURL: null,
      headline: null,
      country: 'IN',
      status: 'active',
      onboarding: { complete: true, selectedRoles: ['student_school'], completedAt: null },
      activeWorkspace: null,
      teacher: null,
      studentLevel: 'school',
      safeguarding: {
        isMinor: true,
        privateProfile: true,
        messagingEnabled: false,
        guardianConsentRecordedAt: null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', STUDENT_B, 'private', 'profile'), {
      email: 'bela@example.com',
      dateOfBirth: '2011-02-02',
      schoolName: 'Greenfield',
      grade: 10,
      collegeName: null,
      degree: null,
      department: null,
      academicStage: null,
      learningInterests: ['Physics'],
      guardianEmail: null,
      consent: {},
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'userRoles', STUDENT_A), {
      selfDeclared: ['student_school'],
      granted: [],
      revoked: [],
      teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'institutionApplications', APPLICANT), {
      id: APPLICANT,
      applicantUid: APPLICANT,
      institutionName: 'New School',
      category: 'school',
      officialEmail: 'office@new.test',
      contactName: 'Applicant',
      contactDesignation: 'Principal',
      contactPhone: '+1 555 0100',
      website: null,
      country: 'IN',
      city: 'Pune',
      registrationInfo: null,
      declarations: { authorizedToApply: true, informationAccurate: true, acceptsTerms: true },
      status: 'submitted',
      submittedAt: serverTimestamp(),
      reviewerUid: null,
      reviewNote: null,
      institutionId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
});

const studentContext = (uid: string) =>
  testEnv
    .authenticatedContext(uid, { email: `${uid}@example.test` })
    .firestore();

const guardianContext = () =>
  testEnv
    .authenticatedContext(GUARDIAN, { email: 'guardian@example.test' })
    .firestore();

describe('authentication is required', () => {
  it('denies anonymous reads of profiles', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users', STUDENT_B)));
  });

  it('denies anonymous reads of institutions', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'institutions', INST)));
  });
});

describe('private user data', () => {
  it('lets a student read their own private profile', async () => {
    const db = testEnv
      .authenticatedContext(STUDENT_B, { email: 'bela@example.test' })
      .firestore();
    await assertSucceeds(getDoc(doc(db, 'users', STUDENT_B, 'private', 'profile')));
  });

  it("prevents Student A from reading Student B's private records", async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(getDoc(doc(db, 'users', STUDENT_B, 'private', 'profile')));
  });

  it("hides a minor's public profile document from other members", async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(getDoc(doc(db, 'users', STUDENT_B)));
  });

  it('lets the platform admin read any profile', async () => {
    const db = testEnv
      .authenticatedContext(ADMIN, { email: 'admin@ischoolie.app', platformAdmin: true })
      .firestore();
    await assertSucceeds(getDoc(doc(db, 'users', STUDENT_B, 'private', 'profile')));
  });
});

describe('role documents', () => {
  it('prevents a normal user from granting themselves a privileged role', async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(
      updateDoc(doc(db, 'userRoles', STUDENT_A), {
        granted: ['institution_admin'],
      }),
    );
  });

  it('prevents self-declaring institution administration', async () => {
    const db = studentContext(STUDENT_B);
    await assertFails(
      setDoc(doc(db, 'userRoles', STUDENT_B), {
        selfDeclared: ['institution_admin'],
        granted: [],
        revoked: [],
        teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('allows a self-serve role activation that leaves privileges untouched', async () => {
    const db = studentContext(STUDENT_A);
    await assertSucceeds(
      updateDoc(doc(db, 'userRoles', STUDENT_A), {
        selfDeclared: ['student_school', 'teacher'],
      }),
    );
  });

  it('prevents a user from verifying themselves as an educator', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test', teacherVerified: true })
      .firestore();
    await assertFails(
      updateDoc(doc(db, 'users', TEACHER), { status: 'active' }),
    );
  });
});

describe('institution isolation', () => {
  it('lets an approved owner read their own institution', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertSucceeds(getDoc(doc(db, 'institutions', INST)));
  });

  it('prevents a teacher from another school reading this institution', async () => {
    const db = testEnv
      .authenticatedContext(OUTSIDER_TEACHER, { email: 'other@lakeside.test' })
      .firestore();
    await assertFails(getDoc(doc(db, 'institutions', INST)));
    await assertFails(getDoc(doc(db, 'institutions', INST, 'classes', 'class-1')));
  });

  it('prevents a non-member from listing a class roster', async () => {
    const db = testEnv
      .authenticatedContext(OUTSIDER_TEACHER, { email: 'other@lakeside.test' })
      .firestore();
    await assertFails(getDocs(collection(db, 'institutions', INST, 'classes', 'class-1', 'roster')));
  });

  it('removes access when the institution is suspended', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'institutions', INST), { status: 'suspended' });
    });
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    // The institution document stays readable so the UI can explain why…
    await assertSucceeds(getDoc(doc(db, 'institutions', INST)));
    // …but academic content is denied.
    await assertFails(getDoc(doc(db, 'institutions', INST, 'classes', 'class-1')));
  });

  it('removes access when the membership is revoked', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'institutions', INST, 'members', TEACHER), {
        status: 'revoked',
      });
    });
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertFails(getDoc(doc(db, 'institutions', INST)));
  });

  it('prevents an institution admin from creating another owner or admin', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertFails(
      setDoc(doc(db, 'institutions', INST, 'members', 'someone-else'), {
        uid: 'someone-else',
        institutionId: INST,
        institutionName: 'Greenfield Public School',
        displayName: 'Someone',
        email: 'someone@example.test',
        role: 'admin',
        status: 'active',
        addedBy: TEACHER,
        addedAt: serverTimestamp(),
        revokedAt: null,
      }),
    );
    await assertSucceeds(
      setDoc(doc(db, 'institutions', INST, 'members', 'new-teacher'), {
        uid: 'new-teacher',
        institutionId: INST,
        institutionName: 'Greenfield Public School',
        displayName: 'New Teacher',
        email: 'new@example.test',
        role: 'teacher',
        status: 'active',
        addedBy: TEACHER,
        addedAt: serverTimestamp(),
        revokedAt: null,
      }),
    );
  });
});

describe('institution applications', () => {
  it('lets an applicant create a submitted application', async () => {
    const db = testEnv
      .authenticatedContext('new-applicant', { email: 'new-applicant@example.test' })
      .firestore();
    await assertSucceeds(
      setDoc(doc(db, 'institutionApplications', 'new-applicant'), {
        id: 'new-applicant',
        applicantUid: 'new-applicant',
        institutionName: 'Fresh School',
        category: 'school',
        officialEmail: 'office@fresh.test',
        contactName: 'Applicant',
        contactDesignation: 'Director',
        contactPhone: '+1 555 0111',
        website: null,
        country: 'IN',
        city: 'Pune',
        registrationInfo: null,
        declarations: { authorizedToApply: true, informationAccurate: true, acceptsTerms: true },
        status: 'submitted',
        submittedAt: serverTimestamp(),
        reviewerUid: null,
        reviewNote: null,
        institutionId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('prevents an applicant from approving their own application', async () => {
    const db = testEnv
      .authenticatedContext(APPLICANT, { email: 'applicant@example.test' })
      .firestore();
    await assertFails(
      updateDoc(doc(db, 'institutionApplications', APPLICANT), { status: 'approved' }),
    );
  });

  it('prevents an applicant from attaching an institution id', async () => {
    const db = testEnv
      .authenticatedContext(APPLICANT, { email: 'applicant@example.test' })
      .firestore();
    await assertFails(
      updateDoc(doc(db, 'institutionApplications', APPLICANT), { institutionId: INST }),
    );
  });

  it('lets the platform admin record a review decision but not approve', async () => {
    const db = testEnv
      .authenticatedContext(ADMIN, { email: 'admin@ischoolie.app', platformAdmin: true })
      .firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'institutionApplications', APPLICANT), {
        status: 'more_information_required',
        reviewerUid: ADMIN,
        reviewNote: 'Send affiliation proof',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'institutionApplications', APPLICANT), { status: 'approved' }),
    );
  });

  it('prevents an approved applicant from editing the decision fields', async () => {
    const db = testEnv
      .authenticatedContext(APPLICANT, { email: 'applicant@example.test' })
      .firestore();
    await assertFails(
      updateDoc(doc(db, 'institutionApplications', APPLICANT), { reviewerUid: APPLICANT }),
    );
  });
});

describe('academic records', () => {
  it('lets a student submit their own work', async () => {
    const db = studentContext(STUDENT_A);
    await assertSucceeds(
      setDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'submissions', STUDENT_A),
        {
          studentUid: STUDENT_A,
          studentName: 'Aarav',
          content: 'My answer',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'submitted',
          attempt: 1,
        },
      ),
    );
  });

  it('prevents a student submitting for another student', async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(
      setDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'submissions', STUDENT_B),
        {
          studentUid: STUDENT_B,
          studentName: 'Bela',
          content: 'Not mine',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'submitted',
          attempt: 1,
        },
      ),
    );
  });

  it('prevents a student from writing an official grade', async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(
      setDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_A),
        {
          studentUid: STUDENT_A,
          score: 20,
          maxScore: 20,
          feedback: 'Self-awarded',
          published: true,
          gradedBy: STUDENT_A,
          gradedAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
          assignmentTitle: 'Problem set',
          assignmentId: 'asg-1',
          classId: 'class-1',
          institutionId: INST,
        },
      ),
    );
  });

  it('prevents a student editing an existing published grade', async () => {
    const db = studentContext(STUDENT_B);
    await assertFails(
      updateDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_B),
        { score: 20 },
      ),
    );
  });

  it('lets a teacher grade work in their own institution', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertSucceeds(
      setDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_A),
        {
          studentUid: STUDENT_A,
          score: 15,
          maxScore: 20,
          feedback: 'Solid',
          published: true,
          gradedBy: TEACHER,
          gradedAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
          assignmentTitle: 'Problem set',
          assignmentId: 'asg-1',
          classId: 'class-1',
          institutionId: INST,
        },
      ),
    );
  });

  it('prevents a teacher from grading in another institution', async () => {
    const db = testEnv
      .authenticatedContext(OUTSIDER_TEACHER, { email: 'other@lakeside.test' })
      .firestore();
    await assertFails(
      setDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_A),
        {
          studentUid: STUDENT_A,
          score: 20,
          maxScore: 20,
          feedback: 'Outsider',
          published: true,
          gradedBy: OUTSIDER_TEACHER,
          gradedAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
          assignmentTitle: 'Problem set',
          assignmentId: 'asg-1',
          classId: 'class-1',
          institutionId: INST,
        },
      ),
    );
  });
});

describe('guardian relationships', () => {
  it('denies an unlinked guardian access to a child grade', async () => {
    const db = guardianContext();
    await assertFails(
      getDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_B),
      ),
    );
  });

  it('allows an approved guardian with academic consent to read a published grade', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'guardianLinks', `${GUARDIAN}_${STUDENT_B}`), {
        guardianUid: GUARDIAN,
        guardianName: 'Meera',
        studentUid: STUDENT_B,
        studentName: 'Bela',
        relationship: 'mother',
        status: 'approved',
        requestedBy: GUARDIAN,
        requestedAt: serverTimestamp(),
        studentConfirmedAt: serverTimestamp(),
        verifiedBy: ADMIN,
        verifiedAt: serverTimestamp(),
        revokedBy: null,
        revokedAt: null,
        note: null,
        consent: { academic: true, attendance: false, announcements: true },
        expiresAt: null,
      });
    });
    const db = guardianContext();
    await assertSucceeds(
      getDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_B),
      ),
    );
  });

  it('denies a guardian without academic consent', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'guardianLinks', `${GUARDIAN}_${STUDENT_B}`), {
        guardianUid: GUARDIAN,
        guardianName: 'Meera',
        studentUid: STUDENT_B,
        studentName: 'Bela',
        relationship: 'mother',
        status: 'approved',
        requestedBy: GUARDIAN,
        requestedAt: serverTimestamp(),
        studentConfirmedAt: serverTimestamp(),
        verifiedBy: ADMIN,
        verifiedAt: serverTimestamp(),
        revokedBy: null,
        revokedAt: null,
        note: null,
        consent: { academic: false, attendance: false, announcements: true },
        expiresAt: null,
      });
    });
    const db = guardianContext();
    await assertFails(
      getDoc(
        doc(db, 'institutions', INST, 'classes', 'class-1', 'assignments', 'asg-1', 'grades', STUDENT_B),
      ),
    );
  });

  it('refuses a guardian request created on behalf of someone else', async () => {
    const db = guardianContext();
    await assertFails(
      setDoc(doc(collection(db, 'guardianLinkRequests')), {
        guardianUid: 'someone-else',
        guardianName: 'Meera',
        studentEmail: 'bela@example.test',
        studentUid: null,
        relationship: 'mother',
        consent: { academic: true, attendance: false, announcements: true },
        status: 'requested',
        note: null,
        decidedBy: null,
        decidedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('moderation and audit', () => {
  it('lets a signed-in member file a report', async () => {
    const db = studentContext(STUDENT_A);
    await assertSucceeds(
      setDoc(doc(collection(db, 'reports')), {
        reporterUid: STUDENT_A,
        targetType: 'post',
        targetPath: 'communities/x/posts/y',
        targetOwnerUid: null,
        reason: 'spam',
        details: null,
        status: 'open',
        handledBy: null,
        handledAt: null,
        action: null,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('prevents a normal user from reading the audit trail', async () => {
    const db = studentContext(STUDENT_A);
    await assertFails(getDocs(query(collection(db, 'auditLogs'), where('actorUid', '==', ADMIN))));
  });

  it('allows a platform admin to read the audit trail', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'auditLogs', 'log-1'), {
        action: 'institution.approve',
        actorUid: ADMIN,
        actorKind: 'admin_cli',
        subjectType: 'institution',
        subjectId: INST,
        detail: 'Approved',
        createdAt: serverTimestamp(),
        metadata: {},
      });
    });
    const db = testEnv
      .authenticatedContext(ADMIN, { email: 'admin@ischoolie.app', platformAdmin: true })
      .firestore();
    await assertSucceeds(getDocs(collection(db, 'auditLogs')));
  });

  it('prevents anyone from editing an audit entry', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'auditLogs', 'log-2'), {
        action: 'institution.approve',
        actorUid: ADMIN,
        actorKind: 'admin_cli',
        subjectType: 'institution',
        subjectId: INST,
        detail: 'Approved',
        createdAt: serverTimestamp(),
        metadata: {},
      });
    });
    const db = testEnv
      .authenticatedContext(ADMIN, { email: 'admin@ischoolie.app', platformAdmin: true })
      .firestore();
    await assertFails(updateDoc(doc(db, 'auditLogs', 'log-2'), { detail: 'Tampered' }));
  });
});

describe('course publishing', () => {
  it('refuses course creation without the verified teacher claim', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertFails(
      setDoc(doc(collection(db, 'courses')), {
        title: 'Physics',
        summary: 'A course',
        subject: 'Physics',
        level: 'Class 10',
        teacherUid: TEACHER,
        teacherName: 'Priya',
        teacherVerified: true,
        institutionId: null,
        visibility: 'public',
        status: 'published',
        enrollCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('allows a verified teacher to publish a course', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test', teacherVerified: true })
      .firestore();
    await assertSucceeds(
      setDoc(doc(collection(db, 'courses')), {
        title: 'Physics',
        summary: 'A course',
        subject: 'Physics',
        level: 'Class 10',
        teacherUid: TEACHER,
        teacherName: 'Priya',
        teacherVerified: true,
        institutionId: null,
        visibility: 'public',
        status: 'published',
        enrollCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('collection-group reads', () => {
  it('lets a member list only their own memberships', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test' })
      .firestore();
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', TEACHER))),
    );
    await assertFails(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', OUTSIDER_TEACHER))),
    );
  });

  it('lets a student list only their own roster entries', async () => {
    const db = studentContext(STUDENT_A);
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'roster'), where('uid', '==', STUDENT_A))),
    );
    await assertFails(
      getDocs(query(collectionGroup(db, 'roster'), where('uid', '==', STUDENT_B))),
    );
  });

  it('lets a teacher list only the classes they teach', async () => {
    const db = testEnv
      .authenticatedContext(TEACHER, { email: 'priya@greenfield.test', teacherVerified: true })
      .firestore();
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'classes'), where('teacherUid', '==', TEACHER))),
    );
    await assertFails(
      getDocs(query(collectionGroup(db, 'classes'), where('teacherUid', '==', OUTSIDER_TEACHER))),
    );
  });

  it('lists published grades for a student and nothing else', async () => {
    const gradeQuery = (db: ReturnType<typeof studentContext>, published: boolean) =>
      getDocs(
        query(
          collectionGroup(db, 'grades'),
          where('studentUid', '==', STUDENT_B),
          where('published', '==', published),
        ),
      );

    await assertSucceeds(gradeQuery(studentContext(STUDENT_B), true));
    // Unpublished marks are not readable, even by their own student.
    await assertFails(gradeQuery(studentContext(STUDENT_B), false));
    // Nor may another student list them.
    await assertFails(gradeQuery(studentContext(STUDENT_A), true));
  });

  it('lets an approved guardian list a linked child\u2019s published grades only with consent', async () => {
    const seedLink = async (academic: boolean) => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'guardianLinks', `${GUARDIAN}_${STUDENT_B}`), {
          guardianUid: GUARDIAN,
          guardianName: 'Meera',
          studentUid: STUDENT_B,
          studentName: 'Bela',
          relationship: 'mother',
          status: 'approved',
          requestedBy: GUARDIAN,
          requestedAt: serverTimestamp(),
          studentConfirmedAt: serverTimestamp(),
          verifiedBy: ADMIN,
          verifiedAt: serverTimestamp(),
          revokedBy: null,
          revokedAt: null,
          note: null,
          consent: { academic, attendance: false, announcements: true },
          expiresAt: null,
        });
      });
    };

    const gradesQuery = () =>
      getDocs(
        query(
          collectionGroup(guardianContext(), 'grades'),
          where('studentUid', '==', STUDENT_B),
          where('published', '==', true),
        ),
      );

    await seedLink(true);
    await assertSucceeds(gradesQuery());

    await seedLink(false);
    await assertFails(gradesQuery());
  });

  it('lets a student list their own course enrolments only', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'courses', 'course-1'), {
        title: 'Physics',
        summary: 'A course',
        subject: 'Physics',
        level: 'Class 10',
        teacherUid: TEACHER,
        teacherName: 'Priya',
        teacherVerified: true,
        institutionId: null,
        visibility: 'public',
        status: 'published',
        enrollCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'courses', 'course-1', 'courseEnrollments', STUDENT_A), {
        uid: STUDENT_A,
        displayName: 'Aarav',
        enrolledAt: serverTimestamp(),
      });
    });

    const db = studentContext(STUDENT_A);
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'courseEnrollments'), where('uid', '==', STUDENT_A))),
    );
    await assertFails(
      getDocs(query(collectionGroup(db, 'courseEnrollments'), where('uid', '==', STUDENT_B))),
    );
  });
});
