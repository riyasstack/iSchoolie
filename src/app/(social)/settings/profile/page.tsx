import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle } from '@/lib/server/social/profiles';
import { getViewerInterestTopics, listTopics } from '@/lib/server/social/topics';
import { SettingsShell } from '@/components/social/settings-shell';
import { ProfileEditor } from '@/components/social/profile-editor';

export const metadata: Metadata = {
  title: 'Edit profile',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/profile' });
  const data = await getProfileByHandle(viewer, viewer.user.handle);
  if (!data) notFound();

  const [topics, interests] = await Promise.all([
    listTopics(viewer),
    getViewerInterestTopics(viewer),
  ]);

  return (
    <SettingsShell
      viewer={viewer}
      title="Edit profile"
      description="This is your public social presence. Private identity and institution records stay separate."
    >
      <ProfileEditor
        profile={{
          handle: viewer.user.handle,
          displayName: data.profile.displayName,
          headline: data.profile.headline,
          bio: data.profile.bio,
          region: data.profile.region,
          website: data.profile.website,
          skills: data.profile.skills,
          professionalFocus: data.profile.professionalFocus,
          photoUrl: data.profile.photoUrl,
          coverUrl: data.profile.coverUrl,
        }}
        topics={topics.map((topic) => ({ slug: topic.slug, name: topic.name }))}
        initialInterests={interests.map((topic) => topic.slug)}
      />
    </SettingsShell>
  );
}
