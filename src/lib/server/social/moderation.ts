import 'server-only';
import { prisma } from '@/lib/prisma';
import { REPORT_REASONS } from '@/lib/social/catalog';
import type { ReportView } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { recordAudit } from '@/lib/server/social/audit';
import { createSocialNotification } from '@/lib/server/social/notifications';

export interface ReportInput {
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  reason: string;
  details?: string;
}

async function targetOwner(
  viewer: SocialViewerRecord,
  targetType: ReportInput['targetType'],
  targetId: string,
): Promise<{ ownerId: string; preview: string }> {
  if (targetType === 'user') {
    if (targetId === viewer.user.id) throw new Error('You cannot report your own account.');
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, displayName: true, isMinor: true, status: true },
    });
    if (!user || user.status !== 'active') throw new Error('That account is not available.');
    if (user.isMinor && !viewer.user.isMinor) throw new Error('That account is not available.');
    return { ownerId: user.id, preview: user.displayName };
  }

  const post = await prisma.socialPost.findUnique({
    where: { id: targetId },
    select: { id: true, authorId: true, body: true, replyToId: true, status: true },
  });
  if (!post || post.status !== 'visible') throw new Error('That content is not available.');
  if (targetType === 'reply' && !post.replyToId) {
    throw new Error('That content is a post, not a reply.');
  }
  if (targetType === 'post' && post.replyToId) {
    throw new Error('That content is a reply, not a post.');
  }
  return { ownerId: post.authorId, preview: post.body.slice(0, 200) };
}

export async function submitReport(
  viewer: SocialViewerRecord,
  input: ReportInput,
): Promise<{ id: string }> {
  const reason = input.reason.trim().slice(0, 100);
  if (!reason) throw new Error('Choose a reason for the report.');
  if (!(REPORT_REASONS as readonly string[]).includes(reason) && reason !== 'Other') {
    // Unknown reasons are kept only when they are on the approved list; a
    // report must never be an arbitrary free-text channel into moderation.
    throw new Error('Choose a reason from the list.');
  }
  if (input.details && input.details.length > 500) {
    throw new Error('Report details must be 500 characters or fewer.');
  }

  const target = await targetOwner(viewer, input.targetType, input.targetId);

  const recent = await prisma.socialReport.findFirst({
    where: {
      reporterId: viewer.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      status: { in: ['open', 'reviewing'] },
    },
    select: { id: true },
  });
  if (recent) return { id: recent.id };

  const report = await prisma.socialReport.create({
    data: {
      reporterId: viewer.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      targetOwnerId: target.ownerId,
      reason,
      details: input.details?.trim().slice(0, 500) || null,
    },
  });

  await recordAudit({
    actorId: viewer.user.id,
    action: 'social.report.created',
    subjectType: input.targetType,
    subjectId: input.targetId,
    detail: reason,
  });

  return { id: report.id };
}

export async function listModerationReports(viewer: SocialViewerRecord): Promise<ReportView[]> {
  if (!viewer.user.platformAdmin) throw new Error('Moderation is restricted.');

  const reports = await prisma.socialReport.findMany({
    where: { status: { in: ['open', 'reviewing'] } },
    include: { reporter: { select: { handle: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    take: 100,
  });

  const postIds = reports
    .filter((report) => report.targetType !== 'user')
    .map((report) => report.targetId);
  const userIds = reports
    .filter((report) => report.targetType === 'user')
    .map((report) => report.targetId);

  const [posts, users] = await Promise.all([
    postIds.length
      ? prisma.socialPost.findMany({
          where: { id: { in: postIds } },
          select: { id: true, body: true },
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, displayName: true },
        })
      : [],
  ]);
  const postPreviews = new Map(posts.map((post) => [post.id, post.body.slice(0, 160)]));
  const userPreviews = new Map(users.map((user) => [user.id, user.displayName]));

  return reports.map((report) => ({
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    targetOwnerId: report.targetOwnerId,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reporterHandle: report.reporter.handle,
    targetPreview:
      report.targetType === 'user'
        ? userPreviews.get(report.targetId) ?? null
        : postPreviews.get(report.targetId) ?? null,
  }));
}

export type ModerationAction = 'dismiss' | 'hide' | 'remove' | 'suspend';

export async function resolveReport(
  viewer: SocialViewerRecord,
  reportId: string,
  action: ModerationAction,
): Promise<void> {
  if (!viewer.user.platformAdmin) throw new Error('Moderation is restricted.');
  if (!['dismiss', 'hide', 'remove', 'suspend'].includes(action)) {
    throw new Error('Unknown moderation action.');
  }

  const report = await prisma.socialReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error('That report is not available.');
  if (report.status === 'actioned' || report.status === 'dismissed') return;

  if (report.targetType === 'user') {
    if (!report.targetOwnerId) throw new Error('The reported account no longer exists.');
    if (report.targetOwnerId === viewer.user.id) throw new Error('You cannot moderate your own account.');
    if (action === 'hide' || action === 'remove') {
      // Content actions do not apply to an account target; treating them as a
      // dismiss keeps the queue honest instead of claiming content was hidden.
      action = 'dismiss';
    }
    if (action === 'suspend') {
      await prisma.user.update({
        where: { id: report.targetOwnerId },
        data: { status: 'suspended' },
      });
    }
  } else {
    const post = await prisma.socialPost.findUnique({
      where: { id: report.targetId },
      select: { id: true, authorId: true },
    });
    if (post) {
      if (action === 'hide') {
        await prisma.socialPost.update({ where: { id: post.id }, data: { status: 'hidden' } });
      } else if (action === 'remove') {
        await prisma.socialPost.update({ where: { id: post.id }, data: { status: 'removed' } });
      } else if (action === 'suspend' && post.authorId !== viewer.user.id) {
        await prisma.user.update({ where: { id: post.authorId }, data: { status: 'suspended' } });
      }
    }
  }

  const finalStatus = action === 'dismiss' ? 'dismissed' : 'actioned';

  await prisma.$transaction([
    prisma.socialReport.update({
      where: { id: reportId },
      data: {
        status: finalStatus,
        handledBy: viewer.user.id,
        handledAt: new Date(),
        action,
      },
    }),
    prisma.socialModerationAction.create({
      data: {
        reportId,
        actorId: viewer.user.id,
        action,
        note: '',
      },
    }),
  ]);

  await recordAudit({
    actorId: viewer.user.id,
    action: `social.moderation.${action}`,
    subjectType: report.targetType,
    subjectId: report.targetId,
  });

  if (report.targetOwnerId && action !== 'dismiss') {
    await createSocialNotification({
      recipientId: report.targetOwnerId,
      actorId: null,
      type: 'moderation',
      title: 'A moderation decision affected your content',
      body: 'Review the iSchoolie community guidelines for details.',
      href: '/moderation-policy',
    });
  }
}

export async function getModerationCounts(): Promise<{ open: number; reviewing: number; actioned: number }> {
  const [open, reviewing, actioned] = await Promise.all([
    prisma.socialReport.count({ where: { status: 'open' } }),
    prisma.socialReport.count({ where: { status: 'reviewing' } }),
    prisma.socialReport.count({ where: { status: 'actioned' } }),
  ]);
  return { open, reviewing, actioned };
}
