import { badRequest, privateJson, readJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import {
  completeSocialOnboarding,
  getOnboardingSnapshot,
  saveOnboardingStep,
} from '@/lib/server/social/onboarding';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withViewer(request, async (viewer) =>
    privateJson({ onboarding: await getOnboardingSnapshot(viewer) }),
  );
}

export async function PATCH(request: Request) {
  return withViewer(request, async (viewer) => {
    const body = await readJson<{ step?: unknown; values?: unknown }>(request);
    if (!body || typeof body.step !== 'number' || typeof body.values !== 'object' || !body.values) {
      return badRequest('Expected a step number and values.');
    }
    const result = await saveOnboardingStep(
      viewer,
      body.step,
      body.values as Parameters<typeof saveOnboardingStep>[2],
    );
    return privateJson({
      ...result,
      onboarding: await getOnboardingSnapshot(viewer),
    });
  });
}

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    await completeSocialOnboarding(viewer);
    return privateJson({ onboarding: await getOnboardingSnapshot(viewer), redirectTo: '/feed' });
  });
}
