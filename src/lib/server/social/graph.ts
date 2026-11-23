import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canSeeNetwork, resolveFollowMode } from '@/lib/social/policy';
import type { FollowRequestView, Page, PersonSummary } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { recordAudit } from '@/lib/server/social/audit';
import { createSocialNotification } from '@/lib/server/social/notifications';
import { clampLimit, decodeCursor, encodeCursor } from '@/lib/server/social/pagination';
import { loadPersonContext, personInclude, summaryFor } from '@/lib/server/social/serialize';

async function findTarget(targetId: string) {
  return prisma.user.findUnique({ where: { id: targetId }, include: personInclude });
}

async function blockedBetween(a: string, b: string): Promise<boolean> {
  const row = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { blockerId: true },
  });
  return Boolean(row);
}

export interface FollowResult {
  state: 'following' | 'pending' | 'not_following';
  requested: boolean;
}

export async function followUser(
  viewer: SocialViewerRecord,
  targetId: string,
): Promise<FollowResult> {
  if (targetId === viewer.user.id) throw new Error('You cannot follow yourself.');
  const target = await findTarget(targetId);
  if (!target) throw new Error('That account is not available.');

  const existing = await prisma.socialFollow.findUnique({
    where: { followerId_followingId: { followerId: viewer.user.id, followingId: targetId } },
    select: { status: true },
  });
  if (existing?.status === 'active') return { state: 'following', requested: false };
  if (existing?.status === 'pending') return { state: 'pending', requested: true };

  const blocked = await blockedBetween(viewer.user.id, targetId);
  const mode = resolveFollowMode({
    viewer: {
      id: viewer.user.id,
      isMinor: viewer.user.isMinor,
      privateProfile: viewer.user.privateProfile,
      status: viewer.user.status,
      teacherVerified: viewer.teacherVerified,
    },
    target: {
      id: target.id,
      isMinor: target.isMinor,
      privateProfile: target.privateProfile,
      status: target.status,
      teacherVerified: target.teacherVerification?.status === 'verified',
    },
    blocked,
    existingStatus: null,
  });

  if (mode === 'blocked') {
    if (target.isMinor && !viewer.user.isMinor) {
      throw new Error('Student accounts cannot be followed by adult accounts.');
    }
    if (viewer.user.isMinor && target.teacherVerification?.status !== 'verified') {
      throw new Error('Student accounts can follow verified educators only.');
    }
    throw new Error('This account cannot be followed.');
  }
  if (mode === 'unavailable') throw new Error('This account is not available.');

  const status = mode === 'request' ? 'pending' : 'active';
  try {
    await prisma.socialFollow.create({
      data: {
        followerId: viewer.user.id,
        followingId: targetId,
        status,
        acceptedAt: status === 'active' ? new Date() : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const current = await prisma.socialFollow.findUnique({
        where: { followerId_followingId: { followerId: viewer.user.id, followingId: targetId } },
        select: { status: true },
      });
      return {
        state: current?.status === 'active' ? 'following' : 'pending',
        requested: current?.status === 'pending',
      };
    }
    throw error;
  }

  if (status === 'pending') {
    await createSocialNotification({
      recipientId: targetId,
      actorId: viewer.user.id,
      type: 'follow_request',
      title: `${viewer.user.displayName} requested to follow you`,
      body: 'Open your follow requests to accept or decline.',
      href: '/follow-requests',
    });
  } else {
    await createSocialNotification({
      recipientId: targetId,
      actorId: viewer.user.id,
      type: 'follow',
      title: `${viewer.user.displayName} started following you`,
      href: `/u/${viewer.user.handle}`,
    });
  }

  return {
    state: status === 'active' ? 'following' : 'pending',
    requested: status === 'pending',
  };
}

export async function unfollowUser(viewer: SocialViewerRecord, targetId: string): Promise<void> {
  await prisma.socialFollow.deleteMany({
    where: { followerId: viewer.user.id, followingId: targetId },
  });
}

export async function removeFollower(
  viewer: SocialViewerRecord,
  followerId: string,
): Promise<void> {
  await prisma.socialFollow.deleteMany({
    where: { followerId, followingId: viewer.user.id },
  });
  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.follower.removed',
    subjectType: 'user',
    subjectId: followerId,
  });
}

