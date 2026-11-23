import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getMoreReplies } from '@/lib/server/social/posts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const page = await getMoreReplies(
      viewer,
      id,
      query(request).get('cursor'),
      Number(query(request).get('limit') ?? 20),
    );
    return privateJson(page);
  });
}
