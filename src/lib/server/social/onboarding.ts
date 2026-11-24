import 'server-only';
import { prisma } from '@/lib/prisma';
import type { EducationStage, RoleKey } from '@prisma/client';
import {
  EDUCATION_GOALS,
  EDUCATION_STAGES,
  TOPIC_CATALOG,
  type EducationStageValue,
} from '@/lib/social/catalog';
import { ageBand, parseIsoDate, slugify } from '@/lib/utils/dates';
import type { OnboardingSnapshot } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { recordAudit } from '@/lib/server/social/audit';
import { ensureTopics } from '@/lib/server/social/topics';

const REQUIRED_STEPS = ['identity', 'education', 'goals', 'interests', 'privacy', 'connect'];

function stageValue(value: unknown): EducationStageValue | null {
  return EDUCATION_STAGES.some((stage) => stage.value === value)
    ? (value as EducationStageValue)
    : null;
}

function deriveRoles(stage: EducationStageValue | null): RoleKey[] {
  switch (stage) {
    case 'school_student':
      return ['student_school'];
    case 'college_student':
      return ['student_college'];
    case 'teacher':
      return ['teacher'];
    case 'parent':
      return ['parent'];
    default:
      return [];
  }
}

export async function getOnboardingSnapshot(
  viewer: SocialViewerRecord,
): Promise<OnboardingSnapshot> {
  const [progress, privateProfile, socialProfile, user, discoverability] = await Promise.all([
    prisma.onboardingProgress.upsert({
      where: { userId: viewer.user.id },
      create: { userId: viewer.user.id, step: 1 },
      update: {},
    }),
    prisma.userPrivate.findUnique({ where: { userId: viewer.user.id } }),
    prisma.socialProfile.upsert({
      where: { userId: viewer.user.id },
      create: { userId: viewer.user.id },
      update: {},
    }),
    prisma.user.findUniqueOrThrow({ where: { id: viewer.user.id } }),
    prisma.discoverabilityPreference.findUnique({ where: { userId: viewer.user.id } }),
  ]);

  return {
    completed: progress.completed,
    step: progress.step,
    completedSteps: progress.completedSteps,
    educationStage: (progress.educationStage as EducationStageValue | null) ?? null,
    goals: progress.goals,
    interests: progress.interests,
    connectDone: progress.connectDone,
    dateOfBirth: privateProfile?.dateOfBirth ?? null,
    displayName: user.displayName,
    handle: user.handle,
    photoUrl: user.photoUrl,
    bio: socialProfile.bio,
    region: socialProfile.region,
    isMinor: user.isMinor,
    isPrivate: user.privateProfile,
    grade: privateProfile?.grade ?? null,
    discoverable: discoverability?.discoverable ?? true,
    recommendable: discoverability?.recommendable ?? true,
    showFollowers: discoverability?.showFollowers ?? true,
    showFollowing: discoverability?.showFollowing ?? true,
  };
}

function asString(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))].slice(0, max);
}

async function markProgress(
  userId: string,
  step: number,
  completedStep: string,
  data: {
    educationStage?: EducationStage | null;
    goals?: string[];
    interests?: string[];
    connectDone?: boolean;
    inviteSkipped?: boolean;
  } = {},
): Promise<void> {
  const current = await prisma.onboardingProgress.findUnique({ where: { userId } });
  const completedSteps = [...new Set([...(current?.completedSteps ?? []), completedStep])];
  await prisma.onboardingProgress.update({
    where: { userId },
    data: {
      step: Math.max(step, current?.step ?? 1),
      completedSteps,
      ...data,
    },
  });
}

export interface OnboardingPayload {
  username?: unknown;
  displayName?: unknown;
  dateOfBirth?: unknown;
  bio?: unknown;
  region?: unknown;
  avatarAssetId?: unknown;
  educationStage?: unknown;
  grade?: unknown;
  goals?: unknown;
  interests?: unknown;
  privateProfile?: unknown;
  discoverable?: unknown;
  recommendable?: unknown;
  showFollowers?: unknown;
  showFollowing?: unknown;
  guardianAcknowledged?: unknown;
  inviteSkipped?: unknown;
}

/**
 * Save one onboarding step. Each step validates its own fields and can be
 * retried safely; step completion is additive so a refresh never loses work.
 */
