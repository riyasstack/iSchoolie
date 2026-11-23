import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { submitRecommendationFeedback } from '@/lib/server/social/recommendations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ targetUserId?: unknown; signal?: unknown }>(request);
    if (!body || typeof body.targetUserId !== 'string' || typeof body.signal !== 'string') {
      return badRequest('targetUserId and signal are required.');
    }
    await submitRecommendationFeedback(viewer, body.targetUserId, body.signal);
    return privateJson({ ok: true });
  });
}
