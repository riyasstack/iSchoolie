import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getBookmarks } from '@/lib/server/social/posts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const page = await getBookmarks(
      viewer,
      query(request).get('cursor'),
      Number(query(request).get('limit') ?? 20),
    );
    return privateJson(page);
  });
}
