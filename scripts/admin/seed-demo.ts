#!/usr/bin/env node
/**
 * Emulator-only demo data.
 *
 * Creates a platform admin, an approved institution with a teacher and a
 * student class so the flows can be exercised end to end locally.
 *
 *   npm run emulators          # terminal 1
 *   npm run seed               # terminal 2
 *
 * Refuses to run against a real project.
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    'This seeder only runs against the emulator suite.\n' +
      'Set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 and FIRESTORE_EMULATOR_HOST=127.0.0.1:8080.\n' +
      '`npm run emulators` prints both values.',
  );
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-ischoolie' });
}

const auth = getAuth();
const db = getFirestore();

const PASSWORD = 'iSchoolie!2026';

async function upsertUser(email: string, displayName: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email,
      password: PASSWORD,
      displayName,
      emailVerified: true,
    });
    return created.uid;
  }
}

async function main(): Promise<void> {
  const adminUid = await upsertUser('admin@ischoolie.test', 'Platform Admin');
  const teacherUid = await upsertUser('teacher@ischoolie.test', 'Priya Nair');
  const studentUid = await upsertUser('student@ischoolie.test', 'Aarav Shah');
  const guardianUid = await upsertUser('guardian@ischoolie.test', 'Meera Shah');

  const baseProfile = (uid: string, displayName: string, headline: string | null) => ({
    uid,
    displayName,
    handle: `${displayName.toLowerCase().replace(/\s+/g, '-')}-${uid.slice(0, 4)}`,
    photoURL: null,
    headline,
    country: 'IN',
    status: 'active',
    onboarding: { complete: true, selectedRoles: [], completedAt: FieldValue.serverTimestamp() },
    activeWorkspace: null,
    teacher: null,
    studentLevel: null,
    safeguarding: {
      isMinor: false,
      privateProfile: true,
      messagingEnabled: true,
      guardianConsentRecordedAt: null,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(adminUid).set({
    ...baseProfile(adminUid, 'Platform Admin', 'iSchoolie team'),
  });
  await db.collection('users').doc(teacherUid).set({
    ...baseProfile(teacherUid, 'Priya Nair', 'Physics educator · verified'),
  });
  await db.collection('users').doc(studentUid).set({
    ...baseProfile(studentUid, 'Aarav Shah', 'Class 10 student'),
  });
  await db.collection('users').doc(guardianUid).set({
    ...baseProfile(guardianUid, 'Meera Shah', 'Guardian'),
  });

  await db.collection('userRoles').doc(adminUid).set({
    selfDeclared: [],
    granted: [],
    revoked: [],
    teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection('userRoles').doc(teacherUid).set({
    selfDeclared: ['teacher'],
    granted: [],
    revoked: [],
    teacherVerification: {
      status: 'verified',
      note: 'Seeded demo verification',
      decidedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection('userRoles').doc(studentUid).set({
    selfDeclared: ['student_school'],
    granted: [],
    revoked: [],
    teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection('userRoles').doc(guardianUid).set({
    selfDeclared: ['parent'],
    granted: [],
    revoked: [],
    teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
    updatedAt: FieldValue.serverTimestamp(),
  });

  await auth.setCustomUserClaims(adminUid, {
    platformAdmin: true,
    teacherVerified: false,
    roles: [],
    institutions: [],
    suspended: false,
  });
  await auth.setCustomUserClaims(teacherUid, {
    platformAdmin: false,
    teacherVerified: true,
    roles: ['teacher'],
    institutions: [],
    suspended: false,
  });

  const institutionRef = db.collection('institutions').doc('demo-greenfield');
  await institutionRef.set({
    name: 'Greenfield Public School',
    slug: 'greenfield-public-school',
    category: 'school',
    officialEmail: 'office@greenfield.test',
    website: 'https://greenfield.test',
    country: 'IN',
    city: 'Pune',
    status: 'active',
    ownerUid: teacherUid,
    sourceApplicationId: null,
    createdAt: FieldValue.serverTimestamp(),
    approvedAt: FieldValue.serverTimestamp(),
    approvedBy: adminUid,
  });

  await institutionRef.collection('members').doc(teacherUid).set({
    uid: teacherUid,
    institutionId: institutionRef.id,
    institutionName: 'Greenfield Public School',
    displayName: 'Priya Nair',
    email: 'teacher@ischoolie.test',
    role: 'owner',
    status: 'active',
    addedBy: adminUid,
    addedAt: FieldValue.serverTimestamp(),
    revokedAt: null,
  });

  await auth.setCustomUserClaims(teacherUid, {
    platformAdmin: false,
    teacherVerified: true,
    roles: ['teacher', 'institution_admin'],
    institutions: [institutionRef.id],
    suspended: false,
  });

  const classRef = institutionRef.collection('classes').doc('demo-physics-10a');
  await classRef.set({
    institutionId: institutionRef.id,
    institutionName: 'Greenfield Public School',
    name: 'Physics — Class 10A',
    subject: 'Physics',
    level: 'Class 10',
    term: '2026–27 Term 1',
    teacherUid,
    teacherName: 'Priya Nair',
    joinCode: 'DEMO01',
    allowSelfEnroll: true,
    archived: false,
    memberCount: 1,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await classRef.collection('roster').doc(studentUid).set({
    uid: studentUid,
    displayName: 'Aarav Shah',
    role: 'student',
    addedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('classCodes').doc('DEMO01').set({
    code: 'DEMO01',
    institutionId: institutionRef.id,
    classId: classRef.id,
    institutionName: 'Greenfield Public School',
    className: 'Physics — Class 10A',
    createdBy: teacherUid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await classRef.collection('assignments').doc('demo-assignment-1').set({
    classId: classRef.id,
    institutionId: institutionRef.id,
    title: "Newton's laws — problem set",
    instructions:
      'Answer questions 1–5 from the chapter. Show your working for every numerical answer.',
    dueAt: null,
    maxScore: 20,
    allowLateSubmission: true,
    status: 'published',
    createdBy: teacherUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('communities').doc('demo-physics-community').set({
    name: 'Physics Problem Solvers',
    slug: 'physics-problem-solvers',
    description: 'A place to work through physics problems together, from Class 8 to university.',
    visibility: 'public',
    institutionId: null,
    createdBy: teacherUid,
    memberCount: 1,
    postCount: 1,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db
    .collection('communities')
    .doc('demo-physics-community')
    .collection('participants')
    .doc(teacherUid)
    .set({ uid: teacherUid, displayName: 'Priya Nair', joinedAt: FieldValue.serverTimestamp() });
  await db
    .collection('communities')
    .doc('demo-physics-community')
    .collection('posts')
    .add({
      communityId: 'demo-physics-community',
      authorUid: teacherUid,
      authorName: 'Priya Nair',
      body: 'Welcome! Post a problem you are stuck on and we will work it out together.',
      status: 'visible',
      commentCount: 0,
      likeCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

  await db.collection('institutionApplications').doc('demo-application').set({
    id: 'demo-application',
    applicantUid: guardianUid,
    institutionName: 'Lakeside Coaching Centre',
    category: 'coaching_centre',
    officialEmail: 'contact@lakeside.test',
    contactName: 'Meera Shah',
    contactDesignation: 'Director',
    contactPhone: '+91 90000 00000',
    website: null,
    country: 'IN',
    city: 'Pune',
    registrationInfo: 'Local registration #LC-2091',
    declarations: { authorizedToApply: true, informationAccurate: true, acceptsTerms: true },
    status: 'submitted',
    submittedAt: FieldValue.serverTimestamp(),
    reviewerUid: null,
    reviewNote: null,
    institutionId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('✔ Demo data seeded.\n');
  console.log('Accounts (password: iSchoolie!2026)');
  console.log('  admin@ischoolie.test     platform administrator');
  console.log('  teacher@ischoolie.test   verified teacher + institution owner');
  console.log('  student@ischoolie.test   Class 10 student in Physics 10A');
  console.log('  guardian@ischoolie.test  guardian + pending institution applicant');
  console.log('\nClass join code: DEMO01');
}

main().catch((error: unknown) => {
  console.error('✖', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
