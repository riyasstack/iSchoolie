import 'server-only';
import { Prisma, type SocialPost } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { POST_MAX_LENGTH, POST_MAX_MEDIA } from '@/lib/social/catalog';
import { canViewPost, parseHashtags, parseMentions } from '@/lib/social/policy';
import type { FeedItem, Page, PostView } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { createSocialNotification } from '@/lib/server/social/notifications';
import { clampLimit, decodeCursor, encodeCursor, postCursorWhere } from '@/lib/server/social/pagination';

const authorSelect = {
  id: true,
  handle: true,
  displayName: true,
  photoUrl: true,
  isMinor: true,
  privateProfile: true,
  status: true,
  teacherVerification: { select: { status: true } },
} satisfies Prisma.UserSelect;

const quoteInclude = {
  author: { select: authorSelect },
  media: { orderBy: { position: 'asc' }, include: { asset: true } },
  topics: { include: { topic: { select: { id: true, slug: true, name: true } } } },
  hashtags: true,
} satisfies Prisma.SocialPostInclude;

const postInclude = {
  ...quoteInclude,
  quoteOf: { include: quoteInclude },
} satisfies Prisma.SocialPostInclude;

type PostRow = Prisma.SocialPostGetPayload<{ include: typeof postInclude }>;
type QuoteRow = Prisma.SocialPostGetPayload<{ include: typeof quoteInclude }>;

interface PostViewerState {
  viewerId: string;
  viewerIsMinor: boolean;
  isAdmin: boolean;
  following: Set<string>;
  liked: Set<string>;
  reposted: Set<string>;
  bookmarked: Set<string>;
}

function authorActor(row: PostRow | QuoteRow) {
  return {
    id: row.author.id,
    isMinor: row.author.isMinor,
    privateProfile: row.author.privateProfile,
    status: row.author.status,
    teacherVerified: row.author.teacherVerification?.status === 'verified',
  };
}

function mapBase(row: PostRow | QuoteRow, state: PostViewerState, quote: PostView | null): PostView {
  const isFollowing = state.following.has(row.author.id);
  const viewerCanSee = canViewPost({
    viewer: {
      id: state.viewerId,
      isMinor: state.viewerIsMinor,
      privateProfile: false,
      status: 'active',
      teacherVerified: false,
    },
    author: authorActor(row),
    audience: row.audience,
    isFollowing,
  });

  return {
    id: row.id,
    body: row.body,
    audience: row.audience,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    author: {
      id: row.author.id,
      handle: row.author.handle,
      displayName: row.author.displayName,
      photoUrl: row.author.photoUrl,
      teacherVerified: row.author.teacherVerification?.status === 'verified',
    },
    media: row.media.map((item) => ({
      id: item.asset.id,
      kind: item.asset.kind,
      url: `/api/social/media/${item.asset.id}`,
      altText: item.asset.altText,
      mimeType: item.asset.mimeType,
    })),
    topics: row.topics.map((item) => ({
      id: item.topic.id,
      slug: item.topic.slug,
      name: item.topic.name,
    })),
    hashtags: row.hashtags.map((tag) => tag.tag),
    replyToId: row.replyToId,
    rootId: row.rootId,
    quote,
    counts: {
      likes: row.likeCount,
      replies: row.replyCount,
      reposts: row.repostCount,
      quotes: row.quoteCount,
      bookmarks: 0,
    },
    viewer: {
      liked: state.liked.has(row.id),
      reposted: state.reposted.has(row.id),
      bookmarked: state.bookmarked.has(row.id),
      followsAuthor: isFollowing,
      canDelete: row.author.id === state.viewerId,
      canEdit: row.author.id === state.viewerId,
      canReply: viewerCanSee && row.status === 'visible',
    },
  };
}

function mapQuote(row: QuoteRow, state: PostViewerState): PostView | null {
  const visible = canViewPost({
    viewer: {
      id: state.viewerId,
      isMinor: state.viewerIsMinor,
      privateProfile: false,
      status: 'active',
      teacherVerified: false,
    },
    author: authorActor(row),
    audience: row.audience,
    isFollowing: state.following.has(row.author.id),
  });
  if (!visible) return null;
  return mapBase(row, state, null);
}

function mapPost(row: PostRow, state: PostViewerState): PostView {
  const quote = row.quoteOf ? mapQuote(row.quoteOf, state) : null;
  return mapBase(row, state, quote);
}

