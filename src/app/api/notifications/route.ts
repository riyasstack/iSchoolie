import { privateJson, readJson, unauthorized } from '@/lib/server/api';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  provisionAccount,
} from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);
  const requested = Number(new URL(request.url).searchParams.get('max') ?? '20');
  const max = Number.isFinite(requested) ? requested : 20;
  return privateJson({ notifications: await listNotifications(user.id, max) });
}

/** Mark one notification read (`id`) or a batch (`ids`). */
export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<{ id?: unknown; ids?: unknown }>(request);
  if (!body) return privateJson({ ok: true });

  if (typeof body.id === 'string') {
    await markNotificationRead(user.id, body.id);
    return privateJson({ ok: true });
  }
  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((id): id is string => typeof id === 'string');
    await markAllNotificationsRead(user.id, ids);
    return privateJson({ ok: true });
  }
  return privateJson({ ok: true });
}
