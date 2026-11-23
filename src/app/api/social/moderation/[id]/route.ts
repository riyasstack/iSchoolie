import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { resolveReport, type ModerationAction } from '@/lib/server/social/moderation';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    if (!viewer.user.platformAdmin) {
      return privateJson({ error: 'Moderation is restricted.' }, { status: 403 });
    }
    const body = await readJson<{ action?: unknown }>(request);
    if (
      !body ||
      (body.action !== 'dismiss' &&
        body.action !== 'hide' &&
        body.action !== 'remove' &&
        body.action !== 'suspend')
    ) {
      return badRequest('Choose a moderation action.');
    }
    await resolveReport(viewer, id, body.action as ModerationAction);
    return privateJson({ ok: true });
  });
}
