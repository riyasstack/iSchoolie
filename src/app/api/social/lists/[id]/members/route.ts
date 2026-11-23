import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { addListMember, getListDetail, removeListMember } from '@/lib/server/social/lists';

export const dynamic = 'force-dynamic';

async function userIdFrom(request: Request): Promise<string | null> {
  const body = await readJson<{ userId?: unknown; handle?: unknown }>(request);
  if (body && typeof body.userId === 'string') return body.userId;
  if (body && typeof body.handle === 'string') {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { handle: body.handle.toLowerCase().replace(/^@/, '') },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const userId = await userIdFrom(request);
    if (!userId) return badRequest('A userId or handle is required.');
    await addListMember(viewer, id, userId);
    return privateJson(await getListDetail(viewer, id));
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withViewer(request, async (viewer) => {
    const userId = await userIdFrom(request);
    if (!userId) return badRequest('A userId or handle is required.');
    await removeListMember(viewer, id, userId);
    return privateJson(await getListDetail(viewer, id));
  });
}
