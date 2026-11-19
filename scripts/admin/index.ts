#!/usr/bin/env node
/**
 * iSchoolie privileged operations CLI (Firebase Admin SDK).
 *
 * This is the ONLY code path that can grant institution access, verify an
 * educator, grant privileged roles or suspend an account. It runs on an
 * operator machine with a service-account key and never ships to a browser.
 *
 * Usage (see docs/RUNBOOK.md):
 *   npm run admin -- bootstrap --email you@ischoolie.app --operator "Your name"
 *   npm run admin -- institution approve --application <uid> --operator you@ischoolie.app
 *   npm run admin -- teacher verify --uid <uid> --operator you@ischoolie.app
 *   npm run admin -- role grant --uid <uid> --role institution_admin --operator you@ischoolie.app
 *
 * Against the emulator, set FIREBASE_AUTH_EMULATOR_HOST and
 * FIRESTORE_EMULATOR_HOST — no credentials are needed.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/* -------------------------------------------------------------------------- */
/* Setup                                                                      */
/* -------------------------------------------------------------------------- */

const EMULATOR =
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) || Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function initFirebase(): void {
  if (getApps().length > 0) return;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    (EMULATOR ? 'demo-ischoolie' : undefined);

  if (EMULATOR) {
    initializeApp({ projectId });
    return;
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const absolute = resolve(credentialsPath);
    const serviceAccount = JSON.parse(readFileSync(absolute, 'utf8')) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      projectId: projectId ?? serviceAccount.project_id,
    });
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
}

initFirebase();
const db = getFirestore();
const auth = getAuth();

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Flags = Record<string, string | true>;

