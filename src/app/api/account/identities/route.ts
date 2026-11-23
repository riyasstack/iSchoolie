import { privateJson, unauthorized } from '@/lib/server/api';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { getWorkOS } from '@workos-inc/authkit-nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  await provisionAccount(workosUser);

  try {
    const identities = await getWorkOS().userManagement.getUserIdentities(workosUser.id);
    return privateJson({ identities });
  } catch {
    return privateJson({ identities: [] });
  }
}