import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { rateLimit } from '@/lib/server/social/rate-limit';
import { createInvitation, listInvitations } from '@/lib/server/social/invitations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ invitations: await listInvitations(viewer) }),
  );
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`invite:${viewer.user.id}`, 10, 15 * 60_000)) {
      return privateJson({ error: 'Too many invitations. Try again later.' }, { status: 429 });
    }
    const body = await readJson<{ email?: unknown; note?: unknown }>(request);
    const invitation = await createInvitation(viewer, {
      email: typeof body?.email === 'string' ? body.email : null,
      note: typeof body?.note === 'string' ? body.note : null,
    });
    return privateJson({ invitation, sharePath: `/join/${invitation.token}` });
  });
}
