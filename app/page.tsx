import HomepageIconLink from '@/components/HomepageIconLink';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-5 text-center sm:px-20">
        <h1 className="text-5xl font-bold sm:text-6xl">Leonid Svyatov</h1>
        <div className="mt-3 text-xl sm:text-2xl">Full-Stack Developer & AI Enthusiast</div>
        <div className="mt-5 flex flex-row items-center space-x-8">
          <HomepageIconLink
            href="https://www.linkedin.com/in/leonid-svyatov/"
            src="/linkedin-icon.png"
            alt="LinkedIn"
          />
          <HomepageIconLink href="https://github.com/svyatov" src="/github-icon.png" alt="GitHub" />
          <HomepageIconLink href="https://leetcode.com/svyatov/" src="/leetcode-icon.png" alt="LeetCode" />
        </div>
      </div>
    </main>
  );
}
