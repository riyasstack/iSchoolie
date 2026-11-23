import type { Metadata } from 'next';
import { Bookmark } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getBookmarks } from '@/lib/server/social/posts';
import { PostList } from '@/components/social/post-list';
import { SocialEmptyState } from '@/components/social/social-empty';

export const metadata: Metadata = {
  title: 'Bookmarks',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const viewer = await requireSocialViewer({ nextPath: '/bookmarks' });
  const page = await getBookmarks(viewer, null, 20);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Bookmarks</h1>
        <p className="text-xs text-subtle">
          Private saved posts. Only you can see this list, and saving a post never notifies its author.
        </p>
      </header>
      <PostList
        initialPage={page}
        endpoint="/api/social/bookmarks"
        empty={
          <SocialEmptyState
            icon={<Bookmark className="h-5 w-5" />}
            title="No bookmarks yet"
            description="Use the bookmark action on any eligible post to keep it here for later."
            actions={[{ href: '/feed', label: 'Browse your feed', variant: 'secondary' }]}
          />
        }
        storageKey="bookmarks"
      />
    </div>
  );
}
