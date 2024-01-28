import type { Metadata } from 'next';
import { Glory } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';

const font = Glory({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Leonid Svyatov | Full-Stack Developer & AI Enthusiast',
  description:
    'Ruby on Rails and Next.js specialist, passionate about crafting clean and' +
    'efficient code that drives business value. Currently exploring the exciting' +
    'world of AI.',
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
