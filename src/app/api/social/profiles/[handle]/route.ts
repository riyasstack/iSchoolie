import { privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { getProfileByHandle, getProfileMeta, updateProfile } from '@/lib/server/social/profiles';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  return withViewer(request, async (viewer) => {
    const data = await getProfileByHandle(viewer, handle);
    if (!data) return privateJson({ error: 'That profile is not available.' }, { status: 404 });
    const meta = await getProfileMeta(viewer, data.targetId);
    return privateJson({ ...data, meta });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  return withViewer(request, async (viewer) => {
    if (viewer.user.handle.toLowerCase() !== handle.toLowerCase()) {
      return privateJson({ error: 'You can only edit your own profile.' }, { status: 403 });
    }
    const body = await readJson<Record<string, unknown>>(request);
    if (!body) return privateJson({ error: 'Expected a JSON body.' }, { status: 400 });
    await updateProfile(viewer, {
      displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
      headline:
        body.headline === undefined ? undefined : typeof body.headline === 'string' ? body.headline : null,
      bio: typeof body.bio === 'string' ? body.bio : undefined,
      region:
        body.region === undefined ? undefined : typeof body.region === 'string' ? body.region : null,
      website:
        body.website === undefined ? undefined : typeof body.website === 'string' ? body.website : null,
      skills: Array.isArray(body.skills)
        ? body.skills.filter((value): value is string => typeof value === 'string')
        : undefined,
      professionalFocus: Array.isArray(body.professionalFocus)
        ? body.professionalFocus.filter((value): value is string => typeof value === 'string')
        : undefined,
      avatarAssetId:
        body.avatarAssetId === undefined
          ? undefined
          : typeof body.avatarAssetId === 'string'
            ? body.avatarAssetId
            : null,
      coverAssetId:
        body.coverAssetId === undefined
          ? undefined
          : typeof body.coverAssetId === 'string'
            ? body.coverAssetId
            : null,
    });
    const data = await getProfileByHandle(viewer, viewer.user.handle);
    return privateJson({ profile: data?.profile ?? null });
  });
}
