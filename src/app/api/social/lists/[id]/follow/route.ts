import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { setListFollow } from '@/lib/server/social/lists';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    await setListFollow(viewer, id, true);
    return privateJson({ following: true });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    await setListFollow(viewer, id, false);
    return privateJson({ following: false });
  });
}
