import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import {
  EDUCATION_STAGE_LABEL,
  type EducationStageValue,
} from '@/lib/social/catalog';
import {
  canSeeNetwork,
  canViewProfile,
  resolveFollowMode,
  type PolicyActor,
} from '@/lib/social/policy';
import type { EducationRoleLabel, FollowState, PersonSummary } from '@/lib/social/types';

export const personInclude = Prisma.validator<Prisma.UserInclude>()({
  socialProfile: true,
  teacherVerification: { select: { status: true } },
  socialInterests: {
    select: {
      topicId: true,
      topic: { select: { id: true, name: true, slug: true } },
    },
    take: 12,
  },
});

export type PersonRow = Prisma.UserGetPayload<{ include: typeof personInclude }>;

export interface PersonContext {
  viewerId: string;
  viewerActor: PolicyActor;
  viewerIsAdmin: boolean;
  outgoing: Map<string, { status: 'active' | 'pending' }>;
  incoming: Map<string, { status: 'active' | 'pending' }>;
  blocked: Set<string>;
  counts: Map<string, { followers: number; following: number; posts: number }>;
  mutualCounts: Map<string, number>;
  mutualNames: Map<string, string[]>;
}

export function roleLabelFor(row: PersonRow): EducationRoleLabel {
  const stage = row.socialProfile?.educationStage;
  if (stage === 'teacher') return 'Educator';
  if (stage === 'education_professional') return 'Education professional';
  if (stage === 'parent') return 'Parent or guardian';
  if (stage === 'school_student' || stage === 'college_student') return 'Student';
  if (stage === 'lifelong_learner') return 'Learner';
  if (row.selectedRoles.includes('teacher')) return 'Educator';
  if (row.selectedRoles.includes('student_school') || row.selectedRoles.includes('student_college')) {
    return 'Student';
  }
  if (row.selectedRoles.includes('parent')) return 'Parent or guardian';
  return 'Learner';
}

export function stageLabelFor(row: PersonRow): string | null {
  const stage = row.socialProfile?.educationStage as EducationStageValue | undefined;
  return stage ? EDUCATION_STAGE_LABEL[stage] ?? null : null;
}

export async function loadPersonContext(
  viewer: SocialViewerRecord,
  rows: PersonRow[],
): Promise<PersonContext> {
  const ids = [...new Set(rows.map((row) => row.id))];
  const viewerActor: PolicyActor = {
    id: viewer.user.id,
    isMinor: viewer.user.isMinor,
    privateProfile: viewer.user.privateProfile,
    status: viewer.user.status,
    teacherVerified: viewer.teacherVerified,
  };

  if (ids.length === 0) {
    return {
      viewerId: viewer.user.id,
      viewerActor,
      viewerIsAdmin: viewer.user.platformAdmin,
      outgoing: new Map(),
      incoming: new Map(),
      blocked: new Set(),
      counts: new Map(),
      mutualCounts: new Map(),
      mutualNames: new Map(),
    };
  }

  const [edges, blocks, followerGroups, followingGroups, postGroups, viewerFollowing] = await Promise.all([
    prisma.socialFollow.findMany({
      where: {
        OR: [
          { followerId: viewer.user.id, followingId: { in: ids } },
          { followingId: viewer.user.id, followerId: { in: ids } },
        ],
      },
      select: { followerId: true, followingId: true, status: true },
    }),
    prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: viewer.user.id, blockedId: { in: ids } },
          { blockedId: viewer.user.id, blockerId: { in: ids } },
        ],
      },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.socialFollow.groupBy({
      by: ['followingId'],
      where: { followingId: { in: ids }, status: 'active' },
      _count: { _all: true },
    }),
    prisma.socialFollow.groupBy({
      by: ['followerId'],
      where: { followerId: { in: ids }, status: 'active' },
      _count: { _all: true },
    }),
    prisma.socialPost.groupBy({
      by: ['authorId'],
      where: { authorId: { in: ids }, status: 'visible', replyToId: null },
      _count: { _all: true },
    }),
    prisma.socialFollow.findMany({
      where: { followerId: viewer.user.id, status: 'active' },
      select: { followingId: true },
    }),
  ]);

  const outgoing = new Map<string, { status: 'active' | 'pending' }>();
  const incoming = new Map<string, { status: 'active' | 'pending' }>();
  for (const edge of edges) {
    if (edge.followerId === viewer.user.id) outgoing.set(edge.followingId, { status: edge.status });
    if (edge.followingId === viewer.user.id) incoming.set(edge.followerId, { status: edge.status });
  }

  const blocked = new Set<string>();
  for (const block of blocks) {
    blocked.add(block.blockerId === viewer.user.id ? block.blockedId : block.blockerId);
  }

  const counts = new Map<string, { followers: number; following: number; posts: number }>();
  for (const id of ids) counts.set(id, { followers: 0, following: 0, posts: 0 });
  for (const group of followerGroups) {
    const entry = counts.get(group.followingId);
    if (entry) entry.followers = group._count._all;
  }
  for (const group of followingGroups) {
    const entry = counts.get(group.followerId);
    if (entry) entry.following = group._count._all;
  }
  for (const group of postGroups) {
    const entry = counts.get(group.authorId);
    if (entry) entry.posts = group._count._all;
  }

  const viewerFollowingIds = viewerFollowing.map((edge) => edge.followingId);
  const mutualEdges =
    viewerFollowingIds.length === 0
      ? []
      : await prisma.socialFollow.findMany({
          where: {
            status: 'active',
            followingId: { in: ids },
            followerId: { in: viewerFollowingIds },
          },
          select: {
            followingId: true,
            follower: { select: { displayName: true, handle: true } },
          },
          take: 400,
        });

  const mutualCounts = new Map<string, number>();
  const mutualNames = new Map<string, string[]>();
  for (const edge of mutualEdges) {
    mutualCounts.set(edge.followingId, (mutualCounts.get(edge.followingId) ?? 0) + 1);
    const names = mutualNames.get(edge.followingId) ?? [];
    if (names.length < 3) names.push(edge.follower.displayName);
    mutualNames.set(edge.followingId, names);
  }

  return {
    viewerId: viewer.user.id,
    viewerActor,
    viewerIsAdmin: viewer.user.platformAdmin,
    outgoing,
    incoming,
    blocked,
    counts,
    mutualCounts,
    mutualNames,
  };
}

