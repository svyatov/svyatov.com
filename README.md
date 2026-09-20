# svyatov.com

Source of [svyatov.com](https://svyatov.com), Leonid Svyatov's personal site and blog, for anyone curious how it is built or who wants to send a fix.

[![CI](https://github.com/svyatov/svyatov.com/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/svyatov/svyatov.com/actions/workflows/deploy.yml)

- **Astro 7 and Tailwind CSS 4.** A static site, deployed to GitHub Pages on every push to `main`.
- **Keyboard first.** Every page has single-key shortcuts for navigation, `j`/`k` to move through rows, and a help dialog listing what is bound.
- **Lighthouse 100, enforced.** Every pull request runs Lighthouse on every page type, mobile and desktop, and fails unless Performance, Accessibility, Best Practices, and SEO all score 100 (`scripts/audit.ts`).
- **Browser tests.** Playwright checks keyboard navigation, focus, dialogs, reduced motion, and reflow on desktop and mobile Chromium (`e2e/site.spec.ts`).
- **Bun.** Node 22.12 or later and Bun; CI runs Bun 1.4.2.

```sh
bun install
```

```sh
bun run dev
# Local http://localhost:4321/
```

## Where to start

Run `bun run dev` first. It serves the site with live reload at http://localhost:4321.

To run what CI runs, in order:

1. `bun run verify`: Biome lint, `astro check`, build, and Vitest.
2. `bun run test:e2e`: Playwright against the build. Install its Chromium once with `bunx --no-install playwright install --with-deps chromium`.
3. `bun run audit`: Lighthouse on one page of each type. `bun run audit:full` runs every page three times.

The build fetches repository metadata from the GitHub API for the projects page. Set `GITHUB_TOKEN` to raise the rate limit; without it the build still works.

## Getting started

You need [Bun](https://bun.sh) and Node 22.12 or later.

1. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/svyatov/svyatov.com.git
   cd svyatov.com
   bun install
   ```

2. Start the dev server and open http://localhost:4321:

   ```sh
   bun run dev
   ```

3. Before opening a pull request, run the full check:

   ```sh
   bun run verify
   ```

`bun run format` applies Biome fixes, including Tailwind class sorting, which `verify` requires.

## Help and status

Questions and problems go to [GitHub Issues](https://github.com/svyatov/svyatov.com/issues). The issue form asks for the page URL and what is wrong.

The site is maintained: it is where I write, so it changes when I do. It takes fixes (typos, broken links, wrong facts, rendering or keyboard problems) and not features or design changes; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Links

- [LICENSE.md](LICENSE.md): all rights reserved; the source is published to be read, not reused.
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, tests, and how to send a fix.
- [SECURITY.md](SECURITY.md): how to report a vulnerability privately.
