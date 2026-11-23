'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Lock, Plus, Trash2, Users } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SocialEmptyState } from '@/components/social/social-empty';
import { LIST_SUGGESTIONS } from '@/lib/social/catalog';
import type { SocialListSummary } from '@/lib/social/types';

export function ListsManager({ initial }: { initial: SocialListSummary[] }) {
  const router = useRouter();
  const [lists, setLists] = React.useState(initial);
  const [open, setOpen] = React.useState(initial.length === 0);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [visibility, setVisibility] = React.useState<'private' | 'public'>('private');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/social/lists', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, visibility }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { list?: SocialListSummary; error?: string }
        | null;
      if (!response.ok || !payload?.list) throw new Error(payload?.error ?? 'Could not create the list.');
      setLists((current) => [payload.list as SocialListSummary, ...current]);
      setName('');
      setDescription('');
      setVisibility('private');
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the list.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(list: SocialListSummary) {
    if (!window.confirm(`Delete “${list.name}”? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/social/lists/${list.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete the list.');
      setLists((current) => current.filter((item) => item.id !== list.id));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the list.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" role="alert" title="List problem">
          {error}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-subtle">
          Curate accounts into a timeline. Private lists are visible only to you.
        </p>
        {!open && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New list
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={create} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          <Field label="List name" htmlFor="list-name" required>
            <Input
              id="list-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Physics educators"
              required
            />
          </Field>
          <Field label="Description" htmlFor="list-description" optional>
            <Textarea
              id="list-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              placeholder="What belongs on this list?"
              className="min-h-[80px]"
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-medium text-ink">
              Visibility
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'private' | 'public')}
                className="ml-2 h-9 rounded-lg border border-line bg-surface px-2 text-xs"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={busy} disabled={name.trim().length < 2}>
                Create list
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
            <span className="text-2xs font-semibold uppercase tracking-wide text-subtle">
              Ideas:
            </span>
            {LIST_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setName(suggestion)}
                className="rounded-full border border-line px-2 py-0.5 text-2xs text-subtle hover:border-brand/40 hover:text-brand"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>
      )}

      {lists.length === 0 ? (
        <SocialEmptyState
          icon={<List className="h-5 w-5" />}
          title="No lists yet"
          description="Lists are private by default and help you follow a focused group of accounts without following every individual."
          actions={[{ href: '/connect/people', label: 'Find people to add', variant: 'secondary' }]}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((list) => (
            <article
              key={list.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-brand/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/lists/${list.id}`}
                    className="truncate text-sm font-semibold text-ink hover:underline"
                  >
                    {list.name}
                  </Link>
                  <p className="mt-0.5 text-2xs text-subtle">by @{list.ownerHandle}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-semibold text-subtle">
                  {list.visibility === 'private' ? (
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Users className="h-3 w-3" aria-hidden="true" />
                  )}
                  {list.visibility}
                </span>
              </div>
              {list.description && (
                <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-subtle">
                  {list.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-2xs text-subtle">
                  {list.memberCount} {list.memberCount === 1 ? 'member' : 'members'}
                  {list.following ? ' · followed' : ''}
                </span>
                <div className="flex items-center gap-2">
                  {list.isOwner && (
                    <button
                      type="button"
                      onClick={() => void remove(list)}
                      aria-label={`Delete ${list.name}`}
                      className="rounded-lg p-1.5 text-subtle hover:bg-danger/5 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <Link
                    href={`/lists/${list.id}`}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Open list
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
