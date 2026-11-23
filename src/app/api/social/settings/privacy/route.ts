import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { getDiscoverability, updatePrivacy } from '@/lib/server/social/profiles';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{
      privateProfile?: unknown;
      showFollowers?: unknown;
      showFollowing?: unknown;
    }>(request);
    if (!body) return privateJson({ error: 'Expected a JSON body.' }, { status: 400 });
    await updatePrivacy(viewer, {
      privateProfile:
        typeof body.privateProfile === 'boolean' ? body.privateProfile : undefined,
      showFollowers:
        typeof body.showFollowers === 'boolean' ? body.showFollowers : undefined,
      showFollowing:
        typeof body.showFollowing === 'boolean' ? body.showFollowing : undefined,
    });
    return privateJson({ settings: await getDiscoverability(viewer) });
  });
}
