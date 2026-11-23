'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, ImagePlus, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';

export function ProfileEditor({
  profile,
  topics,
  initialInterests,
}: {
  profile: {
    handle: string;
    displayName: string;
    headline: string | null;
    bio: string;
    region: string | null;
    website: string | null;
    skills: string[];
    professionalFocus: string[];
    photoUrl: string | null;
    coverUrl: string | null;
  };
  topics: Array<{ slug: string; name: string }>;
  initialInterests: string[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [headline, setHeadline] = React.useState(profile.headline ?? '');
  const [bio, setBio] = React.useState(profile.bio);
  const [region, setRegion] = React.useState(profile.region ?? '');
  const [website, setWebsite] = React.useState(profile.website ?? '');
  const [skills, setSkills] = React.useState(profile.skills.join(', '));
  const [focus, setFocus] = React.useState(profile.professionalFocus.join(', '));
  const [interests, setInterests] = React.useState<string[]>(initialInterests);
  const [avatar, setAvatar] = React.useState<{ id: string | null; url: string | null }>({
    id: null,
    url: profile.photoUrl,
  });
  const [cover, setCover] = React.useState<{ id: string | null; url: string | null }>({
    id: null,
    url: profile.coverUrl,
  });
  const [avatarTouched, setAvatarTouched] = React.useState(false);
  const [coverTouched, setCoverTouched] = React.useState(false);
  const [uploading, setUploading] = React.useState<'avatar' | 'cover' | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const avatarRef = React.useRef<HTMLInputElement>(null);
  const coverRef = React.useRef<HTMLInputElement>(null);

  async function upload(kind: 'avatar' | 'cover', files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(kind);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('alt', kind === 'avatar' ? 'Profile photo' : 'Profile cover');
      const response = await fetch('/api/social/media', { method: 'POST', body: form });
      const payload = (await response.json().catch(() => null)) as
        | { id?: string; url?: string; error?: string }
        | null;
      if (!response.ok || !payload?.id || !payload.url) {
        throw new Error(payload?.error ?? 'Could not upload that image.');
      }
      if (kind === 'avatar') {
        setAvatar({ id: payload.id, url: payload.url });
        setAvatarTouched(true);
      } else {
        setCover({ id: payload.id, url: payload.url });
        setCoverTouched(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload that image.');
    } finally {
      setUploading(null);
      if (avatarRef.current) avatarRef.current.value = '';
      if (coverRef.current) coverRef.current.value = '';
    }
  }

  function toggleInterest(slug: string) {
    setInterests((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : current.length >= 12
          ? current
          : [...current, slug],
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const [profileResponse, interestsResponse] = await Promise.all([
        fetch(`/api/social/profiles/${profile.handle}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            displayName,
            headline,
            bio,
            region,
            website,
            skills: skills
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            professionalFocus: focus
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            ...(avatarTouched ? { avatarAssetId: avatar.id } : {}),
            ...(coverTouched ? { coverAssetId: cover.id } : {}),
          }),
        }),
        fetch('/api/social/settings/interests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slugs: interests }),
        }),
      ]);

      if (!profileResponse.ok) {
        const payload = (await profileResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not save your profile.');
      }
      if (!interestsResponse.ok) {
        const payload = (await interestsResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? 'Could not save your interests.');
      }

      setAvatarTouched(false);
      setCoverTouched(false);
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {saved && (
        <Alert variant="success" title="Profile saved">
          Your public profile and interests have been updated.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" role="alert" title="Could not save">
          {error}
        </Alert>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="relative h-32 bg-gradient-to-br from-plum to-brand">
          {cover.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => void upload('cover', event.target.files)}
              aria-label="Upload cover image"
            />
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full bg-ink/70 px-3 py-1.5 text-2xs font-semibold text-white backdrop-blur"
            >
              {uploading === 'cover' ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <ImagePlus className="h-3 w-3" aria-hidden="true" />
              )}
              Change cover
            </button>
            {cover.url && (
              <button
                type="button"
                onClick={() => {
                  setCover({ id: null, url: null });
                  setCoverTouched(true);
                }}
                aria-label="Remove cover image"
                className="rounded-full bg-ink/70 p-1.5 text-white"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          <div className="-mt-9 flex items-end justify-between">
            <div className="rounded-full border-4 border-surface bg-surface">
              <Avatar name={displayName || profile.handle} src={avatar.url} size="lg" />
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => void upload('avatar', event.target.files)}
              aria-label="Upload profile photo"
            />
            <div className="mb-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-2xs font-semibold text-ink hover:bg-mutedSurface"
              >
                {uploading === 'avatar' ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  <Camera className="h-3 w-3" aria-hidden="true" />
                )}
                Profile photo
              </button>
              {avatar.url && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar({ id: null, url: null });
                    setAvatarTouched(true);
                  }}
                  className="text-2xs font-medium text-subtle underline-offset-2 hover:text-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="displayName" required>
              <Input
                id="displayName"
                value={displayName}
                maxLength={80}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </Field>
            <Field label="Username" htmlFor="handle" hint="Your username is permanent in this milestone.">
              <Input id="handle" value={`@${profile.handle}`} readOnly disabled />
            </Field>
            <Field label="Headline" htmlFor="headline" optional className="sm:col-span-2">
              <Input
                id="headline"
                value={headline}
                maxLength={120}
                placeholder="e.g. Physics educator · Class 11–12"
                onChange={(event) => setHeadline(event.target.value)}
              />
            </Field>
            <Field label="Bio" htmlFor="bio" optional className="sm:col-span-2" hint="Up to 300 characters. Never include private contact details.">
              <Textarea
                id="bio"
                value={bio}
                maxLength={300}
                placeholder="What do you teach, study or care about?"
                onChange={(event) => setBio(event.target.value)}
              />
            </Field>
            <Field label="Public region" htmlFor="region" optional hint="A city or state, never an exact address.">
              <Input
                id="region"
                value={region}
                maxLength={80}
                onChange={(event) => setRegion(event.target.value)}
              />
            </Field>
            <Field label="Website" htmlFor="website" optional>
              <Input
                id="website"
                type="url"
                value={website}
                placeholder="https://"
                onChange={(event) => setWebsite(event.target.value)}
              />
            </Field>
            <Field label="Skills" htmlFor="skills" optional hint="Comma separated, up to 12.">
              <Input
                id="skills"
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder="Curriculum design, Python, mentoring"
              />
            </Field>
            <Field label="Professional focus" htmlFor="focus" optional hint="Comma separated, up to 8.">
              <Input
                id="focus"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                placeholder="STEM education, research methods"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Learning interests</h2>
            <p className="mt-0.5 text-xs text-subtle">
              Interests drive recommendations and your For You feed. Choose up to 12.
            </p>
          </div>
          <span className="text-2xs font-medium tabular-nums text-subtle">{interests.length}/12</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((topic) => {
            const active = interests.includes(topic.slug);
            return (
              <button
                key={topic.slug}
                type="button"
                aria-pressed={active}
                onClick={() => toggleInterest(topic.slug)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-line bg-surface text-subtle hover:border-brand/40 hover:text-ink',
                )}
              >
                {active && <Check className="h-3 w-3" aria-hidden="true" />}
                {topic.name}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" loading={busy} disabled={uploading !== null}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
