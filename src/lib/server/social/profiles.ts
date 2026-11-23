import 'server-only';
import { prisma } from '@/lib/prisma';
import { canSeeNetwork, canViewProfile, isSafeHttpUrl, type PolicyActor } from '@/lib/social/policy';
import type { EducationStageValue } from '@/lib/social/catalog';
import type { DiscoverabilitySettings, PersonProfile } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import {
  canViewPersonContent,
  contextIsBlocked,
  loadPersonContext,
  personInclude,
  summaryFor,
} from '@/lib/server/social/serialize';

function targetActor(row: Awaited<ReturnType<typeof findPerson>>): PolicyActor | null {
  if (!row) return null;
  return {
    id: row.id,
    isMinor: row.isMinor,
    privateProfile: row.privateProfile,
    status: row.status,
    teacherVerified: row.teacherVerification?.status === 'verified',
  };
}

async function findPerson(handle: string) {
  return prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: personInclude,
  });
}

export interface ProfilePageData {
  profile: PersonProfile;
  targetId: string;
  isSelf: boolean;
  canViewContent: boolean;
  canSeeNetwork: boolean;
}

/**
 * Public profile, filtered by the viewer's relationship to the target.
 * Adult accounts receive a 404 for a student profile rather than a "private"
 * page that would confirm the account exists.
 */
export async function getProfileByHandle(
  viewer: SocialViewerRecord,
  handle: string,
): Promise<ProfilePageData | null> {
  const row = await findPerson(handle);
  if (!row) return null;

  const viewerActor: PolicyActor = {
    id: viewer.user.id,
    isMinor: viewer.user.isMinor,
    privateProfile: viewer.user.privateProfile,
    status: viewer.user.status,
    teacherVerified: viewer.teacherVerified,
  };
  const target = targetActor(row);
  if (!target) return null;

  if (row.isMinor && !viewer.user.isMinor && !viewer.user.platformAdmin) return null;
  if (row.status === 'pending_deletion') return null;
  if (row.status === 'suspended' && row.id !== viewer.user.id && !viewer.user.platformAdmin) {
    return null;
  }

  const isSelf = row.id === viewer.user.id;
  const [context, settings] = await Promise.all([
    loadPersonContext(viewer, [row]),
    prisma.discoverabilityPreference.findUnique({ where: { userId: row.id } }),
  ]);

  const isBlocked = contextIsBlocked(context, row.id);
  if (isBlocked) return null;

  const isFollowing = context.outgoing.get(row.id)?.status === 'active';
  const profileVisible = canViewProfile({
    viewer: viewerActor,
    target,
    isFollowing,
    blocked: false,
    isAdmin: viewer.user.platformAdmin,
  });

  // A private account still gets a restrained profile header so an eligible
  // person can request to follow it. Everything below the header stays hidden
  // through `summaryFor` and `canViewContent`; only blocked, suspended and
  // student-invisible cases return 404.
  const restrictedPrivate = row.privateProfile && !isFollowing && !viewer.user.platformAdmin;
  if (!profileVisible && !restrictedPrivate) return null;

  const summary = summaryFor(context, row);
  const showFollowers = settings?.showFollowers ?? true;
  const showFollowing = settings?.showFollowing ?? true;
  const canSee = canSeeNetwork({
    viewer: viewerActor,
    target,
    isFollowing,
    blocked: false,
    isAdmin: viewer.user.platformAdmin,
  });

  return {
    profile: {
      ...summary,
      coverUrl: row.socialProfile?.coverUrl ?? null,
      joinedAt: row.createdAt.toISOString(),
      showFollowers,
      showFollowing,
      canViewContent: canViewPersonContent(context, row),
      canSeeNetwork: canSee,
      isBlockedByViewer: false,
      isMutedByViewer: false,
    },
    targetId: row.id,
    isSelf,
    canViewContent: canViewPersonContent(context, row),
    canSeeNetwork: canSee,
  };
}

export async function getProfileMeta(viewer: SocialViewerRecord, targetId: string) {
  const [mute, block] = await Promise.all([
    prisma.userMute.findUnique({ where: { muterId_mutedId: { muterId: viewer.user.id, mutedId: targetId } } }),
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: viewer.user.id, blockedId: targetId } },
    }),
  ]);
  return { isMuted: Boolean(mute), isBlocked: Boolean(block) };
}

