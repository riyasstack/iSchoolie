import { privateJson } from '@/lib/server/api';
import { query, withViewer } from '@/lib/server/social/api';
import { getRecommendations, type RecommendationTab } from '@/lib/server/social/recommendations';
import type { EducationStageValue } from '@/lib/social/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) => {
    const params = query(request);
    const page = await getRecommendations(
      viewer,
      {
        tab: (params.get('tab') as RecommendationTab | null) ?? 'for-you',
        subject: params.get('subject'),
        stage: (params.get('stage') as EducationStageValue | null) ?? null,
        region: params.get('region'),
        verifiedOnly: params.get('verified') === 'true',
      },
      params.get('cursor'),
      Number(params.get('limit') ?? 12),
    );
    return privateJson(page);
  });
}