export async function acceptFollowRequest(
  viewer: SocialViewerRecord,
  requestId: string,
): Promise<void> {
  const request = await prisma.socialFollow.findUnique({
    where: { id: requestId },
    include: {
      follower: {
        select: {
          id: true,
          isMinor: true,
          status: true,
          displayName: true,
          teacherVerification: { select: { status: true } },
        },
      },
    },
  });
  if (!request || request.followingId !== viewer.user.id || request.status !== 'pending') {
    throw new Error('That follow request is no longer available.');
  }
  if (request.follower.isMinor && !viewer.user.isMinor) {
    await prisma.socialFollow.delete({ where: { id: request.id } });
    throw new Error('Student follow requests cannot be accepted by adult accounts.');
  }
  if (
    viewer.user.isMinor &&
    !request.follower.isMinor &&
    request.follower.teacherVerification?.status !== 'verified'
  ) {
    await prisma.socialFollow.delete({ where: { id: request.id } });
    throw new Error('Only verified educators can connect with student accounts.');
  }

  await prisma.socialFollow.update({
    where: { id: request.id },
    data: { status: 'active', acceptedAt: new Date() },
  });
  await createSocialNotification({
    recipientId: request.followerId,
    actorId: viewer.user.id,
    type: 'follow_accepted',
    title: `${viewer.user.displayName} accepted your follow request`,
    href: `/u/${viewer.user.handle}`,
  });
}

export async function declineFollowRequest(
  viewer: SocialViewerRecord,
  requestId: string,
): Promise<void> {
  await prisma.socialFollow.deleteMany({
    where: { id: requestId, followingId: viewer.user.id, status: 'pending' },
  });
}

export async function cancelFollowRequest(
  viewer: SocialViewerRecord,
  targetId: string,
): Promise<void> {
  await prisma.socialFollow.deleteMany({
    where: { followerId: viewer.user.id, followingId: targetId, status: 'pending' },
  });
}

export async function cancelFollowRequestById(
  viewer: SocialViewerRecord,
  requestId: string,
): Promise<void> {
  await prisma.socialFollow.deleteMany({
    where: { id: requestId, followerId: viewer.user.id, status: 'pending' },
  });
}

