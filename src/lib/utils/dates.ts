/** Date, age and formatting helpers. Pure functions (unit-tested). */
import { ADULT_AGE, MIN_INDEPENDENT_AGE } from '@/lib/constants';

/**
 * Age in whole years at `now`.
 * Ages are derived from the date of birth, never from class/grade selection.
 */
export function ageFromDate(isoDate: string, now: Date = new Date()): number | null {
  const dob = parseIsoDate(isoDate);
  if (!dob) return null;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type AgeBand = 'under-13' | 'minor' | 'adult' | 'unknown';

export function ageBand(isoDate: string | null, now: Date = new Date()): AgeBand {
  if (!isoDate) return 'unknown';
  const age = ageFromDate(isoDate, now);
  if (age === null) return 'unknown';
  if (age < MIN_INDEPENDENT_AGE) return 'under-13';
  if (age < ADULT_AGE) return 'minor';
  return 'adult';
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** Accepts Firestore Timestamps, Dates and ISO strings from the API. */
export type DateLike = Date | string | { toDate(): Date };

function resolveDate(value: DateLike): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return value.toDate();
}

export function formatDateTime(value: DateLike | null | undefined): string {
  if (!value) return '—';
  const date = resolveDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function relativeTime(value: DateLike | null | undefined): string {
  if (!value) return '—';
  const date = resolveDate(value);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (abs >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '?';
}

/** Student ↔ guardian link id. Deterministic so rules can `get()` it directly. */
export function guardianLinkId(guardianUid: string, studentUid: string): string {
  return `${guardianUid}_${studentUid}`;
}

export function randomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}
