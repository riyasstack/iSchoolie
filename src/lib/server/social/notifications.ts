import 'server-only';
import type { SocialNotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { encodeCursor, decodeCursor, clampLimit } from '@/lib/server/social/pagination';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import type { NotificationView, Page } from '@/lib/social/types';

const PREFERENCE_FIELD: Partial<Record<SocialNotificationType, keyof NotificationPreference>> = {
  follow: 'follows',
  follow_request: 'follows',
  follow_accepted: 'follows',
  reaction: 'reactions',
  reply: 'replies',
  mention: 'mentions',
  repost: 'reposts',
  quote: 'quotes',
  moderation: 'moderation',
};

interface NotificationPreference {
  follows: boolean;
  reactions: boolean;
  replies: boolean;
  mentions: boolean;
  reposts: boolean;
  quotes: boolean;
  moderation: boolean;
}

/**
 * Write one notification if the recipient's preferences, blocks and safety
 * policy allow it. Returns the created row, or null when suppressed.
 */
export async function createSocialNotification(input: {
  recipientId: string;
  actorId: string | null;
  type: SocialNotificationType;
  title: string;
  body?: string;
  href?: string | null;
  postId?: string | null;
}) {
  if (input.actorId === input.recipientId) return null;

  const [recipient, preference, block] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.recipientId },
      select: { id: true, status: true, isMinor: true },
    }),
    prisma.socialNotificationPreference.findUnique({ where: { userId: input.recipientId } }),
    input.actorId
      ? prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: input.actorId, blockedId: input.recipientId },
              { blockerId: input.recipientId, blockedId: input.actorId },
            ],
          },
          select: { blockerId: true },
        })
      : null,
  ]);

  if (!recipient || recipient.status !== 'active') return null;
  if (block) return null;

  if (input.actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: input.actorId },
      select: { isMinor: true, status: true },
    });
    if (!actor || actor.status !== 'active') return null;
    // Safeguarding: an adult must not receive interaction notifications from a
    // student account, and vice versa. The interaction itself is already
    // refused upstream for adult→minor; this closes the reverse direction.
    if (recipient.isMinor !== actor.isMinor) return null;
  }

  const field = PREFERENCE_FIELD[input.type];
  if (preference && field && preference[field] === false) return null;

  // One unread follow notification per actor prevents follow/unfollow spam.
  if (input.type === 'follow' && input.actorId) {
    const existing = await prisma.socialNotification.findFirst({
      where: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: 'follow',
        read: false,
      },
      select: { id: true },
    });
    if (existing) return null;
  }

  return prisma.socialNotification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      title: input.title.slice(0, 120),
      body: (input.body ?? '').slice(0, 240),
      href: input.href ?? null,
      postId: input.postId ?? null,
    },
  });
}

export async function listNotifications(
  viewer: SocialViewerRecord,
  options?: { cursor?: string | null; limit?: number; mentionsOnly?: boolean },
): Promise<Page<NotificationView>> {
  const limit = clampLimit(options?.limit ? String(options.limit) : null, 20, 50);
  const cursor = decodeCursor<{ createdAt: string; id: string }>(options?.cursor);
  const cursorDate = cursor ? new Date(cursor.createdAt) : null;

  const rows = await prisma.socialNotification.findMany({
    where: {
      recipientId: viewer.user.id,
      ...(options?.mentionsOnly ? { type: 'mention' } : {}),
      ...(cursor && cursorDate && !Number.isNaN(cursorDate.getTime())
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursor.id } },
            ],
          }
        : {}),
    },
    include: {
      actor: { select: { id: true, handle: true, displayName: true, photoUrl: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor,
    })),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export async function markNotificationRead(viewer: SocialViewerRecord, id: string): Promise<void> {
  await prisma.socialNotification.updateMany({
    where: { id, recipientId: viewer.user.id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(viewer: SocialViewerRecord): Promise<number> {
  const result = await prisma.socialNotification.updateMany({
    where: { recipientId: viewer.user.id, read: false },
    data: { read: true },
  });
  return result.count;
}

export async function getNotificationPreferences(viewer: SocialViewerRecord) {
  const row = await prisma.socialNotificationPreference.upsert({
    where: { userId: viewer.user.id },
    create: { userId: viewer.user.id },
    update: {},
  });
  return {
    follows: row.follows,
    reactions: row.reactions,
    replies: row.replies,
    mentions: row.mentions,
    reposts: row.reposts,
    quotes: row.quotes,
    moderation: row.moderation,
  };
}

export async function updateNotificationPreferences(
  viewer: SocialViewerRecord,
  values: Partial<NotificationPreference>,
): Promise<void> {
  const data: Partial<NotificationPreference> = {};
  for (const key of [
    'follows',
    'reactions',
    'replies',
    'mentions',
    'reposts',
    'quotes',
    'moderation',
  ] as const) {
    if (typeof values[key] === 'boolean') data[key] = values[key];
  }
  if (Object.keys(data).length === 0) return;
  await prisma.socialNotificationPreference.upsert({
    where: { userId: viewer.user.id },
    create: { userId: viewer.user.id, ...data },
    update: data,
  });
}
