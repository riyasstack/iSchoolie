'use client';

import * as React from 'react';
import { Check, Users, X } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import {
  approveGuardianRequest,
  listPendingGuardianRequests,
  rejectGuardianRequest,
  type GuardianRequestDoc,
} from '@/lib/services/guardian';
import type { UserProfile } from '@/lib/models';

export default function AdminGuardiansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const requests = useAsync<GuardianRequestDoc[]>(() => listPendingGuardianRequests(), [], []);

  async function approve(request: GuardianRequestDoc) {
    if (!user || busyId || !request.studentUid) return;
    setBusyId(request.id);
    try {
      await approveGuardianRequest(
        request,
        { uid: request.studentUid, displayName: request.studentEmail },
        user.uid,
      );
      toast({ title: 'Guardian relationship verified', variant: 'success' });
      requests.reload();
    } catch (cause) {
      toast({
        title: 'Could not verify the relationship',
        description: cause instanceof Error ? cause.message : undefined,
        variant: 'danger',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(request: GuardianRequestDoc) {
    if (!user || busyId) return;
    setBusyId(request.id);
    try {
      await rejectGuardianRequest(request.id, user.uid, 'Relationship could not be verified.');
      toast({ title: 'Request rejected', variant: 'success' });
      requests.reload();
    } catch {
      toast({ title: 'Could not reject the request', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Guardian review"
        title="Verified relationships"
        description="A guardian sees a child's results only after the student confirms and iSchoolie verifies."
      />

      <Alert variant="warning" title="Verify before approving" className="mb-5">
        Confirm the relationship using the institution (a school office call, a known guardian email)
        — never by matching a name typed into a form. Approval creates the deterministic
        `guardianLinks/&lt;guardianUid&gt;_&lt;studentUid&gt;` record that Security Rules consult.
      </Alert>

      {requests.status === 'loading' && <SkeletonCard rows={3} />}
      {requests.status === 'success' && requests.data.length === 0 && (
        <EmptyState
          icon={<Users aria-hidden="true" className="h-5 w-5" />}
          title="No requests awaiting verification"
          description="Requests appear here once the student confirms a guardian's link request."
        />
      )}

      <div className="space-y-3">
        {requests.data.map((request) => (
          <Card key={request.id}>
            <CardHeader
              title={`${request.guardianName} → ${request.studentEmail}`}
              description={`Relationship: ${request.relationship.replace(/_/g, ' ')} · consent: ${
                Object.entries(request.consent ?? {})
                  .filter(([, granted]) => granted)
                  .map(([key]) => key)
                  .join(', ') || 'none'
              }`}
              action={<Badge tone="warning">{request.status.replace(/_/g, ' ')}</Badge>}
            />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-subtle">
                Guardian account <span className="font-mono">{request.guardianUid}</span> · student
                account <span className="font-mono">{request.studentUid ?? 'not confirmed'}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={busyId === request.id}
                  onClick={() => void approve(request)}
                  icon={<Check className="h-3.5 w-3.5" />}
                >
                  Verify relationship
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === request.id}
                  onClick={() => void reject(request)}
                  icon={<X className="h-3.5 w-3.5" />}
                >
                  Reject
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
