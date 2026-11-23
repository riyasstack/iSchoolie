import { privateJson, unauthorized } from '@/lib/server/api';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { getWorkOS } from '@workos-inc/authkit-nextjs';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  await provisionAccount(workosUser);

  try {
    const sessions = await getWorkOS().userManagement.listSessions(workosUser.id);
    for (const session of sessions.data ?? []) {
      try {
        await getWorkOS().userManagement.revokeSession({ sessionId: session.id });
      } catch {
        // Best effort: continue revoking the rest.
      }
    }
  } catch {
    return privateJson({ error: 'Could not revoke sessions.' }, { status: 400 });
  }

  return privateJson({ ok: true });
}