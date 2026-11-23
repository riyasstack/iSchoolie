import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  EDUCATION_STAGE_LABEL,
  type EducationStageValue,
} from '@/lib/social/catalog';
import {
  isRecommendationEligible,
  recommendationReasonLabel,
  scoreRecommendation,
  type RecommendationReasonCode,
} from '@/lib/social/policy';
import type { Page, PersonSummary } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { recordAudit } from '@/lib/server/social/audit';
import { clampLimit, decodeCursor, encodeCursor } from '@/lib/server/social/pagination';
import { loadPersonContext, personInclude, summaryFor } from '@/lib/server/social/serialize';

export type RecommendationTab =
  | 'for-you'
  | 'educators'
  | 'peers'
  | 'researchers'
  | 'professionals'
  | 'connections';

const TABS: RecommendationTab[] = [
  'for-you',
  'educators',
  'peers',
  'researchers',
  'professionals',
  'connections',
];

export interface RecommendationFilters {
  tab?: RecommendationTab;
  subject?: string | null;
  stage?: EducationStageValue | null;
  region?: string | null;
  verifiedOnly?: boolean;
}

const candidateInclude = {
  ...personInclude,
  discoverability: true,
} satisfies Prisma.UserInclude;

type CandidateRow = Prisma.UserGetPayload<{ include: typeof candidateInclude }>;

function tabWhere(tab: RecommendationTab): Prisma.UserWhereInput {
  switch (tab) {
    case 'educators':
      return {
        OR: [
          { socialProfile: { is: { educationStage: 'teacher' } } },
          { teacherVerification: { is: { status: 'verified' } } },
        ],
      };
    case 'peers':
      return {
        socialProfile: { is: { educationStage: { in: ['school_student', 'college_student'] } } },
      };
    case 'researchers':
      return {
        OR: [
          { socialProfile: { is: { educationStage: 'education_professional' } } },
          { socialInterests: { some: { topic: { slug: 'research' } } } },
        ],
      };
    case 'professionals':
      return {
        socialProfile: {
          is: { educationStage: { in: ['education_professional', 'teacher'] } },
        },
      };
    default:
      return {};
  }
}

/**
 * Deterministic, permission-filtered people recommendations.
 *
 * Candidate selection happens in PostgreSQL with indexed filters; scoring is a
 * bounded in-process step over at most 300 eligible rows. Every reason attached
 * to a card comes from a signal that was actually computed.
 */
