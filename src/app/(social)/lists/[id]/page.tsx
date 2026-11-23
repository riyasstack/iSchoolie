import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getListDetail, getListTimeline } from '@/lib/server/social/lists';
import { ListDetail } from '@/components/social/list-detail';

export const dynamic = 'force-dynamic';

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireSocialViewer({ nextPath: `/lists/${id}` });
  const detail = await getListDetail(viewer, id);
  if (!detail) notFound();
  const timeline = await getListTimeline(viewer, id, null, 20);
  if (!timeline) notFound();

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <div className="border-b border-line px-4 pt-3 sm:px-5">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1 text-2xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All lists
        </Link>
      </div>
      <ListDetail
        list={detail.list}
        members={detail.members}
        canEdit={detail.canEdit}
        initialTimeline={timeline}
      />
    </div>
  );
}
