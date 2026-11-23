import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { createPost } from '@/lib/server/social/posts';
import { rateLimit } from '@/lib/server/social/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`post:${viewer.user.id}`, 12, 5 * 60_000)) {
      return privateJson({ error: 'You are posting too quickly. Try again shortly.' }, { status: 429 });
    }
    const body = await readJson<{
      body?: unknown;
      audience?: unknown;
      topicSlugs?: unknown;
      mediaIds?: unknown;
      replyToId?: unknown;
      quoteOfId?: unknown;
    }>(request);
    if (!body || typeof body.body !== 'string') return badRequest('A post body is required.');

    const post = await createPost(viewer, {
      body: body.body,
      audience:
        body.audience === 'followers' || body.audience === 'private' ? body.audience : 'public',
      topicSlugs: Array.isArray(body.topicSlugs)
        ? body.topicSlugs.filter((value): value is string => typeof value === 'string')
        : [],
      mediaIds: Array.isArray(body.mediaIds)
        ? body.mediaIds.filter((value): value is string => typeof value === 'string')
        : [],
      replyToId: typeof body.replyToId === 'string' ? body.replyToId : null,
      quoteOfId: typeof body.quoteOfId === 'string' ? body.quoteOfId : null,
    });
    return privateJson({ post });
  });
}
