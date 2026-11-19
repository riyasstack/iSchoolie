import { describe, expect, it } from 'vitest';
import { assessPassword, isAcceptablePassword } from '@/lib/utils/password';

describe('password policy', () => {
  it('rejects short passwords even when complex', () => {
    expect(isAcceptablePassword('Aa1!')).toBe(false);
    expect(assessPassword('Aa1!').isValid).toBe(false);
  });

  it('accepts long passphrases with no forced symbol classes', () => {
    expect(isAcceptablePassword('greenfield')).toBe(true);
    expect(isAcceptablePassword('greenfield7')).toBe(true);
    expect(isAcceptablePassword('abcdefgh')).toBe(true);
  });

  it('rejects commonly used passwords regardless of length', () => {
    expect(assessPassword('password123').isCommon).toBe(true);
    expect(isAcceptablePassword('password123')).toBe(false);
  });

  it('scores long passphrases more highly than short ones', () => {
    const short = assessPassword('BlueSky9');
    const long = assessPassword('BlueSky9-Morning-Rain');
    expect(long.score).toBeGreaterThan(short.score);
  });

  it('rejects values beyond the Firebase maximum length', () => {
    expect(isAcceptablePassword('a1'.repeat(40))).toBe(false);
  });

  it('offers guidance rather than arbitrary rules', () => {
    const assessment = assessPassword('abc');
    expect(assessment.suggestions.length).toBeGreaterThan(0);
    expect(assessment.suggestions.join(' ')).toMatch(/8 characters/);
  });

  it('trims nothing for the length check but ignores case for the denylist', () => {
    expect(assessPassword('PASSWORD123').isCommon).toBe(true);
  });
});
