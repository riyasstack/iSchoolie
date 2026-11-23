'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { REPORT_REASONS } from '@/lib/social/catalog';

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  onClose,
}: {
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}) {
  const [reason, setReason] = React.useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('button, select, textarea')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/social/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not send the report.');
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close report dialog"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="relative w-full max-w-md rounded-t-2xl border border-line bg-surface p-5 shadow-lift sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="report-title" className="text-base font-semibold text-ink">
              Report {targetType === 'user' ? 'account' : 'content'}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-xs text-subtle">{targetLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-subtle hover:bg-mutedSurface"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {done ? (
          <div className="mt-5 space-y-4">
            <Alert variant="success" title="Report received">
              Our moderation team will review this. Reports about a student account are handled with
              additional priority. We never tell the reported account who submitted the report.
            </Alert>
            <Button fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Reason" htmlFor="report-reason" required>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              >
                {REPORT_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="What happened?" htmlFor="report-details" hint="Optional, up to 500 characters.">
              <Textarea
                id="report-details"
                value={details}
                maxLength={500}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Add context that helps a moderator review this."
              />
            </Field>
            {error && (
              <p role="alert" className="text-xs font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={busy}>
                Submit report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