async function loadViewerState(
  viewer: SocialViewerRecord,
  rows: Array<PostRow | QuoteRow>,
): Promise<PostViewerState> {
  const postIds: string[] = [];
  const authorIds = new Set<string>();
  for (const row of rows) {
    postIds.push(row.id);
    authorIds.add(row.author.id);
    if ('quoteOf' in row && row.quoteOf) {
      postIds.push(row.quoteOf.id);
      authorIds.add(row.quoteOf.author.id);
    }
  }

  const [reactions, reposts, bookmarks, follows] = await Promise.all([
    postIds.length
      ? prisma.socialReaction.findMany({
          where: { userId: viewer.user.id, postId: { in: postIds } },
          select: { postId: true },
        })
      : [],
    postIds.length
      ? prisma.socialRepost.findMany({
          where: { userId: viewer.user.id, postId: { in: postIds } },
          select: { postId: true },
        })
      : [],
    postIds.length
      ? prisma.socialBookmark.findMany({
          where: { userId: viewer.user.id, postId: { in: postIds } },
          select: { postId: true },
        })
      : [],
    authorIds.size
      ? prisma.socialFollow.findMany({
          where: {
            followerId: viewer.user.id,
            followingId: { in: [...authorIds] },
            status: 'active',
          },
          select: { followingId: true },
        })
      : [],
  ]);

  return {
    viewerId: viewer.user.id,
    viewerIsMinor: viewer.user.isMinor,
    isAdmin: viewer.user.platformAdmin,
    following: new Set(follows.map((row) => row.followingId)),
    liked: new Set(reactions.map((row) => row.postId)),
    reposted: new Set(reposts.map((row) => row.postId)),
    bookmarked: new Set(bookmarks.map((row) => row.postId)),
  };
}

function visibleToViewer(row: PostRow | QuoteRow, state: PostViewerState): boolean {
  return canViewPost({
    viewer: {
      id: state.viewerId,
      isMinor: state.viewerIsMinor,
      privateProfile: false,
      status: 'active',
      teacherVerified: false,
    },
    author: authorActor(row),
    audience: row.audience,
    isFollowing: state.following.has(row.author.id),
  });
}

