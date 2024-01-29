import type { Metadata } from 'next';

import HeaderLink from '@/components/HeaderLink';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.svyatov.com',
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-2">
      <header className="flex w-full flex-1 flex-col items-center justify-center px-5 text-center sm:px-20">
        <h1 className="bg-gradient-to-b from-slate-400 via-white to-slate-400 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl">
          Leonid Svyatov{' '}
          <span className="mt-3 block text-xl font-normal sm:text-2xl">Full-Stack Developer & AI Enthusiast</span>
        </h1>
        <div className="mt-6 flex flex-row items-center space-x-8 border-t border-t-white px-5 pt-6 sm:space-x-10">
          <HeaderLink href="https://www.linkedin.com/in/leonid-svyatov/">LinkedIn</HeaderLink>
          <HeaderLink href="https://github.com/svyatov">GitHub</HeaderLink>
          <HeaderLink href="https://leetcode.com/svyatov/">LeetCode</HeaderLink>
        </div>
      </header>
    </main>
  );
}
