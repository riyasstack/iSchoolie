'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileSearch,
  Flag,
  ScrollText,
  Settings,
  UserCheck,
  Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { useAsync } from '@/hooks/use-async';
import { listPendingApplications, listAllApplications } from '@/lib/services/institutions';
import { listPendingGuardianRequests } from '@/lib/services/guardian';
import { listReports } from '@/lib/services/community';
import { listTeacherVerificationQueue, type UserRolesEntry } from '@/lib/services/admin';
import type { InstitutionApplication } from '@/lib/models';
import type { GuardianRequestDoc } from '@/lib/services/guardian';
import type { Report } from '@/lib/models';

const LINKS = [
  { href: '/admin/institutions', label: 'Institution applications', icon: <Building2 className="h-4 w-4" />, copy: 'Review, request information, deny. Approval runs through the admin CLI.' },
  { href: '/admin/users', label: 'Users and verification', icon: <UserCheck className="h-4 w-4" />, copy: 'Teacher verification queue and role grants.' },
  { href: '/admin/guardians', label: 'Guardian review', icon: <Users className="h-4 w-4" />, copy: 'Verify or reject confirmed guardian requests.' },
  { href: '/admin/moderation', label: 'Reports and moderation', icon: <Flag className="h-4 w-4" />, copy: 'Triage content reports.' },
  { href: '/admin/audit', label: 'Audit history', icon: <ScrollText className="h-4 w-4" />, copy: 'Append-only record of privileged actions.' },
  { href: '/admin/settings', label: 'Platform settings', icon: <Settings className="h-4 w-4" />, copy: 'Provider status, quotas and operating notes.' },
];

export default function AdminOverviewPage() {
  const applications = useAsync<InstitutionApplication[]>(() => listPendingApplications(), [], []);
  const allApplications = useAsync<InstitutionApplication[]>(() => listAllApplications(), [], []);
  const guardians = useAsync<GuardianRequestDoc[]>(() => listPendingGuardianRequests(), [], []);
  const reports = useAsync<Report[]>(() => listReports(), [], []);
  const teachers = useAsync<UserRolesEntry[]>(() => listTeacherVerificationQueue(), [], []);

  const approved = allApplications.data.filter((application) => application.status === 'approved').length;

  return (
    <div>
      <PageHeader
        eyebrow="Platform administration"
        title="iSchoolie team overview"
        description="Verification queues, moderation and the privileged actions that need the admin CLI."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending institutions" value={applications.data.length} icon={<Building2 aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Approved institutions" value={approved} icon={<ClipboardCheck aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Guardian verifications" value={guardians.data.length} icon={<Users aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Open reports" value={reports.data.length} icon={<Flag aria-hidden="true" className="h-4 w-4 text-subtle" />} />
      </div>

      <Alert variant="neutral" title="Two kinds of action" className="mt-6">
        <p>
          Reviewing and denying happens here and is authorised by your platform-admin claim. Actions
          that <span className="font-semibold text-ink">grant</span> access — approving an institution,
          creating its owner, verifying an educator, granting a role — are performed only by the Admin
          SDK CLI with a service account. The UI shows you the exact command instead of pretending it
          can do it.
        </p>
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((link) => (
          <Card key={link.href} className="flex flex-col transition hover:border-brand/40">
            <CardBody className="flex flex-1 flex-col">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                {link.icon}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink">{link.label}</h2>
              <p className="mt-1 flex-1 text-xs text-subtle">{link.copy}</p>
              <Link href={link.href} className={buttonClass('ghost', 'sm', 'mt-3 justify-start px-0')}>
                Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Teacher verification queue"
          description="Profiles awaiting an iSchoolie decision."
          action={<Link href="/admin/users" className={buttonClass('outline', 'sm')}>Manage</Link>}
        />
        <CardBody>
          {teachers.status === 'loading' && <div className="skeleton h-4 w-1/2" />}
          {teachers.status === 'success' && teachers.data.length === 0 && (
            <p className="text-sm text-subtle">No teacher verification records yet.</p>
          )}
          <ul className="space-y-2">
            {teachers.data.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <span className="truncate font-mono text-xs text-ink">{entry.id}</span>
                <span className="text-xs font-medium text-subtle">{entry.teacherVerification.status}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Where to find things" />
        <CardBody className="grid gap-3 text-xs text-subtle sm:grid-cols-2">
          <p className="flex items-start gap-2"><FileSearch aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Institution detail, declarations and review history live under Institution applications.</p>
          <p className="flex items-start gap-2"><ScrollText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Every CLI action writes an audit record you can read in Audit history.</p>
        </CardBody>
      </Card>
    </div>
  );
}
