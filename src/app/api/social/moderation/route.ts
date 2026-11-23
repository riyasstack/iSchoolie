import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { getModerationCounts, listModerationReports } from '@/lib/server/social/moderation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    if (!viewer.user.platformAdmin) {
      return privateJson({ error: 'Moderation is restricted.' }, { status: 403 });
    }
    const [reports, counts] = await Promise.all([
      listModerationReports(viewer),
      getModerationCounts(),
    ]);
    return privateJson({ reports, counts });
  });
}
