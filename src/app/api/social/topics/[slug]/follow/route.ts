import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { toggleTopicFollow } from '@/lib/server/social/topics';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withViewer(request, async (viewer) =>
    privateJson(await toggleTopicFollow(viewer, slug, true)),
  );
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withViewer(request, async (viewer) =>
    privateJson(await toggleTopicFollow(viewer, slug, false)),
  );
}
