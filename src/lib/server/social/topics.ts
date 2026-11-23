import 'server-only';
import { prisma } from '@/lib/prisma';
import { TOPIC_CATALOG } from '@/lib/social/catalog';
import type { TopicSummary } from '@/lib/social/types';
import type { SocialViewerRecord } from '@/lib/server/social/auth';

/** Idempotent catalogue bootstrap. Safe to call from onboarding or a seed. */
export async function ensureTopics(): Promise<void> {
  await prisma.$transaction(
    TOPIC_CATALOG.map((topic) =>
      prisma.topic.upsert({
        where: { slug: topic.slug },
        create: topic,
        update: { name: topic.name, description: topic.description, category: topic.category },
      }),
    ),
  );
}

export async function listTopics(viewer: SocialViewerRecord | null): Promise<TopicSummary[]> {
  const [topics, follows] = await Promise.all([
    prisma.topic.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    viewer
      ? prisma.topicFollow.findMany({
          where: { userId: viewer.user.id },
          select: { topicId: true },
        })
      : [],
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

export async function getTopic(slug: string): Promise<TopicSummary | null> {
  const topic = await prisma.topic.findUnique({ where: { slug } });
  if (!topic) return null;
  return {
    id: topic.id,
    slug: topic.slug,
    name: topic.name,
    category: topic.category,
    followerCount: topic.followerCount,
    postCount: topic.postCount,
    following: false,
  };
}

export async function toggleTopicFollow(
  viewer: SocialViewerRecord,
  slug: string,
  follow: boolean,
): Promise<{ following: boolean; followerCount: number }> {
  const topic = await prisma.topic.findUnique({ where: { slug } });
  if (!topic) throw new Error('That topic is not available.');

  const existing = await prisma.topicFollow.findUnique({
    where: { userId_topicId: { userId: viewer.user.id, topicId: topic.id } },
  });

  if (follow && !existing) {
    await prisma.$transaction([
      prisma.topicFollow.create({ data: { userId: viewer.user.id, topicId: topic.id } }),
      prisma.topic.update({ where: { id: topic.id }, data: { followerCount: { increment: 1 } } }),
    ]);
  } else if (!follow && existing) {
    await prisma.$transaction([
      prisma.topicFollow.delete({
        where: { userId_topicId: { userId: viewer.user.id, topicId: topic.id } },
      }),
      prisma.topic.updateMany({
        where: { id: topic.id, followerCount: { gt: 0 } },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
  }

  const fresh = await prisma.topic.findUnique({ where: { id: topic.id }, select: { followerCount: true } });
  return {
    following: follow,
    followerCount: fresh?.followerCount ?? topic.followerCount,
  };
}

export async function saveInterests(
  viewer: SocialViewerRecord,
  topicSlugs: string[],
): Promise<void> {
  await ensureTopics();
  const unique = [...new Set(topicSlugs)].slice(0, 16);
  const topics = await prisma.topic.findMany({
    where: { slug: { in: unique } },
    select: { id: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.userInterest.deleteMany({ where: { userId: viewer.user.id } });
    if (topics.length > 0) {
      await tx.userInterest.createMany({
        data: topics.map((topic) => ({ userId: viewer.user.id, topicId: topic.id })),
        skipDuplicates: true,
      });
    }
  });
}

export async function saveGoals(viewer: SocialViewerRecord, goals: string[]): Promise<void> {
  const unique = [...new Set(goals)].slice(0, 10);
  await prisma.$transaction(async (tx) => {
    await tx.userGoal.deleteMany({ where: { userId: viewer.user.id } });
    if (unique.length > 0) {
      await tx.userGoal.createMany({
        data: unique.map((goal) => ({ userId: viewer.user.id, goal })),
        skipDuplicates: true,
      });
    }
  });
}

export async function getViewerInterestTopics(
  viewer: SocialViewerRecord,
): Promise<Array<{ id: string; slug: string; name: string }>> {
  const rows = await prisma.userInterest.findMany({
    where: { userId: viewer.user.id },
    include: { topic: { select: { id: true, slug: true, name: true } } },
    take: 20,
  });
  return rows.map((row) => row.topic);
}
