import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getListTimeline } from '@/lib/server/social/lists';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const page = await getListTimeline(
      viewer,
      id,
      query(request).get('cursor'),
      Number(query(request).get('limit') ?? 20),
    );
    if (!page) return privateJson({ error: 'That list is not available.' }, { status: 404 });
    return privateJson(page);
  });
}
