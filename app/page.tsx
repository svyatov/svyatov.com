import type { Metadata } from 'next';

import HeaderLink from '@/app/components/HeaderLink';
import { DESCRIPTION, TITLE } from '@/app/data';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-2">
      <header className="flex w-full flex-1 flex-col items-center justify-center px-5 text-center sm:px-20">
        <h1 className="bg-gradient-to-b from-slate-400 via-white to-slate-400 bg-clip-text text-5xl font-bold text-transparent sm:text-7xl">
          Leonid Svyatov{' '}
          <span className="mt-7 block text-xl font-normal sm:text-2xl">Full-Stack Developer & AI Enthusiast</span>
        </h1>
        <div className="mt-9 flex flex-row items-center space-x-8 px-5 sm:space-x-10">
          <HeaderLink href="https://www.linkedin.com/in/leonid-svyatov/">LinkedIn</HeaderLink>
          <HeaderLink href="https://github.com/svyatov">GitHub</HeaderLink>
          <HeaderLink href="https://leetcode.com/svyatov/">LeetCode</HeaderLink>
        </div>
      </header>
    </main>
  );
}
