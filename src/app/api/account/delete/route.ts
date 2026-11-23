import { privateJson, readJson, unauthorized } from '@/lib/server/api';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { getWorkOS } from '@workos-inc/authkit-nextjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<{ password?: unknown }>(request);
  const password = typeof body?.password === 'string' ? body.password : '';

  // If the account has a password, require it for this destructive action.
  if (password) {
    try {
      await getWorkOS().userManagement.authenticateWithPassword({
        email: workosUser.email,
        password,
      });
    } catch {
      return privateJson({ error: 'Password is incorrect.' }, { status: 400 });
    }
  }

  try {
    await getWorkOS().userManagement.deleteUser(workosUser.id);
  } catch {
    return privateJson({ error: 'Could not delete the account.' }, { status: 400 });
  }

  // Best-effort local cleanup; WorkOS deletion is authoritative.
  try {
    await prisma.user.delete({ where: { id: user.id } });
  } catch {
    // ignore
  }

  return privateJson({ ok: true });
}