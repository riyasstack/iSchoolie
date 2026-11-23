'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, Check, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import {
  EDUCATION_GOALS,
  EDUCATION_STAGES,
  type EducationStageValue,
} from '@/lib/social/catalog';
import type { OnboardingSnapshot } from '@/lib/social/types';

interface TopicOption {
  slug: string;
  name: string;
  category: string;
}

const STEP_COPY = [
  { title: 'Tell us about you', description: 'Your public name and private age details.' },
  { title: 'Where are you learning?', description: 'This shapes who you can safely discover.' },
  { title: 'What brings you here?', description: 'Choose everything that applies.' },
  { title: 'Choose your subjects', description: 'Interests power your feed and suggestions.' },
  { title: 'Privacy and safety', description: 'You stay in control of your visibility.' },
];

export function OnboardingSocialWizard({
  initial,
  topics,
  startStep,
}: {
  initial: OnboardingSnapshot;
  topics: TopicOption[];
  startStep?: number;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(() => {
    const requested = startStep ?? initial.step;
    return Math.min(5, Math.max(1, requested));
  });
  const [displayName, setDisplayName] = React.useState(initial.displayName);
  const [dateOfBirth, setDateOfBirth] = React.useState(initial.dateOfBirth?.slice(0, 10) ?? '');
  const [bio, setBio] = React.useState(initial.bio);
  const [region, setRegion] = React.useState(initial.region ?? '');
  const [avatar, setAvatar] = React.useState<{ id: string | null; url: string | null }>({
    id: null,
    url: initial.photoUrl,
  });
  const [avatarTouched, setAvatarTouched] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [stage, setStage] = React.useState<EducationStageValue | null>(initial.educationStage);
  const [grade, setGrade] = React.useState<number>(initial.grade ?? 8);
  const [goals, setGoals] = React.useState<string[]>(initial.goals);
  const [interests, setInterests] = React.useState<string[]>(initial.interests);
  const [isPrivate, setIsPrivate] = React.useState(initial.isMinor ? true : initial.isPrivate);
  const [discoverable, setDiscoverable] = React.useState(initial.discoverable);
  const [recommendable, setRecommendable] = React.useState(initial.recommendable);
  const [showFollowers, setShowFollowers] = React.useState(initial.showFollowers);
  const [showFollowing, setShowFollowing] = React.useState(initial.showFollowing);
  const [guardianAcknowledged, setGuardianAcknowledged] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function uploadAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('alt', 'Profile photo');
      const response = await fetch('/api/social/media', { method: 'POST', body: form });
      const payload = (await response.json().catch(() => null)) as
        | { id?: string; url?: string; error?: string }
        | null;
      if (!response.ok || !payload?.id || !payload.url) {
        throw new Error(payload?.error ?? 'Could not upload that image.');
      }
      setAvatar({ id: payload.id, url: payload.url });
      setAvatarTouched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload that image.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function valuesFor(current: number): Record<string, unknown> {
    if (current === 1) {
      return {
        displayName,
        dateOfBirth,
        bio,
        region,
        ...(avatarTouched ? { avatarAssetId: avatar.id } : {}),
      };
    }
    if (current === 2) return { educationStage: stage, grade: stage === 'school_student' ? grade : null };
    if (current === 3) return { goals };
    if (current === 4) return { interests };
    return {
      privateProfile: initial.isMinor ? true : isPrivate,
      discoverable,
      recommendable,
      showFollowers,
      showFollowing,
      guardianAcknowledged,
    };
  }

  function validate(current: number): string | null {
    if (current === 1) {
      if (displayName.trim().length < 2) return 'Enter the name you want people to see.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return 'Enter your date of birth.';
    }
    if (current === 2 && !stage) return 'Choose where you are in your education journey.';
    if (current === 3 && goals.length === 0) return 'Choose at least one goal.';
    if (current === 4 && interests.length === 0) return 'Choose at least one subject.';
    if (current === 5 && initial.isMinor && !guardianAcknowledged) {
      return 'A parent or guardian must acknowledge this student account.';
    }
    return null;
  }

  async function next() {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/social/onboarding', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ step, values: valuesFor(step) }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { nextStep?: number; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not save this step.');
      if (step === 5) {
        router.push('/onboarding/connect');
        return;
      }
      setStep(Math.min(5, payload?.nextStep ?? step + 1));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this step.');
    } finally {
      setBusy(false);
    }
  }

  function toggleGoal(goal: string) {
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal].slice(0, 10),
    );
    setError(null);
  }

  function toggleInterest(slug: string) {
    setInterests((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : current.length >= 12
          ? current
          : [...current, slug],
    );
    setError(null);
  }

  const copy = STEP_COPY[step - 1];

  return (
    <div className="rounded-3xl border border-line bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
            Step {step} of 5
          </p>
          <div className="flex gap-1" aria-label={`Onboarding progress: step ${step} of 5`}>
            {[1, 2, 3, 4, 5].map((index) => (
              <span
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index <= step ? 'w-6 bg-brand' : 'w-3 bg-line',
                )}
              />
            ))}
          </div>
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 text-xl font-semibold tracking-tight text-ink outline-none sm:text-2xl"
        >
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-subtle">{copy.description}</p>
      </div>

      <div className="px-5 py-5 sm:px-7">
        {error && (
          <Alert variant="danger" role="alert" className="mb-4" title="Check this step">
            {error}
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={displayName || 'You'} src={avatar.url} size="lg" />
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => void uploadAvatar(event.target.files)}
                  aria-label="Upload profile photo"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mutedSurface"
                >
                  {uploading ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {avatar.url ? 'Change photo' : 'Add photo'}
                </button>
                <p className="mt-1 text-2xs text-subtle">Optional. A clear photo helps people recognise you.</p>
              </div>
            </div>

            <Field label="Display name" htmlFor="onboarding-name" required>
              <Input
                id="onboarding-name"
                value={displayName}
                maxLength={80}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>

            <Field
              label="Date of birth"
              htmlFor="onboarding-dob"
              required
              hint="Private. Used only to apply age-appropriate safety rules; never shown on your profile."
            >
              <Input
                id="onboarding-dob"
                type="date"
                value={dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </Field>

            <Field label="Short bio" htmlFor="onboarding-bio" optional hint="Up to 300 characters.">
              <Textarea
                id="onboarding-bio"
                value={bio}
                maxLength={300}
                placeholder="What are you learning or teaching?"
                onChange={(event) => setBio(event.target.value)}
              />
            </Field>

            <Field label="City or state" htmlFor="onboarding-region" optional hint="Coarse location only — never an exact address.">
              <Input
                id="onboarding-region"
                value={region}
                maxLength={80}
                onChange={(event) => setRegion(event.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {EDUCATION_STAGES.map((option) => {
                const active = stage === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setStage(option.value);
                      setError(null);
                    }}
                    className={cn(
                      'rounded-2xl border p-3.5 text-left transition',
                      active
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                        : 'border-line hover:border-brand/30 hover:bg-mutedSurface/40',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{option.label}</span>
                      {active && <Check className="h-4 w-4 text-brand" aria-hidden="true" />}
                    </span>
                    <span className="mt-1 block text-2xs leading-relaxed text-subtle">{option.hint}</span>
                  </button>
                );
              })}
            </div>

            {stage === 'school_student' && (
              <Field label="Class" htmlFor="onboarding-grade" required hint="School accounts start from Class 8.">
                <select
                  id="onboarding-grade"
                  value={grade}
                  onChange={(event) => setGrade(Number(event.target.value))}
                  className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
                >
                  {[8, 9, 10, 11, 12].map((value) => (
                    <option key={value} value={value}>
                      Class {value}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <p className="rounded-xl bg-mutedSurface/60 p-3 text-2xs leading-relaxed text-subtle">
              Choosing a role personalises your experience. It does not grant a verified institution
              role, and a claimed school affiliation is never treated as permission.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-wrap gap-2">
            {EDUCATION_GOALS.map((goal) => {
              const active = goals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-line text-subtle hover:border-brand/40 hover:text-ink',
                  )}
                >
                  {active && <Check className="h-3 w-3" aria-hidden="true" />}
                  {goal}
                </button>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => {
                const active = interests.includes(topic.slug);
                return (
                  <button
                    key={topic.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInterest(topic.slug)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      active
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-line text-subtle hover:border-brand/40 hover:text-ink',
                    )}
                  >
                    {active && <Check className="h-3 w-3" aria-hidden="true" />}
                    {topic.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-2xs text-subtle">
              {interests.length}/12 selected. You can change these at any time in settings.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {[
                {
                  id: 'private',
                  label: 'Private account',
                  hint: 'Approval is required before anyone can follow you.',
                  checked: initial.isMinor ? true : isPrivate,
                  set: setIsPrivate,
                  locked: initial.isMinor,
                },
                {
                  id: 'discoverable',
                  label: 'Allow eligible people to discover my public profile',
                  hint: 'Remove yourself from search and recommendation surfaces.',
                  checked: discoverable,
                  set: setDiscoverable,
                  locked: false,
                },
                {
                  id: 'recommendable',
                  label: 'Appear in account recommendations',
                  hint: "Applies only while your profile is discoverable.",
                  checked: recommendable,
                  set: setRecommendable,
                  locked: !discoverable,
                },
                {
                  id: 'followers',
                  label: 'Show my followers list',
                  hint: 'The count stays visible; the accounts do not.',
                  checked: showFollowers,
                  set: setShowFollowers,
                  locked: false,
                },
                {
                  id: 'following',
                  label: 'Show who I follow',
                  hint: 'Turn off to keep your following list private.',
                  checked: showFollowing,
                  set: setShowFollowing,
                  locked: false,
                },
              ].map((row) => (
                <label
                  key={row.id}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-line p-3"
                >
                  <span>
                    <span className="block text-sm font-medium text-ink">{row.label}</span>
                    <span className="mt-0.5 block text-2xs leading-relaxed text-subtle">{row.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={row.checked}
                    disabled={row.locked}
                    onChange={(event) => {
                      row.set(event.target.checked);
                      if (row.id === 'discoverable' && !event.target.checked) setRecommendable(false);
                    }}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-line accent-[rgb(var(--brand))]"
                  />
                </label>
              ))}
            </div>

            {initial.isMinor && (
              <>
                <Alert variant="info" title="Student account protections">
                  Student profiles are always private. Adults cannot discover or follow student accounts,
                  and your posts are visible only to approved followers.
                </Alert>
                <label className="flex items-start gap-2 rounded-xl border border-brand/25 bg-brand/5 p-3 text-xs leading-relaxed text-ink">
                  <input
                    type="checkbox"
                    checked={guardianAcknowledged}
                    onChange={(event) => setGuardianAcknowledged(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[rgb(var(--brand))]"
                  />
                  <span>
                    A parent or guardian knows I am using iSchoolie and agrees to this student account.
                  </span>
                </label>
              </>
            )}

            <div className="rounded-xl border border-line bg-mutedSurface/40 p-3 text-2xs leading-relaxed text-subtle">
              <p className="flex items-center gap-1.5 font-semibold text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> What stays private
              </p>
              <p className="mt-1">
                Your date of birth, exact location, institution records and grades are never part of
                your social profile. Settings can be changed later.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep((value) => Math.max(1, value - 1));
          }}
          disabled={step === 1 || busy}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-subtle transition hover:bg-mutedSurface hover:text-ink disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <Button onClick={() => void next()} loading={busy} disabled={uploading}>
          {step === 5 ? 'Continue to people' : 'Continue'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
