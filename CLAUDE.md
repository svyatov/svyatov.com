# svyatov.com

Personal site of Leonid Svyatov. Astro 7 static site, Tailwind CSS 4, hosted on GitHub Pages.

## Commands

- `bun install`, then `bun run dev` (http://localhost:4321)
- `bun run verify` runs everything CI runs: `lint` (Biome), `check` (astro check), `build`, `test` (vitest: unit, Container API component tests, and checks on `dist/`)
- `bun run format` applies Biome fixes, including Tailwind class sorting

## Layout

- `src/content/blog/*.md`: posts. Frontmatter: `title`, `description`, `date`, `tags`, optional `updated` and `devto`. A post with images lives in its own folder as `index.md`.
- `src/site.ts`: name, socials, nav, stack cards, employers. `src/data/cv.ts`: CV content. `src/data/projects.ts`: GitHub repo allowlist with optional copy overrides.
- `src/loaders/github.ts`: content loader that fetches repo metadata at build time (`GITHUB_TOKEN` optional, raises the rate limit in CI).
- `src/components/*.astro`: one component per design element, tests next to them as `*.test.ts`.
- `src/pages/`: routes. `blog/[...page]` paginates 10 per page; `og/[slug].png.ts` renders OG cards with satori + resvg using the TTFs in `src/assets/fonts/`.
- `src/styles/global.css`: all design tokens live in `@theme`. Sizes are rem only; the only px values are 1px borders.

## Conventions

- Tailwind utilities in templates, `@utility` for the two custom ones, `.prose` for markdown output. No arbitrary values except grid templates.
- Every internal link ends with `/` (`trailingSlash: 'always'`); the dist test fails on anything else.
- Throwaway scripts are Ruby stdlib in `tmp/` (gitignored) and get deleted.
- Conventional Commits, no AI attribution footers.
