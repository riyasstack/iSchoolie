import 'server-only';
import { redirect } from 'next/navigation';
import type { User as PrismaUser } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getWorkosUser } from '@/lib/server/session';
import { provisionSocialUser } from '@/lib/server/social/provision';
import type { EducationStageValue } from '@/lib/social/catalog';
import type { PolicyActor } from '@/lib/social/policy';
import type { SocialViewer } from '@/lib/social/types';

export interface SocialViewerRecord {
  user: PrismaUser;
  teacherVerified: boolean;
  educationStage: EducationStageValue | null;
  discoverable: boolean;
  recommendable: boolean;
  onboardingCompleted: boolean;
  unreadNotifications: number;
  pendingFollowRequests: number;
}

async function loadViewer(user: PrismaUser): Promise<SocialViewerRecord> {
  const [teacherVerification, socialProfile, discoverability, onboarding, unreadNotifications, pendingFollowRequests] =
    await Promise.all([
      prisma.teacherVerification.findUnique({ where: { userId: user.id }, select: { status: true } }),
      prisma.socialProfile.findUnique({ where: { userId: user.id }, select: { educationStage: true } }),
      prisma.discoverabilityPreference.findUnique({ where: { userId: user.id } }),
      prisma.onboardingProgress.findUnique({ where: { userId: user.id }, select: { completed: true } }),
      prisma.socialNotification.count({ where: { recipientId: user.id, read: false } }),
      prisma.socialFollow.count({ where: { followingId: user.id, status: 'pending' } }),
    ]);

  return {
    user,
    teacherVerified: teacherVerification?.status === 'verified',
    educationStage: (socialProfile?.educationStage as EducationStageValue | null) ?? null,
    discoverable: discoverability?.discoverable ?? true,
    recommendable: discoverability?.recommendable ?? true,
    onboardingCompleted: onboarding?.completed ?? false,
    unreadNotifications,
    pendingFollowRequests,
  };
}

/** Null when there is no WorkOS session; never creates guest access. */
export async function getSocialViewer(): Promise<SocialViewerRecord | null> {
  const workosUser = await getWorkosUser();
  if (!workosUser) return null;
  const user = await provisionSocialUser(workosUser);
  if (!user) return null;
  return loadViewer(user);
}

export async function requireSocialViewer(options?: {
  allowIncomplete?: boolean;
  nextPath?: string;
}): Promise<SocialViewerRecord> {
  const viewer = await getSocialViewer();
  if (!viewer) {
    const next = encodeURIComponent(options?.nextPath ?? '/feed');
    redirect(`/sign-in?next=${next}`);
  }
  if (viewer.user.status !== 'active') {
    redirect('/access-denied?reason=suspended');
  }
  if (!viewer.onboardingCompleted && !options?.allowIncomplete) {
    redirect('/onboarding/social');
  }
  return viewer;
}

export async function requirePlatformAdmin(): Promise<SocialViewerRecord> {
  const viewer = await requireSocialViewer();
  if (!viewer.user.platformAdmin) {
    redirect('/feed?notice=moderation-restricted');
  }
  return viewer;
}

export function viewerActor(viewer: SocialViewerRecord): PolicyActor {
  return {
    id: viewer.user.id,
    isMinor: viewer.user.isMinor,
    privateProfile: viewer.user.privateProfile,
    status: viewer.user.status,
    teacherVerified: viewer.teacherVerified,
  };
}

export function actorOf(user: PrismaUser, teacherVerified = false): PolicyActor {
  return {
    id: user.id,
    isMinor: user.isMinor,
    privateProfile: user.privateProfile,
    status: user.status,
    teacherVerified,
  };
}

export function toSocialViewer(viewer: SocialViewerRecord): SocialViewer {
  return {
    id: viewer.user.id,
    handle: viewer.user.handle,
    displayName: viewer.user.displayName,
    photoUrl: viewer.user.photoUrl,
    isMinor: viewer.user.isMinor,
    isPrivate: viewer.user.privateProfile,
    platformAdmin: viewer.user.platformAdmin,
    teacherVerified: viewer.teacherVerified,
    educationStage: viewer.educationStage,
    unreadNotifications: viewer.unreadNotifications,
    pendingFollowRequests: viewer.pendingFollowRequests,
    onboardingCompleted: viewer.onboardingCompleted,
  };
}

/** API helper: null means "answer 401", never "use a demo identity". */
export async function getApiViewer(): Promise<SocialViewerRecord | null> {
  return getSocialViewer();
}
