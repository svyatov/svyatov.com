---
title: "Keeping code alive on a DOM you don't own: 12-year Chrome extension story"
description: "Lessons from maintaining Hacker News Sorted: resilient DOM selectors, failure reporting, daily compatibility checks, timestamps, and extension design."
date: "2026-07-17"
tags: ["webdev", "showdev", "javascript", "sideprojects"]
devto: "https://dev.to/svyatov/keeping-code-alive-on-a-dom-you-dont-own-12-year-chrome-extension-story-2g3o"
---

In April 2014 I wanted to sort posts on the Hacker News front page by points, by time, or by comments. Nothing I found did it without cluttering the page, so I wrote a tiny Chrome extension over a couple of days, uploaded it to the Web Store, and mostly stopped thinking about it for ten years.

I touched it exactly once in that decade, in 2019, to fix the selectors.

Then in March 2024 I rewrote it from scratch, with the old version still working fine: I wanted TypeScript, React, and tests, and Manifest v3 while I was in there. That's when I started actually maintaining it.

It's called [Hacker News Sorted](https://chromewebstore.google.com/detail/hacker-news-sorted/djkcnbncofmjekhlhemlkinfpkamlkaj), it's now at v2.6.1, and it has one dependency that never appears in package.json: the exact HTML structure of the Hacker News front page. HN can change that structure any day, without a changelog, and they owe me nothing.

Sorting 30 rows of a table is a weekend project. This post is about everything else: the selector that survived a layout change and the one that didn't, the badge that tells users it's my fault, the GitHub Action that checks HN's HTML every morning, and the timestamps HN quietly rewrites.

The obvious question first: HN has an official API, so why scrape the DOM at all? Because the extension doesn't need data, it needs to rearrange the page you're already looking at. Every number it sorts by is already sitting in the rows, true timestamps included.

Fetching the same 30 items over the network would only add latency, a wider permission surface, and a privacy story to explain.

## The selector war

HN's front page is one big `<table>`. Each story is three `<tr>`s, emitted in order: a title row, an info row (points, age, comments), and an empty spacer row. The natural way to grab them is `nth-child` arithmetic, and that part hasn't needed a single change since the 2024 rewrite:

```ts
// app/constants.ts (v2.6.1)
TITLE_ROWS: 'tr:nth-child(3n+1)',
INFO_ROWS: 'tr:nth-child(3n+2)',
SPACER_ROWS: 'tr:nth-child(3n+3)',
```

Each `3n+k` picks every third row from offset k: titles at 1, 4, 7, info rows at 2, 5, 8, spacers at 3, 6, 9. The pattern assumes nothing non-story slips between the rows. HN's one exception, the "More" link at the bottom, sits after all 30 stories, so it never shifts the count above it.

The trap is what those selectors run against. Until March 2026, my two outer anchors were absolute paths through HN's table soup:

```ts
// app/constants.ts, the anchors before March 2026 (v2.3.1)
CONTROL_PANEL_PARENT:
  'body > center > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(3)',
TABLE_BODY:
  'body > center > table > tbody > tr:nth-child(4) > td > table > tbody',
```

Every `nth-child(N)` in there is a bet that HN will never insert a row above row N. On March 11, 2026, HN added a logo row to its outer table and won the bet. Both anchors stopped matching, and the extension didn't crash or throw. It just silently did nothing, on every user's machine at once.

I committed a hotfix at 17:54 that day: bump the shifted indices by one. Committed, not delivered: an extension fix reaches users only after the Chrome Web Store review approves the update, so every hour of my reaction time has Google's review time stacked on top of it.

Then I sat with the diff and realized I was patching the symptom. The real problem was anchoring to *positions* when HN's markup is full of *names* that have barely moved in two decades (`.pagetop` is in the earliest Wayback Machine capture of HN, from 2007). At 18:47, 53 minutes after the hotfix, I replaced the positional paths with semantic anchors.

My first pass at that was `#hnmain tr:has(.hnname) > td:last-child`. (`:has()` matches an element by what it contains, the one relational selector CSS gives you.) It felt clever and it was wrong: `tr:has(.hnname)` matches any row with `.hnname` anywhere inside it, and HN nests tables inside tables, so an outer wrapper row matched along with the nav row it contains.

The sort menu injected itself above the page header. The version that stuck, two days later, pins every step with direct-child combinators:

```ts
// app/constants.ts (v2.6.1)
CONTROL_PANEL_PARENT: '#hnmain tr:has(> td > .pagetop > .hnname) > td:last-child',
TABLE_BODY: '#hnmain #bigbox > td > table > tbody',
```

