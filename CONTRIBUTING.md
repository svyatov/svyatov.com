# Contributing

This is a personal site. It takes fixes: a typo, a broken link, a wrong fact in a post or the CV, a page that renders or navigates badly. It does not take new features, new pages, or design changes, because the design and the content are the point of the site and they are not licensed for reuse (see [LICENSE.md](LICENSE.md)).

If you are not sure whether something counts as a fix, open an issue first and ask.

## Set up

You need [Bun](https://bun.sh). Clone your fork, then:

```sh
bun install
bun run dev
```

The dev server runs at http://localhost:4321.

## Test

Run everything CI runs, in the same order (Biome lint, `astro check`, build, Vitest):

```sh
bun run verify
```

`bun run format` applies Biome fixes, including Tailwind class sorting; unsorted classes fail `lint`, so format before verifying.

For the browser checks, install the Chromium build Playwright expects once, then run them. They start their own preview server on port 4322 and need a fresh `bun run build` first:

```sh
bunx --no-install playwright install --with-deps chromium
bun run test:e2e
```

A change to code arrives with a test. Helpers in `src/lib/` and components in `src/components/` keep their tests next to them as `*.test.ts`; `test/dist.test.ts` checks the built site. A content fix needs no new test, but `bun run verify` still has to pass, because `test/dist.test.ts` reads the output.

## Submit a change

1. Fork the repository and create a branch named `type/kebab-description`, for example `fix/cv-typo`.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.
3. Open a pull request against `main`. CI runs the checks above plus a Lighthouse audit; the pull request template asks for what CI cannot tell.

Pull requests are squash merged, so the pull request title becomes the commit subject.

What an acceptable change looks like is in [AGENTS.md](AGENTS.md), under Conventions and Layout. It is written for coding agents and it is the same standard a human change is held to.

## Who decides

Leonid Svyatov is the only maintainer. He reviews, merges, and deploys. There is no succession arranged: if he stops, the site stops with him.
