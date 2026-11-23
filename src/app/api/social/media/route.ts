import { privateJson } from '@/lib/server/api';
import { withViewer } from '@/lib/server/social/api';
import { saveUpload } from '@/lib/server/social/media';
import { rateLimit } from '@/lib/server/social/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withViewer(request, async (viewer) => {
    if (!rateLimit(`upload:${viewer.user.id}`, 20, 10 * 60_000)) {
      return privateJson({ error: 'Too many uploads. Try again later.' }, { status: 429 });
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return privateJson({ error: 'Expected a multipart upload.' }, { status: 400 });
    }
    const file = form.get('file');
    if (!(file instanceof File)) {
      return privateJson({ error: 'Choose a file to upload.' }, { status: 400 });
    }
    const alt = form.get('alt');
    const result = await saveUpload(viewer, file, typeof alt === 'string' ? alt : null);
    return privateJson(result);
  });
}
