import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { requireSocialViewer, toSocialViewer } from '@/lib/server/social/auth';
import { getPostById } from '@/lib/server/social/posts';
import { listTopics } from '@/lib/server/social/topics';
import { PostComposer } from '@/components/social/post-composer';

export const metadata: Metadata = {
  title: 'Create a post',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; quote?: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: '/compose' });
  const params = await searchParams;
  const topics = await listTopics(viewer);

  const editing = params.edit ? await getPostById(viewer, params.edit) : null;
  if (params.edit && (!editing || !editing.viewer.canEdit)) notFound();
  const quoting = params.quote ? await getPostById(viewer, params.quote) : null;
  if (params.quote && !quoting) notFound();

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <Link
          href={editing ? `/post/${editing.id}` : '/feed'}
          className="inline-flex items-center gap-1 text-2xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
        </Link>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink">
          {editing ? 'Edit post' : quoting ? 'Quote post' : 'Create a post'}
        </h1>
        <p className="text-xs text-subtle">
          {editing
            ? 'Edits are marked on the post. You can change the text, audience and topics.'
            : quoting
              ? 'Add your perspective to another eligible post.'
              : 'Share a question, a resource or something you have learned with your education network.'}
        </p>
      </header>

      <div className="px-4 py-4 sm:px-5">
        <PostComposer
          viewer={toSocialViewer(viewer)}
          topics={topics.map((topic) => ({ slug: topic.slug, name: topic.name }))}
          mode={editing ? 'edit' : quoting ? 'quote' : 'create'}
          editPost={
            editing
              ? {
                  id: editing.id,
                  body: editing.body,
                  audience: editing.audience,
                  topicSlugs: editing.topics.map((topic) => topic.slug),
                }
              : undefined
          }
          quoteOf={
            quoting
              ? {
                  id: quoting.id,
                  author: quoting.author.displayName,
                  body: quoting.body,
                }
              : undefined
          }
          redirectTo={editing ? `/post/${editing.id}` : '/feed'}
          autoFocus
        />
      </div>

      <section className="border-t border-line px-4 py-4 text-2xs leading-relaxed text-subtle sm:px-5">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> Before you publish
        </p>
        <ul className="mt-1 space-y-1">
          <li>• Do not include a student&apos;s private information, exact address or academic record.</li>
          <li>• Student posts are visible to approved followers only, whatever audience is selected.</li>
          <li>• You can edit or delete your own post later from its menu.</li>
        </ul>
      </section>
    </div>
  );
}
