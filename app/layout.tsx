import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Glory } from 'next/font/google';

import { TITLE, DESCRIPTION } from '@/app/data';

import './globals.css';

const font = Glory({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.svyatov.com'),
  title: TITLE,
  description: DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: 'black',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
