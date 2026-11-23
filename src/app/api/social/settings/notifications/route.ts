import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/server/social/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ preferences: await getNotificationPreferences(viewer) }),
  );
}

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<Record<string, unknown>>(request);
    if (!body) return privateJson({ error: 'Expected a JSON body.' }, { status: 400 });
    const preferences: Record<string, boolean> = {};
    for (const key of ['follows', 'reactions', 'replies', 'mentions', 'reposts', 'quotes', 'moderation']) {
      if (typeof body[key] === 'boolean') preferences[key] = body[key] as boolean;
    }
    await updateNotificationPreferences(viewer, preferences);
    return privateJson({ preferences: await getNotificationPreferences(viewer) });
  });
}