export async function getRecommendations(
  viewer: SocialViewerRecord,
  filters: RecommendationFilters = {},
  cursorInput?: string | null,
  limitInput?: number,
): Promise<Page<PersonSummary>> {
  const tab = TABS.includes(filters.tab ?? 'for-you') ? filters.tab ?? 'for-you' : 'for-you';
  const limit = clampLimit(limitInput ? String(limitInput) : null, 12, 30);
  const offset = decodeCursor<{ offset: number }>(cursorInput)?.offset ?? 0;

  const [blocks, dismissals, follows, viewerInterests, viewerTopicFollows, viewerFollowing] =
    await Promise.all([
      prisma.userBlock.findMany({
        where: {
          OR: [{ blockerId: viewer.user.id }, { blockedId: viewer.user.id }],
        },
        select: { blockerId: true, blockedId: true },
      }),
      prisma.recommendationDismissal.findMany({
        where: { userId: viewer.user.id },
        select: { targetUserId: true },
      }),
      prisma.socialFollow.findMany({
        where: { followerId: viewer.user.id },
        select: { followingId: true, status: true },
      }),
      prisma.userInterest.findMany({
        where: { userId: viewer.user.id },
        include: { topic: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.topicFollow.findMany({
        where: { userId: viewer.user.id },
        include: { topic: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.socialFollow.findMany({
        where: { followerId: viewer.user.id, status: 'active' },
        select: { followingId: true },
        take: 500,
      }),
    ]);

  const blockedIds = new Set<string>();
  for (const block of blocks) {
    blockedIds.add(block.blockerId === viewer.user.id ? block.blockedId : block.blockerId);
  }
  const dismissedIds = new Set(dismissals.map((row) => row.targetUserId));
  const followedStatus = new Map(follows.map((row) => [row.followingId, row.status]));

  let secondDegree: Set<string> | null = null;
  if (tab === 'connections') {
    const viewerFollowingIds = viewerFollowing.map((row) => row.followingId);
    if (viewerFollowingIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    const rows = await prisma.socialFollow.findMany({
      where: {
        followerId: { in: viewerFollowingIds },
        status: 'active',
      },
      select: { followingId: true },
      take: 1000,
    });
    secondDegree = new Set(rows.map((row) => row.followingId));
    if (secondDegree.size === 0) return { items: [], nextCursor: null };
  }

  const excludedIds = new Set<string>([
    viewer.user.id,
    ...blockedIds,
    ...dismissedIds,
    // Already following or awaiting a request: not a "new suggestion".
    ...[...followedStatus.keys()],
  ]);

  const where: Prisma.UserWhereInput = {
    status: 'active',
    id: {
      notIn: [...excludedIds],
      ...(secondDegree ? { in: [...secondDegree] } : {}),
    },
    privateProfile: false,
    socialProfile: { isNot: null },
    discoverability: { is: { discoverable: true, recommendable: true } },
    ...(viewer.user.isMinor
      ? {
          OR: [
            { isMinor: true, ...(filters.stage ? { socialProfile: { is: { educationStage: filters.stage } } } : {}) },
            { teacherVerification: { is: { status: 'verified' } } },
          ],
        }
      : { isMinor: false }),
    ...tabWhere(tab),
    ...(filters.subject
      ? { socialInterests: { some: { topic: { slug: filters.subject } } } }
      : {}),
    ...(filters.stage
      ? {
          AND: [
            { socialProfile: { is: { educationStage: filters.stage } } },
          ],
        }
      : {}),
    ...(filters.region
      ? { socialProfile: { is: { region: { contains: filters.region, mode: 'insensitive' } } } }
      : {}),
    ...(filters.verifiedOnly
      ? { teacherVerification: { is: { status: 'verified' } } }
      : {}),
  };

  const candidates = (await prisma.user.findMany({
    where,
    include: candidateInclude,
    orderBy: { createdAt: 'desc' },
    take: 300,
  })) as CandidateRow[];

  if (candidates.length === 0) return { items: [], nextCursor: null };

  const candidateIds = candidates.map((row) => row.id);
  const viewerFollowingIds = viewerFollowing.map((row) => row.followingId);
  const [mutualGroups, recentPostGroups] = await Promise.all([
    viewerFollowingIds.length
      ? prisma.socialFollow.groupBy({
          by: ['followingId'],
          where: {
            followerId: { in: viewerFollowingIds },
            followingId: { in: candidateIds },
            status: 'active',
          },
          _count: { _all: true },
        })
      : [],
    prisma.socialPost.groupBy({
      by: ['authorId'],
      where: {
        authorId: { in: candidateIds },
        status: 'visible',
        replyToId: null,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 3_600_000) },
      },
      _count: { _all: true },
    }),
  ]);

  const mutualCounts = new Map(mutualGroups.map((group) => [group.followingId, group._count._all]));
  const recentPosts = new Map(recentPostGroups.map((group) => [group.authorId, group._count._all]));

  const viewerInterestIds = new Set(viewerInterests.map((row) => row.topicId));
  const viewerTopicIds = new Set(viewerTopicFollows.map((row) => row.topicId));
  const viewerInterestNames = new Map(viewerInterests.map((row) => [row.topicId, row.topic.name]));
  const viewerTopicNames = new Map(viewerTopicFollows.map((row) => [row.topicId, row.topic.name]));

  const scored = candidates
    .map((row) => {
      const eligibility = isRecommendationEligible({
        viewer: {
          id: viewer.user.id,
          isMinor: viewer.user.isMinor,
          privateProfile: viewer.user.privateProfile,
          status: viewer.user.status,
          teacherVerified: viewer.teacherVerified,
        },
        target: {
          id: row.id,
          isMinor: row.isMinor,
          privateProfile: row.privateProfile,
          status: row.status,
          teacherVerified: row.teacherVerification?.status === 'verified',
        },
        blocked: blockedIds.has(row.id),
        dismissed: dismissedIds.has(row.id),
        followingStatus: followedStatus.get(row.id) ?? null,
        discoverable: row.discoverability?.discoverable ?? true,
        recommendable: row.discoverability?.recommendable ?? true,
      });
      if (!eligibility) return null;

      const sharedInterestIds = row.socialInterests
        .map((interest) => interest.topicId)
        .filter((topicId) => viewerInterestIds.has(topicId));
      const sharedTopicIds = row.socialInterests
        .map((interest) => interest.topicId)
        .filter((topicId) => viewerTopicIds.has(topicId));

      const result = scoreRecommendation({
        sharedInterestCount: sharedInterestIds.length,
        sharedTopicCount: sharedTopicIds.length,
        mutualCount: mutualCounts.get(row.id) ?? 0,
        recentPostCount: recentPosts.get(row.id) ?? 0,
        teacherVerified: row.teacherVerification?.status === 'verified',
        sameStage:
          Boolean(row.socialProfile?.educationStage) &&
          row.socialProfile?.educationStage === viewer.educationStage,
      });

      const primaryReason = result.reasons[0] as RecommendationReasonCode;
      const reason = recommendationReasonLabel(primaryReason, {
        interest: sharedInterestIds[0] ? viewerInterestNames.get(sharedInterestIds[0]) : undefined,
        topic: sharedTopicIds[0] ? viewerTopicNames.get(sharedTopicIds[0]) : undefined,
        mutualCount: mutualCounts.get(row.id),
        stage: row.socialProfile?.educationStage
          ? EDUCATION_STAGE_LABEL[row.socialProfile.educationStage as EducationStageValue]
          : undefined,
      });

      return { row, score: result.score, reason };
    })
    .filter((entry): entry is { row: CandidateRow; score: number; reason: string } => Boolean(entry))
    .sort((a, b) => {
      const delta = b.score - a.score;
      if (delta !== 0) return delta;
      return b.row.createdAt.getTime() - a.row.createdAt.getTime();
    });

  const window = scored.slice(offset, offset + limit + 1);
  const page = window.slice(0, limit);
  const context = await loadPersonContext(viewer, page.map((entry) => entry.row));

  return {
    items: page.map((entry) => summaryFor(context, entry.row, { reason: entry.reason })),
    nextCursor: window.length > limit ? encodeCursor({ offset: offset + limit }) : null,
  };
}

export async function dismissRecommendation(
  viewer: SocialViewerRecord,
  targetUserId: string,
): Promise<void> {
  if (targetUserId === viewer.user.id) throw new Error('You cannot dismiss yourself.');
  await prisma.recommendationDismissal.upsert({
    where: {
      userId_targetUserId: { userId: viewer.user.id, targetUserId },
    },
    create: { userId: viewer.user.id, targetUserId },
    update: {},
  });
}

const FEEDBACK_SIGNALS = new Set([
  'not_relevant',
  'already_know',
  'different_subject',
  'following_soon',
]);

export async function submitRecommendationFeedback(
  viewer: SocialViewerRecord,
  targetUserId: string,
  signal: string,
): Promise<void> {
  if (!FEEDBACK_SIGNALS.has(signal)) throw new Error('Unknown feedback signal.');
  await prisma.recommendationFeedback.create({
    data: { userId: viewer.user.id, targetUserId, signal },
  });
  if (signal === 'not_relevant' || signal === 'different_subject') {
    await dismissRecommendation(viewer, targetUserId);
  }
  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.recommendation.feedback',
    subjectType: 'user',
    subjectId: targetUserId,
    detail: signal,
  });
}

/** Small sidebar/home module; same service, never a separate mock list. */
export async function getQuickSuggestions(
  viewer: SocialViewerRecord,
  limit = 3,
): Promise<PersonSummary[]> {
  const page = await getRecommendations(viewer, { tab: 'for-you' }, null, limit);
  return page.items;
}
