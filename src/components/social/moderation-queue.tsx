'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff, ShieldAlert, ShieldCheck, Trash2, UserX, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SocialEmptyState } from '@/components/social/social-empty';
import type { ReportView } from '@/lib/social/types';

type Action = 'dismiss' | 'hide' | 'remove' | 'suspend';

const ACTION_LABEL: Record<Action, string> = {
  dismiss: 'Dismiss',
  hide: 'Hide content',
  remove: 'Remove content',
  suspend: 'Suspend account',
};

export function ModerationQueue({
  initial,
  initialCounts,
}: {
  initial: ReportView[];
  initialCounts: { open: number; reviewing: number; actioned: number };
}) {
  const router = useRouter();
  const [reports, setReports] = React.useState(initial);
  const [counts, setCounts] = React.useState(initialCounts);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function resolve(report: ReportView, action: Action) {
    if (action === 'suspend' && !window.confirm(`Suspend ${report.reporterHandle ? 'this account' : 'the account'}? They will lose access immediately.`)) {
      return;
    }
    setBusy(report.id);
    setError(null);
    try {
      const response = await fetch(`/api/social/moderation/${report.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not resolve this report.');
      }
      setReports((current) => current.filter((item) => item.id !== report.id));
      setCounts((current) => ({
        ...current,
        open: Math.max(0, current.open - (report.status === 'open' ? 1 : 0)),
        reviewing: Math.max(0, current.reviewing - (report.status === 'reviewing' ? 1 : 0)),
        actioned: current.actioned + (action === 'dismiss' ? 0 : 1),
      }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resolve this report.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 border-b border-line px-4 py-3 sm:px-5">
        {[
          { label: 'Open', value: counts.open },
          { label: 'Reviewing', value: counts.reviewing },
          { label: 'Actioned', value: counts.actioned },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-mutedSurface/60 px-3 py-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-subtle">{stat.label}</p>
            <p className="text-lg font-semibold tabular-nums text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm text-danger sm:mx-5">
          {error}
        </p>
      )}

      {reports.length === 0 ? (
        <SocialEmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="The queue is clear"
          description="New reports from the community will appear here for review."
        />
      ) : (
        <ul className="divide-y divide-line">
          {reports.map((report) => (
            <li key={report.id} className="px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-danger">
                  <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  {report.targetType}
                </span>
                <span className="text-xs font-medium text-ink">{report.reason}</span>
                <span className="text-2xs text-subtle">
                  reported by @{report.reporterHandle} ·{' '}
                  {new Date(report.createdAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="ml-auto rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-semibold text-subtle">
                  {report.status}
                </span>
              </div>

              {report.targetPreview && (
                <blockquote className="mt-2 rounded-xl border border-line bg-mutedSurface/40 p-3 text-sm leading-relaxed text-ink">
                  “{report.targetPreview}”
                </blockquote>
              )}
              {report.details && (
                <p className="mt-2 text-xs leading-relaxed text-subtle">
                  <span className="font-semibold text-ink">Reporter note: </span>
                  {report.details}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy === report.id}
                  onClick={() => void resolve(report, 'dismiss')}
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> {ACTION_LABEL.dismiss}
                </Button>
                {report.targetType !== 'user' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === report.id}
                      onClick={() => void resolve(report, 'hide')}
                    >
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> {ACTION_LABEL.hide}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busy === report.id}
                      onClick={() => void resolve(report, 'remove')}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> {ACTION_LABEL.remove}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy === report.id}
                  onClick={() => void resolve(report, 'suspend')}
                >
                  <UserX className="h-3.5 w-3.5" aria-hidden="true" /> {ACTION_LABEL.suspend}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
