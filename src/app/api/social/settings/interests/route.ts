import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { getViewerInterestTopics, saveInterests } from '@/lib/server/social/topics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ interests: await getViewerInterestTopics(viewer) }),
  );
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ slugs?: unknown }>(request);
    if (!body || !Array.isArray(body.slugs)) return badRequest('slugs must be an array.');
    await saveInterests(
      viewer,
      body.slugs.filter((value): value is string => typeof value === 'string'),
    );
    return privateJson({ interests: await getViewerInterestTopics(viewer) });
  });
}
