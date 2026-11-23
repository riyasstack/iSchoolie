'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, LogOut, Mail, ShieldAlert, Trash2 } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  revokeAllSessions,
} from '@/lib/services/users';
import {
  changeEmailSchema,
  changePasswordSchema,
  type ChangeEmailValues,
  type ChangePasswordValues,
} from '@/lib/schemas/auth';

function SecurityScreen() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [passwordBusy, setPasswordBusy] = React.useState(false);
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteConfirm, setDeleteConfirm] = React.useState('');
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [revokeBusy, setRevokeBusy] = React.useState(false);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const emailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: '' },
  });

  async function submitPassword(values: ChangePasswordValues) {
    setPasswordBusy(true);
    const result = await changePassword(values.currentPassword, values.newPassword);
    setPasswordBusy(false);
    toast({
      title: result.ok ? 'Password updated' : 'Could not update password',
      description: result.ok ? undefined : result.message,
      variant: result.ok ? 'success' : 'danger',
    });
    if (result.ok) passwordForm.reset();
  }

  async function submitEmail(values: ChangeEmailValues) {
    setEmailBusy(true);
    const result = await changeEmail(values.email);
    setEmailBusy(false);
    toast({
      title: result.ok ? 'Confirmation sent' : 'Could not start the email change',
      description: result.message ?? (result.ok ? 'Check your inbox to verify the new address.' : undefined),
      variant: result.ok ? 'success' : 'danger',
    });
    if (result.ok) emailForm.reset();
  }

  async function destroyAccount() {
    if (!user || deleteBusy) return;
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    const result = await deleteAccount(deletePassword || undefined);
    setDeleteBusy(false);
    if (result.ok) {
      toast({ title: 'Account deleted', variant: 'success' });
      await signOut();
    } else {
      setDeleteError(result.message ?? 'Could not delete the account.');
    }
  }

  async function signOutEverywhere() {
    setRevokeBusy(true);
    try {
      await revokeAllSessions();
    } catch {
      // Best effort; still sign out locally.
    }
    setRevokeBusy(false);
    await signOut();
  }

  return (
    <AppShell title="Security settings">
      <PageHeader
        eyebrow="Account"
        title="Security settings"
        description="Passwords, email address, sessions and account deletion."
        action={<Link href="/account" className={buttonClass('ghost', 'sm')}>Back to profile</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Change password" description="You will need your current password." />
          <CardBody>
            <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="space-y-3" noValidate>
              <Field label="Current password" htmlFor="currentPassword" error={passwordForm.formState.errors.currentPassword?.message} required>
                <PasswordInput id="currentPassword" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
              </Field>
              <Field label="New password" htmlFor="newPassword" error={passwordForm.formState.errors.newPassword?.message} required>
                <PasswordInput id="newPassword" autoComplete="new-password" {...passwordForm.register('newPassword')} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirmNewPassword" error={passwordForm.formState.errors.confirmPassword?.message} required>
                <PasswordInput id="confirmNewPassword" autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
              </Field>
              <Button type="submit" loading={passwordBusy} icon={<KeyRound className="h-4 w-4" />}>
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change email" description="WorkOS sends a verification link to the new address." />
          <CardBody>
            <form onSubmit={emailForm.handleSubmit(submitEmail)} className="space-y-3" noValidate>
              <Field
                label="New email address"
                htmlFor="newEmail"
                hint={`Current: ${user?.email ?? 'none'}`}
                error={emailForm.formState.errors.email?.message}
                required
              >
                <Input id="newEmail" type="email" autoComplete="email" {...emailForm.register('email')} />
              </Field>
              <Button type="submit" loading={emailBusy} icon={<Mail className="h-4 w-4" />}>
                Send confirmation
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sessions" description="Signed in on this device." />
          <CardBody className="space-y-3">
            <p className="text-sm text-subtle">
              {user?.email} · last sign-in{' '}
              {user?.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleString()
                : 'unknown'}
            </p>
            <Alert variant="neutral" title="Shared-device guidance">
              Uncheck “Remember me” on a school or library computer: the session then ends when the
              tab closes. Sign out when you are finished — never leave a guardian or teacher session
              open on a shared machine.
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                loading={revokeBusy}
                onClick={() => void signOutEverywhere()}
                icon={<LogOut className="h-4 w-4" />}
              >
                Sign out everywhere
              </Button>
            </div>
            <p className="text-2xs text-subtle">
              Revoking access quickly: role and membership checks are enforced on every request, so an
              institution revocation applies immediately.
            </p>
          </CardBody>
        </Card>

        <Card className="border-danger/30">
          <CardHeader title="Delete account" description="This cannot be undone." />
          <CardBody className="space-y-3">
            {deleteError && <Alert variant="danger" role="alert">{deleteError}</Alert>}
            <Alert variant="warning" title="What happens">
              Your sign-in is deleted immediately. Academic records held by an institution and audit
              entries are retained as required for institutional records, then purged by the
              iSchoolie team on request.
            </Alert>
            <Field label="Confirm with the word DELETE" htmlFor="deleteConfirm" required>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder="DELETE"
              />
            </Field>
            <Field label="Password (if you use one)" htmlFor="deletePassword">
              <PasswordInput
                id="deletePassword"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </Field>
            <Button
              variant="danger"
              loading={deleteBusy}
              disabled={deleteConfirm !== 'DELETE'}
              onClick={() => void destroyAccount()}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete my account
            </Button>
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-subtle">
        <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        Need a faster global revocation (lost device, school incident)? Contact iSchoolie support —
        operators can disable the account with the admin CLI, which also invalidates refresh tokens.
      </p>
    </AppShell>
  );
}

export default function SecurityPage() {
  return (
    <RequireAuth>
      <SecurityScreen />
    </RequireAuth>
  );
}