import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { dismissRecommendation } from '@/lib/server/social/recommendations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ targetUserId?: unknown }>(request);
    if (!body || typeof body.targetUserId !== 'string') return badRequest('targetUserId is required.');
    await dismissRecommendation(viewer, body.targetUserId);
    return privateJson({ dismissed: true });
  });
}