export async function saveOnboardingStep(
  viewer: SocialViewerRecord,
  step: number,
  payload: OnboardingPayload,
): Promise<{ nextStep: number; completed: boolean }> {
  if (!Number.isInteger(step) || step < 1 || step > 7) {
    throw new Error('Unknown onboarding step.');
  }

  if (step === 1) {
    const displayName = asString(payload.displayName, 80);
    if (displayName.length < 2) throw new Error('Please enter your display name.');

    const dateOfBirth = asString(payload.dateOfBirth, 10);
    if (!parseIsoDate(dateOfBirth)) throw new Error('Please enter a valid date of birth.');
    const band = ageBand(dateOfBirth);
    if (band === 'under-13') {
      throw new Error('iSchoolie accounts are not available to children under 13.');
    }
    if (band === 'unknown') throw new Error('Please enter a valid date of birth.');
    const isMinor = band === 'minor';

    let photoUrl: string | undefined;
    const avatarAssetId = asString(payload.avatarAssetId, 60);
    if (avatarAssetId) {
      const asset = await prisma.socialMediaAsset.findFirst({
        where: { id: avatarAssetId, ownerId: viewer.user.id, kind: 'image' },
      });
      if (!asset) throw new Error('That profile image could not be verified.');
      photoUrl = `/api/social/media/${asset.id}`;
    }

    const bio = asString(payload.bio, 300);
    const region = asString(payload.region, 80);

    const rawUsername = asString(payload.username, 40);
    let handle: string | undefined;
    if (rawUsername) {
      const normalized = slugify(rawUsername);
      if (normalized.length < 3) {
        throw new Error('Choose a username with at least 3 letters or numbers.');
      }
      const taken = await prisma.user.findFirst({
        where: { handle: normalized, NOT: { id: viewer.user.id } },
        select: { id: true },
      });
      if (taken) throw new Error('This username is already taken.');
      handle = normalized;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: viewer.user.id },
          data: {
            displayName,
            isMinor,
            // A student account is always private, whatever the client sends.
            ...(isMinor ? { privateProfile: true } : {}),
            ...(photoUrl ? { photoUrl } : {}),
            ...(handle ? { handle } : {}),
          },
        });
      await tx.userPrivate.update({
        where: { userId: viewer.user.id },
        data: { dateOfBirth },
      });
              await tx.socialProfile.update({
        where: { userId: viewer.user.id },
        data: { bio, region: region || null },
      });
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
        throw new Error('This username is already taken.');
      }
      throw error;
    }

    await markProgress(viewer.user.id, 2, 'identity');
    return { nextStep: 2, completed: false };
  }

  if (step === 2) {
    const stage = stageValue(payload.educationStage);
    if (!stage) throw new Error('Choose where you are in your education journey.');

    let grade: number | null = null;
    if (stage === 'school_student') {
      const parsed = Number(payload.grade);
      if (!Number.isInteger(parsed) || parsed < 8 || parsed > 12) {
        throw new Error('iSchoolie school accounts start from Class 8 (Class 8–12).');
      }
      grade = parsed;
    }

    const current = await prisma.user.findUniqueOrThrow({
      where: { id: viewer.user.id },
      select: { isMinor: true },
    });
    if (stage === 'school_student' && !current.isMinor) {
      throw new Error('A school student account must belong to someone under 18.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: viewer.user.id },
        data: {
          studentLevel:
            stage === 'school_student' ? 'school' : stage === 'college_student' ? 'college' : null,
        },
      });
      await tx.userPrivate.update({
        where: { userId: viewer.user.id },
        data: { grade },
      });
      await tx.socialProfile.update({
        where: { userId: viewer.user.id },
        data: { educationStage: stage as EducationStage },
      });
    });

    await markProgress(viewer.user.id, 3, 'education');
    return { nextStep: 3, completed: false };
  }

  if (step === 3) {
    const goals = asStringArray(payload.goals, 10).filter((goal) =>
      (EDUCATION_GOALS as readonly string[]).includes(goal),
    );
    if (goals.length === 0) throw new Error('Choose at least one goal.');

    await prisma.$transaction(async (tx) => {
      await tx.userGoal.deleteMany({ where: { userId: viewer.user.id } });
      await tx.userGoal.createMany({
        data: goals.map((goal) => ({ userId: viewer.user.id, goal })),
        skipDuplicates: true,
      });
      await tx.onboardingProgress.update({
        where: { userId: viewer.user.id },
        data: { goals },
      });
    });
    await markProgress(viewer.user.id, 4, 'goals');
    return { nextStep: 4, completed: false };
  }

  if (step === 4) {
    const slugs = asStringArray(payload.interests, 16);
    const valid = slugs.filter((slug) => TOPIC_CATALOG.some((topic) => topic.slug === slug));
    if (valid.length === 0) throw new Error('Choose at least one interest.');

    await ensureTopics();
    const topics = await prisma.topic.findMany({ where: { slug: { in: valid } }, select: { id: true } });

    await prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId: viewer.user.id } });
      await tx.userInterest.createMany({
        data: topics.map((topic) => ({ userId: viewer.user.id, topicId: topic.id })),
        skipDuplicates: true,
      });
      await tx.onboardingProgress.update({
        where: { userId: viewer.user.id },
        data: { interests: valid },
      });
    });
    await markProgress(viewer.user.id, 5, 'interests');
    return { nextStep: 5, completed: false };
  }

  if (step === 5) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: viewer.user.id },
      select: { isMinor: true },
    });
    if (user.isMinor && payload.guardianAcknowledged !== true) {
      throw new Error('A parent or guardian must acknowledge this student account.');
    }
    const privateProfile = user.isMinor ? true : payload.privateProfile !== false;
    const discoverable = payload.discoverable !== false;
    const recommendable = discoverable && payload.recommendable !== false;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: viewer.user.id },
        data: {
          privateProfile,
          ...(user.isMinor ? { guardianConsentRecordedAt: new Date() } : {}),
        },
      });
      await tx.discoverabilityPreference.update({
        where: { userId: viewer.user.id },
        data: {
          discoverable,
          recommendable,
          showFollowers: payload.showFollowers !== false,
          showFollowing: payload.showFollowing !== false,
        },
      });
    });
    await markProgress(viewer.user.id, 6, 'privacy');
    return { nextStep: 6, completed: false };
  }

  if (step === 6) {
    await markProgress(viewer.user.id, 7, 'connect', { connectDone: true });
    return { nextStep: 7, completed: false };
  }

  await markProgress(viewer.user.id, 8, 'invite', { inviteSkipped: payload.inviteSkipped !== false });
  return { nextStep: 8, completed: false };
}