Read the first one aloud: the cell next to the nav that contains the site name. It no longer cares how many wrapper tables HN nests around that row, and it can't accidentally match a parent, because every hop is `>`.

I want to be honest about what this buys. These are still bets. `td:last-child` is positional; the `tbody` chain still encodes nesting. The difference is what the bets are on: names HN's own stylesheet depends on, plus a few explicit local hops, instead of a count of rows in a table I can't see change.

HN renaming `#hnmain` would break me; HN renaming `#hnmain` would also break HN's own CSS, so we'd at least go down together. And the new anchors have survived exactly zero HN layout changes so far, because HN hasn't shipped one since. The positional paths survived two years before losing. Ask me in 2028.

One boundary on all of this: it works because HN's markup is unusually stable and hand-named. On a bundler-built SPA with hashed class names there are no names worth anchoring to, and you're down to ARIA roles, text content, and luck.

## When the selectors fail anyway

So v2.4.0 added the assumption that the new anchors will eventually lose too. The failure mode that scares me isn't a selector that throws; it's one that matches nothing while I have no way to know.

The content script waits for HN's DOM with a `MutationObserver` on `document.body` (the browser API that calls you back whenever the DOM changes), then runs a sanity check before injecting anything:

```ts
// content.tsx (v2.6.1)
const verifyAndInject = (parent: HTMLElement, resolve: (el: HTMLElement) => void): boolean => {
  if (!getTableBody()) {
    setLayoutStatus(false);
    return false;
  }
  setLayoutStatus(true);
  resolve(injectRootElement(parent));
  return true;
};
```

