import 'server-only';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from '@/lib/social/catalog';
import type { SocialViewerRecord } from '@/lib/server/social/auth';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

function signatureMatches(buffer: Buffer, mime: string): boolean {
  const starts = (bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);
  switch (mime) {
    case 'image/jpeg':
      return starts([0xff, 0xd8, 0xff]);
    case 'image/png':
      return starts([0x89, 0x50, 0x4e, 0x47]);
    case 'image/gif':
      return buffer.subarray(0, 4).toString('ascii') === 'GIF8';
    case 'image/webp':
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf':
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';
    default:
      return false;
  }
}

export async function saveUpload(
  viewer: SocialViewerRecord,
  file: File,
  altText: string | null,
): Promise<{ id: string; url: string; kind: 'image' | 'document'; mimeType: string; sizeBytes: number }> {
  const mimeType = file.type.toLowerCase();
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error('Only JPEG, PNG, WebP, GIF and PDF files are supported.');
  }
  if (file.size <= 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Files must be 8 MB or smaller.');

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(buffer, mimeType)) {
    throw new Error('The file content does not match its declared type.');
  }

  const id = randomUUID();
  const extension = EXTENSIONS[mimeType] ?? 'bin';
  const storageKey = `${id}.${extension}`;

  const kind = mimeType === 'application/pdf' ? 'document' : 'image';
  await prisma.socialMediaAsset.create({
    data: {
      id,
      ownerId: viewer.user.id,
      kind,
      storageKey,
      mimeType,
      sizeBytes: buffer.length,
      data: buffer,
      altText: altText ? altText.replace(/\s+/g, ' ').trim().slice(0, 300) : null,
    },
  });

  return {
    id,
    url: `/api/social/media/${id}`,
    kind,
    mimeType,
    sizeBytes: buffer.length,
  };
}

export function resolveStoragePath(storageKey: string): string {
  return storageKey;
}

export async function readMedia(assetId: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const asset = await prisma.socialMediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || !asset.data) return null;
  return { bytes: Buffer.from(asset.data), mimeType: asset.mimeType };
}

export const mediaUrl = (assetId: string) => `/api/social/media/${assetId}`;
