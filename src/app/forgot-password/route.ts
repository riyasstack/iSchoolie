import { NextResponse, type NextRequest } from 'next/server';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

/**
 * Password recovery is part of the hosted AuthKit sign-in screen, so this
 * handler forwards straight there. It is a route handler so old bookmarks get
 * one redirect instead of a page shell that renders empty.
 */
export async function GET(request: NextRequest) {
  const target = isWorkosConfigured() ? '/sign-in' : '/auth/error';
  return NextResponse.redirect(new URL(target, request.url));
}
