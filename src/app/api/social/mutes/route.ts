import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { listMuted, muteUser, unmuteUser } from '@/lib/server/social/graph';

export const dynamic = 'force-dynamic';

async function targetFrom(request: Request): Promise<string | null> {
  const body = await readJson<{ targetId?: unknown }>(request);
  if (body && typeof body.targetId === 'string') return body.targetId;
  const value = new URL(request.url).searchParams.get('targetId');
  return value || null;
}

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => privateJson({ muted: await listMuted(viewer) }));
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const targetId = await targetFrom(request);
    if (!targetId) return badRequest('targetId is required.');
    await muteUser(viewer, targetId);
    return privateJson({ muted: true });
  });
}

export async function DELETE(request: Request) {
  return withViewer(request, async (viewer) => {
    const targetId = await targetFrom(request);
    if (!targetId) return badRequest('targetId is required.');
    await unmuteUser(viewer, targetId);
    return privateJson({ muted: false });
  });
}
