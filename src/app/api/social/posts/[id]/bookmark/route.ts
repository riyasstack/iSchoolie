import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { setBookmark } from '@/lib/server/social/posts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => privateJson(await setBookmark(viewer, id, true)));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => privateJson(await setBookmark(viewer, id, false)));
}