export async function listFollowRequests(viewer: SocialViewerRecord): Promise<FollowRequestView[]> {
  const [incoming, outgoing] = await Promise.all([
    prisma.socialFollow.findMany({
      where: { followingId: viewer.user.id, status: 'pending' },
      include: { follower: { include: personInclude } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.socialFollow.findMany({
      where: { followerId: viewer.user.id, status: 'pending' },
      include: { following: { include: personInclude } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const rows = [...incoming.map((row) => row.follower), ...outgoing.map((row) => row.following)];
  const context = await loadPersonContext(viewer, rows);

  return [
    ...incoming.map((row) => ({
      id: row.id,
      person: summaryFor(context, row.follower),
      createdAt: row.createdAt.toISOString(),
      direction: 'incoming' as const,
    })),
    ...outgoing.map((row) => ({
      id: row.id,
      person: summaryFor(context, row.following),
      createdAt: row.createdAt.toISOString(),
      direction: 'outgoing' as const,
    })),
  ].filter((request) => !request.person.isMinor || viewer.user.isMinor || request.person.id === viewer.user.id);
}

interface EdgeCursor {
  createdAt: string;
  id: string;
}

function edgeCursorWhere(cursor: EdgeCursor | null): Prisma.SocialFollowWhereInput {
  if (!cursor) return {};
  const date = new Date(cursor.createdAt);
  if (Number.isNaN(date.getTime())) return {};
  return {
    OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: cursor.id } }],
  };
}

export interface PeopleListResult {
  restricted: boolean;
  page: Page<PersonSummary>;
}

function emptyPage<T>(): Page<T> {
  return { items: [], nextCursor: null };
}

export async function listFollowers(
  viewer: SocialViewerRecord,
  handle: string,
  cursorInput?: string | null,
  limitInput?: number,
): Promise<PeopleListResult> {
  const target = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: personInclude,
  });
  if (!target || target.status !== 'active') return { restricted: true, page: emptyPage() };
  if (target.isMinor && !viewer.user.isMinor && !viewer.user.platformAdmin) {
    return { restricted: true, page: emptyPage() };
  }

  const [settings, following] = await Promise.all([
    prisma.discoverabilityPreference.findUnique({ where: { userId: target.id } }),
    prisma.socialFollow.findUnique({
      where: { followerId_followingId: { followerId: viewer.user.id, followingId: target.id } },
      select: { status: true },
    }),
  ]);

  const isSelf = target.id === viewer.user.id;
  const isAdmin = viewer.user.platformAdmin;
  if (!isSelf && !isAdmin) {
    if (settings?.showFollowers === false) return { restricted: true, page: emptyPage() };
    const allowed = canSeeNetwork({
      viewer: {
        id: viewer.user.id,
        isMinor: viewer.user.isMinor,
        privateProfile: viewer.user.privateProfile,
        status: viewer.user.status,
        teacherVerified: viewer.teacherVerified,
      },
      target: {
        id: target.id,
        isMinor: target.isMinor,
        privateProfile: target.privateProfile,
        status: target.status,
        teacherVerified: target.teacherVerification?.status === 'verified',
      },
      isFollowing: following?.status === 'active',
      blocked: false,
    });
    if (!allowed) return { restricted: true, page: emptyPage() };
  }

  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const cursor = decodeCursor<EdgeCursor>(cursorInput);
  const rows = await prisma.socialFollow.findMany({
    where: { followingId: target.id, status: 'active', ...edgeCursorWhere(cursor) },
    include: { follower: { include: personInclude } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const context = await loadPersonContext(viewer, rows.map((row) => row.follower));
  const visible = rows
    .map((row) => ({ row, person: summaryFor(context, row.follower) }))
    .filter(({ person }) => !person.isMinor || viewer.user.isMinor || person.id === viewer.user.id);
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];

  return {
    restricted: false,
    page: {
      items: page.map(({ person }) => person),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({ createdAt: last.row.createdAt.toISOString(), id: last.row.id })
          : null,
    },
  };
}

export async function listFollowing(
  viewer: SocialViewerRecord,
  handle: string,
  cursorInput?: string | null,
  limitInput?: number,
): Promise<PeopleListResult> {
  const target = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: personInclude,
  });
  if (!target || target.status !== 'active') return { restricted: true, page: emptyPage() };
  if (target.isMinor && !viewer.user.isMinor && !viewer.user.platformAdmin) {
    return { restricted: true, page: emptyPage() };
  }

  const [settings, following] = await Promise.all([
    prisma.discoverabilityPreference.findUnique({ where: { userId: target.id } }),
    prisma.socialFollow.findUnique({
      where: { followerId_followingId: { followerId: viewer.user.id, followingId: target.id } },
      select: { status: true },
    }),
  ]);
  const isSelf = target.id === viewer.user.id;
  const isAdmin = viewer.user.platformAdmin;
  if (!isSelf && !isAdmin) {
    if (settings?.showFollowing === false) return { restricted: true, page: emptyPage() };
    const allowed = canSeeNetwork({
      viewer: {
        id: viewer.user.id,
        isMinor: viewer.user.isMinor,
        privateProfile: viewer.user.privateProfile,
        status: viewer.user.status,
        teacherVerified: viewer.teacherVerified,
      },
      target: {
        id: target.id,
        isMinor: target.isMinor,
        privateProfile: target.privateProfile,
        status: target.status,
        teacherVerified: target.teacherVerification?.status === 'verified',
      },
      isFollowing: following?.status === 'active',
      blocked: false,
    });
    if (!allowed) return { restricted: true, page: emptyPage() };
  }

  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const cursor = decodeCursor<EdgeCursor>(cursorInput);
  const rows = await prisma.socialFollow.findMany({
    where: { followerId: target.id, status: 'active', ...edgeCursorWhere(cursor) },
    include: { following: { include: personInclude } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const context = await loadPersonContext(viewer, rows.map((row) => row.following));
  const visible = rows
    .map((row) => ({ row, person: summaryFor(context, row.following) }))
    .filter(({ person }) => !person.isMinor || viewer.user.isMinor || person.id === viewer.user.id);
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];

  return {
    restricted: false,
    page: {
      items: page.map(({ person }) => person),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({ createdAt: last.row.createdAt.toISOString(), id: last.row.id })
          : null,
    },
  };
}

export async function listMutuals(
  viewer: SocialViewerRecord,
  handle: string,
  limitInput?: number,
): Promise<PeopleListResult> {
  const target = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: personInclude,
  });
  if (!target || target.status !== 'active') return { restricted: true, page: emptyPage() };
  if (target.isMinor && !viewer.user.isMinor && !viewer.user.platformAdmin) {
    return { restricted: true, page: emptyPage() };
  }
  if (target.id === viewer.user.id) {
    return { restricted: true, page: emptyPage() };
  }

  const following = await prisma.socialFollow.findUnique({
    where: { followerId_followingId: { followerId: viewer.user.id, followingId: target.id } },
    select: { status: true },
  });
  const allowed = canSeeNetwork({
    viewer: {
      id: viewer.user.id,
      isMinor: viewer.user.isMinor,
      privateProfile: viewer.user.privateProfile,
      status: viewer.user.status,
      teacherVerified: viewer.teacherVerified,
    },
    target: {
      id: target.id,
      isMinor: target.isMinor,
      privateProfile: target.privateProfile,
      status: target.status,
      teacherVerified: target.teacherVerification?.status === 'verified',
    },
    isFollowing: following?.status === 'active',
    blocked: false,
  });
  if (!allowed) return { restricted: true, page: emptyPage() };

  const viewerFollowing = await prisma.socialFollow.findMany({
    where: { followerId: viewer.user.id, status: 'active' },
    select: { followingId: true },
    take: 500,
  });
  const ids = viewerFollowing.map((row) => row.followingId);
  if (ids.length === 0) return { restricted: false, page: emptyPage() };

  const rows = await prisma.socialFollow.findMany({
    where: {
      followingId: target.id,
      followerId: { in: ids },
      status: 'active',
    },
    include: { follower: { include: personInclude } },
    take: clampLimit(limitInput ? String(limitInput) : null, 20, 50),
  });

  const context = await loadPersonContext(viewer, rows.map((row) => row.follower));
  return {
    restricted: false,
    page: {
      items: rows
        .map((row) => summaryFor(context, row.follower))
        .filter((person) => !person.isMinor || viewer.user.isMinor || person.id === viewer.user.id),
      nextCursor: null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Blocks and mutes                                                           */
/* -------------------------------------------------------------------------- */

export async function blockUser(viewer: SocialViewerRecord, targetId: string): Promise<void> {
  if (targetId === viewer.user.id) throw new Error('You cannot block yourself.');
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw new Error('That account is not available.');

  await prisma.$transaction([
    prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: viewer.user.id, blockedId: targetId } },
      create: { blockerId: viewer.user.id, blockedId: targetId },
      update: {},
    }),
    prisma.socialFollow.deleteMany({
      where: {
        OR: [
          { followerId: viewer.user.id, followingId: targetId },
          { followerId: targetId, followingId: viewer.user.id },
        ],
      },
    }),
    prisma.userMute.deleteMany({
      where: {
        OR: [
          { muterId: viewer.user.id, mutedId: targetId },
          { muterId: targetId, mutedId: viewer.user.id },
        ],
      },
    }),
  ]);
  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.block.created',
    subjectType: 'user',
    subjectId: targetId,
  });
}

