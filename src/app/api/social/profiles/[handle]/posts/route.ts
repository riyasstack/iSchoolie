import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getPostsByAuthor, type ProfileTab } from '@/lib/server/social/posts';
import { getProfileByHandle } from '@/lib/server/social/profiles';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  return withViewer(request, async (viewer) => {
    const profile = await getProfileByHandle(viewer, handle);
    if (!profile) return privateJson({ error: 'That profile is not available.' }, { status: 404 });
    if (!profile.canViewContent) {
      return privateJson({ error: 'Follow this account to see their posts.' }, { status: 403 });
    }
    const search = query(request);
    const rawTab = search.get('tab');
    const tab: ProfileTab =
      rawTab === 'replies' || rawTab === 'media' ? rawTab : 'posts';
    return privateJson(
      await getPostsByAuthor(
        viewer,
        profile.targetId,
        tab,
        search.get('cursor'),
        Number(search.get('limit') ?? 20),
      ),
    );
  });
}
