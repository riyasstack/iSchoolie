import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { provisionAccount, setActiveWorkspace } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * Remember the workspace a person opened last.
 *
 * A convenience preference only: every workspace re-checks roles and
 * membership on the server, so this can never widen access.
 */
export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<{ workspaceId?: unknown }>(request);
  if (!body || !('workspaceId' in body)) return badRequest('Expected { workspaceId }.');
  const { workspaceId } = body;
  if (workspaceId !== null && typeof workspaceId !== 'string') {
    return badRequest('workspaceId must be a string or null.');
  }

  await setActiveWorkspace(user.id, workspaceId);
  return privateJson({ ok: true });
}
