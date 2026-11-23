import { requireSocialViewer } from '@/lib/server/social/auth';
import { SocialFrame } from '@/components/social/social-frame';

export const dynamic = 'force-dynamic';

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireSocialViewer({ nextPath: '/feed' });
  return <SocialFrame viewer={viewer}>{children}</SocialFrame>;
}
