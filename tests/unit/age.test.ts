import { describe, expect, it } from 'vitest';
import {
  ageBand,
  ageFromDate,
  guardianLinkId,
  isValidEmail,
  relativeTime,
  slugify,
} from '@/lib/utils/dates';

const REFERENCE = new Date('2026-11-18T00:00:00.000Z');

describe('age derivation', () => {
  it('computes whole years at the reference date', () => {
    expect(ageFromDate('2008-11-18', REFERENCE)).toBe(18);
    expect(ageFromDate('2008-11-19', REFERENCE)).toBe(17);
    expect(ageFromDate('2013-11-18', REFERENCE)).toBe(13);
  });

  it('rejects malformed and impossible dates', () => {
    expect(ageFromDate('18/11/2008', REFERENCE)).toBeNull();
    expect(ageFromDate('', REFERENCE)).toBeNull();
    expect(ageFromDate('2099-01-01', REFERENCE)).toBeNull();
  });

  it('bands ages for safeguarding decisions', () => {
    expect(ageBand('2015-01-01', REFERENCE)).toBe('under-13');
    expect(ageBand('2012-01-01', REFERENCE)).toBe('minor');
    expect(ageBand('2000-01-01', REFERENCE)).toBe('adult');
    expect(ageBand(null, REFERENCE)).toBe('unknown');
  });

  it('does not infer age from grade, only from the date', () => {
    // A Class 10 learner can still be 12 years old; the date decides.
    expect(ageBand('2016-05-05', REFERENCE)).toBe('under-13');
  });
});

describe('helpers', () => {
  it('builds deterministic guardian link ids', () => {
    expect(guardianLinkId('guardian1', 'student1')).toBe('guardian1_student1');
    expect(guardianLinkId('a', 'b')).toBe(guardianLinkId('a', 'b'));
  });

  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('slugifies names for handles and institution slugs', () => {
    expect(slugify('Greenfield Public School')).toBe('greenfield-public-school');
    expect(slugify('St. Xavier’s College')).toBe('st-xavier-s-college');
    expect(slugify('***')).toBe('');
  });

  it('formats relative times in the past', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000);
    expect(relativeTime(twoHoursAgo)).toMatch(/hours? ago/);
  });
});
