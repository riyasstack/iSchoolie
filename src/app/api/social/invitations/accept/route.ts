import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { acceptInvitation } from '@/lib/server/social/invitations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ token?: unknown }>(request);
    if (!body || typeof body.token !== 'string') return badRequest('token is required.');
    const result = await acceptInvitation(viewer, body.token);
    return privateJson({ result });
  });
}
