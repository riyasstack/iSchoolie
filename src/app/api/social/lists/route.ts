import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { createList, listSocialLists } from '@/lib/server/social/lists';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ lists: await listSocialLists(viewer) }),
  );
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ name?: unknown; description?: unknown; visibility?: unknown }>(request);
    if (!body || typeof body.name !== 'string') {
      return privateJson({ error: 'A list name is required.' }, { status: 400 });
    }
    const list = await createList(viewer, {
      name: body.name,
      description: typeof body.description === 'string' ? body.description : '',
      visibility: body.visibility === 'public' ? 'public' : 'private',
    });
    return privateJson({ list });
  });
}
