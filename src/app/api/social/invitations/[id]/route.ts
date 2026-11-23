import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { revokeInvitation } from '@/lib/server/social/invitations';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    await revokeInvitation(viewer, id);
    return privateJson({ revoked: true });
  });
}
