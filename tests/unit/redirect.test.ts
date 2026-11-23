import { describe, expect, it } from 'vitest';
import { redirectFromSearch, safeRedirectPath } from '@/lib/auth/redirect';

describe('safeRedirectPath', () => {
  it('accepts same-origin absolute paths', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/dashboard/class?classId=abc')).toBe(
      '/dashboard/class?classId=abc',
    );
  });

  it('rejects absolute URLs and protocol-relative URLs', () => {
    expect(safeRedirectPath('https://evil.example')).toBe('/feed');
    expect(safeRedirectPath('http://evil.example')).toBe('/feed');
    expect(safeRedirectPath('//evil.example')).toBe('/feed');
    expect(safeRedirectPath('/\\evil.example')).toBe('/feed');
    expect(safeRedirectPath('\\\\evil.example')).toBe('/feed');
  });

  it('rejects encoded protocol-relative tricks', () => {
    expect(safeRedirectPath('/%2F%2Fevil.example')).toBe('/feed');
    expect(safeRedirectPath('/%5Cevil.example')).toBe('/feed');
  });

  it('rejects javascript: and whitespace/control characters', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/feed');
    expect(safeRedirectPath('/dash board')).toBe('/feed');
    expect(safeRedirectPath('/dash\u0000board')).toBe('/feed');
  });

  it('never bounces back into auth screens', () => {
    expect(safeRedirectPath('/login?next=/x')).toBe('/feed');
    expect(safeRedirectPath('/signup')).toBe('/feed');
    expect(safeRedirectPath('/forgot-password')).toBe('/feed');
  });

  it('falls back for empty and oversized values', () => {
    expect(safeRedirectPath('')).toBe('/feed');
    expect(safeRedirectPath(null)).toBe('/feed');
    expect(safeRedirectPath(undefined)).toBe('/feed');
    expect(safeRedirectPath(`/${'a'.repeat(600)}`)).toBe('/feed');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirectPath(null, '/onboarding')).toBe('/onboarding');
  });

  it('reads the next parameter from a search object', () => {
    expect(redirectFromSearch(new URLSearchParams('next=/courses'))).toBe('/courses');
    expect(redirectFromSearch(new URLSearchParams('next=//evil.example'))).toBe('/feed');
  });
});
