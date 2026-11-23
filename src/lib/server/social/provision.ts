import 'server-only';
import { prisma } from '@/lib/prisma';
import { provisionAccount } from '@/lib/server/identity';
import type { User as WorkosUser } from '@workos-inc/node';

/**
 * Create the social sidecar rows for an identity.
 *
 * Every field is safe by default: private profile, discovery allowed only
 * inside eligible surfaces, recommendations on, and no implicit follows. The
 * calls are upserts so a retry cannot duplicate state.
 */
export async function ensureSocialRows(userId: string): Promise<void> {
  await Promise.all([
    prisma.socialProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
    prisma.discoverabilityPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
    prisma.onboardingProgress.upsert({
      where: { userId },
      create: { userId, step: 1 },
      update: {},
    }),
    prisma.socialNotificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  ]);
}

export async function provisionSocialUser(workosUser: WorkosUser) {
  const existing = await prisma.user.findUnique({ where: { workosUserId: workosUser.id } });
  const user = existing ?? (await provisionAccount(workosUser));
  await ensureSocialRows(user.id);
  return user;
}
