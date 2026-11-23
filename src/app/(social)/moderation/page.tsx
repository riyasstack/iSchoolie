import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/server/social/auth';
import { getModerationCounts, listModerationReports } from '@/lib/server/social/moderation';
import { ModerationQueue } from '@/components/social/moderation-queue';

export const metadata: Metadata = {
  title: 'Moderation',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const viewer = await requirePlatformAdmin();
  const [reports, counts] = await Promise.all([
    listModerationReports(viewer),
    getModerationCounts(),
  ]);

  return (
    <div className="bg-surface pb-6 sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Platform administration
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink">Moderation queue</h1>
        <p className="text-xs leading-relaxed text-subtle">
          Reports are reviewed against the community guidelines. Every action is recorded in the audit
          log and the affected account is notified.
        </p>
      </header>
      <ModerationQueue initial={reports} initialCounts={counts} />
    </div>
  );
}
