'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, ClipboardList, ShieldAlert, UserCog, Users } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import {
  getInstitution,
  listInstitutionMembers,
} from '@/lib/services/institutions';
import { listInstitutionClasses } from '@/lib/services/academics';
import { canAdministerInstitution, canTeachInstitution } from '@/lib/auth/permissions';
import { ClassForm } from '@/components/academics/class-form';
import { INSTITUTION_CATEGORY_LABEL } from '@/lib/constants';
import type { ClassDoc, Institution, InstitutionMember } from '@/lib/models';

export default function InstitutionDashboardPage() {
  const { user, profile, memberships } = useAuth();
  const router = useRouter();
  const requestedId = useQueryParam('institutionId');

  const usable = memberships.filter((membership) => membership.role !== 'staff');
  const membership =
    usable.find((candidate) => candidate.institutionId === requestedId) ?? usable[0] ?? null;
  const institutionId = membership?.institutionId ?? '';
  const isAdmin = membership ? canAdministerInstitution(membership.role) : false;
  const canTeach = membership ? canTeachInstitution(membership.role) : false;

  const institution = useAsync<Institution | null>(
    () => (institutionId ? getInstitution(institutionId) : Promise.resolve(null)),
    [institutionId],
    null,
  );
  const classes = useAsync<ClassDoc[]>(
    () => (institutionId ? listInstitutionClasses(institutionId) : Promise.resolve([])),
    [institutionId],
    [],
  );
  const members = useAsync<InstitutionMember[]>(
    () => (institutionId && isAdmin ? listInstitutionMembers(institutionId) : Promise.resolve([])),
    [institutionId, isAdmin],
    [],
  );

  React.useEffect(() => {
    if (!membership) router.replace('/access-denied?reason=not-a-member');
  }, [membership, router]);

  if (!membership) {
    return (
      <div>
        <PageHeader eyebrow="Institution" title="No institution workspace" />
        <Alert variant="warning" title="You are not an active member of an institution">
          Institution workspaces unlock only after the iSchoolie team approves an application and
          provisions the owner. If you have submitted an application, check its status.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/institution/status" className={buttonClass('primary', 'sm')}>Application status</Link>
            <Link href="/onboarding/institution" className={buttonClass('outline', 'sm')}>Apply for access</Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Institution workspace"
        title={institution.data?.name ?? membership.institutionName}
        description={
          institution.data
            ? `${INSTITUTION_CATEGORY_LABEL[institution.data.category]} · ${institution.data.city}, ${institution.data.country}`
            : 'Loading institution details…'
        }
        action={
          <Badge tone={institution.data?.status === 'active' ? 'success' : 'warning'}>
            {institution.data?.status ?? 'checking'}
          </Badge>
        }
      />

      {institution.data?.status === 'suspended' && (
        <Alert variant="danger" title="Institution suspended" className="mb-5" role="alert">
          iSchoolie has suspended this institution. Management tools and student records are
          unavailable until the suspension is lifted.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.data.length} icon={<ClipboardList aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Team members" value={members.data.length} icon={<Users aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Your role" value={membership.role} icon={<UserCog aria-hidden="true" className="h-4 w-4 text-subtle" />} />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Classes</h2>
          {canTeach && user && profile && (
            <ClassForm
              institutionId={institutionId}
              institutionName={institution.data?.name ?? membership.institutionName}
              teacher={{ uid: user.uid, displayName: profile.displayName }}
              onCreated={() => classes.reload()}
            />
          )}
        </div>

        {classes.status === 'loading' && <SkeletonCard rows={4} />}
        {classes.status === 'error' && (
          <Alert variant="danger" role="alert" title="Could not load classes">
            If you were recently revoked, this list stays empty. Otherwise refresh the page.
          </Alert>
        )}
        {classes.status === 'success' && classes.data.length === 0 && (
          <EmptyState
            icon={<Building2 aria-hidden="true" className="h-5 w-5" />}
            title="No classes yet"
            description={canTeach ? 'Create your first class and invite learners.' : 'An administrator or teacher can create classes.'}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {classes.data.map((classDoc) => (
            <Card key={classDoc.id}>
              <CardBody className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <ClipboardList aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{classDoc.name}</p>
                  <p className="truncate text-xs text-subtle">
                    {classDoc.subject} · {classDoc.teacherName} · {classDoc.memberCount} learners
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">Join code: <span className="font-mono font-semibold text-ink">{classDoc.joinCode}</span></p>
                </div>
                <Link
                  href={`/dashboard/class?institutionId=${encodeURIComponent(institutionId)}&classId=${encodeURIComponent(classDoc.id)}`}
                  className={buttonClass('ghost', 'sm')}
                >
                  Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader
            title="Institution team"
            description={
              isAdmin
                ? 'Owners and administrators are provisioned by iSchoolie. You can invite teachers and staff.'
                : 'Only administrators can see the full team list.'
            }
          />
          {!isAdmin && (
            <CardBody>
              <Alert variant="neutral" title="Administrator view">
                Your membership role is <span className="font-semibold text-ink">{membership.role}</span>. Teaching
                tools are available; team management is not.
              </Alert>
            </CardBody>
          )}
          {isAdmin && members.status === 'success' && members.data.length === 0 && (
            <CardBody><p className="text-sm text-subtle">No member records found.</p></CardBody>
          )}
          {isAdmin && (
            <ul className="divide-y divide-line">
              {members.data.map((member) => (
                <li key={member.uid} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{member.displayName || member.email}</p>
                    <p className="truncate text-xs text-subtle">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}>{member.role}</Badge>
                    <Badge tone={member.status === 'active' ? 'success' : 'danger'}>{member.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isAdmin && (
            <CardBody className="border-t border-line bg-mutedSurface/40">
              <p className="flex items-start gap-2 text-xs text-subtle">
                <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                Owner and administrator grants are created only by the privileged admin CLI, so an
                institution administrator cannot promote themselves or anyone else. Ask the
                iSchoolie team for role changes.
              </p>
            </CardBody>
          )}
        </Card>
      </section>
    </div>
  );
}