export function contextIsBlocked(ctx: PersonContext, id: string): boolean {
  return ctx.blocked.has(id);
}

export function followStateFor(ctx: PersonContext, row: PersonRow): FollowState {
  if (row.id === ctx.viewerId) return 'self';
  if (row.status !== 'active') return 'unavailable';
  if (ctx.blocked.has(row.id)) return 'blocked';
  const outgoing = ctx.outgoing.get(row.id);
  if (outgoing?.status === 'active') return 'following';
  if (outgoing?.status === 'pending') return 'pending';
  const incoming = ctx.incoming.get(row.id);
  if (incoming?.status === 'pending') return 'requested_by';
  return 'not_following';
}

export function summaryFor(
  ctx: PersonContext,
  row: PersonRow,
  extras?: { reason?: string | null },
): PersonSummary {
  const followState = followStateFor(ctx, row);
  const target = {
    id: row.id,
    isMinor: row.isMinor,
    privateProfile: row.privateProfile,
    status: row.status,
    teacherVerified: row.teacherVerification?.status === 'verified',
  };
  const mode =
    followState === 'self' || followState === 'following' || followState === 'pending'
      ? 'unavailable'
      : resolveFollowMode({
          viewer: ctx.viewerActor,
          target,
          blocked: ctx.blocked.has(row.id),
          existingStatus: ctx.outgoing.get(row.id)?.status ?? null,
        });
  const counts = ctx.counts.get(row.id) ?? { followers: 0, following: 0, posts: 0 };
  const viewerCanSee = canViewProfile({
    viewer: ctx.viewerActor,
    target,
    isFollowing: followState === 'following',
    blocked: ctx.blocked.has(row.id),
    isAdmin: ctx.viewerIsAdmin,
  });

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    photoUrl: row.photoUrl,
    headline: row.headline,
    // A private profile that the viewer cannot see reveals only identity-level
    // information, never the bio, education detail or interest graph.
    bio: viewerCanSee ? row.socialProfile?.bio ?? '' : '',
    educationStage: viewerCanSee
      ? ((row.socialProfile?.educationStage as EducationStageValue | null) ?? null)
      : null,
    stageLabel: viewerCanSee ? stageLabelFor(row) : null,
    roleLabel: roleLabelFor(row),
    teacherVerified: row.teacherVerification?.status === 'verified',
    isMinor: row.isMinor,
    isPrivate: row.privateProfile,
    region: viewerCanSee ? row.socialProfile?.region ?? null : null,
    website: viewerCanSee ? row.socialProfile?.website ?? null : null,
    interests: viewerCanSee ? row.socialInterests.map((interest) => interest.topic.name) : [],
    skills: viewerCanSee ? row.socialProfile?.skills ?? [] : [],
    professionalFocus: viewerCanSee ? row.socialProfile?.professionalFocus ?? [] : [],
    followerCount: counts.followers,
    followingCount: counts.following,
    postCount: counts.posts,
    followState,
    canFollow: mode === 'follow' || mode === 'request',
    mutualCount: ctx.mutualCounts.get(row.id) ?? 0,
    mutualNames: ctx.mutualNames.get(row.id) ?? [],
    reason: extras?.reason ?? null,
  };
}

export function canViewPersonContent(ctx: PersonContext, row: PersonRow): boolean {
  return canSeeNetwork({
    viewer: ctx.viewerActor,
    target: {
      id: row.id,
      isMinor: row.isMinor,
      privateProfile: row.privateProfile,
      status: row.status,
      teacherVerified: row.teacherVerification?.status === 'verified',
    },
    isFollowing: ctx.outgoing.get(row.id)?.status === 'active',
    blocked: ctx.blocked.has(row.id),
    isAdmin: ctx.viewerIsAdmin,
  });
}

export const personSelectForList = personInclude;
