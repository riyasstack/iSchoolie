import 'server-only';

/** Base64url cursor helpers. Cursors are opaque to the client. */

export function encodeCursor(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor: string | null | undefined): T | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export function clampLimit(value: string | null | undefined, fallback = 20, max = 50): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export interface PostCursor {
  createdAt: string;
  id: string;
}

export function postCursorWhere(cursor: PostCursor | null) {
  if (!cursor) return {};
  const createdAt = new Date(cursor.createdAt);
  if (Number.isNaN(createdAt.getTime())) return {};
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { createdAt, id: { lt: cursor.id } },
    ],
  };
}

export function postCursorFrom(row: { createdAt: Date; id: string }): string {
  return encodeCursor({ createdAt: row.createdAt.toISOString(), id: row.id });
}
