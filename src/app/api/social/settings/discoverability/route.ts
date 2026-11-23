import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { getDiscoverability, updateDiscoverability } from '@/lib/server/social/profiles';
import type { DiscoverabilitySettings } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ settings: await getDiscoverability(viewer) }),
  );
}

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<Partial<DiscoverabilitySettings>>(request);
    if (!body) return privateJson({ error: 'Expected a JSON body.' }, { status: 400 });
    const settings = await updateDiscoverability(viewer, body);
    return privateJson({ settings });
  });
}