export async function unblockUser(viewer: SocialViewerRecord, targetId: string): Promise<void> {
  await prisma.userBlock.deleteMany({
    where: { blockerId: viewer.user.id, blockedId: targetId },
  });
  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.block.removed',
    subjectType: 'user',
    subjectId: targetId,
  });
}

export async function muteUser(viewer: SocialViewerRecord, targetId: string): Promise<void> {
  if (targetId === viewer.user.id) throw new Error('You cannot mute yourself.');
  await prisma.userMute.upsert({
    where: { muterId_mutedId: { muterId: viewer.user.id, mutedId: targetId } },
    create: { muterId: viewer.user.id, mutedId: targetId },
    update: {},
  });
}

export async function unmuteUser(viewer: SocialViewerRecord, targetId: string): Promise<void> {
  await prisma.userMute.deleteMany({
    where: { muterId: viewer.user.id, mutedId: targetId },
  });
}

export async function listBlocked(viewer: SocialViewerRecord): Promise<PersonSummary[]> {
  const rows = await prisma.userBlock.findMany({
    where: { blockerId: viewer.user.id },
    include: { blocked: { include: personInclude } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const context = await loadPersonContext(viewer, rows.map((row) => row.blocked));
  return rows.map((row) => summaryFor(context, row.blocked));
}

export async function listMuted(viewer: SocialViewerRecord): Promise<PersonSummary[]> {
  const rows = await prisma.userMute.findMany({
    where: { muterId: viewer.user.id },
    include: { muted: { include: personInclude } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const context = await loadPersonContext(viewer, rows.map((row) => row.muted));
  return rows.map((row) => summaryFor(context, row.muted));
}
