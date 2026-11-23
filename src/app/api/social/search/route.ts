import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { searchContent } from '@/lib/server/social/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const params = query(request);
    const rawType = params.get('type') ?? 'top';
    const type =
      rawType === 'latest' || rawType === 'people' || rawType === 'media' || rawType === 'topics'
        ? rawType
        : 'top';
    const results = await searchContent(viewer, params.get('q') ?? '', type);
    return privateJson(results);
  });
}
