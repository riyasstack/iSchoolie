import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { setRepost } from '@/lib/server/social/posts';
import { rateLimit } from '@/lib/server/social/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`repost:${viewer.user.id}`, 30, 60_000)) {
      return privateJson({ error: 'Too many reposts.' }, { status: 429 });
    }
    return privateJson(await setRepost(viewer, id, true));
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => privateJson(await setRepost(viewer, id, false)));
}
