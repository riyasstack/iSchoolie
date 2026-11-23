import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

/**
 * AuthKit session middleware.
 *
 * It seals/refreshes the `wos-session` cookie and forwards the session headers
 * that `withAuth()` reads in server components and route handlers. Static
 * assets are excluded so CSS and images are not intercepted.
 */
export default authkitMiddleware();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|webp|ico|css|js|map|woff2?)$).*)'],
};
