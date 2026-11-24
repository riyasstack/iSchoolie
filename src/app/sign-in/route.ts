import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirectPath } from '@/lib/auth/redirect';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

/** Initiate login URI registered in the WorkOS dashboard. */
export async function GET(request: NextRequest) {
  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
  const next = safeRedirectPath(request.nextUrl.searchParams.get('next'), '/auth/redirect');
  try {
    return NextResponse.redirect(await getSignInUrl({ returnTo: next }));
  } catch {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}