export async function updateProfile(
  viewer: SocialViewerRecord,
  values: {
    displayName?: string;
    headline?: string | null;
    bio?: string;
    region?: string | null;
    website?: string | null;
    skills?: string[];
    professionalFocus?: string[];
    educationStage?: EducationStageValue | null;
    avatarAssetId?: string | null;
    coverAssetId?: string | null;
  },
): Promise<void> {
  const userData: { displayName?: string; headline?: string | null } = {};
  const profileData: {
    bio?: string;
    region?: string | null;
    website?: string | null;
    skills?: string[];
    professionalFocus?: string[];
    educationStage?: EducationStageValue | null;
    coverUrl?: string | null;
  } = {};

  if (values.displayName !== undefined) {
    const name = values.displayName.trim();
    if (name.length < 2) throw new Error('Display name must be at least 2 characters.');
    userData.displayName = name.slice(0, 80);
  }
  if (values.headline !== undefined) {
    userData.headline = values.headline ? values.headline.trim().slice(0, 120) : null;
  }
  if (values.bio !== undefined) profileData.bio = values.bio.trim().slice(0, 300);
  if (values.region !== undefined) {
    profileData.region = values.region ? values.region.trim().slice(0, 80) : null;
  }
  if (values.website !== undefined) {
    const website = values.website ? values.website.trim() : null;
    if (website && !isSafeHttpUrl(website)) {
      throw new Error('Website must be a valid http or https address.');
    }
    profileData.website = website ? website.slice(0, 200) : null;
  }
  if (values.skills !== undefined) {
    profileData.skills = values.skills
      .map((skill) => skill.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 12);
  }
  if (values.professionalFocus !== undefined) {
    profileData.professionalFocus = values.professionalFocus
      .map((item) => item.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 8);
  }
  if (values.educationStage !== undefined) profileData.educationStage = values.educationStage;

  let photoUrl: string | undefined;
  if (values.avatarAssetId !== undefined) {
    if (values.avatarAssetId === null) {
      photoUrl = undefined;
      await prisma.user.update({ where: { id: viewer.user.id }, data: { photoUrl: null } });
    } else {
      const asset = await prisma.socialMediaAsset.findFirst({
        where: { id: values.avatarAssetId, ownerId: viewer.user.id, kind: 'image' },
      });
      if (!asset) throw new Error('That profile image could not be verified.');
      photoUrl = `/api/social/media/${asset.id}`;
      await prisma.user.update({ where: { id: viewer.user.id }, data: { photoUrl } });
    }
  }

  if (values.coverAssetId !== undefined) {
    if (values.coverAssetId === null) {
      profileData.coverUrl = null;
    } else {
      const asset = await prisma.socialMediaAsset.findFirst({
        where: { id: values.coverAssetId, ownerId: viewer.user.id, kind: 'image' },
      });
      if (!asset) throw new Error('That cover image could not be verified.');
      profileData.coverUrl = `/api/social/media/${asset.id}`;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({ where: { id: viewer.user.id }, data: userData });
    }
    if (Object.keys(profileData).length > 0) {
      await tx.socialProfile.upsert({
        where: { userId: viewer.user.id },
        create: { userId: viewer.user.id, ...profileData },
        update: profileData,
      });
    }
  });
}

export async function getDiscoverability(viewer: SocialViewerRecord): Promise<DiscoverabilitySettings> {
  const row = await prisma.discoverabilityPreference.upsert({
    where: { userId: viewer.user.id },
    create: { userId: viewer.user.id },
    update: {},
  });
  return {
    discoverable: row.discoverable,
    recommendable: row.recommendable,
    discoverByEmail: row.discoverByEmail,
    discoverByPhone: row.discoverByPhone,
    showEducation: row.showEducation,
    showFollowers: row.showFollowers,
    showFollowing: row.showFollowing,
    allowSearchIndexing: row.allowSearchIndexing,
  };
}

export async function updateDiscoverability(
  viewer: SocialViewerRecord,
  values: Partial<DiscoverabilitySettings>,
): Promise<DiscoverabilitySettings> {
  if (values.discoverByEmail === true || values.discoverByPhone === true) {
    throw new Error(
      'Lookup by email or phone is not enabled on iSchoolie. Contact discovery requires a separate approved policy.',
    );
  }

  const data: Partial<DiscoverabilitySettings> = {};
  for (const key of [
    'discoverable',
    'recommendable',
    'showEducation',
    'showFollowers',
    'showFollowing',
    'allowSearchIndexing',
  ] as const) {
    if (typeof values[key] === 'boolean') data[key] = values[key];
  }
  if (Object.keys(data).length === 0) return getDiscoverability(viewer);

  const row = await prisma.discoverabilityPreference.upsert({
    where: { userId: viewer.user.id },
    create: { userId: viewer.user.id, ...data },
    update: data,
  });
  return {
    discoverable: row.discoverable,
    recommendable: row.recommendable,
    discoverByEmail: row.discoverByEmail,
    discoverByPhone: row.discoverByPhone,
    showEducation: row.showEducation,
    showFollowers: row.showFollowers,
    showFollowing: row.showFollowing,
    allowSearchIndexing: row.allowSearchIndexing,
  };
}

export async function updatePrivacy(
  viewer: SocialViewerRecord,
  values: { privateProfile?: boolean; showFollowers?: boolean; showFollowing?: boolean },
): Promise<void> {
  if (typeof values.privateProfile === 'boolean') {
    await prisma.user.update({
      where: { id: viewer.user.id },
      data: {
        privateProfile: values.privateProfile,
        ...(viewer.user.isMinor ? { privateProfile: true } : {}),
      },
    });
  }
  const discoverability: Partial<DiscoverabilitySettings> = {};
  if (typeof values.showFollowers === 'boolean') discoverability.showFollowers = values.showFollowers;
  if (typeof values.showFollowing === 'boolean') discoverability.showFollowing = values.showFollowing;
  if (Object.keys(discoverability).length > 0) {
    await updateDiscoverability(viewer, discoverability);
  }
}
