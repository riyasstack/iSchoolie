import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listSocialLists } from '@/lib/server/social/lists';
import { ListsManager } from '@/components/social/lists-manager';

export const metadata: Metadata = {
  title: 'Lists',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/lists' });
  const lists = await listSocialLists(viewer);

  return (
    <div className="bg-surface pb-6 sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Lists</h1>
        <p className="text-xs leading-relaxed text-subtle">
          Curate accounts into focused timelines: science educators, AI researchers, exam resources or
          anything useful to your learning.
        </p>
      </header>
      <div className="px-4 py-4 sm:px-5">
        <ListsManager initial={lists} />
      </div>
    </div>
  );
}
