import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { listFollowers, listFollowing, listMutuals } from '@/lib/server/social/graph';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string; relation: string }> },
) {
  const { handle, relation } = await params;
  return withViewer(request, async (viewer) => {
    const search = query(request);
    if (relation === 'followers') {
      const result = await listFollowers(
        viewer,
        handle,
        search.get('cursor'),
        Number(search.get('limit') ?? 20),
      );
      return privateJson({ ...result.page, restricted: result.restricted });
    }
    if (relation === 'following') {
      const result = await listFollowing(
        viewer,
        handle,
        search.get('cursor'),
        Number(search.get('limit') ?? 20),
      );
      return privateJson({ ...result.page, restricted: result.restricted });
    }
    if (relation === 'mutuals') {
      const result = await listMutuals(viewer, handle, Number(search.get('limit') ?? 20));
      return privateJson({ ...result.page, restricted: result.restricted });
    }
    return privateJson({ error: 'Unknown relationship.' }, { status: 404 });
  });
}
