import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { deleteList, getListDetail, updateList } from '@/lib/server/social/lists';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const detail = await getListDetail(viewer, id);
    if (!detail) return privateJson({ error: 'That list is not available.' }, { status: 404 });
    return privateJson(detail);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ name?: unknown; description?: unknown; visibility?: unknown }>(request);
    if (!body) return privateJson({ error: 'Expected a JSON body.' }, { status: 400 });
    await updateList(viewer, id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      visibility: body.visibility === 'public' ? 'public' : body.visibility === 'private' ? 'private' : undefined,
    });
    return privateJson({ list: (await getListDetail(viewer, id))?.list ?? null });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    await deleteList(viewer, id);
    return privateJson({ deleted: true });
  });
}
