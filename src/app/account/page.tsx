'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, UserRound } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import { loadPrivateProfile, updatePublicProfile } from '@/lib/services/users';
import { COUNTRY_OPTIONS, ROLE_LABEL } from '@/lib/constants';
import type { UserPrivateProfile } from '@/lib/models';

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name').max(80),
  headline: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
});
type ProfileValues = z.infer<typeof profileSchema>;

function AccountScreen() {
  const { user, profile, roles, refresh } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const privateProfile = useAsync<UserPrivateProfile | null>(
    () => (user ? loadPrivateProfile() : Promise.resolve(null)),
    [user?.uid],
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: profile?.displayName ?? '',
      headline: profile?.headline ?? '',
      country: profile?.country ?? '',
    },
  });

  async function save(values: ProfileValues) {
    if (!user || busy) return;
    setBusy(true);
    try {
      await updatePublicProfile({
        displayName: values.displayName,
        headline: values.headline || null,
        country: values.country || null,
      });
      await refresh({ forceToken: false });
      toast({ title: 'Profile updated', variant: 'success' });
    } catch (cause) {
      toast({
        title: 'Could not update your profile',
        description: cause instanceof Error ? cause.message : undefined,
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="My profile">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="This is the public-safe part of your identity. Private details live in a separate document only you and the platform team can read."
        action={
          <div className="flex gap-2">
            <Link href="/account/privacy" className={buttonClass('ghost', 'sm')}>Privacy</Link>
            <Link href="/account/security" className={buttonClass('secondary', 'sm')}>Security</Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Public profile" description="Visible to signed-in members — unless safeguarding makes it private." />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={profile?.displayName ?? 'You'} src={profile?.photoURL} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{profile?.displayName}</p>
                <p className="truncate text-xs text-subtle">{profile?.handle}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {roles.map((role) => (
                    <Badge key={role} tone="brand">{ROLE_LABEL[role]}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
              <Field label="Display name" htmlFor="displayName" error={errors.displayName?.message} required>
                <Input id="displayName" disabled={busy} {...register('displayName')} />
              </Field>
              <Field
                label="Headline"
                htmlFor="headline"
                optional
                hint="A short line about what you teach or study."
                error={errors.headline?.message}
              >
                <Input id="headline" disabled={busy} placeholder="e.g. Class 11 student · Physics" {...register('headline')} />
              </Field>
              <Field label="Country" htmlFor="country" optional error={errors.country?.message}>
                <Select id="country" disabled={busy} {...register('country')}>
                  <option value="">Not specified</option>
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" loading={busy} loadingText="Saving…">Save profile</Button>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Private details" description="Owner and platform administrators only." />
            <CardBody>
              {privateProfile.status === 'loading' && <div className="skeleton h-4 w-1/2" />}
              {privateProfile.data && (
                <dl className="grid gap-3 text-sm">
                  {[
                    ['Email', privateProfile.data.email],
                    ['Date of birth', privateProfile.data.dateOfBirth ?? 'Not set'],
                    ['School', privateProfile.data.schoolName ?? 'Not set'],
                    ['Interests', privateProfile.data.learningInterests.join(', ') || 'Not set'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">{label}</dt>
                      <dd className="break-anywhere text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-3 flex items-start gap-2 text-2xs text-subtle">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                Other members can never read this document. Firestore rules deny it outright.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Roles and access" />
            <CardBody className="space-y-2 text-sm">
              {[
                ['Account status', profile?.status ?? '—'],
                ['Onboarding', profile?.onboarding.complete ? 'Complete' : 'Incomplete'],
                ['Safeguarding', profile?.safeguarding.isMinor ? 'Minor protections on' : 'Standard'],
                ['Educator verification', profile?.teacher?.bio ? 'Profile created' : 'Not a teacher profile'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-subtle">{label}</span>
                  <span className="font-medium text-ink">{value}</span>
                </div>
              ))}
              <Link href="/account/providers" className={buttonClass('outline', 'sm', 'mt-2 w-full')}>
                <UserRound aria-hidden="true" className="h-3.5 w-3.5" /> Linked providers
              </Link>
            </CardBody>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountScreen />
    </RequireAuth>
  );
}
