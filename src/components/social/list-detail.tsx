'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PostList } from '@/components/social/post-list';
import { SocialEmptyState } from '@/components/social/social-empty';
import type { FeedItem, Page, PersonSummary, SocialListSummary } from '@/lib/social/types';

export function ListDetail({
  list,
  members,
  canEdit,
  initialTimeline,
}: {
  list: SocialListSummary;
  members: PersonSummary[];
  canEdit: boolean;
  initialTimeline: Page<FeedItem>;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(list);
  const [people, setPeople] = React.useState(members);
  const [handle, setHandle] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(list.name);
  const [description, setDescription] = React.useState(list.description);
  const [visibility, setVisibility] = React.useState(list.visibility);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function saveList(event: React.FormEvent) {
    event.preventDefault();
    setBusy('save');
    setError(null);
    try {
      const response = await fetch(`/api/social/lists/${current.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, visibility }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { list?: SocialListSummary; error?: string }
        | null;
      if (!response.ok || !payload?.list) throw new Error(payload?.error ?? 'Could not save the list.');
      setCurrent(payload.list);
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the list.');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${current.name}”?`)) return;
    setBusy('delete');
    try {
      const response = await fetch(`/api/social/lists/${current.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete the list.');
      router.push('/lists');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the list.');
      setBusy(null);
    }
  }

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    const value = handle.trim().replace(/^@/, '');
    if (!value) return;
    setBusy('add');
    setError(null);
    try {
      const response = await fetch(`/api/social/lists/${current.id}/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle: value }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { members?: PersonSummary[]; error?: string }
        | null;
      if (!response.ok || !payload?.members) {
        throw new Error(payload?.error ?? 'Could not add that account.');
      }
      setPeople(payload.members);
      setCurrent((value) => ({ ...value, memberCount: payload.members?.length ?? value.memberCount }));
      setHandle('');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add that account.');
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(person: PersonSummary) {
    setBusy(person.id);
    setError(null);
    try {
      const response = await fetch(`/api/social/lists/${current.id}/members`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: person.id }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { members?: PersonSummary[]; error?: string }
        | null;
      if (!response.ok || !payload?.members) {
        throw new Error(payload?.error ?? 'Could not remove that account.');
      }
      setPeople(payload.members);
      setCurrent((value) => ({ ...value, memberCount: payload.members?.length ?? value.memberCount }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove that account.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleFollow() {
    setBusy('follow');
    try {
      const response = await fetch(`/api/social/lists/${current.id}/follow`, {
        method: current.following ? 'DELETE' : 'POST',
      });
      if (!response.ok) throw new Error('Could not update this list.');
      setCurrent((value) => ({ ...value, following: !value.following }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this list.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <header className="border-b border-line bg-surface px-4 py-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink">{current.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-semibold text-subtle">
                {current.visibility === 'private' ? (
                  <Lock className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Users className="h-3 w-3" aria-hidden="true" />
                )}
                {current.visibility}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-subtle">
              by{' '}
              <Link href={`/u/${current.ownerHandle}`} className="font-medium text-brand hover:underline">
                @{current.ownerHandle}
              </Link>{' '}
              · {current.memberCount} {current.memberCount === 1 ? 'member' : 'members'}
            </p>
            {current.description && (
              <p className="mt-2 text-sm leading-relaxed text-subtle">{current.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {canEdit ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>
                  Edit list
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove()} loading={busy === 'delete'}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </Button>
              </>
            ) : current.visibility === 'public' ? (
              <Button
                size="sm"
                variant={current.following ? 'outline' : 'primary'}
                loading={busy === 'follow'}
                onClick={() => void toggleFollow()}
              >
                {current.following ? 'Unfollow list' : 'Follow list'}
              </Button>
            ) : null}
          </div>
        </div>

        {error && (
          <Alert variant="danger" role="alert" className="mt-3">
            {error}
          </Alert>
        )}

        {editing && (
          <form onSubmit={saveList} className="mt-4 space-y-3 rounded-xl border border-line p-3">
            <Field label="Name" htmlFor="edit-list-name" required>
              <Input
                id="edit-list-name"
                value={name}
                maxLength={60}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Description" htmlFor="edit-list-description" optional>
              <Input
                id="edit-list-description"
                value={description}
                maxLength={200}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'private' | 'public')}
                className="h-9 rounded-lg border border-line bg-surface px-2 text-xs"
                aria-label="List visibility"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <Button type="submit" size="sm" loading={busy === 'save'}>
                Save
              </Button>
            </div>
          </form>
        )}
      </header>

      <section className="border-b border-line bg-surface px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-ink">Members</h2>
        {canEdit && (
          <form onSubmit={addMember} className="mt-2 flex items-end gap-2">
            <Field label="Add by username" htmlFor="add-member" className="flex-1">
              <Input
                id="add-member"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="@username"
              />
            </Field>
            <Button type="submit" size="sm" loading={busy === 'add'}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Add
            </Button>
          </form>
        )}
        {people.length === 0 ? (
          <p className="mt-3 text-xs text-subtle">
            No members yet. Add educators and peers by username.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-2.5 py-2">
                <Avatar name={person.displayName} src={person.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${person.handle}`}
                    className="truncate text-sm font-medium text-ink hover:underline"
                  >
                    {person.displayName}
                  </Link>
                  <p className="truncate text-2xs text-subtle">@{person.handle}</p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void removeMember(person)}
                    disabled={busy === person.id}
                    aria-label={`Remove ${person.displayName}`}
                    className="rounded-lg p-1.5 text-subtle hover:bg-danger/5 hover:text-danger"
                  >
                    <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <h2 className="border-b border-line bg-surface px-4 py-3 text-sm font-semibold text-ink sm:px-5">
          List timeline
        </h2>
        {people.length === 0 ? (
          <SocialEmptyState
            title="This list has no members yet"
            description="Add accounts and their eligible public posts will appear here."
          />
        ) : (
          <PostList
            initialPage={initialTimeline}
            endpoint={`/api/social/lists/${current.id}/timeline`}
            empty={
              <SocialEmptyState
                title="No posts from this list yet"
                description="When members publish eligible posts, they appear here."
              />
            }
            storageKey={`list-${current.id}`}
          />
        )}
      </div>
    </div>
  );
}
