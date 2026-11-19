'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessagesSquare, Plus, Users } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import { createCommunity, joinCommunity, listCommunities } from '@/lib/services/community';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { communitySchema, type CommunityValues } from '@/lib/schemas/social';
import type { Community } from '@/lib/models';

function CommunitiesScreen() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const communities = useAsync<Community[]>(() => listCommunities(), [], []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: '', description: '', visibility: 'public' },
  });

  async function create(values: CommunityValues) {
    if (!user || !profile) return;
    setFormError(null);
    try {
      await createCommunity(values, { uid: user.uid, displayName: profile.displayName }, null);
      reset();
      setShowForm(false);
      communities.reload();
      toast({ title: 'Community created', variant: 'success' });
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not create the community.');
    }
  }

  async function join(community: Community) {
    if (!user || !profile || busyId) return;
    setBusyId(community.id);
    try {
      await joinCommunity(community.id, { uid: user.uid, displayName: profile.displayName });
      toast({ title: `Joined ${community.name}`, variant: 'success' });
      communities.reload();
    } catch {
      toast({ title: 'Could not join', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Communities">
      <PageHeader
        eyebrow="Network"
        title="Educational communities"
        description="Subject groups, study circles and institution spaces. Minors keep private profiles here too."
        action={
          <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm((value) => !value)}>
            New community
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="Create a community" description="You become its first member." />
          <CardBody>
            {formError && <Alert variant="danger" role="alert" className="mb-3">{formError}</Alert>}
            <form onSubmit={handleSubmit(create)} className="space-y-3" noValidate>
              <Field label="Name" htmlFor="communityName" error={errors.name?.message} required>
                <Input id="communityName" placeholder="e.g. Physics Problem Solvers" {...register('name')} />
              </Field>
              <Field label="Description" htmlFor="communityDescription" error={errors.description?.message} required>
                <Textarea id="communityDescription" rows={3} placeholder="What belongs here?" {...register('description')} />
              </Field>
              <Field label="Visibility" htmlFor="communityVisibility" error={errors.visibility?.message} required>
                <Select id="communityVisibility" {...register('visibility')}>
                  <option value="public">Public — any signed-in member can read</option>
                  <option value="institution">Institution — only that institution</option>
                </Select>
              </Field>
              <Button type="submit">Create community</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {communities.status === 'loading' && <SkeletonCard rows={4} />}
      {communities.status === 'error' && <Alert variant="danger" role="alert">Could not load communities.</Alert>}
      {communities.status === 'success' && communities.data.length === 0 && (
        <EmptyState
          icon={<MessagesSquare aria-hidden="true" className="h-5 w-5" />}
          title="No communities yet"
          description="Create the first one for your subject or school."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.data.map((community) => (
          <Card key={community.id} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <MessagesSquare aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                <Badge tone={community.visibility === 'public' ? 'neutral' : 'brand'}>
                  {community.visibility}
                </Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{community.name}</h3>
              <p className="mt-1 line-clamp-3 flex-1 text-xs text-subtle">{community.description}</p>
              <p className="mt-2 flex items-center gap-1 text-2xs text-subtle">
                <Users aria-hidden="true" className="h-3 w-3" /> {community.memberCount} members ·{' '}
                {community.postCount} posts
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/communities/detail?communityId=${encodeURIComponent(community.id)}`}
                  className={buttonClass('outline', 'sm', 'flex-1')}
                >
                  Open
                </Link>
                <Button
                  size="sm"
                  className="flex-1"
                  loading={busyId === community.id}
                  onClick={() => void join(community)}
                >
                  Join
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export default function CommunitiesPage() {
  return (
    <RequireAuth>
      <CommunitiesScreen />
    </RequireAuth>
  );
}