async function excludedUserIds(viewerId: string): Promise<string[]> {
  const [blocks, mutes] = await Promise.all([
    prisma.userBlock.findMany({
      where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.userMute.findMany({ where: { muterId: viewerId }, select: { mutedId: true } }),
  ]);
  const ids = new Set<string>();
  for (const block of blocks) ids.add(block.blockerId === viewerId ? block.blockedId : block.blockerId);
  for (const mute of mutes) ids.add(mute.mutedId);
  return [...ids];
}

async function followingIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.socialFollow.findMany({
    where: { followerId: viewerId, status: 'active' },
    select: { followingId: true },
  });
  return rows.map((row) => row.followingId);
}

function feedItem(post: PostView, repostedBy: FeedItem['repostedBy'], repostedAt: string | null): FeedItem {
  return {
    key: repostedBy ? `repost:${repostedBy.id}:${post.id}` : `post:${post.id}`,
    kind: repostedBy ? 'repost' : 'post',
    post,
    repostedBy,
    repostedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Feeds                                                                      */
/* -------------------------------------------------------------------------- */

export type FeedKind = 'following' | 'for-you' | 'explore';

export async function getFeed(
  viewer: SocialViewerRecord,
  kind: FeedKind,
  options?: { cursor?: string | null; limit?: number; topicSlug?: string },
): Promise<Page<FeedItem>> {
  if (kind === 'following') return getFollowingFeed(viewer, options);
  return getDiscoveryFeed(viewer, kind, options);
}

async function getFollowingFeed(
  viewer: SocialViewerRecord,
  options?: { cursor?: string | null; limit?: number },
): Promise<Page<FeedItem>> {
  const limit = clampLimit(options?.limit ? String(options.limit) : null, 20, 50);
  const cursor = decodeCursor<{ at: string; key: string }>(options?.cursor);
  const cursorDate = cursor ? new Date(cursor.at) : null;
  const following = await followingIds(viewer.user.id);
  const authors = [...following, viewer.user.id];
  const excluded = await excludedUserIds(viewer.user.id);

  const postWhere: Prisma.SocialPostWhereInput = {
    authorId: { in: authors, notIn: excluded },
    status: 'visible',
    replyToId: null,
    OR: [{ audience: { in: ['public', 'followers'] } }, { authorId: viewer.user.id }],
    ...(viewer.user.isMinor ? {} : { author: { isMinor: false } }),
    ...(cursor && cursorDate && !Number.isNaN(cursorDate.getTime())
      ? { createdAt: { lt: cursorDate } }
      : {}),
  };

  const [posts, reposts] = await Promise.all([
    prisma.socialPost.findMany({
      where: postWhere,
      include: postInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    }),
    following.length
      ? prisma.socialRepost.findMany({
          where: {
            userId: { in: following, notIn: excluded },
            post: {
              status: 'visible',
              replyToId: null,
              audience: { in: ['public', 'followers'] },
              authorId: { notIn: excluded },
              author: { status: 'active', ...(viewer.user.isMinor ? {} : { isMinor: false }) },
            },
            ...(cursor && cursorDate && !Number.isNaN(cursorDate.getTime())
              ? { createdAt: { lt: cursorDate } }
              : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                handle: true,
                displayName: true,
                photoUrl: true,
                teacherVerification: { select: { status: true } },
              },
            },
            post: { include: postInclude },
          },
          orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
          take: limit + 1,
        })
      : [],
  ]);

  const state = await loadViewerState(viewer, [
    ...posts,
    ...reposts.map((row) => row.post),
  ]);

  const entries: Array<{ at: Date; item: FeedItem }> = [];
  for (const row of posts) {
    if (!visibleToViewer(row, state)) continue;
    const view = mapPost(row, state);
    entries.push({ at: row.createdAt, item: feedItem(view, null, null) });
  }
  for (const row of reposts) {
    if (!visibleToViewer(row.post, state)) continue;
    const view = mapPost(row.post, state);
    entries.push({
      at: row.createdAt,
      item: feedItem(
        view,
        {
          id: row.user.id,
          handle: row.user.handle,
          displayName: row.user.displayName,
          photoUrl: row.user.photoUrl,
          teacherVerified: row.user.teacherVerification?.status === 'verified',
        },
        row.createdAt.toISOString(),
      ),
    });
  }

  entries.sort((a, b) => {
    const delta = b.at.getTime() - a.at.getTime();
    return delta !== 0 ? delta : b.item.key.localeCompare(a.item.key);
  });

  const seen = new Set<string>();
  const page: FeedItem[] = [];
  for (const entry of entries) {
    const dedupeKey = entry.item.kind === 'post' ? entry.item.post.id : entry.item.key;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    page.push(entry.item);
    if (page.length === limit + 1) break;
  }

  const items = page.slice(0, limit);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor:
      page.length > limit && last
        ? encodeCursor({
            at: last.repostedAt ?? last.post.createdAt,
            key: last.key,
          })
        : null,
  };
}

function rankPost(
  row: PostRow,
  interestTopicIds: Set<string>,
  followedTopicIds: Set<string>,
  now: number,
): number {
  let score = 0;
  for (const topic of row.topics) {
    if (interestTopicIds.has(topic.topicId)) score += 8;
    if (followedTopicIds.has(topic.topicId)) score += 5;
  }
  const ageHours = Math.max(0, (now - row.createdAt.getTime()) / 3_600_000);
  const engagement = row.likeCount + 2 * row.replyCount + 2 * row.repostCount + 3 * row.quoteCount;
  score += Math.min(engagement, 200) * 0.35;
  score -= Math.min(ageHours, 24 * 30) * 0.12;
  return score;
}

async function getDiscoveryFeed(
  viewer: SocialViewerRecord,
  kind: 'for-you' | 'explore',
  options?: { cursor?: string | null; limit?: number; topicSlug?: string },
): Promise<Page<FeedItem>> {
  const limit = clampLimit(options?.limit ? String(options.limit) : null, 20, 50);
  const offset = decodeCursor<{ offset: number }>(options?.cursor)?.offset ?? 0;
  const excluded = await excludedUserIds(viewer.user.id);

  const [interests, topicFollows, candidateCount] = await Promise.all([
    prisma.userInterest.findMany({ where: { userId: viewer.user.id }, select: { topicId: true } }),
    prisma.topicFollow.findMany({ where: { userId: viewer.user.id }, select: { topicId: true } }),
    prisma.socialPost.count({
      where: {
        status: 'visible',
        replyToId: null,
        audience: 'public',
        author: { status: 'active', ...(viewer.user.isMinor ? {} : { isMinor: false }) },
        authorId: { notIn: excluded },
        ...(options?.topicSlug ? { topics: { some: { topic: { slug: options.topicSlug } } } } : {}),
      },
    }),
  ]);

  void candidateCount;

  const candidates = await prisma.socialPost.findMany({
    where: {
      status: 'visible',
      replyToId: null,
      audience: 'public',
      author: { status: 'active', ...(viewer.user.isMinor ? {} : { isMinor: false }) },
      authorId: { notIn: excluded },
      ...(options?.topicSlug ? { topics: { some: { topic: { slug: options.topicSlug } } } } : {}),
      ...(kind === 'for-you'
        ? { createdAt: { gte: new Date(Date.now() - 45 * 24 * 3_600_000) } }
        : {}),
    },
    include: postInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 200,
  });

  const state = await loadViewerState(viewer, candidates);
  const interestTopicIds = new Set(interests.map((row) => row.topicId));
  const followedTopicIds = new Set(topicFollows.map((row) => row.topicId));
  const now = Date.now();

  const ranked = candidates
    .filter((row) => visibleToViewer(row, state))
    .map((row) => ({
      row,
      score:
        kind === 'for-you'
          ? rankPost(row, interestTopicIds, followedTopicIds, now)
          : row.likeCount * 0.4 + row.replyCount * 0.8 + row.repostCount * 0.8 + row.quoteCount,
    }))
    .sort((a, b) => {
      const delta = b.score - a.score;
      if (delta !== 0) return delta;
      return b.row.createdAt.getTime() - a.row.createdAt.getTime();
    });

  const window = ranked.slice(offset, offset + limit + 1);
  const items = window.slice(0, limit).map(({ row }) => feedItem(mapPost(row, state), null, null));

  return {
    items,
    nextCursor:
      window.length > limit ? encodeCursor({ offset: offset + limit }) : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Post detail and author timelines                                           */
/* -------------------------------------------------------------------------- */

export interface PostDetail {
  post: PostView;
  ancestors: PostView[];
  replies: PostView[];
  hasMoreReplies: boolean;
}

export async function getPostById(viewer: SocialViewerRecord, id: string): Promise<PostView | null> {
  const row = await prisma.socialPost.findUnique({ where: { id }, include: postInclude });
  if (!row) return null;
  const state = await loadViewerState(viewer, [row]);
  if (!visibleToViewer(row, state)) return null;
  return mapPost(row, state);
}

export async function getPostDetail(viewer: SocialViewerRecord, id: string): Promise<PostDetail | null> {
  const row = await prisma.socialPost.findUnique({ where: { id }, include: postInclude });
  if (!row) return null;

  const [state, replies, ancestors] = await Promise.all([
    loadViewerState(viewer, [row]),
    prisma.socialPost.findMany({
      where: { replyToId: id, status: 'visible' },
      include: postInclude,
      orderBy: { createdAt: 'asc' },
      take: 21,
    }),
    loadAncestors(viewer, row.replyToId),
  ]);

  if (!visibleToViewer(row, state)) return null;

  const replyState = await loadViewerState(viewer, replies);
  const visibleReplies = replies.filter((reply) => visibleToViewer(reply, replyState)).slice(0, 20);

  const childRows = visibleReplies.length
    ? await prisma.socialPost.findMany({
        where: { replyToId: { in: visibleReplies.map((reply) => reply.id) }, status: 'visible' },
        include: postInclude,
        orderBy: { createdAt: 'asc' },
        take: 80,
      })
    : [];
  const childState = await loadViewerState(viewer, childRows);
  const childrenByParent = new Map<string, PostView[]>();
  for (const child of childRows) {
    if (!child.replyToId || !visibleToViewer(child, childState)) continue;
    const list = childrenByParent.get(child.replyToId) ?? [];
    if (list.length >= 2) continue;
    list.push(mapPost(child, childState));
    childrenByParent.set(child.replyToId, list);
  }

  return {
    post: mapPost(row, state),
    ancestors,
    replies: visibleReplies.map((reply) => ({
      ...mapPost(reply, replyState),
      children: childrenByParent.get(reply.id) ?? [],
    })),
    hasMoreReplies: replies.length > 20,
  };
}

async function loadAncestors(viewer: SocialViewerRecord, parentId: string | null): Promise<PostView[]> {
  const chain: PostRow[] = [];
  let nextId = parentId;
  for (let depth = 0; depth < 5 && nextId; depth += 1) {
    const row = await prisma.socialPost.findUnique({ where: { id: nextId }, include: postInclude });
    if (!row) break;
    chain.unshift(row);
    nextId = row.replyToId;
  }
  if (chain.length === 0) return [];
  const state = await loadViewerState(viewer, chain);
  return chain.filter((row) => visibleToViewer(row, state)).map((row) => mapPost(row, state));
}

export async function getMoreReplies(
  viewer: SocialViewerRecord,
  postId: string,
  cursor: string | null,
  limitInput?: number,
): Promise<Page<PostView>> {
  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const parsed = decodeCursor<{ createdAt: string; id: string }>(cursor);
  const parent = await prisma.socialPost.findUnique({ where: { id: postId }, include: postInclude });
  if (!parent) return { items: [], nextCursor: null };
  const parentState = await loadViewerState(viewer, [parent]);
  if (!visibleToViewer(parent, parentState)) return { items: [], nextCursor: null };

  const rows = await prisma.socialPost.findMany({
    where: {
      replyToId: postId,
      status: 'visible',
      ...postCursorWhere(parsed),
    },
    include: postInclude,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: limit + 1,
  });
  const state = await loadViewerState(viewer, rows);
  const visible = rows.filter((row) => visibleToViewer(row, state));
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => mapPost(row, state)),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export type ProfileTab = 'posts' | 'replies' | 'media';

export async function getPostsByAuthor(
  viewer: SocialViewerRecord,
  authorId: string,
  tab: ProfileTab,
  cursor: string | null,
  limitInput?: number,
): Promise<Page<FeedItem>> {
  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const parsed = decodeCursor<{ createdAt: string; id: string }>(cursor);
  const isSelf = authorId === viewer.user.id;

  const rows = await prisma.socialPost.findMany({
    where: {
      authorId,
      status: 'visible',
      ...(tab === 'posts' ? { replyToId: null } : tab === 'replies' ? { replyToId: { not: null } } : { media: { some: {} } }),
      ...(isSelf ? {} : { audience: { in: ['public', 'followers'] } }),
      ...postCursorWhere(parsed),
    },
    include: postInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const state = await loadViewerState(viewer, rows);
  const visible = rows.filter((row) => visibleToViewer(row, state));
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => feedItem(mapPost(row, state), null, null)),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export async function getPostsForAuthors(
  viewer: SocialViewerRecord,
  authorIds: string[],
  cursor: string | null,
  limitInput?: number,
): Promise<Page<FeedItem>> {
  if (authorIds.length === 0) return { items: [], nextCursor: null };
  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const parsed = decodeCursor<{ createdAt: string; id: string }>(cursor);
  const excluded = await excludedUserIds(viewer.user.id);

  const rows = await prisma.socialPost.findMany({
    where: {
      authorId: { in: authorIds, notIn: excluded },
      status: 'visible',
      replyToId: null,
      audience: { in: ['public', 'followers'] },
      author: { status: 'active', ...(viewer.user.isMinor ? {} : { isMinor: false }) },
      ...postCursorWhere(parsed),
    },
    include: postInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const state = await loadViewerState(viewer, rows);
  const visible = rows.filter((row) => visibleToViewer(row, state));
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => feedItem(mapPost(row, state), null, null)),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export async function getBookmarks(
  viewer: SocialViewerRecord,
  cursor: string | null,
  limitInput?: number,
): Promise<Page<FeedItem>> {
  const limit = clampLimit(limitInput ? String(limitInput) : null, 20, 50);
  const parsed = decodeCursor<{ createdAt: string; postId: string }>(cursor);
  const cursorDate = parsed ? new Date(parsed.createdAt) : null;

  const rows = await prisma.socialBookmark.findMany({
    where: {
      userId: viewer.user.id,
      ...(parsed && cursorDate && !Number.isNaN(cursorDate.getTime())
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, postId: { lt: parsed.postId } },
            ],
          }
        : {}),
    },
    include: { post: { include: postInclude } },
    orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
    take: limit + 1,
  });

  const state = await loadViewerState(viewer, rows.map((row) => row.post));
  const visible = rows.filter((row) => visibleToViewer(row.post, state));
  const page = visible.slice(0, limit);
  const last = page[page.length - 1];

  return {
    items: page.map((row) => feedItem(mapPost(row.post, state), null, null)),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), postId: last.postId })
        : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreatePostInput {
  body: string;
  audience: 'public' | 'followers' | 'private';
  topicSlugs?: string[];
  mediaIds?: string[];
  replyToId?: string | null;
  quoteOfId?: string | null;
}

function validateAudience(value: unknown): value is CreatePostInput['audience'] {
  return value === 'public' || value === 'followers' || value === 'private';
}

async function assertPostVisible(viewer: SocialViewerRecord, postId: string) {
  const row = await prisma.socialPost.findUnique({ where: { id: postId }, include: postInclude });
  if (!row) throw new Error('That post is not available.');
  const state = await loadViewerState(viewer, [row]);
  if (!visibleToViewer(row, state)) throw new Error('That post is not available.');
  return row;
}

export async function createPost(
  viewer: SocialViewerRecord,
  input: CreatePostInput,
): Promise<PostView> {
  const body = input.body.replace(/\r\n/g, '\n').trim().slice(0, POST_MAX_LENGTH);
  const audience = validateAudience(input.audience) ? input.audience : 'public';
  const topicSlugs = [...new Set((input.topicSlugs ?? []).slice(0, 5))];
  const mediaIds = [...new Set((input.mediaIds ?? []).slice(0, POST_MAX_MEDIA))];

  if (!body && mediaIds.length === 0 && !input.quoteOfId) {
    throw new Error('Write something or attach media before publishing.');
  }

  // Safeguarding: a student's post is never public, whatever the client asks.
  const effectiveAudience =
    viewer.user.isMinor && audience === 'public' ? 'followers' : audience;

  const [topics, assets, parent, quote] = await Promise.all([
    topicSlugs.length
      ? prisma.topic.findMany({ where: { slug: { in: topicSlugs } }, select: { id: true } })
      : [],
    mediaIds.length
      ? prisma.socialMediaAsset.findMany({
          where: { id: { in: mediaIds }, ownerId: viewer.user.id },
          select: { id: true },
        })
      : [],
    input.replyToId ? assertPostVisible(viewer, input.replyToId) : null,
    input.quoteOfId ? assertPostVisible(viewer, input.quoteOfId) : null,
  ]);

  if (mediaIds.length > 0 && assets.length !== mediaIds.length) {
    throw new Error('One or more attachments could not be verified.');
  }
  if (parent && parent.status !== 'visible') throw new Error('That conversation is closed.');

  const hashtags = parseHashtags(body);
  const mentionHandles = parseMentions(body);
  const mentioned = mentionHandles.length
    ? await prisma.user.findMany({
        where: { handle: { in: mentionHandles }, status: 'active' },
        select: { id: true, handle: true },
      })
    : [];

  const rootId = parent ? parent.rootId ?? parent.id : null;

  const created = await prisma.$transaction(async (tx) => {
    const post = await tx.socialPost.create({
      data: {
        authorId: viewer.user.id,
        body,
        audience: effectiveAudience,
        replyToId: parent?.id ?? null,
        rootId,
        quoteOfId: quote?.id ?? null,
      },
    });

    if (topics.length > 0) {
      await tx.socialPostTopic.createMany({
        data: topics.map((topic) => ({ postId: post.id, topicId: topic.id })),
        skipDuplicates: true,
      });
      for (const topic of topics) {
        await tx.topic.update({ where: { id: topic.id }, data: { postCount: { increment: 1 } } });
      }
    }
    if (hashtags.length > 0) {
      await tx.socialPostHashtag.createMany({
        data: hashtags.map((tag) => ({ postId: post.id, tag })),
        skipDuplicates: true,
      });
    }
    if (mentioned.length > 0) {
      await tx.socialPostMention.createMany({
        data: mentioned
          .filter((user) => user.id !== viewer.user.id)
          .map((user) => ({ postId: post.id, mentionedUserId: user.id })),
        skipDuplicates: true,
      });
    }
    if (assets.length > 0) {
      await tx.socialPostMedia.createMany({
        data: assets.map((asset, index) => ({ postId: post.id, assetId: asset.id, position: index })),
        skipDuplicates: true,
      });
    }
    if (parent) {
      await tx.socialPost.update({
        where: { id: parent.id },
        data: { replyCount: { increment: 1 } },
      });
    }
    if (quote) {
      await tx.socialPost.update({
        where: { id: quote.id },
        data: { quoteCount: { increment: 1 } },
      });
    }
    return post;
  });

  const href = `/post/${created.id}`;
  if (parent && parent.authorId !== viewer.user.id) {
    await createSocialNotification({
      recipientId: parent.authorId,
      actorId: viewer.user.id,
      type: 'reply',
      title: `${viewer.user.displayName} replied to your post`,
      body: body.slice(0, 120),
      href,
      postId: created.id,
    });
  }
  if (quote && quote.authorId !== viewer.user.id) {
    await createSocialNotification({
      recipientId: quote.authorId,
      actorId: viewer.user.id,
      type: 'quote',
      title: `${viewer.user.displayName} quoted your post`,
      body: body.slice(0, 120),
      href,
      postId: created.id,
    });
  }
  await Promise.all(
    mentioned
      .filter((user) => user.id !== viewer.user.id)
      .map((user) =>
        createSocialNotification({
          recipientId: user.id,
          actorId: viewer.user.id,
          type: 'mention',
          title: `${viewer.user.displayName} mentioned you`,
          body: body.slice(0, 120),
          href,
          postId: created.id,
        }),
      ),
  );

  const view = await getPostById(viewer, created.id);
  if (!view) throw new Error('The post was saved but could not be loaded.');
  return view;
}

export async function editPost(
  viewer: SocialViewerRecord,
  postId: string,
  input: CreatePostInput,
): Promise<PostView> {
  const existing = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { topics: true },
  });
  if (!existing) throw new Error('That post is not available.');
  if (existing.authorId !== viewer.user.id) throw new Error('You can only edit your own posts.');
  if (existing.status !== 'visible') throw new Error('That post is no longer editable.');

  const body = input.body.replace(/\r\n/g, '\n').trim().slice(0, POST_MAX_LENGTH);
  const topicSlugs = [...new Set((input.topicSlugs ?? []).slice(0, 5))];
  const topics = topicSlugs.length
    ? await prisma.topic.findMany({ where: { slug: { in: topicSlugs } }, select: { id: true } })
    : [];
  const hashtags = parseHashtags(body);
  const mentionHandles = parseMentions(body);
  const mentioned = mentionHandles.length
    ? await prisma.user.findMany({
        where: { handle: { in: mentionHandles }, status: 'active' },
        select: { id: true },
      })
    : [];

  const audience = viewer.user.isMinor
    ? input.audience === 'private'
      ? 'private'
      : 'followers'
    : validateAudience(input.audience)
      ? input.audience
      : existing.audience;

  const previousTopicIds = existing.topics.map((topic) => topic.topicId);
  const nextTopicIds = new Set(topics.map((topic) => topic.id));

  await prisma.$transaction(async (tx) => {
    await tx.socialPost.update({
      where: { id: postId },
      data: { body, audience, editedAt: new Date() },
    });
    await tx.socialPostTopic.deleteMany({ where: { postId } });
    if (topics.length > 0) {
      await tx.socialPostTopic.createMany({
        data: topics.map((topic) => ({ postId, topicId: topic.id })),
        skipDuplicates: true,
      });
    }
    for (const topicId of previousTopicIds) {
      if (!nextTopicIds.has(topicId)) {
        await tx.topic.update({
          where: { id: topicId },
          data: { postCount: { decrement: 1 } },
        });
      }
    }
    for (const topicId of nextTopicIds) {
      if (!previousTopicIds.includes(topicId)) {
        await tx.topic.update({ where: { id: topicId }, data: { postCount: { increment: 1 } } });
      }
    }
    await tx.socialPostHashtag.deleteMany({ where: { postId } });
    if (hashtags.length > 0) {
      await tx.socialPostHashtag.createMany({
        data: hashtags.map((tag) => ({ postId, tag })),
        skipDuplicates: true,
      });
    }
    await tx.socialPostMention.deleteMany({ where: { postId } });
    if (mentioned.length > 0) {
      await tx.socialPostMention.createMany({
        data: mentioned
          .filter((user) => user.id !== viewer.user.id)
          .map((user) => ({ postId, mentionedUserId: user.id })),
        skipDuplicates: true,
      });
    }
  });

  const view = await getPostById(viewer, postId);
  if (!view) throw new Error('The post was saved but could not be loaded.');
  return view;
}

export async function deletePost(viewer: SocialViewerRecord, postId: string): Promise<void> {
  const existing = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, replyToId: true, status: true },
  });
  if (!existing) throw new Error('That post is not available.');
  if (existing.authorId !== viewer.user.id && !viewer.user.platformAdmin) {
    throw new Error('You can only delete your own posts.');
  }
  if (existing.status === 'removed') return;

  await prisma.$transaction(async (tx) => {
    await tx.socialPost.update({
      where: { id: postId },
      data: { status: 'removed', body: '' },
    });
    if (existing.replyToId) {
      await tx.socialPost.updateMany({
        where: { id: existing.replyToId, replyCount: { gt: 0 } },
        data: { replyCount: { decrement: 1 } },
      });
    }
  });
}

