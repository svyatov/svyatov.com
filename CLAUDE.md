# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# svyatov.com

Personal site of Leonid Svyatov. Astro 7 static site, Tailwind CSS 4, hosted on GitHub Pages.

## Commands

- `bun install`, then `bun run dev` (http://localhost:4321)
- `bun run verify` runs everything CI runs, in order: `lint` (Biome), `check` (astro check), `build`, `test` (vitest)
- `bun run format` applies Biome fixes, including Tailwind class sorting. Unsorted classes fail `lint`, so format before verifying.
- Single test file: `bunx vitest run src/lib/posts.test.ts`. `test/dist.test.ts` reads `dist/` and throws if it is missing, so run `bun run build` first.
- `build` fetches GitHub repo metadata over the network. `GITHUB_TOKEN` is optional and raises the rate limit; CI passes the Actions token.
- CI is `.github/workflows/deploy.yml`: `bun run verify` on every push and PR, deploy to Pages on `main` only.

## Layout

- `src/content.config.ts`: two collections. `blog` is markdown in `src/content/blog/`. `projects` comes from `src/loaders/github.ts`, which fetches all repos of the `svyatov` user and keeps only the names listed in `src/data/projects.ts`, in that order. A listed repo that does not exist fails the build. If the API call fails and the content store already has entries, the loader keeps them and warns.
- `src/content/blog/*.md`: posts. Frontmatter: `title`, `description`, `date`, `tags`, optional `updated` and `devto`. A post with images lives in its own folder as `index.md`. The post id is the file or folder name and becomes `/blog/<id>/`, so an id cannot be numeric, `tag` or `year` (those are sub-routes; the dist test checks).
- `src/site.ts`: name, socials, nav (each nav item has a `key` letter), stack cards. `src/data/cv.ts`: CV content. `src/data/banners.ts`: figlet ASCII banners per page, several fonts each, all exactly 6 rows (tested) so the click-to-swap never reflows.
- `src/lib/`: pure helpers with tests next to them. `posts.ts` (sorting, urls, dates, reading time), `feeds.ts` and `llms.ts` (item shapes for rss/atom/json and llms.txt), `og.ts` (satori + resvg card, reads TTFs from `src/assets/fonts/` via `process.cwd()`).
- `src/components/*.astro`: one component per design element, tests next to them as `*.test.ts` using the Astro Container API.
- `src/pages/`: routes. `blog/[...page]` paginates 10 per page; `blog/tag/[tag]` and `blog/year/[year]` filter; `og/[slug].png.ts` renders OG cards; `rss.xml.ts`, `atom.xml.ts`, `feed.json.ts`, `llms.txt.ts`, `llms-full.txt.ts` are text endpoints and must list every post (the dist test counts them).
- `src/layouts/Base.astro`: the only layout. Its inline script owns keyboard navigation and reads attributes from the page: `a[data-key]` binds a key to a link (nav, prev/next), `main a[data-item]` makes a row a `j`/`k` target, `h1[data-type]` gets the typewriter effect, `[data-for]` help rows hide when their key is not bound on the page. New list rows and paginated links need these attributes to stay keyboard-reachable.
- `src/styles/global.css`: all design tokens live in `@theme`. Sizes are rem only; the only px values are 1px borders.
- `test/dist.test.ts`: checks the built site: every internal href resolves and ends with `/` or an extension, one canonical and one h1 per page, JSON-LD, feed counts, OG images for every post.

## Conventions

- Tailwind utilities in templates, `@utility` for the two custom ones, `.prose` for markdown output. No arbitrary values except grid templates.
- Every internal link ends with `/` (`trailingSlash: 'always'`); the dist test fails on anything else.
- Biome does not touch `src/content`. Everything else: single quotes, 100 columns, sorted imports and classes.
- Throwaway scripts are Ruby stdlib in `tmp/` (gitignored) and get deleted.
- Conventional Commits, no AI attribution footers.