The content script hands [Plasmo](https://www.plasmo.com/) (the extension framework) a Promise that will deliver the element to render into; the `resolve` here is that Promise's resolve.

If the panel's parent shows up but the story table doesn't, the layout has shifted in a way I can't handle, and `setLayoutStatus(false)` writes a flag to `chrome.storage.sync`. A 3-second timeout covers the other case: if the parent never appears at all, same flag, and the panel never renders.

The badge itself can't be painted from the content script: only the extension's background service worker may call `chrome.action`, and `chrome.storage` is the bridge between those two worlds. Here's the entire background file, 19 lines:

```ts
// background.ts (v2.6.1)
import { SETTINGS_KEYS } from '~app/constants';

function updateBadge(ok: boolean) {
  chrome.action.setBadgeText({ text: ok ? '' : ':(' });
  chrome.action.setBadgeBackgroundColor({ color: '#E05050' });
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

// Restore badge state on service worker restart
chrome.storage.sync.get(SETTINGS_KEYS.LAYOUT_OK, (result) => {
  if (result[SETTINGS_KEYS.LAYOUT_OK] === false) updateBadge(false);
});

// React to layout status changes
chrome.storage.sync.onChanged.addListener((changes) => {
  if (SETTINGS_KEYS.LAYOUT_OK in changes) {
    updateBadge(changes[SETTINGS_KEYS.LAYOUT_OK].newValue !== false);
  }
});
```

Users see a red `:(` on the extension icon, and the popup shows a banner: "Sorting temporarily unavailable :( Hacker News appears to have changed its page layout. We're aware, and a fix is on the way." A broken extension that tells you it's broken gets a bug report. A silent one gets an uninstall.

The two-part structure of that file is Manifest v3 discipline. An MV3 service worker is killed after about 30 seconds of idle, and every global variable dies with it, so the flag's only real home is `chrome.storage`.

The listener at the bottom reacts to changes while the worker happens to be alive (anything but an explicit `false` counts as healthy). The `get` at the top runs every time Chrome starts the worker fresh, and it's what puts the badge back after the cases where Chrome resets badge state entirely, like a browser restart or an extension reload.

Write state assuming your process is already dead; read it back assuming you just woke up with amnesia.

Scope, for the record: the script matches every `news.ycombinator.com` page except item pages, which get a separate content script for the comment features.

One wart: at v2.6.1 the check has two false positives. Pages with no story list at all (your profile, the submit form) wait 3 seconds, find no table, and flip the flag.

And on a slow-loading page the timeout could flip the flag even after the menu mounted fine, because nothing cancelled it. Both fixes shipped right after this release. Detection code needs the same skepticism as the code it watches.

## The GitHub Action that reads HN every morning

The badge tells *users* something broke. It doesn't tell *me*, unless I happen to open HN that day. So the repo has a canary, `.github/workflows/monitor.yml`, and this is the whole thing:

```yaml
name: HN Layout Monitor

on:
  schedule:
    - cron: '0 9 * * *'
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  check-layout:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run fixture:update
      - run: bun run test:integration
```

Every morning at 09:00 UTC it downloads the live HN homepage, overwrites the HTML fixture my integration tests run against, and runs the suite. If HN changed something my selectors care about, the suite fails, and GitHub's stock failed-workflow email lands in my inbox. No custom alerting, no dashboard. Nineteen lines of YAML watching a website on my behalf.

The integration tests assert more than "selectors match something." They pin the row counts, the elements inside each row, and even the formats of what's in them:

```ts
// app/utils/selectors.integration.test.ts (v2.6.1)
// Canary: validate HN's .age title attribute format ("ISO_DATETIME UNIX_TIMESTAMP")
const titleFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} \d+$/;
infoRows.forEach((row) => {
  const ageEl = getTimeElement(row);
  if (!ageEl) return;
  const title = ageEl.getAttribute('title');
  expect(title, 'age title should match "ISO UNIX" format').toMatch(titleFormatRegex);
});

// Canary: validate HN's .age text format ("X minute(s)/hour(s)/day(s) ago")
const ageTextRegex = /^\d+ (minute|hour|day)s? ago$/;
infoRows.forEach((row) => {
  const label = getTimeElement(row)?.textContent?.trim();
  if (label) expect(label, 'age text should match "N unit(s) ago"').toMatch(ageTextRegex);
});
```

If HN drops the Unix timestamp from the `title` attribute, time sort breaks and the first regex catches it. If "7 hours ago" ever becomes "7h", the second one fails before I've written a parser that cares.

A daily cron doesn't buy "before the first user notices." If HN ships a change at noon, users hit it all afternoon and my email arrives the next morning.

What the canary really buys is a bound: I find out in at most a day, instead of whenever I next happen to open HN with my own extension working. For a one-person project, turning "unbounded" into "24 hours" is most of the value.

And then the canary itself broke. In July 2026 the monitor started failing every day, and the cause wasn't HN's layout. The updater also refreshes a comment-page fixture (the comment features later in this post are tested the same way), and that fixture pinned a hardcoded item id.

HN had removed that thread, and their server answered every request for it with 429, forever. The watchdog needed watching.

The fix was to stop pinning data I could derive: the updater now picks the most-commented story off the fresh homepage each run, sends a browser User-Agent, and backs off politely when HN rate-limits. It's [75 lines](https://github.com/svyatov/hacker_news_sorted/blob/main/app/__fixtures__/updateFixture.ts) if you want the fetch half of the pattern too. If your canary hardcodes anything about the site it watches, that's where it will rot.

If you maintain anything that scrapes or decorates someone else's site, steal this pattern. A cron workflow, a fixture refresh, and your existing tests.

One gotcha before you do: GitHub automatically disables scheduled workflows in a public repository after 60 days without repository activity. A canary guarding a project you consider finished is exactly the workflow that dies of that, so an occasional commit (or a calendar reminder to re-enable) is part of the deal.

And a risk I haven't paid yet: the canary fetches HN from GitHub's shared runner IPs, exactly the kind of traffic a site might one day rate-limit wholesale.

## The timestamps HN rewrites

HN has a "second chance" pool: moderators and reviewers pick good stories that got no traction, and the site re-ups them onto the front page later. When that happens, HN rewrites the story's *displayed* age.

Not to the re-up moment, even: dang [has explained](https://news.ycombinator.com/item?id=19774614) it's back-computed, the time the story would have needed to be posted to deserve its new rank. A story submitted four days ago can honestly say "1 hour ago" on the front page.

It isn't rare, either, at least not on the day I checked. Here's a row from the snapshot of the front page I took while writing this (July 16, 2026):

```html
<span class="age" title="2026-07-12T17:19:47 1783876787">
  <a href="item?id=48882777">1 hour ago</a>
</span>
```

The `title` attribute is the tell: HN rewrites the visible text, but the machine-readable timestamp keeps the original submission time, as an ISO datetime plus a Unix epoch. (Don't take the attribute's word for it: the official API's `time` field for that item returns the same 1783876787.)

You can count the rewrites on today's front page yourself. Paste this into DevTools on news.ycombinator.com:

```js
const now = Date.now() / 1000;
const HOURS_PER_UNIT = { minute: 1 / 60, hour: 1, day: 24 };
const SLACK_HOURS = 2; // beyond truncation, allow a little drift before calling it a rewrite
let rewritten = 0;

for (const age of document.querySelectorAll('span.age')) {
  const epoch = Number(age.title.split(' ')[1]);
  const trueHours = (now - epoch) / 3600;
  const label = age.textContent.trim();

  const match = label.match(/^(\d+) (minute|hour|day)/);
  if (!match) continue;
  const [, count, unit] = match;
  // "3 days ago" is truncated: it covers anything from 72 up to (but not including) 96 hours.
  const labelCeiling = HOURS_PER_UNIT[unit] * (Number(count) + 1);

  if (trueHours - labelCeiling > SLACK_HOURS) {
    rewritten++;
    console.log(`"${label}" but submitted ${trueHours.toFixed(1)} hours ago`);
  }
}
console.log(`${rewritten} of ${document.querySelectorAll('span.age').length} ages look rewritten`);
```

Against my snapshot it printed (trimmed):

```plaintext
"1 hour ago" but submitted 88.4 hours ago
"9 hours ago" but submitted 116.7 hours ago
"5 hours ago" but submitted 116.0 hours ago
13 of 30 ages look rewritten
```

That's one snapshot on one day, so your count will differ. And the snippet detects rewritten labels, not who rewrote them: the second-chance pool is the best-documented mechanism, but moderator re-ups generally leave the same signature.

What survives is narrower: on any given day, a chunk of the HN front page may be days older than it says.

So the extension sorts by the field HN doesn't rewrite. The parser is small:

```ts
// app/utils/parsers.ts (v2.6.1)
const TITLE_UNIX_TS_INDEX = 1;

export const getTime = (infoRow: HTMLElement): number => {
  const timeElement = getTimeElement(infoRow);
  if (!timeElement) return 0;

  const title = timeElement.getAttribute('title');
  if (!title) return 0;

  const unixTs = parseInt(title.split(' ')[TITLE_UNIX_TS_INDEX]);
  return isNaN(unixTs) ? 0 : unixTs;
};
```

Once real timestamps were in memory anyway, showing them was nearly free. Since v2.5.0 the extension replaces the misleading label with the true age ("1 hour ago" becomes "3 days ago"), stashing HN's original text in a `data-original-age` attribute on the link.

Toggle the feature off and it restores the attribute and deletes it. No destructive edits.

Two confessions from the git history, since this section makes me sound more deliberate than I was.

The 2024 rewrite parsed the `title` attribute by throwing the whole thing at `new Date()`. That worked while the attribute was a bare ISO date, and Wayback Machine snapshots show it stayed bare until fall 2024.

Then HN changed the format twice in two months: fractional seconds and a `Z` by October 1, today's "ISO space epoch" by November 1. V8 parses the first happily and returns `Invalid Date` for the second.

So from around November 2024 until the fix shipped in late December 2025, sorting by time was quietly broken for every user of the extension. Nobody reported it. Not one review, not one issue, and I didn't notice either, for over a year: I sort by points myself, so the broken path wasn't one I walked. That is what silent failure looks like.

The second confession: an earlier version of this very post claimed the second-chance rewrite was corrupting my time sort before v2.5.0. It wasn't. The old code read the ISO half of the same attribute, which is just as original as the epoch half. The rewrite only ever lied to *readers*, through the visible text.

I caught my own false claim by re-checking it against the git history while writing. Verifying your war stories is part of maintenance too.

## Sorts HN doesn't have: velocity and heat

Points, time, and comments are HN's own numbers, just sortable. Version 2.6.0 added two derived ones, and they exist because a different feature died.

I wanted to pin a thread's highest-scored comments to the top, until I checked the DOM and the API and found that HN hides comment scores from everyone except each comment's author. There is nothing to sort by. That dead end turned into: what *can* I compute from the numbers already on the page?

Two things, it turns out. **Velocity** is points per hour, damped:

```ts
// app/utils/sorters.ts (v2.6.1)
// Borrow HN's +2 gravity constant to keep young posts from spiking (not its full power-law rank).
const VELOCITY_DAMPING_HOURS = 2;

const velocity = (row: ParsedRow): number => {
  // Clamp age at 0 so a client clock running behind a post's server timestamp can't drive the
  // denominator to zero/negative (Infinity/NaN/negative rank); keeps the no-Infinity/NaN guarantee.
  const ageHours = Math.max(0, (nowInSeconds() - row.time) / SECONDS_PER_HOUR);
  return row.points / (ageHours + VELOCITY_DAMPING_HOURS);
};
```

Raw points-per-hour has a baby-post problem: a 20-minute-old story with a few upvotes beats everything on the page. Adding 2 hours to every denominator makes young posts earn their rank, and the penalty fades as posts age.

The `+ 2` isn't mine. In HN's own [ranking code](https://github.com/wting/hackernews/blob/master/news.arc) the denominator is (age in hours + 2) raised to a gravity power. I borrow the constant, not the exponent: velocity decays linearly where HN's rank decays as a power law, so this ranks momentum, not HN's front page.

And note which timestamp feeds it. `row.time` comes from `getTime` above, the epoch HN doesn't rewrite, so a second-chance story pretending to be an hour old doesn't get to pretend it's rising fast.

**Heat** is comments per point:

```ts
// app/utils/sorters.ts (v2.6.1)
const heat = (row: ParsedRow): number => (row.points === 0 ? HEAT_ZERO_POINTS_SENTINEL : row.comments / row.points);
```

A high ratio means a thread draws more comments than upvotes, which is sometimes exactly what you came for. (I'm not the first to notice this signal: [hn-ratio](https://github.com/paradite/hn-ratio) has ranked HN's top stories by comment-to-score ratio for years; its author reads a high ratio as "active and extended debates.")

The sentinel is for job ads, which render with no score at all: `-1` sinks them below every real story without the `Infinity` and `NaN` that naive division would spray into a comparator.

Both sorts get a toggle in the popup, and turning off the sort you're currently using reverts the page to HN's default order rather than silently switching you to points. Substituting a different metric without asking felt like the kind of thing I'd file a bug about.

## Being a guest on someone else's page

Injection comes with etiquette problems on top of selector problems. The sort menu lives in HN's header, and HN's header has its own responsive behavior to not break.

The menu has three tiers (full words, single letters, a native dropdown), and the breakpoints are count-aware: React publishes how many sorts are enabled onto the panel root as a `data-sort-count` attribute, because the collapse thresholds are pure CSS and CSS can't read React state. The stylesheet keys its breakpoints on `[data-sort-count='6']` and friends.

Each threshold sits just above the width where the menu would push HN's own nav links onto a second line. I measured those widths against HN's actual header, per option count, by resizing a window like a caveman. It was worth it.

The newest feature is on comment pages: the story author's comments get a subtle orange tint and an "OP" pill, and you can mark one other commenter per thread to highlight their replies. It exists because of a pattern HN regulars know well: someone else submits an article, and the actual author shows up in the comments saying "hi, I wrote this."

The mark is stored in `sessionStorage`, keyed by thread id. It survives reloads while you're reading and evaporates when the session ends, because a permanent cross-thread watchlist is a heavier thing than "follow this person through this discussion," and heavier wasn't the point.

Keyboard shortcuts get the same etiquette. Each sort has a hotkey (P, T, C, V, H, and D to restore HN's order), and on the first press of a key the handler checks whether another extension already claimed it. If `event.defaultPrevented` is true before I've done anything, something like Vimium got there first.

All sort hotkeys go inert, and the menu shows a note naming the exact keys that are taken.

Everything injected stays inside HN's palette (the orange is HN's own `#ff6600`), including the dot that marks posts new since your last visit, which fades out over a configurable cooldown and holds still if your system asks for reduced motion.

The settings popup follows your system's light or dark theme. The goal is furniture that looks like it was always there.

## Stack, size, and the React question

TypeScript, React 19, and Plasmo, tested with Vitest against jsdom plus real-HTML fixtures, with Playwright generating the Web Store screenshots and demo GIFs. `bun` runs everything. About 1,600 lines of TypeScript and 540 of CSS, tests excluded.

No analytics, and the extension's own code makes no network calls (the manifest's only host permission is `news.ycombinator.com`). Settings ride `chrome.storage.sync`, which is Chrome's own sync infrastructure talking to Google's servers, not mine. MIT licensed.

Does sorting 30 table rows need React? No. The sort itself is `querySelectorAll`, a comparator, and re-appending rows in order.

React pays rent in the popup and the injected menu: settings that sync live across devices, toggles that enable and disable sorts, conditional banners. The DOM work that touches HN's table is plain DOM code in plain functions, which is also what makes it testable against a fixture that is literally yesterday's HN homepage.

## Twelve years, one lesson

The extension has spent most of its life being finished. What kept it alive through the unfinished parts was never the feature code.

It was the boring perimeter: selectors anchored to names instead of positions, a sanity check before injecting, a flag in storage instead of a global, a red badge, a cron job reading HN at breakfast. None of that is HN-specific. Any code that depends on HTML it doesn't control is in the same war, whether it admits it or not.

Declare the dependency, even if only to yourself. Then build the perimeter around it.

- Install: [Hacker News Sorted on the Chrome Web Store](https://chromewebstore.google.com/detail/hacker-news-sorted/djkcnbncofmjekhlhemlkinfpkamlkaj)
- Source: [github.com/svyatov/hacker_news_sorted](https://github.com/svyatov/hacker_news_sorted)
