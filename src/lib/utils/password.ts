/**
 * Password guidance.
 *
 * Follows current NIST-aligned advice rather than legacy composition rules:
 * length is the primary control, no forced symbol classes, and a small
 * common-password denylist to catch the worst offenders. Guidance is shown
 * live, but the only hard requirement is length ≥ 8.
 */
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyui',
  'qwerty123',
  'iloveyou',
  'welcome1',
  'abc12345',
  'letmein1',
  'admin123',
  'ischoolie',
]);

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordAssessment {
  score: PasswordScore;
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  suggestions: string[];
  isCommon: boolean;
  isValid: boolean;
}

export function assessPassword(value: string): PasswordAssessment {
  const normalised = value.trim().toLowerCase();
  const isCommon = COMMON_PASSWORDS.has(normalised);
  const length = value.length;
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let score: PasswordScore = 0;
  if (length >= PASSWORD_MIN_LENGTH && !isCommon) {
    const longBonus = length >= 14 ? 2 : length >= 11 ? 1 : 0;
    const raw = 1 + longBonus + (variety >= 3 ? 1 : 0);
    score = Math.min(4, raw) as PasswordScore;
  }
  if (isCommon) score = 0;

  const suggestions: string[] = [];
  if (length < PASSWORD_MIN_LENGTH) suggestions.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (isCommon) suggestions.push('This is a commonly used password. Pick something unique.');
  if (length >= 8 && length < 11) suggestions.push('A longer passphrase is much harder to guess.');
  if (variety < 3 && length >= 8) suggestions.push('Mix upper case, lower case, numbers or symbols.');

  const labels: Record<PasswordScore, PasswordAssessment['label']> = {
    0: length === 0 ? 'Too short' : isCommon ? 'Weak' : 'Too short',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };

  return {
    score,
    label: labels[score],
    suggestions,
    isCommon,
    isValid: length >= PASSWORD_MIN_LENGTH && length <= 72 && !isCommon,
  };
}

/** Zod-friendly predicate shared by schema and form. */
export function isAcceptablePassword(value: string): boolean {
  return assessPassword(value).isValid;
}
