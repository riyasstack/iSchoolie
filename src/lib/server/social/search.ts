import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Page, PersonSummary, PostView, TopicSummary } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { clampLimit, decodeCursor, encodeCursor } from '@/lib/server/social/pagination';
import { loadPersonContext, personInclude, summaryFor } from '@/lib/server/social/serialize';
import { getFeed } from '@/lib/server/social/posts';

/** People search. Discoverability and block policy are applied before the query. */
export async function searchPeople(
  viewer: SocialViewerRecord,
  query: string,
  options?: { cursor?: string | null; limit?: number },
): Promise<Page<PersonSummary>> {
  const term = query.trim().slice(0, 80);
  if (term.length < 1) return { items: [], nextCursor: null };
  const limit = clampLimit(options?.limit ? String(options.limit) : null, 20, 40);
  const offset = decodeCursor<{ offset: number }>(options?.cursor)?.offset ?? 0;

  const [blocks, follows, dismissals] = await Promise.all([
    prisma.userBlock.findMany({
      where: { OR: [{ blockerId: viewer.user.id }, { blockedId: viewer.user.id }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.socialFollow.findMany({
      where: { followerId: viewer.user.id },
      select: { followingId: true, status: true },
    }),
    prisma.recommendationDismissal.findMany({
      where: { userId: viewer.user.id },
      select: { targetUserId: true },
    }),
  ]);

  const blockedIds = blocks.map((block) =>
    block.blockerId === viewer.user.id ? block.blockedId : block.blockerId,
  );
  const followed = new Map(follows.map((row) => [row.followingId, row.status]));
  void dismissals;

  const where: Prisma.UserWhereInput = {
    status: 'active',
    id: { notIn: blockedIds },
    ...(viewer.user.isMinor
      ? {
          OR: [
            { isMinor: true },
            { teacherVerification: { is: { status: 'verified' } } },
            { id: viewer.user.id },
          ],
        }
      : { isMinor: false }),
    AND: [
      {
        OR: [
          { displayName: { contains: term, mode: 'insensitive' } },
          { handle: { contains: term.toLowerCase().replace(/^@/, ''), mode: 'insensitive' } },
          { headline: { contains: term, mode: 'insensitive' } },
          { socialProfile: { is: { bio: { contains: term, mode: 'insensitive' } } } },
        ],
      },
    ],
    discoverability: { is: { discoverable: true } },
  };

  const rows = await prisma.user.findMany({
    where,
    include: personInclude,
    orderBy: [{ isMinor: 'asc' }, { displayName: 'asc' }],
    skip: offset,
    take: limit + 1,
  });

  const page = rows.slice(0, limit);
  const context = await loadPersonContext(viewer, page);
  void followed;

  return {
    items: page.map((row) => summaryFor(context, row)),
    nextCursor: rows.length > limit ? encodeCursor({ offset: offset + limit }) : null,
  };
}

export interface SearchResults {
  people: PersonSummary[];
  posts: PostView[];
  topics: TopicSummary[];
}

export async function searchTopics(query: string, viewer: SocialViewerRecord): Promise<TopicSummary[]> {
  const term = query.trim().slice(0, 60);
  if (!term) return [];
  const [topics, follows] = await Promise.all([
    prisma.topic.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { followerCount: 'desc' },
    }),
    prisma.topicFollow.findMany({
      where: { userId: viewer.user.id },
      select: { topicId: true },
    }),
  ]);
  const followed = new Set(follows.map((row) => row.topicId));
  return topics.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    name: topic.name,
    category: topic.category,
    followerCount: topic.followerCount,
    postCount: topic.postCount,
    following: followed.has(topic.id),
  }));
}

export async function searchContent(
  viewer: SocialViewerRecord,
  query: string,
  type: 'top' | 'latest' | 'people' | 'media' | 'topics' = 'top',
): Promise<SearchResults> {
  const term = query.trim().slice(0, 80);
  if (!term) return { people: [], posts: [], topics: [] };

  const [people, topics] = await Promise.all([
    type === 'people' || type === 'top' ? searchPeople(viewer, term, { limit: 8 }) : Promise.resolve({ items: [] }),
    type === 'topics' || type === 'top' ? searchTopics(term, viewer) : Promise.resolve([]),
  ]);

  let posts: PostView[] = [];
  if (type !== 'people' && type !== 'topics') {
    // Reuse the explore feed's visibility and ranking logic, then filter by the
    // term. The candidate window is bounded, which is appropriate until a
    // PostgreSQL full-text index is added.
    const page = await getFeed(viewer, 'explore', { limit: 50 });
    const needle = term.replace(/^#/, '').toLowerCase();
    posts = page.items
      .map((item) => item.post)
      .filter(
        (post) =>
          post.body.toLowerCase().includes(needle) ||
          post.hashtags.some((tag) => tag.toLowerCase().includes(needle)),
      )
      .slice(0, 20);
    if (type === 'media') posts = posts.filter((post) => post.media.length > 0);
    if (type === 'latest') {
      posts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  return { people: people.items, posts, topics };
}
