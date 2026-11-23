import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { submitReport } from '@/lib/server/social/moderation';
import { rateLimit } from '@/lib/server/social/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`report:${viewer.user.id}`, 8, 10 * 60_000)) {
      return privateJson({ error: 'Too many reports. Try again later.' }, { status: 429 });
    }
    const body = await readJson<{
      targetType?: unknown;
      targetId?: unknown;
      reason?: unknown;
      details?: unknown;
    }>(request);
    if (
      !body ||
      (body.targetType !== 'post' && body.targetType !== 'reply' && body.targetType !== 'user') ||
      typeof body.targetId !== 'string' ||
      typeof body.reason !== 'string'
    ) {
      return badRequest('targetType, targetId and reason are required.');
    }
    const result = await submitReport(viewer, {
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      details: typeof body.details === 'string' ? body.details : undefined,
    });
    return privateJson({ report: result });
  });
}