function parseFlags(args: string[]): Flags {
  const flags: Flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token || !token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function requiredString(flags: Flags, key: string): string {
  const value = flags[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required flag --${key}`);
  }
  return value.trim();
}

function optionalString(flags: Flags, key: string): string | null {
  const value = flags[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function resolveUid(identifier: string): Promise<string> {
  if (identifier.includes('@')) {
    const user = await auth.getUserByEmail(identifier);
    return user.uid;
  }
  return identifier;
}

async function operatorUid(operator: string): Promise<string> {
  if (!operator) return 'unknown-operator';
  try {
    return await resolveUid(operator);
  } catch {
    return operator;
  }
}

async function audit(input: {
  action: string;
  actor: string;
  subjectType: string;
  subjectId: string;
  detail: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const actorUid = await operatorUid(input.actor);
  await db.collection('auditLogs').add({
    action: input.action,
    actorUid,
    actorKind: 'admin_cli',
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    detail: input.detail,
    createdAt: FieldValue.serverTimestamp(),
    metadata: input.metadata ?? {},
  });
}

interface ClaimsShape {
  platformAdmin?: boolean;
  teacherVerified?: boolean;
  roles?: string[];
  institutions?: string[];
  suspended?: boolean;
}

async function readClaims(uid: string): Promise<ClaimsShape> {
  const user = await auth.getUser(uid);
  return (user.customClaims ?? {}) as ClaimsShape;
}

/**
 * Apply claims and revoke refresh tokens so the change takes effect on the next
 * token refresh instead of waiting for the current token to expire.
 */
async function applyClaims(uid: string, patch: Partial<ClaimsShape>): Promise<ClaimsShape> {
  const current = await readClaims(uid);
  const next: ClaimsShape = {
    platformAdmin: patch.platformAdmin ?? current.platformAdmin ?? false,
    teacherVerified: patch.teacherVerified ?? current.teacherVerified ?? false,
    roles: patch.roles ?? current.roles ?? [],
    institutions: patch.institutions ?? current.institutions ?? [],
    suspended: patch.suspended ?? current.suspended ?? false,
  };
  await auth.setCustomUserClaims(uid, next);
  await auth.revokeRefreshTokens(uid);
  return next;
}

const SELF_SERVE = ['student_school', 'student_college', 'teacher', 'parent'];

function effectiveRoles(rolesDoc: {
  selfDeclared?: string[];
  granted?: string[];
  revoked?: string[];
}): string[] {
  const revoked = new Set(rolesDoc.revoked ?? []);
  const merged = new Set([...(rolesDoc.granted ?? []), ...(rolesDoc.selfDeclared ?? [])]);
  return [...merged].filter((role) => !revoked.has(role));
}

async function syncRoleClaims(uid: string): Promise<void> {
  const snapshot = await db.collection('userRoles').doc(uid).get();
  const data = snapshot.data() ?? {};
  const roles = effectiveRoles(data as { selfDeclared?: string[]; granted?: string[]; revoked?: string[] });
  const teacherVerified =
    (data as { teacherVerification?: { status?: string } }).teacherVerification?.status === 'verified';
  await applyClaims(uid, { roles, teacherVerified });
}

/* -------------------------------------------------------------------------- */
/* Commands                                                                   */
/* -------------------------------------------------------------------------- */

async function bootstrapPlatformAdmin(flags: Flags): Promise<void> {
  const email = requiredString(flags, 'email');
  const operator = requiredString(flags, 'operator');
  const uid = await resolveUid(email);

  const claims = await applyClaims(uid, { platformAdmin: true });

  const rolesRef = db.collection('userRoles').doc(uid);
  const rolesSnapshot = await rolesRef.get();
  if (!rolesSnapshot.exists) {
    await rolesRef.set({
      selfDeclared: [],
      granted: [],
      revoked: [],
      teacherVerification: { status: 'not_submitted', note: null, decidedAt: null },
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await audit({
    action: 'platform_admin.bootstrap',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: `${email} provisioned as the first platform administrator`,
  });
  console.log(`✔ ${email} (${uid}) is now a platform administrator.`);
  console.log('  Claims:', JSON.stringify(claims));
  console.log('  Ask them to sign out and sign in again.');
}

async function grantRole(flags: Flags): Promise<void> {
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const role = requiredString(flags, 'role');
  const operator = requiredString(flags, 'operator');
  const allowed = ['institution_admin', 'teacher', 'parent', 'student_school', 'student_college'];
  if (!allowed.includes(role)) throw new Error(`Unknown role: ${role}`);

  const ref = db.collection('userRoles').doc(uid);
  const snapshot = await ref.get();
  const existing = (snapshot.data() ?? {}) as {
    selfDeclared?: string[];
    granted?: string[];
    revoked?: string[];
    teacherVerification?: unknown;
  };
  await ref.set(
    {
      selfDeclared: existing.selfDeclared ?? [],
      granted: Array.from(new Set([...(existing.granted ?? []), role])),
      revoked: (existing.revoked ?? []).filter((item) => item !== role),
      teacherVerification:
        existing.teacherVerification ?? { status: 'not_submitted', note: null, decidedAt: null },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await syncRoleClaims(uid);
  await audit({
    action: 'role.grant',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: `Granted role ${role}`,
    metadata: { role },
  });
  console.log(`✔ Granted ${role} to ${uid}`);
}

async function revokeRole(flags: Flags): Promise<void> {
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const role = requiredString(flags, 'role');
  const operator = requiredString(flags, 'operator');

  // Platform administration is a custom claim, not a document role. Revoke the
  // claim itself so a refreshed token cannot carry it.
  if (role === 'platform_admin') {
    await applyClaims(uid, { platformAdmin: false });
    await audit({
      action: 'platform_admin.revoke',
      actor: operator,
      subjectType: 'user',
      subjectId: uid,
      detail: 'Revoked platform administrator access',
    });
    console.log(`✔ Revoked platform administrator access from ${uid}`);
    return;
  }

  const ref = db.collection('userRoles').doc(uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('No role document for that user.');
  const existing = snapshot.data() as { granted?: string[]; revoked?: string[]; selfDeclared?: string[] };

  await ref.set(
    {
      granted: (existing.granted ?? []).filter((item) => item !== role),
      revoked: Array.from(new Set([...(existing.revoked ?? []), role])),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Institution administration also means institution memberships. Revoking it
  // removes active memberships so no workspace survives the revocation.
  if (role === 'institution_admin') {
    const members = await db.collectionGroup('members').where('uid', '==', uid).get();
    const batch = db.batch();
    for (const member of members.docs) {
      if ((member.data() as { role?: string }).role === 'owner') continue;
      batch.update(member.ref, {
        status: 'revoked',
        revokedAt: FieldValue.serverTimestamp(),
        addedBy: operator,
      });
    }
    await batch.commit();
    const claims = await readClaims(uid);
    await applyClaims(uid, { institutions: [] });
    console.log(`  Revoked institution memberships (previous claims: ${JSON.stringify(claims.institutions ?? [])})`);
  }

  await syncRoleClaims(uid);
  await audit({
    action: 'role.revoke',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: `Revoked role ${role}`,
    metadata: { role },
  });
  console.log(`✔ Revoked ${role} from ${uid}`);
}

async function verifyTeacher(flags: Flags): Promise<void> {
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const operator = requiredString(flags, 'operator');
  const note = optionalString(flags, 'note') ?? 'Verified by the iSchoolie team';
  const status = flags.reject ? 'rejected' : 'verified';

  const ref = db.collection('userRoles').doc(uid);
  const snapshot = await ref.get();
  const existing = (snapshot.data() ?? {}) as {
    selfDeclared?: string[];
    granted?: string[];
    revoked?: string[];
  };
  await ref.set(
    {
      selfDeclared: existing.selfDeclared ?? [],
      granted: existing.granted ?? [],
      revoked: existing.revoked ?? [],
      teacherVerification: {
        status,
        note,
        decidedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await applyClaims(uid, { teacherVerified: status === 'verified' });
  await audit({
    action: status === 'verified' ? 'teacher.verify' : 'teacher.reject',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: note,
  });
  console.log(`✔ Teacher verification for ${uid}: ${status}`);
}

async function approveInstitution(flags: Flags): Promise<void> {
  const applicationId = requiredString(flags, 'application');
  const operator = requiredString(flags, 'operator');
  const note = optionalString(flags, 'note') ?? 'Institution identity verified by the iSchoolie team';

  const applicationRef = db.collection('institutionApplications').doc(applicationId);
  const applicationSnapshot = await applicationRef.get();
  if (!applicationSnapshot.exists) throw new Error(`Application ${applicationId} not found.`);
  const application = applicationSnapshot.data() as {
    applicantUid: string;
    institutionName: string;
    category: string;
    officialEmail: string;
    website: string | null;
    country: string;
    city: string;
    status: string;
    institutionId: string | null;
  };

  if (application.institutionId) {
    console.log(`ℹ Already approved → institution ${application.institutionId}. Nothing to do.`);
    return;
  }
  if (application.status === 'rejected') {
    throw new Error('This application was rejected. Reopening it requires a fresh submission.');
  }

  const ownerIdentifier = optionalString(flags, 'owner') ?? application.applicantUid;
  const ownerUid = await resolveUid(ownerIdentifier);
  const ownerRecord = await auth.getUser(ownerUid);

  const institutionRef = db.collection('institutions').doc();
  const actorUid = await operatorUid(operator);

  await db.runTransaction(async (transaction) => {
    transaction.set(institutionRef, {
      name: application.institutionName,
      slug: slugify(application.institutionName),
      category: application.category,
      officialEmail: application.officialEmail,
      website: application.website ?? null,
      country: application.country,
      city: application.city,
      status: 'active',
      ownerUid,
      sourceApplicationId: applicationId,
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: actorUid,
    });

    transaction.set(institutionRef.collection('members').doc(ownerUid), {
      uid: ownerUid,
      institutionId: institutionRef.id,
      institutionName: application.institutionName,
      displayName: ownerRecord.displayName ?? application.institutionName,
      email: ownerRecord.email ?? application.officialEmail,
      role: 'owner',
      status: 'active',
      addedBy: actorUid,
      addedAt: FieldValue.serverTimestamp(),
      revokedAt: null,
    });

    transaction.update(applicationRef, {
      status: 'approved',
      institutionId: institutionRef.id,
      reviewerUid: actorUid,
      reviewNote: note,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(applicationRef.collection('events').doc(), {
      action: 'approved',
      actorUid,
      actorKind: 'admin_cli',
      note,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  // Privileged grants: role document + claims.
  const rolesRef = db.collection('userRoles').doc(ownerUid);
  const rolesSnapshot = await rolesRef.get();
  const existing = (rolesSnapshot.data() ?? {}) as {
    selfDeclared?: string[];
    granted?: string[];
    revoked?: string[];
    teacherVerification?: unknown;
  };
  await rolesRef.set(
    {
      selfDeclared: existing.selfDeclared ?? [],
      granted: Array.from(new Set([...(existing.granted ?? []), 'institution_admin'])),
      revoked: (existing.revoked ?? []).filter((role) => role !== 'institution_admin'),
      teacherVerification:
        existing.teacherVerification ?? { status: 'not_submitted', note: null, decidedAt: null },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const claims = await readClaims(ownerUid);
  await applyClaims(ownerUid, {
    institutions: Array.from(new Set([...(claims.institutions ?? []), institutionRef.id])),
  });
  await syncRoleClaims(ownerUid);

  await audit({
    action: 'institution.approve',
    actor: operator,
    subjectType: 'institution',
    subjectId: institutionRef.id,
    detail: `Approved "${application.institutionName}" from application ${applicationId}`,
    metadata: { ownerUid, applicationId },
  });
  await audit({
    action: 'institution.owner.provision',
    actor: operator,
    subjectType: 'user',
    subjectId: ownerUid,
    detail: `Provisioned institution owner for ${application.institutionName}`,
    metadata: { institutionId: institutionRef.id },
  });

  console.log(`✔ Institution approved: ${institutionRef.id}`);
  console.log(`  Owner: ${ownerRecord.email ?? ownerUid} (${ownerUid})`);
  console.log('  The owner must sign out and sign in again to receive the claim.');
}

async function rejectInstitution(flags: Flags): Promise<void> {
  const applicationId = requiredString(flags, 'application');
  const operator = requiredString(flags, 'operator');
  const reason = requiredString(flags, 'reason');
  const actorUid = await operatorUid(operator);
  const ref = db.collection('institutionApplications').doc(applicationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Application not found.');
  if ((snapshot.data() as { status: string }).status === 'approved') {
    throw new Error('An approved application cannot be rejected. Suspend the institution instead.');
  }
  await ref.update({
    status: 'rejected',
    reviewerUid: actorUid,
    reviewNote: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await ref.collection('events').add({
    action: 'rejected',
    actorUid,
    actorKind: 'admin_cli',
    note: reason,
    createdAt: FieldValue.serverTimestamp(),
  });
  await audit({
    action: 'institution.reject',
    actor: operator,
    subjectType: 'institutionApplication',
    subjectId: applicationId,
    detail: reason,
  });
  console.log(`✔ Application ${applicationId} rejected.`);
}

async function setInstitutionStatus(flags: Flags, status: 'active' | 'suspended'): Promise<void> {
  const institutionId = requiredString(flags, 'institution');
  const operator = requiredString(flags, 'operator');
  const ref = db.collection('institutions').doc(institutionId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Institution not found.');
  await ref.update({ status });
  await audit({
    action: status === 'suspended' ? 'institution.suspend' : 'institution.resume',
    actor: operator,
    subjectType: 'institution',
    subjectId: institutionId,
    detail: status === 'suspended' ? 'Institution suspended' : 'Institution re-activated',
  });
  console.log(`✔ Institution ${institutionId} → ${status}.`);
  if (status === 'suspended') {
    console.log('  Members keep their accounts; institution tools and records are denied by rules.');
  }
}

async function addInstitutionMember(flags: Flags): Promise<void> {
  const institutionId = requiredString(flags, 'institution');
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const operator = requiredString(flags, 'operator');
  const role = requiredString(flags, 'role');
  if (!['teacher', 'staff'].includes(role)) {
    throw new Error('Only teacher or staff may be added here; ownership is set by approval.');
  }
  const institution = await db.collection('institutions').doc(institutionId).get();
  if (!institution.exists) throw new Error('Institution not found.');
  const user = await auth.getUser(uid);
  const actorUid = await operatorUid(operator);

  await db
    .collection('institutions')
    .doc(institutionId)
    .collection('members')
    .doc(uid)
    .set({
      uid,
      institutionId,
      institutionName: (institution.data() as { name: string }).name,
      displayName: user.displayName ?? 'Member',
      email: user.email ?? '',
      role,
      status: 'active',
      addedBy: actorUid,
      addedAt: FieldValue.serverTimestamp(),
      revokedAt: null,
    });

  await syncRoleClaims(uid);
  await audit({
    action: 'institution.member.add',
    actor: operator,
    subjectType: 'institution',
    subjectId: institutionId,
    detail: `Added ${user.email ?? uid} as ${role}`,
    metadata: { uid, role },
  });
  console.log(`✔ ${user.email ?? uid} added to ${institutionId} as ${role}.`);
}

async function suspendUser(flags: Flags, suspended: boolean): Promise<void> {
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const operator = requiredString(flags, 'operator');
  await db
    .collection('users')
    .doc(uid)
    .update({ status: suspended ? 'suspended' : 'active', updatedAt: FieldValue.serverTimestamp() });
  await applyClaims(uid, { suspended });
  await audit({
    action: suspended ? 'user.suspend' : 'user.restore',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: suspended ? 'Account suspended and tokens revoked' : 'Account restored',
  });
  console.log(`✔ User ${uid} ${suspended ? 'suspended' : 'restored'}.`);
}

async function purgeUser(flags: Flags): Promise<void> {
  const uid = await resolveUid(requiredString(flags, 'uid'));
  const operator = requiredString(flags, 'operator');
  if (!flags.confirm) {
    console.log('Refusing to purge without --confirm. This deletes the identity documents.');
    return;
  }
  const batch = db.batch();
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('users').doc(uid).collection('private').doc('profile'));
  batch.delete(db.collection('userRoles').doc(uid));
  await batch.commit();
  try {
    await auth.deleteUser(uid);
  } catch {
    console.log('  Auth user already removed.');
  }
  await audit({
    action: 'user.purge',
    actor: operator,
    subjectType: 'user',
    subjectId: uid,
    detail: 'Identity documents purged after deletion request',
  });
  console.log(`✔ Purged identity documents for ${uid}.`);
}

async function approveGuardian(flags: Flags): Promise<void> {
  const requestId = requiredString(flags, 'request');
  const operator = requiredString(flags, 'operator');
  const actorUid = await operatorUid(operator);
  const ref = db.collection('guardianLinkRequests').doc(requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Guardian request not found.');
  const request = snapshot.data() as {
    guardianUid: string;
    guardianName: string;
    studentUid: string | null;
    relationship: string;
    consent: Record<string, boolean>;
  };
  if (!request.studentUid) throw new Error('The student has not confirmed this request yet.');

  const student = await db.collection('users').doc(request.studentUid).get();
  const studentName =
    (student.data() as { displayName?: string } | undefined)?.displayName ?? request.studentUid;

  await db.collection('guardianLinks').doc(`${request.guardianUid}_${request.studentUid}`).set({
    guardianUid: request.guardianUid,
    guardianName: request.guardianName,
    studentUid: request.studentUid,
    studentName,
    relationship: request.relationship,
    status: 'approved',
    requestedBy: request.guardianUid,
    requestedAt: FieldValue.serverTimestamp(),
    studentConfirmedAt: FieldValue.serverTimestamp(),
    verifiedBy: actorUid,
    verifiedAt: FieldValue.serverTimestamp(),
    revokedBy: null,
    revokedAt: null,
    note: null,
    consent: request.consent,
    expiresAt: null,
  });
  await ref.update({
    status: 'approved',
    decidedBy: actorUid,
    decidedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await audit({
    action: 'guardian.approve',
    actor: operator,
    subjectType: 'guardianLink',
    subjectId: `${request.guardianUid}_${request.studentUid}`,
    detail: `Verified guardian ${request.guardianName} for ${studentName}`,
  });
  console.log('✔ Guardian relationship verified.');
}

async function listAudit(flags: Flags): Promise<void> {
  const limit = Number(typeof flags.limit === 'string' ? flags.limit : 20);
  const snapshot = await db
    .collection('auditLogs')
    .orderBy('createdAt', 'desc')
    .limit(Number.isFinite(limit) ? limit : 20)
    .get();
  if (snapshot.empty) {
    console.log('No audit entries.');
    return;
  }
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(
      `${data.action}\t${data.actorKind}:${data.actorUid}\t${data.subjectType}/${data.subjectId}\t${data.detail}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */

function printHelp(): void {
  console.log(`iSchoolie admin CLI

  bootstrap --email <email> --operator <email>
  role grant --uid <uid|email> --role <role> --operator <email>
  role revoke --uid <uid|email> --role <role> --operator <email>
  teacher verify --uid <uid|email> --operator <email> [--note ...]
  teacher reject --uid <uid|email> --operator <email> --reject
  institution approve --application <id> --operator <email> [--owner <uid|email>] [--note ...]
  institution reject --application <id> --reason "..." --operator <email>
  institution suspend --institution <id> --operator <email>
  institution resume --institution <id> --operator <email>
  institution member --institution <id> --uid <uid|email> --role teacher|staff --operator <email>
  guardian approve --request <id> --operator <email>
  user suspend --uid <uid|email> --operator <email>
  user restore --uid <uid|email> --operator <email>
  user purge --uid <uid|email> --operator <email> --confirm
  audit list [--limit 20]
`);
}

async function main(): Promise<void> {
  const [, , domain, action, ...rest] = process.argv;
  const flags = parseFlags(rest);

  switch (domain) {
    case 'bootstrap':
      await bootstrapPlatformAdmin(flags);
      return;
    case 'role':
      if (action === 'grant') return grantRole(flags);
      if (action === 'revoke') return revokeRole(flags);
      break;
    case 'teacher':
      if (action === 'verify') return verifyTeacher(flags);
      if (action === 'reject') return verifyTeacher({ ...flags, reject: true });
      break;
    case 'institution':
      if (action === 'approve') return approveInstitution(flags);
      if (action === 'reject') return rejectInstitution(flags);
      if (action === 'suspend') return setInstitutionStatus(flags, 'suspended');
      if (action === 'resume') return setInstitutionStatus(flags, 'active');
      if (action === 'member') return addInstitutionMember(flags);
      break;
    case 'guardian':
      if (action === 'approve') return approveGuardian(flags);
      break;
    case 'user':
      if (action === 'suspend') return suspendUser(flags, true);
      if (action === 'restore') return suspendUser(flags, false);
      if (action === 'purge') return purgeUser(flags);
      break;
    case 'audit':
      if (action === 'list') return listAudit(flags);
      break;
    default:
      break;
  }

  printHelp();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error('✖', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
