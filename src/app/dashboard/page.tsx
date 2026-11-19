'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  Building2,
  Clock3,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge, Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { listNotifications, markAllNotificationsRead } from '@/lib/services/users';
import { ROLE_LABEL } from '@/lib/constants';
import { relativeTime } from '@/lib/utils/dates';
import type { AppNotification } from '@/lib/models';

export default function PersonalDashboardPage() {
  const { user, profile, roles, memberships, workspaces, platformAdmin } = useAuth();
  const router = useRouter();
  const [readBusy, setReadBusy] = React.useState(false);
  const notifications = useAsync<AppNotification[]>(
    () => (user ? listNotifications(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );

  // §14 routing: an unfinished account resumes onboarding instead of browsing.
  React.useEffect(() => {
    if (!profile) return;
    if (profile.status === 'suspended') {
      router.replace('/access-denied?reason=suspended');
      return;
    }
    if (!profile.onboarding.complete) {
      router.replace('/onboarding');
      return;
    }
    if (profile.activeWorkspace && profile.activeWorkspace !== 'personal') {
      const remembered = workspaces.find((workspace) => workspace.id === profile.activeWorkspace);
      if (remembered) router.replace(remembered.href);
    }
  }, [profile, workspaces, router]);

  const unread = notifications.data.filter((item) => !item.read);

  async function markRead() {
    if (!user || unread.length === 0) return;
    setReadBusy(true);
    await markAllNotificationsRead(
      user.uid,
      unread.map((item) => item.id),
    );
    setReadBusy(false);
    notifications.reload();
  }

  const activeRoles = roles.length > 0 ? roles : [];

  return (
    <div>
      <PageHeader
        eyebrow="Personal iSchoolie"
        title={`Hello, ${profile?.displayName?.split(' ')[0] ?? 'there'}`}
        description="Your identity, network and workspaces in one place."
        action={
          <Link href="/workspaces" className={buttonClass('secondary', 'md')}>
            Switch workspace
          </Link>
        }
      />

      {activeRoles.length === 0 && (
        <Alert variant="info" title="Your account is ready — choose how you use iSchoolie" className="mb-5">
          Set up a student, educator or guardian workspace. You can add more than one.
          <Link href="/onboarding" className="ml-1 font-semibold text-brand underline-offset-2 hover:underline">
            Choose a role
          </Link>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active roles" value={activeRoles.length} hint={activeRoles.map((role) => ROLE_LABEL[role]).join(', ') || 'None yet'} />
        <StatCard label="Workspaces" value={workspaces.length} hint="Includes personal" />
        <StatCard label="Institutions" value={memberships.length} hint="Approved memberships" icon={<Building2 aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Unread" value={unread.length} hint="Notifications" icon={<Bell aria-hidden="true" className="h-4 w-4 text-subtle" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="workspaces-heading">
          <h2 id="workspaces-heading" className="mb-3 text-sm font-semibold text-ink">Your workspaces</h2>
          <div className="space-y-3">
            {workspaces.map((workspace) => {
              const Icon =
                workspace.kind === 'institution'
                  ? Building2
                  : workspace.kind === 'teacher'
                    ? Sparkles
                    : workspace.kind === 'parent'
                      ? Users
                      : workspace.kind === 'personal'
                        ? Sparkles
                        : GraduationCap;
              return (
                <Card key={workspace.id} className="transition hover:border-brand/40">
                  <CardBody className="flex items-center gap-3 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{workspace.label}</p>
                      <p className="truncate text-xs text-subtle">{workspace.description}</p>
                    </div>
                    <Link href={workspace.href} className={buttonClass('ghost', 'sm')} aria-label={`Open ${workspace.label}`}>
                      Open
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
            {platformAdmin && (
              <Card className="border-brand/30 bg-brand/5">
                <CardBody className="flex items-center gap-3 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-fg">
                    <Building2 aria-hidden="true" className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">iSchoolie platform administration</p>
                    <p className="text-xs text-subtle">Verification queues, moderation and audit trail</p>
                  </div>
                  <Link href="/admin" className={buttonClass('primary', 'sm')}>Open</Link>
                </CardBody>
              </Card>
            )}
          </div>
        </section>

        <section aria-labelledby="notifications-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="notifications-heading" className="text-sm font-semibold text-ink">Notifications</h2>
            {unread.length > 0 && (
              <Button variant="link" size="sm" loading={readBusy} onClick={() => void markRead()}>
                Mark all read
              </Button>
            )}
          </div>
          <Card>
            {notifications.status === 'loading' && (
              <CardBody className="space-y-3">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
              </CardBody>
            )}
            {notifications.status === 'error' && (
              <CardBody>
                <Alert variant="danger" role="alert">Could not load notifications.</Alert>
              </CardBody>
            )}
            {notifications.status === 'success' && notifications.data.length === 0 && (
              <EmptyState
                title="Nothing yet"
                description="Grades, institution decisions and guardian updates appear here."
                icon={<Bell aria-hidden="true" className="h-5 w-5" />}
              />
            )}
            {notifications.status === 'success' && notifications.data.length > 0 && (
              <ul className="divide-y divide-line">
                {notifications.data.map((item) => (
                  <li key={item.id} className="flex gap-3 p-4">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-line' : 'bg-brand'}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-xs text-subtle">{item.body}</p>
                      <p className="mt-1 text-2xs text-subtle">{relativeTime(item.createdAt as never)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <section className="mt-8">
        <Card>
          <CardHeader
            title="Profile completeness"
            description="Private details stay private; institutions see only what your role requires."
            action={<Badge tone={profile?.headline ? 'success' : 'warning'}>{profile?.headline ? 'Profile complete' : 'Profile incomplete'}</Badge>}
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-subtle">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
              Member since {profile?.createdAt ? relativeTime(profile.createdAt as never) : '—'}
            </div>
            <Link href="/account" className={buttonClass('secondary', 'sm')}>
              Edit my profile
            </Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
