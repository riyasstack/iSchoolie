import { signOut } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

/**
 * Ends the AuthKit session and clears the sealed cookie. The WorkOS dashboard
 * needs a default Sign-out URI under Applications → Redirects.
 */
export async function GET(request: NextRequest) {
  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  await signOut({ returnTo: new URL('/', request.url).toString() });
  // `signOut` redirects; this is unreachable but keeps the signature honest.
  return NextResponse.redirect(new URL('/', request.url));
}
