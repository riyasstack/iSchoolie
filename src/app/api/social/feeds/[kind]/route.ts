import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getFeed, type FeedKind } from '@/lib/server/social/posts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return withViewer(request, async (viewer) => {
    const normalized: FeedKind =
      kind === 'following' ? 'following' : kind === 'explore' ? 'explore' : 'for-you';
    const page = await getFeed(viewer, normalized, {
      cursor: query(request).get('cursor'),
      limit: Number(query(request).get('limit') ?? 20),
      topicSlug: query(request).get('topic') ?? undefined,
    });
    return privateJson(page);
  });
}
