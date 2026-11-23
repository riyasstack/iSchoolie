import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { followUser, unfollowUser } from '@/lib/server/social/graph';

export const dynamic = 'force-dynamic';

async function targetFrom(request: Request): Promise<string | null> {
  const body = await readJson<{ targetId?: unknown }>(request);
  if (body && typeof body.targetId === 'string' && body.targetId.length > 0) return body.targetId;
  const queryTarget = new URL(request.url).searchParams.get('targetId');
  return queryTarget && queryTarget.length > 0 ? queryTarget : null;
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const targetId = await targetFrom(request);
    if (!targetId) return badRequest('targetId is required.');
    const result = await followUser(viewer, targetId);
    return privateJson(result);
  });
}

export async function DELETE(request: Request) {
  return withViewer(request, async (viewer) => {
    const targetId = await targetFrom(request);
    if (!targetId) return badRequest('targetId is required.');
    await unfollowUser(viewer, targetId);
    return privateJson({ state: 'not_following', requested: false });
  });
}
