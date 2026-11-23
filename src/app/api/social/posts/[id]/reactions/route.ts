import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { setReaction } from '@/lib/server/social/posts';
import { rateLimit } from '@/lib/server/social/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`react:${viewer.user.id}`, 60, 60_000)) {
      return privateJson({ error: 'Too many reactions.' }, { status: 429 });
    }
    return privateJson(await setReaction(viewer, id, true));
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => privateJson(await setReaction(viewer, id, false)));
}
