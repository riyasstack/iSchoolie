import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public alias for `/sign-up` (the WorkOS initiate-login URI). */
export async function GET(request: NextRequest) {
  const url = new URL('/sign-up', request.url);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url);
}