export async function setReaction(
  viewer: SocialViewerRecord,
  postId: string,
  liked: boolean,
): Promise<{ liked: boolean; count: number }> {
  const post = await assertPostVisible(viewer, postId);
  const existing = await prisma.socialReaction.findUnique({
    where: { postId_userId: { postId, userId: viewer.user.id } },
  });

  if (liked && !existing) {
    await prisma.$transaction(async (tx) => {
      await tx.socialReaction.create({ data: { postId, userId: viewer.user.id } });
      await tx.socialPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
    });
    await createSocialNotification({
      recipientId: post.authorId,
      actorId: viewer.user.id,
      type: 'reaction',
      title: `${viewer.user.displayName} liked your post`,
      href: `/post/${postId}`,
      postId,
    });
  } else if (!liked && existing) {
    await prisma.$transaction(async (tx) => {
      await tx.socialReaction.delete({
        where: { postId_userId: { postId, userId: viewer.user.id } },
      });
      await tx.socialPost.updateMany({
        where: { id: postId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
      });
    });
  }

  const fresh = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { likeCount: true },
  });
  return { liked, count: fresh?.likeCount ?? 0 };
}

export async function setRepost(
  viewer: SocialViewerRecord,
  postId: string,
  reposted: boolean,
): Promise<{ reposted: boolean; count: number }> {
  const post = await assertPostVisible(viewer, postId);
  const existing = await prisma.socialRepost.findUnique({
    where: { postId_userId: { postId, userId: viewer.user.id } },
  });

  if (reposted && !existing) {
    await prisma.$transaction(async (tx) => {
      await tx.socialRepost.create({ data: { postId, userId: viewer.user.id } });
      await tx.socialPost.update({
        where: { id: postId },
        data: { repostCount: { increment: 1 } },
      });
    });
    await createSocialNotification({
      recipientId: post.authorId,
      actorId: viewer.user.id,
      type: 'repost',
      title: `${viewer.user.displayName} reposted your post`,
      href: `/post/${postId}`,
      postId,
    });
  } else if (!reposted && existing) {
    await prisma.$transaction(async (tx) => {
      await tx.socialRepost.delete({
        where: { postId_userId: { postId, userId: viewer.user.id } },
      });
      await tx.socialPost.updateMany({
        where: { id: postId, repostCount: { gt: 0 } },
        data: { repostCount: { decrement: 1 } },
      });
    });
  }

  const fresh = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { repostCount: true },
  });
  return { reposted, count: fresh?.repostCount ?? 0 };
}

export async function setBookmark(
  viewer: SocialViewerRecord,
  postId: string,
  bookmarked: boolean,
): Promise<{ bookmarked: boolean }> {
  const row = await assertPostVisible(viewer, postId);
  if (bookmarked) {
    await prisma.socialBookmark.upsert({
      where: { postId_userId: { postId, userId: viewer.user.id } },
      create: { postId, userId: viewer.user.id },
      update: {},
    });
  } else {
    await prisma.socialBookmark.deleteMany({ where: { postId, userId: viewer.user.id } });
  }
  void row;
  return { bookmarked };
}

/** Used by the API when a client sends an insecure or malformed audience. */
export function audienceOrDefault(value: unknown): SocialPost['audience'] {
  return validateAudience(value) ? value : 'public';
}
