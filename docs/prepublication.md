# Prepublication checks

The Pages build must pass repository verification, browser tests, and Lighthouse before the deployment job can start. This work does not publish the site.

## Run the checks

1. **A1:** Install locked dependencies with `bun install --frozen-lockfile`.
2. **A2:** Install the fixed browser revision with `bunx --no-install playwright install --with-deps chromium`.
3. **A3:** Run `bun run verify` to lint, type-check, build, and test the generated files. The build needs access to the GitHub API.
4. **A4:** Run `bun run test:e2e` against the completed build. Do not rebuild while these tests run.
5. **A5:** Run `bun run audit` on an otherwise idle machine. It saves an isolated build snapshot for collection.

Lighthouse CI 0.15.1 and Playwright 1.63.0 are development dependencies with exact versions in `package.json` and `bun.lock`. Playwright fixes the Chromium revision. CI uses Bun 1.4.2 and the Node version the Astro action installs. The upstream releases and installation instructions were checked, and npm verified registry signatures for all installed packages.

## Audit contract

The audit discovers every generated HTML file recursively, then excludes the 404 page and pages with explicit `noindex`. `bun run audit` takes the first route of each page type (home, projects, CV, work, privacy, blog index, blog page, tag archive, year archive, post) and gives it one cold load with the standard Lighthouse mobile settings and one with the desktop preset. A route that matches no page type in `scripts/routes.ts` fails the command. `bun run audit:full` gives every URL three loads per profile; in CI it runs on manual dispatch with the `full-audit` input. Scripts, animations, and prefetch remain enabled. No audits are disabled.

For each URL and profile, the Performance median must be 100. Accessibility, Best Practices, and SEO must be 100 in every run. Missing runs fail the command. Individual HTML and JSON reports, assertion results, the route list, profile configuration, and the complete score table are retained under `audit-results/`. CI uploads these and the browser reports even when a check fails, with 30-day retention.

The 404 page has `noindex`, no canonical link, and a real HTTP 404 response in the preview. Browser tests check its metadata and keyboard help. It is excluded from the ordinary Lighthouse score gate because its error status and indexing policy are intentional.

## Recorded local results

The 2026-09-19 UTC run passed repository verification with 35 tests and browser verification with 181 passed tests and one expected desktop skip of the mobile-menu test. The full Lighthouse gate passed all 438 cold loads across 73 indexable pages and two profiles. Every individual run scored 100 for Performance, Accessibility, Best Practices, and SEO. Collection used macOS 26.6.2, Playwright Chromium revision 1243, and Lighthouse 12.6.1 through Lighthouse CI 0.15.1. All 154 files in the audited snapshot match the completed production build.

Final reports and the complete score table are in `audit-results/audit-2026-09-19T22-06-02.337Z/`. The original-build baseline is in `audit-results/baseline-2026-09-19T21-30-54.864Z/`, with 146 runs. Baseline scores ranged from 99 to 100 for Performance, 90 to 96 for Accessibility, 96 to 100 for Best Practices, and 92 to 100 for SEO. These local artifacts are ignored by Git; CI retains its own reports as workflow artifacts.

## Accessibility evidence and remaining human checks

Automated browser checks cover skip-link focus, dialog naming and focus containment, focus restoration, shortcut persistence, filtered row navigation, keyboard banner activation, reduced motion, cursor duration, clipboard success and failure, mobile navigation, images, script errors, and reflow. Screenshot attachments cover home, projects, blog, pagination, tags, years, an article, CV, and 404. The reflow checks use a 320 CSS-pixel viewport and a separate 2x CSS zoom simulation.

These tests and Lighthouse do not establish WCAG 2.2 AA conformance. Before launch, record the browser, assistive technology, date, and result for each human check:

1. **M1:** Use only the keyboard through every page type, with help open and closed, shortcuts on and off, and each project filter selected. Confirm visible focus and no blocked controls.
2. **M2:** Use VoiceOver with Safari or NVDA with Firefox to hear heading structure, dialog names, filter state, checkbox state, image descriptions, and clipboard success and failure. Check repeated announcements.
3. **M3:** Use real browser zoom at 200% and 400%, plus text-only enlargement where available. Confirm reflow, readable content, and reachable dialog controls. CSS zoom automation is only a preliminary check.
4. **M4:** Check touch navigation on a physical phone, including the menu, filters, banner, copy controls, and help. Check target spacing, horizontal code/table scrolling, and both orientations.
5. **M5:** Review contrast and focus in every interactive state, including syntax colors, hover, pressed filters, text selection, and system high-contrast settings. Check reduced motion through the operating-system setting.

Actual screen-reader speech and physical-device touch checks require a human or a device session. Do not mark them complete from an accessibility-tree inspection alone.

The terminal scanline overlay uses 8% black. A contrast calculation for dim text on the code surface gives 5.47:1 without the overlay and 4.78:1 on the darkest scanline. Code comments use the same dim color. The automated design scan reported one type-hierarchy warning for the help dialog; its compact terminal typography was retained within the requested design.

## Search and content exports

Indexable pages retain crawler access. Article sitemap dates use the published or updated metadata from the generated article. Structured data describes the visible author and article content. Feed HTML uses Astro content rendering so image placeholders become public assets; exported URLs are absolute. The full Markdown export preserves code examples while resolving asset references.

`llms.txt` and `llms-full.txt` are reading conveniences. Google states that its AI search features use ordinary search requirements and do not need a special AI text file or schema. See [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features). Image and font behavior follows the [Astro assets API](https://docs.astro.build/en/reference/modules/astro-assets/). Score assertions follow the [Lighthouse CI configuration](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html).

## After publication

1. **L1:** Check HTTP-to-HTTPS and alternate-host redirects, the preferred domain, and trailing-slash URLs on GitHub Pages.
2. **L2:** Check response status and headers for normal pages, unknown paths, fonts, images, feeds, and text endpoints.
3. **L3:** Check the live sitemap, robots file, canonical URLs, social cards, and article dates.
4. **L4:** Run a separate Lighthouse audit against the public URL in Chrome DevTools after publication. Record hosting conditions separately from local results; `bun run audit` measures the local build only.
5. **L5:** Monitor Search Console and real-user performance after traffic arrives. Local lab scores do not prove indexing or field performance.
