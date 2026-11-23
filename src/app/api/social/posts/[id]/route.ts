import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { deletePost, editPost, getPostDetail, getPostById } from '@/lib/server/social/posts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const detail = await getPostDetail(viewer, id);
    if (!detail) return privateJson({ error: 'That post is not available.' }, { status: 404 });
    return privateJson(detail);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const body = await readJson<{
      body?: unknown;
      audience?: unknown;
      topicSlugs?: unknown;
      mediaIds?: unknown;
    }>(request);
    if (!body || typeof body.body !== 'string') return badRequest('A post body is required.');
    const post = await editPost(viewer, id, {
      body: body.body,
      audience:
        body.audience === 'followers' || body.audience === 'private' ? body.audience : 'public',
      topicSlugs: Array.isArray(body.topicSlugs)
        ? body.topicSlugs.filter((value): value is string => typeof value === 'string')
        : [],
      mediaIds: Array.isArray(body.mediaIds)
        ? body.mediaIds.filter((value): value is string => typeof value === 'string')
        : [],
    });
    return privateJson({ post });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    await deletePost(viewer, id);
    return privateJson({ deleted: true, post: await getPostById(viewer, id) });
  });
}
