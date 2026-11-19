/**
 * Safe redirect handling for post-authentication navigation.
 *
 * An attacker can craft `/login?next=https://evil.example`, and any app that
 * redirects blindly after sign-in becomes an open redirector. We therefore
 * accept only same-origin, absolute-path values and reject everything else.
 */

const BLOCKED_PREFIXES = ['//', '/\\', '\\\\'];

/** Returns a safe internal path, or the fallback. */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (value.length === 0 || value.length > 512) return fallback;

  // Reject control characters and whitespace that some URLs tolerate.
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return fallback;
  // Protocol-relative and backslash tricks (browsers normalise \ to /).
  if (BLOCKED_PREFIXES.some((prefix) => value.startsWith(prefix))) return fallback;
  // Only absolute paths.
  if (!value.startsWith('/')) return fallback;
  // Reject encoded protocol-relative forms such as /%2F%2Fevil.com
  if (/^\/%2f/i.test(value) || /^\/%5c/i.test(value)) return fallback;
  // Never bounce back into auth screens after a successful login.
  if (/^\/(login|signup|reset-password|forgot-password)(\/|\?|$)/.test(value)) return fallback;

  return value;
}

/** Read `next` from a URLSearchParams-like object. */
export function redirectFromSearch(search: { get(name: string): string | null }): string {
  return safeRedirectPath(search.get('next'), '/dashboard');
}
