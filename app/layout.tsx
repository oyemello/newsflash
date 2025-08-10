import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NewsFlash - Latest Developer News',
  description: 'Stay updated with the latest developer news and releases from RSS feeds',
  keywords: ['news', 'developer', 'technology', 'rss', 'feed'],
  authors: [{ name: 'NewsFlash Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
