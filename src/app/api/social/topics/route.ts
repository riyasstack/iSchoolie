import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { ensureTopics, listTopics } from '@/lib/server/social/topics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => privateJson({ topics: await listTopics(viewer) }));
}

export async function POST(request: Request) {
  return withViewer(request, async () => {
    await ensureTopics();
    return privateJson({ ok: true });
  });
}
