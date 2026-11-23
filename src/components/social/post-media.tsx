import { FileText } from 'lucide-react';
import type { PostMediaView } from '@/lib/social/types';

/** Authenticated media: the src is a session-checked route, never a public path. */
export function PostMedia({ media }: { media: PostMediaView[] }) {
  if (media.length === 0) return null;
  const images = media.filter((item) => item.kind === 'image');
  const documents = media.filter((item) => item.kind === 'document');

  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div
          className={
            images.length === 1
              ? 'overflow-hidden rounded-2xl border border-line'
              : 'grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl'
          }
        >
          {images.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block bg-mutedSurface"
              aria-label={item.altText ? `Open image: ${item.altText}` : 'Open attached image'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.altText ?? ''}
                loading="lazy"
                className={
                  images.length === 1
                    ? 'max-h-[430px] w-full object-cover'
                    : 'h-44 w-full object-cover transition duration-300 group-hover:opacity-95'
                }
              />
            </a>
          ))}
        </div>
      )}

      {documents.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-line bg-mutedSurface/50 px-3 py-2.5 transition hover:border-brand/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand">
            <FileText className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {item.altText || 'Attached document'}
            </span>
            <span className="block text-xs text-subtle">PDF document</span>
          </span>
        </a>
      ))}
    </div>
  );
}
