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
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('http://evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('/\\evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('\\\\evil.example')).toBe('/dashboard');
  });

  it('rejects encoded protocol-relative tricks', () => {
    expect(safeRedirectPath('/%2F%2Fevil.example')).toBe('/dashboard');
    expect(safeRedirectPath('/%5Cevil.example')).toBe('/dashboard');
  });

  it('rejects javascript: and whitespace/control characters', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
    expect(safeRedirectPath('/dash board')).toBe('/dashboard');
    expect(safeRedirectPath('/dash\u0000board')).toBe('/dashboard');
  });

  it('never bounces back into auth screens', () => {
    expect(safeRedirectPath('/login?next=/x')).toBe('/dashboard');
    expect(safeRedirectPath('/signup')).toBe('/dashboard');
    expect(safeRedirectPath('/forgot-password')).toBe('/dashboard');
  });

  it('falls back for empty and oversized values', () => {
    expect(safeRedirectPath('')).toBe('/dashboard');
    expect(safeRedirectPath(null)).toBe('/dashboard');
    expect(safeRedirectPath(undefined)).toBe('/dashboard');
    expect(safeRedirectPath(`/${'a'.repeat(600)}`)).toBe('/dashboard');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirectPath(null, '/onboarding')).toBe('/onboarding');
  });

  it('reads the next parameter from a search object', () => {
    expect(redirectFromSearch(new URLSearchParams('next=/courses'))).toBe('/courses');
    expect(redirectFromSearch(new URLSearchParams('next=//evil.example'))).toBe('/dashboard');
  });
});
