'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, GraduationCap, Plus, Sparkles, Users } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, PageHeader } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { setActiveWorkspace } from '@/lib/services/users';
import { effectiveRoles } from '@/lib/auth/permissions';
import type { WorkspaceOption } from '@/lib/auth/workspaces';
import { ROLE_LABEL } from '@/lib/constants';

const ICONS: Record<string, React.ReactNode> = {
  personal: <Sparkles aria-hidden="true" className="h-5 w-5" />,
  student_school: <GraduationCap aria-hidden="true" className="h-5 w-5" />,
  student_college: <GraduationCap aria-hidden="true" className="h-5 w-5" />,
  teacher: <Sparkles aria-hidden="true" className="h-5 w-5" />,
  parent: <Users aria-hidden="true" className="h-5 w-5" />,
  institution: <Building2 aria-hidden="true" className="h-5 w-5" />,
};

function WorkspaceScreen() {
  const { user, profile, workspaces, account, memberships } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const roles = effectiveRoles(account?.roles ?? null);

  async function open(workspace: WorkspaceOption) {
    if (!user || busyId) return;
    setBusyId(workspace.id);
    try {
      // Remembering the workspace is a convenience preference only. It never
      // confers permission: the destination page re-checks membership.
      await setActiveWorkspace(workspace.id);
    } catch {
      toast({ title: 'Preference not saved', description: 'Opening the workspace anyway.', variant: 'warning' });
    }
    setBusyId(null);
    router.push(workspace.href);
  }

  return (
    <AppShell title="My workspaces">
      <PageHeader
        eyebrow="One account, many roles"
        title="My workspaces"
        description="Every workspace below is authorised for your account. Switching never grants new permissions — each page re-checks your role with Firestore Security Rules."
        action={
          <Link href="/onboarding" className={buttonClass('secondary', 'sm')}>
            <Plus aria-hidden="true" className="h-3.5 w-3.5" /> Add a role
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  {ICONS[workspace.kind]}
                </span>
                {workspace.kind === 'institution' ? (
                  <Badge tone="success">Verified institution</Badge>
                ) : (
                  <Badge tone="neutral">Personal role</Badge>
                )}
              </div>
              <h2 className="mt-3 text-base font-semibold text-ink">{workspace.label}</h2>
              <p className="mt-1 flex-1 text-sm text-subtle">{workspace.description}</p>
              {profile?.activeWorkspace === workspace.id && (
                <p className="mt-2 text-2xs font-semibold uppercase tracking-wider text-brand">Last used</p>
              )}
              <Button
                className="mt-4 w-full"
                variant="primary"
                loading={busyId === workspace.id}
                onClick={() => void open(workspace)}
              >
                Open workspace
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {memberships.length > 0 && (
        <Alert variant="neutral" title="Institution access is scoped" className="mt-6">
          Institution workspaces you can see: {memberships.map((membership) => membership.institutionName).join(', ')}.
          Revoked memberships disappear from this list immediately because the membership record — not a cached
          claim — is checked on every request.
        </Alert>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Roles on this account</h2>
        <Card>
          <CardBody className="flex flex-wrap gap-2">
            {roles.length === 0 && <p className="text-sm text-subtle">No roles activated yet.</p>}
            {roles.map((role) => (
              <Badge key={role} tone="brand">{ROLE_LABEL[role]}</Badge>
            ))}
          </CardBody>
        </Card>
      </section>

      <p className="mt-6 text-xs text-subtle">
        Need an institution workspace?{' '}
        <Link href="/onboarding/institution" className="font-medium text-brand underline-offset-2 hover:underline">
          Apply for institutional access
        </Link>{' '}
        — approval is handled by the iSchoolie team.
      </p>
    </AppShell>
  );
}

export default function WorkspacesPage() {
  return (
    <RequireAuth>
      <WorkspaceScreen />
    </RequireAuth>
  );
}
