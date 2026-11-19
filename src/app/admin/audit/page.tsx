'use client';

import { ScrollText } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Card, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAsync } from '@/hooks/use-async';
import { listAuditLogs } from '@/lib/services/admin';
import { formatDateTime } from '@/lib/utils/dates';
import type { AuditLog } from '@/lib/models';

export default function AdminAuditPage() {
  const logs = useAsync<AuditLog[]>(() => listAuditLogs(100), [], []);

  return (
    <div>
      <PageHeader
        eyebrow="Audit history"
        title="Privileged action log"
        description="Append-only. Updates and deletes are denied by Security Rules for everyone, including administrators."
      />

      <Alert variant="neutral" title="What is recorded" className="mb-5">
        Institution approvals, owner provisioning, role grants and revocations, teacher verification
        decisions, account suspension and guardian verification. CLI actions record the operator
        identity supplied on the command line.
      </Alert>

      {logs.status === 'loading' && <SkeletonCard rows={5} />}
      {logs.status === 'success' && logs.data.length === 0 && (
        <EmptyState
          icon={<ScrollText aria-hidden="true" className="h-5 w-5" />}
          title="No audit entries yet"
          description="Entries appear after privileged CLI or review actions."
        />
      )}

      {logs.data.length > 0 && (
        <Card>
          <CardHeader title="Recent entries" description={`${logs.data.length} most recent`} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-2xs uppercase tracking-wide text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">When</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Action</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Actor</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Subject</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.data.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={log.action.includes('revoke') || log.action.includes('suspend') ? 'danger' : 'brand'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink">
                      {log.actorUid}
                      <span className="block text-2xs text-subtle">{log.actorKind}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink">
                      {log.subjectType}
                      <span className="block break-anywhere font-mono text-2xs text-subtle">{log.subjectId}</span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-subtle">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
