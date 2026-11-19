'use client';

import * as React from 'react';
import { Flag, ShieldCheck } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import { listReports, resolveReport } from '@/lib/services/community';
import { formatDateTime } from '@/lib/utils/dates';
import type { Report } from '@/lib/models';

export default function AdminModerationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const reports = useAsync<Report[]>(() => listReports(), [], []);

  async function resolve(report: Report, outcome: 'actioned' | 'dismissed') {
    if (!user || busyId) return;
    setBusyId(report.id);
    try {
      await resolveReport(
        report.id,
        user.uid,
        outcome === 'actioned' ? 'Content hidden and author notified' : 'No action required',
        outcome,
      );
      toast({ title: 'Report updated', variant: 'success' });
      reports.reload();
    } catch {
      toast({ title: 'Could not update the report', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Moderation"
        title="Reports and moderation"
        description="Reports from students, educators and guardians. Moderation never grants or removes roles — that is a separate, audited process."
      />

      <Alert variant="neutral" title="Safeguarding escalations" className="mb-5">
        Reports involving a minor must be escalated to the iSchoolie safeguarding lead. Hiding content
        is not sufficient on its own: also suspend the account with the admin CLI so refresh tokens
        are revoked.
      </Alert>

      {reports.status === 'loading' && <SkeletonCard rows={3} />}
      {reports.status === 'success' && reports.data.length === 0 && (
        <EmptyState
          icon={<ShieldCheck aria-hidden="true" className="h-5 w-5" />}
          title="No open reports"
          description="The moderation queue is clear."
        />
      )}

      <div className="space-y-3">
        {reports.data.map((report) => (
          <Card key={report.id}>
            <CardHeader
              title={`${report.reason.replace(/-/g, ' ')} · ${report.targetType}`}
              description={formatDateTime(report.createdAt)}
              action={<Badge tone="warning">{report.status}</Badge>}
            />
            <CardBody className="space-y-3">
              <p className="break-anywhere font-mono text-2xs text-subtle">{report.targetPath}</p>
              {report.details && <p className="text-sm text-ink">{report.details}</p>}
              <p className="text-2xs text-subtle">
                Reporter {report.reporterUid} · owner {report.targetOwnerUid ?? 'n/a'}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={busyId === report.id}
                  onClick={() => void resolve(report, 'actioned')}
                  icon={<Flag className="h-3.5 w-3.5" />}
                >
                  Action content
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === report.id}
                  onClick={() => void resolve(report, 'dismissed')}
                >
                  Dismiss
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
