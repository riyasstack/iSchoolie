import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { searchPeople } from '@/lib/server/social/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const params = query(request);
    const term = params.get('q') ?? '';
    const page = await searchPeople(viewer, term, {
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') ?? 20),
    });
    return privateJson(page);
  });
}
