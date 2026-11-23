import 'server-only';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { isValidEmail } from '@/lib/utils/dates';
import type { InvitationView } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { createSocialNotification } from '@/lib/server/social/notifications';

/**
 * Invitations create a shareable link. Email delivery is intentionally not
 * claimed: no transactional email provider is configured in this project, so an
 * email invitation stays in `created` state with a `mailto:` hand-off in the UI.
 * The link itself always works and requires the recipient to authenticate.
 */
export async function createInvitation(
  viewer: SocialViewerRecord,
  input: { email?: string | null; note?: string | null },
): Promise<InvitationView> {
  const email = input.email ? input.email.trim().toLowerCase() : null;
  if (email && !isValidEmail(email)) throw new Error('Enter a valid email address.');
  if (email && email === viewer.user.email.toLowerCase()) {
    throw new Error('Use a different address; this is your own email.');
  }

  const recent = await prisma.socialInvitation.count({
    where: {
      inviterId: viewer.user.id,
      createdAt: { gte: new Date(Date.now() - 24 * 3_600_000) },
    },
  });
  if (recent >= 25) throw new Error('You can create up to 25 invitations per day.');

  const duplicate = email
    ? await prisma.socialInvitation.findFirst({
        where: {
          inviterId: viewer.user.id,
          email,
          status: { in: ['created', 'sent'] },
        },
        select: { id: true },
      })
    : null;
  if (duplicate) throw new Error('You have already invited that address.');

  const row = await prisma.socialInvitation.create({
    data: {
      inviterId: viewer.user.id,
      email,
      token: randomBytes(24).toString('base64url'),
      channel: email ? 'email' : 'link',
      note: input.note?.trim().slice(0, 200) || null,
    },
  });

  return {
    id: row.id,
    email: row.email,
    channel: row.channel,
    status: row.status,
    token: row.token,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
  };
}

export async function listInvitations(
  viewer: SocialViewerRecord,
): Promise<InvitationView[]> {
  const rows = await prisma.socialInvitation.findMany({
    where: { inviterId: viewer.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    channel: row.channel,
    status: row.status,
    token: row.token,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
  }));
}

export async function revokeInvitation(
  viewer: SocialViewerRecord,
  invitationId: string,
): Promise<void> {
  await prisma.socialInvitation.updateMany({
    where: { id: invitationId, inviterId: viewer.user.id, status: { not: 'accepted' } },
    data: { status: 'revoked' },
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.socialInvitation.findUnique({
    where: { token },
    include: {
      inviter: { select: { handle: true, displayName: true, photoUrl: true } },
    },
  });
  if (!invitation) return null;
  return {
    token: invitation.token,
    status: invitation.status,
    email: invitation.email,
    note: invitation.note,
    inviter: invitation.inviter,
  };
}

export async function acceptInvitation(
  viewer: SocialViewerRecord,
  token: string,
): Promise<'accepted' | 'already' | 'own' | 'unavailable'> {
  const invitation = await prisma.socialInvitation.findUnique({ where: { token } });
  if (!invitation) return 'unavailable';
  if (invitation.status === 'revoked') return 'unavailable';
  if (invitation.inviterId === viewer.user.id) return 'own';
  if (invitation.status === 'accepted') return 'already';

  await prisma.socialInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
      ...(invitation.sentAt ? {} : { sentAt: new Date() }),
    },
  });
  await createSocialNotification({
    recipientId: invitation.inviterId,
    actorId: viewer.user.id,
    type: 'invitation',
    title: `${viewer.user.displayName} joined from your invitation`,
    href: `/u/${viewer.user.handle}`,
  });
  return 'accepted';
}
