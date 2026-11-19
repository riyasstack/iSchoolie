'use client';

import * as React from 'react';
import { BadgeCheck, Terminal, UserCog } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/use-async';
import {
  grantRoleCommand,
  listRecentUsers,
  listTeacherVerificationQueue,
  verifyTeacherCommand,
  type UserRolesEntry,
} from '@/lib/services/admin';
import { ROLE_KEYS } from '@/lib/auth/permissions';
import { ROLE_LABEL } from '@/lib/constants';
import { formatDateTime, relativeTime } from '@/lib/utils/dates';
import type { UserProfile } from '@/lib/models';

export default function AdminUsersPage() {
  const users = useAsync<UserProfile[]>(() => listRecentUsers(), [], []);
  const roles = useAsync<UserRolesEntry[]>(() => listTeacherVerificationQueue(), [], []);
  const [selectedUid, setSelectedUid] = React.useState<string>('');

  return (
    <div>
      <PageHeader
        eyebrow="Access control"
        title="Users, roles and verification"
        description="Role grants and educator verification are privileged: the browser shows the command, the CLI performs it."
      />

      <Alert variant="neutral" title="Self-assignment is impossible" className="mb-5">
        `userRoles/{'{uid}'}` denies every browser write to `granted`, `revoked` and
        `teacherVerification`. Only the Admin SDK (service account) can change them, and every change
        is written to `auditLogs`.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Recent accounts" description="Newest 50 profiles." />
          {users.status === 'loading' && <CardBody><div className="skeleton h-4 w-2/3" /></CardBody>}
          {users.status === 'success' && users.data.length === 0 && (
            <EmptyState title="No accounts yet" description="Profiles appear as people sign up." />
          )}
          <ul className="divide-y divide-line">
            {users.data.map((profile) => (
              <li key={profile.uid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{profile.displayName}</p>
                  <p className="truncate text-2xs text-subtle">
                    {profile.uid} · joined {relativeTime(profile.createdAt as never)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {profile.onboarding.selectedRoles.map((role) => (
                    <Badge key={role} tone="neutral">{ROLE_LABEL[role]}</Badge>
                  ))}
                  <Badge tone={profile.status === 'active' ? 'success' : 'danger'}>{profile.status}</Badge>
                  <button
                    type="button"
                    onClick={() => setSelectedUid(profile.uid)}
                    className="ml-1 rounded-md px-2 py-1 text-2xs font-semibold text-brand hover:bg-brand/10"
                  >
                    Commands
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Teacher verification" description="Only the CLI can set 'verified'." />
            {roles.status === 'loading' && <CardBody><div className="skeleton h-4 w-1/2" /></CardBody>}
            {roles.status === 'success' && roles.data.length === 0 && (
              <CardBody><p className="text-sm text-subtle">No teacher verification records.</p></CardBody>
            )}
            <ul className="divide-y divide-line">
              {roles.data.map((entry) => (
                <li key={entry.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-ink">{entry.id}</span>
                    <Badge tone={entry.teacherVerification.status === 'verified' ? 'success' : 'warning'}>
                      {entry.teacherVerification.status}
                    </Badge>
                  </div>
                  <code className="block break-anywhere rounded-lg bg-ink/95 p-2 font-mono text-2xs text-white/90">
                    {verifyTeacherCommand(entry.id)}
                  </code>
                  {entry.teacherVerification.decidedAt && (
                    <p className="text-2xs text-subtle">
                      Last decision {formatDateTime(entry.teacherVerification.decidedAt)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Role grants" description="Institution administration and verified teaching are granted roles." />
            <CardBody className="space-y-3">
              <p className="flex items-start gap-2 text-xs text-subtle">
                <UserCog aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Self-declared roles (student, teacher profile, guardian) need no grant. Privileged
                roles do — and none of them can be self-assigned.
              </p>
              <ul className="space-y-1.5">
                {ROLE_KEYS.map((role) => (
                  <li key={role} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink">{ROLE_LABEL[role]}</span>
                    <Badge tone={role === 'institution_admin' ? 'warning' : 'neutral'}>
                      {role === 'institution_admin' ? 'grant only' : 'self-serve'}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-ink/95 p-2">
                <p className="flex items-center gap-1.5 text-2xs uppercase tracking-wider text-white/50">
                  <Terminal aria-hidden="true" className="h-3 w-3" /> grant command
                </p>
                <code className="mt-1 block break-anywhere font-mono text-2xs text-white/90">
                  {grantRoleCommand(selectedUid || '<uid>', 'institution_admin')}
                </code>
              </div>
              <p className="flex items-start gap-1.5 text-2xs text-subtle">
                <BadgeCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Select “Commands” on a user to fill their UID.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
