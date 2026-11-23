import { SettingsNav } from '@/components/social/settings-nav';
import type { SocialViewerRecord } from '@/lib/server/social/auth';

export function SettingsShell({
  viewer,
  title,
  description,
  children,
}: {
  viewer: SocialViewerRecord;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface pb-6 sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-subtle">{description}</p>
      </header>
      <SettingsNav isAdmin={viewer.user.platformAdmin} />
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </div>
  );
}
