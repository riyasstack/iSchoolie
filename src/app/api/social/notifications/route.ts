import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/server/social/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const params = query(request);
    const page = await listNotifications(viewer, {
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') ?? 20),
      mentionsOnly: params.get('mentions') === 'true',
    });
    return privateJson(page);
  });
}

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ id?: unknown; all?: unknown }>(request);
    if (body?.all === true) {
      return privateJson({ marked: await markAllNotificationsRead(viewer) });
    }
    if (!body || typeof body.id !== 'string') return badRequest('A notification id is required.');
    await markNotificationRead(viewer, body.id);
    return privateJson({ marked: 1 });
  });
}
