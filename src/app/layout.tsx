import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { AppLoading } from '@/components/loading/app-loading';

export const metadata: Metadata = {
  title: {
    default: 'iSchoolie — Learn. Teach. Connect. Grow. | Education Networking Platform',
    template: '%s · iSchoolie',
  },
  description:
    'iSchoolie connects students, educators and institutions through learning, educational communities, professional networking and opportunities.',
  applicationName: 'iSchoolie',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'iSchoolie — Learn. Teach. Connect. Grow.',
    description:
      'iSchoolie connects students, educators and institutions through learning, educational communities, professional networking and opportunities.',
    type: 'website',
    siteName: 'iSchoolie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iSchoolie — Learn. Teach. Connect. Grow.',
    description:
      'An education networking platform for learners, educators, guardians and institutions.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafd' },
    { media: '(prefers-color-scheme: dark)', color: '#080d18' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
        <AppLoading />
      </body>
    </html>
  );
}
