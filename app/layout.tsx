import type { Metadata } from 'next';
import { Glory } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';

const font = Glory({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Leonid Svyatov',
  description: "Leonid Svyatov's personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
