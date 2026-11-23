import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Page, FeedItem, PersonSummary, SocialListSummary } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';
import { getPostsForAuthors } from '@/lib/server/social/posts';
import { loadPersonContext, personInclude, summaryFor } from '@/lib/server/social/serialize';

function validateName(value: string): string {
  const name = value.trim();
  if (name.length < 2 || name.length > 60) {
    throw new Error('List names must be between 2 and 60 characters.');
  }
  return name;
}

function validateVisibility(value: unknown): 'public' | 'private' {
  return value === 'public' ? 'public' : 'private';
}

export async function listSocialLists(viewer: SocialViewerRecord): Promise<SocialListSummary[]> {
  const lists = await prisma.socialList.findMany({
    where: {
      OR: [{ ownerId: viewer.user.id }, { follows: { some: { followerId: viewer.user.id } } }],
    },
    include: {
      owner: { select: { handle: true } },
      _count: { select: { members: true } },
      follows: { where: { followerId: viewer.user.id }, select: { followerId: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    visibility: list.visibility,
    ownerId: list.ownerId,
    ownerHandle: list.owner.handle,
    memberCount: list._count.members,
    following: list.follows.length > 0,
    isOwner: list.ownerId === viewer.user.id,
    updatedAt: list.updatedAt.toISOString(),
  }));
}

export async function createList(
  viewer: SocialViewerRecord,
  input: { name: string; description?: string; visibility?: 'public' | 'private' },
): Promise<SocialListSummary> {
  const count = await prisma.socialList.count({ where: { ownerId: viewer.user.id } });
  if (count >= 25) throw new Error('You can create up to 25 lists.');

  const list = await prisma.socialList.create({
    data: {
      ownerId: viewer.user.id,
      name: validateName(input.name),
      description: (input.description ?? '').trim().slice(0, 200),
      visibility: validateVisibility(input.visibility),
    },
    include: { owner: { select: { handle: true } }, _count: { select: { members: true } } },
  });

  return {
    id: list.id,
    name: list.name,
    description: list.description,
    visibility: list.visibility,
    ownerId: list.ownerId,
    ownerHandle: list.owner.handle,
    memberCount: list._count.members,
    following: false,
    isOwner: true,
    updatedAt: list.updatedAt.toISOString(),
  };
}

export async function updateList(
  viewer: SocialViewerRecord,
  listId: string,
  input: { name?: string; description?: string; visibility?: 'public' | 'private' },
): Promise<void> {
  const list = await prisma.socialList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) throw new Error('That list is not available.');
  if (list.ownerId !== viewer.user.id) throw new Error('Only the list owner can edit it.');

  await prisma.socialList.update({
    where: { id: listId },
    data: {
      ...(input.name !== undefined ? { name: validateName(input.name) } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim().slice(0, 200) }
        : {}),
      ...(input.visibility !== undefined ? { visibility: validateVisibility(input.visibility) } : {}),
    },
  });
}

export async function deleteList(viewer: SocialViewerRecord, listId: string): Promise<void> {
  await prisma.socialList.deleteMany({ where: { id: listId, ownerId: viewer.user.id } });
}

export async function addListMember(
  viewer: SocialViewerRecord,
  listId: string,
  userId: string,
): Promise<void> {
  const list = await prisma.socialList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) throw new Error('That list is not available.');
  if (list.ownerId !== viewer.user.id) throw new Error('Only the list owner can add accounts.');
  if (userId === viewer.user.id) throw new Error('You are already on every list you own.');

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, isMinor: true },
  });
  if (!target || target.status !== 'active') throw new Error('That account is not available.');
  if (target.isMinor && !viewer.user.isMinor) {
    throw new Error('Student accounts cannot be added to an adult list.');
  }

  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: viewer.user.id, blockedId: userId },
        { blockerId: userId, blockedId: viewer.user.id },
      ],
    },
    select: { blockerId: true },
  });
  if (blocked) throw new Error('That account is not available.');

  await prisma.socialListMember.upsert({
    where: { listId_userId: { listId, userId } },
    create: { listId, userId },
    update: {},
  });
  await prisma.socialList.update({ where: { id: listId }, data: { updatedAt: new Date() } });
}

export async function removeListMember(
  viewer: SocialViewerRecord,
  listId: string,
  userId: string,
): Promise<void> {
  await prisma.socialListMember.deleteMany({
    where: { listId, userId, list: { ownerId: viewer.user.id } },
  });
}

export interface ListDetail {
  list: SocialListSummary;
  members: PersonSummary[];
  canEdit: boolean;
}

export async function getListDetail(
  viewer: SocialViewerRecord,
  listId: string,
): Promise<ListDetail | null> {
  const list = await prisma.socialList.findUnique({
    where: { id: listId },
    include: {
      owner: { select: { handle: true } },
      members: { include: { user: { include: personInclude } }, take: 100 },
      _count: { select: { members: true } },
      follows: { where: { followerId: viewer.user.id }, select: { followerId: true } },
    },
  });
  if (!list) return null;

  const isOwner = list.ownerId === viewer.user.id;
  if (list.visibility === 'private' && !isOwner) return null;

  const context = await loadPersonContext(viewer, list.members.map((member) => member.user));
  const members = list.members
    .map((member) => summaryFor(context, member.user))
    .filter((person) => !person.isMinor || viewer.user.isMinor || person.id === viewer.user.id);

  return {
    list: {
      id: list.id,
      name: list.name,
      description: list.description,
      visibility: list.visibility,
      ownerId: list.ownerId,
      ownerHandle: list.owner.handle,
      memberCount: list._count.members,
      following: list.follows.length > 0,
      isOwner,
      updatedAt: list.updatedAt.toISOString(),
    },
    members,
    canEdit: isOwner,
  };
}

export async function setListFollow(
  viewer: SocialViewerRecord,
  listId: string,
  follow: boolean,
): Promise<void> {
  const list = await prisma.socialList.findUnique({
    where: { id: listId },
    select: { visibility: true, ownerId: true },
  });
  if (!list) throw new Error('That list is not available.');
  if (list.visibility !== 'public') throw new Error('Only public lists can be followed.');
  if (list.ownerId === viewer.user.id) return;

  if (follow) {
    await prisma.socialListFollow.upsert({
      where: { listId_followerId: { listId, followerId: viewer.user.id } },
      create: { listId, followerId: viewer.user.id },
      update: {},
    });
  } else {
    await prisma.socialListFollow.deleteMany({
      where: { listId, followerId: viewer.user.id },
    });
  }
}

export async function getListTimeline(
  viewer: SocialViewerRecord,
  listId: string,
  cursor: string | null,
  limit?: number,
): Promise<Page<FeedItem> | null> {
  const list = await prisma.socialList.findUnique({
    where: { id: listId },
    include: { members: { select: { userId: true }, take: 100 } },
  });
  if (!list) return null;
  if (list.visibility === 'private' && list.ownerId !== viewer.user.id) return null;
  return getPostsForAuthors(
    viewer,
    list.members.map((member) => member.userId),
    cursor,
    limit,
  );
}
