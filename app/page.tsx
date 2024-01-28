import HomepageIconLink from '@/components/HomepageIconLink';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-5 text-center sm:px-20">
        <h1 className="text-5xl font-bold sm:text-6xl">Leonid Svyatov</h1>
        <p className="mt-3 text-xl sm:text-2xl">Full-Stack Developer & AI Enthusiast</p>
        <p className="mt-5 flex flex-row space-x-8">
          <HomepageIconLink
            href="https://www.linkedin.com/in/leonid-svyatov/"
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={32}
            height={32}
          />
          <HomepageIconLink
            href="https://github.com/svyatov"
            src="/github-icon.svg"
            alt="GitHub"
            width={32}
            height={32}
          />
          <HomepageIconLink
            href="https://leetcode.com/svyatov/"
            src="/leetcode-icon.svg"
            alt="LeetCode"
            width={32}
            height={32}
          />
        </p>
      </div>
    </main>
  );
}