export async function completeSocialOnboarding(
  viewer: SocialViewerRecord,
): Promise<{ completed: true }> {
  const [progress, user, userRoles, privateProfile, socialProfile] = await Promise.all([
    prisma.onboardingProgress.findUnique({ where: { userId: viewer.user.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: viewer.user.id } }),
    prisma.userRoles.findUnique({ where: { userId: viewer.user.id } }),
    prisma.userPrivate.findUnique({ where: { userId: viewer.user.id } }),
    prisma.socialProfile.findUnique({ where: { userId: viewer.user.id } }),
  ]);

  if (!progress) throw new Error('Start onboarding before completing it.');
  const missing = REQUIRED_STEPS.filter((step) => !progress.completedSteps.includes(step));
  if (missing.length > 0) {
    throw new Error('Complete the earlier onboarding steps first.');
  }
  if (!privateProfile?.dateOfBirth) {
    throw new Error('Add your date of birth before continuing.');
  }

  const stage = (socialProfile?.educationStage as EducationStageValue | null) ?? null;
  const derived = deriveRoles(stage);
  const selectedRoles = [...new Set([...user.selectedRoles, ...derived])];

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: viewer.user.id },
      data: {
        onboarded: true,
        onboardedAt: user.onboardedAt ?? new Date(),
        selectedRoles,
        isMinor: ageBand(privateProfile.dateOfBirth) === 'minor',
        privateProfile: ageBand(privateProfile.dateOfBirth) === 'minor' ? true : user.privateProfile,
      },
    });
    await tx.userRoles.upsert({
      where: { userId: viewer.user.id },
      create: {
        userId: viewer.user.id,
        selfDeclared: selectedRoles,
        granted: [],
        revoked: [],
      },
      update: {
        selfDeclared: [...new Set([...(userRoles?.selfDeclared ?? []), ...selectedRoles])],
      },
    });
    await tx.onboardingProgress.update({
      where: { userId: viewer.user.id },
      data: { completed: true, completedAt: new Date(), step: 8 },
    });
  });

  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.onboarding.completed',
    subjectType: 'user',
    subjectId: viewer.user.id,
  });

  return { completed: true };
}
