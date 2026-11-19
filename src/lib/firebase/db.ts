/** Small Firestore helpers shared by the service layer. */
import {
  doc,
  getDoc,
  getDocs,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/client';

export function requireDb(): Firestore {
  return getDb();
}

export function docWithId<T>(snapshot: DocumentSnapshot<DocumentData>): T | null {
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as unknown as T;
}

export function docsWithId<T>(snapshot: {
  docs: Array<{ id: string; data(): unknown }>;
}): T[] {
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...(item.data() as DocumentData) }) as unknown as T,
  );
}

export async function getDocData<T>(path: string, ...segments: string[]): Promise<T | null> {
  const reference = doc(requireDb(), path, ...segments);
  const snapshot = await getDoc(reference);
  return docWithId<T>(snapshot);
}

export async function getQueryData<T>(queryLike: Parameters<typeof getDocs>[0]): Promise<T[]> {
  const snapshot = await getDocs(queryLike);
  return docsWithId<T>(snapshot);
}

/** Read a Firestore Timestamp defensively (may be null right after a write). */
export function timestampToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as Timestamp;
    if (typeof candidate.toDate === 'function') return candidate.toDate();
  }
  return null;
}

/** Firestore write limited to 500 documents per batch. */
export const BATCH_LIMIT = 500;
