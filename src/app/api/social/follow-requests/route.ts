import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import {
  acceptFollowRequest,
  cancelFollowRequestById,
  declineFollowRequest,
  listFollowRequests,
} from '@/lib/server/social/graph';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ requests: await listFollowRequests(viewer) }),
  );
}

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ id?: unknown; action?: unknown }>(request);
    if (!body || typeof body.id !== 'string') return badRequest('A request id is required.');
    if (body.action === 'accept') {
      await acceptFollowRequest(viewer, body.id);
    } else if (body.action === 'decline') {
      await declineFollowRequest(viewer, body.id);
    } else if (body.action === 'cancel') {
      await cancelFollowRequestById(viewer, body.id);
    } else {
      return badRequest('Unknown follow-request action.');
    }
    return privateJson({ ok: true });
  });
}
