import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'JobOps Radar',
  description:
    'Personal job-opportunity intelligence platform with 5-action workflow (ASSESS, ANALYZE, APPLY, BUILD, AUTOMATE).',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#1d6feb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
