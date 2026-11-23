import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { toSocialViewer } from '@/lib/server/social/auth';
import { getOnboardingSnapshot } from '@/lib/server/social/onboarding';
import { getViewerInterestTopics } from '@/lib/server/social/topics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const [onboarding, interests] = await Promise.all([
      getOnboardingSnapshot(viewer),
      getViewerInterestTopics(viewer),
    ]);
    return privateJson({
      viewer: toSocialViewer(viewer),
      onboarding,
      interests,
    });
  });
}
