import 'server-only';
import { SocialAppShell } from '@/components/social/social-shell';
import { RightRail } from '@/components/social/right-rail';
import { toSocialViewer, type SocialViewerRecord } from '@/lib/server/social/auth';
import { getQuickSuggestions } from '@/lib/server/social/recommendations';
import { listTopics } from '@/lib/server/social/topics';

/**
 * Shared authenticated frame. `/explore` lives outside the social route group
 * because iSchoolie already has a public explore page, so both entry points
 * render this same shell and right rail.
 */
export async function SocialFrame({
  viewer,
  children,
}: {
  viewer: SocialViewerRecord;
  children: React.ReactNode;
}) {
  const [suggestions, topics] = await Promise.all([
    getQuickSuggestions(viewer, 3),
    listTopics(viewer),
  ]);

  return (
    <SocialAppShell
      viewer={toSocialViewer(viewer)}
      rightRail={<RightRail suggestions={suggestions} topics={topics} />}
    >
      {children}
    </SocialAppShell>
  );
}
