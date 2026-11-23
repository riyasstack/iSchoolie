import { prisma } from '@/lib/prisma';
import { canViewPost } from '@/lib/social/policy';
import { getSocialViewer } from '@/lib/server/social/auth';
import { readMedia } from '@/lib/server/social/media';

export const dynamic = 'force-dynamic';

const NOT_FOUND = () => new Response('Not found', { status: 404 });

/**
 * Media is never served from a public folder. Every request resolves the
 * session first, then proves the viewer may see a post (or profile image) that
 * references the asset. Student-owned media is never served to adults.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getSocialViewer();
  if (!viewer) return new Response('Sign in to view this file.', { status: 401 });

  const asset = await prisma.socialMediaAsset.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, isMinor: true } },
      posts: {
        include: {
          post: {
            select: {
              id: true,
              status: true,
              audience: true,
              authorId: true,
              author: {
                select: {
                  id: true,
                  isMinor: true,
                  privateProfile: true,
                  status: true,
                  teacherVerification: { select: { status: true } },
                },
              },
            },
          },
        },
        take: 20,
      },
    },
  });

  if (!asset) return NOT_FOUND();

  const isOwner = asset.ownerId === viewer.user.id;
  const isAdmin = viewer.user.platformAdmin;
  // Safeguarding first: no adult receives a student's uploaded bytes, even with
  // a guessed URL.
  if (asset.owner.isMinor && !viewer.user.isMinor && !isOwner && !isAdmin) return NOT_FOUND();

  const relativeUrl = `/api/social/media/${asset.id}`;
  const usedOnProfile = await prisma.user.findFirst({
    where: { OR: [{ photoUrl: relativeUrl }, { socialProfile: { is: { coverUrl: relativeUrl } } }] },
    select: { id: true },
  });

  let allowed = isOwner || isAdmin || Boolean(usedOnProfile);

  if (!allowed && asset.posts.length > 0) {
    const authorIds = [...new Set(asset.posts.map((item) => item.post.authorId))];
    const follows = await prisma.socialFollow.findMany({
      where: {
        followerId: viewer.user.id,
        followingId: { in: authorIds },
        status: 'active',
      },
      select: { followingId: true },
    });
    const following = new Set(follows.map((row) => row.followingId));

    allowed = asset.posts.some(({ post }) => {
      if (post.status !== 'visible') return false;
      return canViewPost({
        viewer: {
          id: viewer.user.id,
          isMinor: viewer.user.isMinor,
          privateProfile: viewer.user.privateProfile,
          status: viewer.user.status,
          teacherVerified: viewer.teacherVerified,
        },
        author: {
          id: post.author.id,
          isMinor: post.author.isMinor,
          privateProfile: post.author.privateProfile,
          status: post.author.status,
          teacherVerified: post.author.teacherVerification?.status === 'verified',
        },
        audience: post.audience,
        isFollowing: following.has(post.authorId),
      });
    });
  }

  if (!allowed) return NOT_FOUND();

  const file = await readMedia(asset.id);
  if (!file) return NOT_FOUND();

  const headers = new Headers({
    'Content-Type': file.mimeType,
    'Content-Length': String(file.bytes.length),
    'Cache-Control': 'private, max-age=60',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Content-Disposition': `inline; filename="${asset.storageKey}"`,
  });
  void request;
  return new Response(new Uint8Array(file.bytes), { headers });
}
