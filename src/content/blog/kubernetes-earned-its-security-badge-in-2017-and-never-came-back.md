---
title: "Kubernetes earned its security badge in 2017 and never came back"
description: "Kubernetes has an OpenSSF Best Practices badge. It earned that badge on 16 August 2017 at 14:52:28 UTC, and nobody has touched the entry since. The save that earned it is still the last anyone..."
date: "2026-07-31"
tags: ["opensource", "security", "devops", "ruby"]
devto: "https://dev.to/svyatov/kubernetes-earned-its-security-badge-in-2017-and-never-came-back-58eh"
---

Kubernetes has an [OpenSSF Best Practices badge](https://www.bestpractices.dev/projects/569). It earned that badge on 16 August 2017 at 14:52:28 UTC, and nobody has touched the entry since. The save that earned it is still the last anyone made: the two timestamps sit three milliseconds apart, because one save wrote both.

The badge on that page today looks exactly like a badge earned this morning. It carries no date.

[bestpractices.dev](https://www.bestpractices.dev) has been running for a decade, the CNCF requires it before a project can graduate, and it had never crossed my desk. So I went and read it properly: the criteria, the [Rails app behind it](https://github.com/ossf/best-practices-badge), and the daily statistics it has been publishing at a public URL the whole time. This is what I found, including the part the program's own maintainer raised in 2024 and nobody has fixed.

Every number here was fetched on 31 July 2026, by crawling the site's own JSON API and its published daily statistics. They move daily, so check them rather than trusting mine.

## What the thing is

It is a questionnaire. You answer a list of questions about how your project is run, and if you answer enough of them the site gives you a badge image for your README.

It is free, it takes no review board, and it works for any project anywhere. The Linux kernel's entry points at git.kernel.org. GitLab's own repository holds one. Working anywhere is the badge's real advantage over the automated scanners.

There are [two ladders](https://openssf.org/blog/2026/02/25/getting-an-openssf-baseline-badge-with-the-best-practices-badge-system/) now, which is the first confusing thing a newcomer meets:

```diagram
  METAL (2016)                    BASELINE (2026)

  passing   67 criteria           baseline-1   24 controls  \
     |                            baseline-2   19 more       > OpenSSF Baseline,
  silver    55 more               baseline-3   21 more      /  MUST-only controls
     |
  gold      23 more

  3,080 projects at passing       223 at baseline-1
    262 at silver or better       103 at baseline-2
     86 at gold                    44 at baseline-3
```

Same form, same login, two unrelated series of questions. The metal ladder is cumulative: a gold badge is 145 criteria deep.

Anyone with an account can create an entry for any project, and nobody checks that you own it. The first person to file owns it, though GitHub committers on the repository you name can edit it too.

## Where it came from

Heartbleed, April 2014. Two weeks after the bug went public the Linux Foundation announced the Core Infrastructure Initiative, and the badge was one of the things that initiative produced.

The repository's first commit is dated 22 July 2015. Dan Kohn, two files, 24 lines: an MIT license and a README containing nothing but the project's name. Two weeks later David A. Wheeler pushed the first draft of the criteria, and the document says out loud what the thing was always going to be:

> The goal is to eventually create a "badging" program where OSS projects that meet the criteria can voluntarily self-certify that they meet the criteria and then be able to show a badge.

Self-certify. That was the plan on day one, and it is still the plan.

Greg Kroah-Hartman opened the [first pull request](https://github.com/ossf/best-practices-badge/pull/1) on 10 August 2015 to delete the code-coverage requirement, arguing coverage "is not a good metric for any sort of assurance other than someone wrote a bunch of tests." It was closed without merging. Eleven days later somebody opened the exact opposite pull request, asking to add coverage back.

The badge went generally available in May 2016. The announcement carries a line that has aged well:

> Prior to Heartbleed, OpenSSL failed to meet more than one-third of the CII Best Practices Badge criteria. Today it meets 100 percent.

Then CII became the OpenSSF, and in August 2023 the site moved from bestpractices.coreinfrastructure.org to bestpractices.dev, which is why old badge links point at a domain that no longer names anything.

OpenSSL, ten years on, still holds passing and nothing above it.

## What the 67 questions actually ask

The [range](https://www.bestpractices.dev/en/criteria) is wider than "do you have a license." The 67 sort into six groups, and the split says something before you read a single one: Basics 13, Change Control 9, Reporting 8, Quality 13, Security 16, Analysis 8. Most of the form is asking how you run the project.

Four of them, verbatim.

The easy one:

> The project sites (website, repository, and download URLs) MUST support HTTPS using TLS.

The one you cannot fake with a config change:

> The project MUST have at least one primary developer who knows how to design secure software.

The one that is true or false about the world, not about your repository:

> There MUST be no unpatched vulnerabilities of medium or higher severity that have been publicly known for more than 60 days.

And the one that quietly locks a whole class of project out of gold:

> The project MUST have a "bus factor" of 2 or more.

That last one is a gold MUST and a silver SHOULD. If you maintain your project alone, silver is reachable by writing a justification and gold is not reachable at all, no matter how good the code is. Gold also wants at least two unassociated significant contributors and half of all changes reviewed by someone other than their author. Gold is measuring your staffing, not your software.

Answering "Met" is sometimes not enough. Across all 145 criteria, 52 require a written justification and 34 require a URL inside it, and an answer that misses either is dropped from your percentage. That burden is almost entirely a silver and gold problem, though: at passing level it is one justification and eight URLs.

Passing is lenient in the other direction too. An unmet SUGGESTED criterion still counts toward your score, so a SUGGESTED item only has to be answered rather than met. And where a justification is required, the bar is `MIN_SHOULD_LENGTH = 5`. Five characters.

There is also an undocumented convention: a justification beginning with `// ` is treated as a comment rather than an answer, and it appears nowhere in the docs or the interface strings.

How long does it take? The one clean public figure comes from [Marc Wrobel](https://github.com/keycloak/keycloak/discussions/13276#discussioncomment-3464477), who filled one in for his own library and said it took "3 to 6 hours to answer all the questions." [Roscoe Bartlett](https://ideas-productivity.org/events/hpcbp-093-openssf), teaching the badge to scientific-computing groups at Sandia, puts reading the criteria alone at more than half a day. The Linux Foundation's 2016 press release claimed "generally, in under an hour," which I can find no evidence for.

Sandia's FIREWHEEL went from entry creation to passing in six hours and two minutes, one sitting. BizHawk opened its entry in November 2021 and is still in progress.

You do not have to type everything. The site reads your repository and pre-fills what it can, and you can hand it a `.bestpractices.json` file or a `security-insights.yml` in the repo instead. Autofill only works against GitHub.

## Does anyone actually check?

The maintainers answer this themselves, in [the repository](https://github.com/ossf/best-practices-badge/blob/main/docs/vetting.md), and their answer is more careful than most of the criticism I found:

> That means that the badge is not strictly self-certification, instead, the badge is merely based on it.

I went to find out how much work "merely" is doing. The app runs a set of classes it calls detectives, which read your repository and propose answers. Most of them only fill in blanks. Three of them can overrule a human being who claimed "Met", across five criteria: the HTTPS check, the security-headers check, and the license-location check.

Three, and only on GitHub. The license check reads a file listing the app can fetch from nowhere else, so on GitLab or a self-hosted repo the referee is two checks over three criteria.

It also runs the other way, which surprised me. Five answers get forced *to* Met over whatever the human said, including the license checks.

The bigger check is social rather than automated, and the maintainers lean on it deliberately: every answer and every justification is published on the project page. That is how I found the dead URLs later in this post. Anyone can read what a project claimed and go and look. And the detectives only wake up when someone saves the form, or opens it with an explicit `?reanalyze`. Merely looking at a completed entry runs nothing.

So what happens when somebody disputes a badge? There is one good test case: in August 2024 a contributor [filed an issue](https://github.com/ossf/best-practices-badge/issues/2153) saying Netdata should not hold a badge, because it had begun shipping closed-source dashboard blobs that Debian, Alpine and Fedora had all refused. Wheeler's first response was to check the LICENSE file, see GPL-3.0, and call it settled. Three days later he wrote:

> I can point to myself; when this issue was first raised, I went to LICENSE, saw "GPL-3.0", and said "sure, that's OSS".

He escalated it to the project mailing list. Nobody replied. The issue is still open two years later, and Netdata's entry still shows a passing badge, last edited in May 2023.

That is not fraud. It is a volunteer dispute process with one person in it.

## The clock that isn't there

Here is the funnel, from the site's own daily statistics:

| where entries sit today | entries | share |
|---|---|---|
| registered an entry | 11,434 | 100% |
| at 25% or more | 5,785 | 50.6% |
| at 50% or more | 5,026 | 44.0% |
| at 75% or more | 4,529 | 39.6% |
| at 90% or more | 3,863 | 33.8% |
| at passing | 3,080 | 26.9% |
| at silver or better | 262 | 2.3% |
| at gold | 86 | 0.8% |

Those are positions today, not high-water marks, so entries that slipped back are counted where they now sit. Finishing at 26.9% is healthier than the program itself advertises: the repository's README has said "on average only about 10% of pursuing projects have a passing badge" since June 2017, when it was accurate to a tenth of a point. The line has not been edited since.

Now the interesting half. Of the 3,082 entries holding a passing badge (a live crawl, two ahead of the previous night's statistics row above), 1,806 have never been edited since the write that earned it. Not "not edited recently."

| gap between earning the badge and the last edit | entries | share |
|---|---|---|
| same write (under 100 ms) | 1,806 | 58.6% |
| 100 ms to 1 s | 0 | 0.0% |
| 1 s to 1 min | 38 | 1.2% |
| 1 min to 1 h | 340 | 11.0% |
| 1 h to 6 h | 100 | 3.2% |
| 6 h to 24 h | 99 | 3.2% |
| more than 24 h | 697 | 22.6% |
| not classified (two backfill artifacts) | 2 | 0.1% |

Nothing at all falls between 100 milliseconds and one second, so the top bucket is a category rather than a cutoff I chose: one save, with the skew inside it running from 0 to 48 milliseconds.

One caveat on that 58.6%, since it flatters the argument: a third of those entries first passed in 2026 and have barely had the chance to come back. Restrict it to badges earned three or more years ago and it is still 53.6%.

Meanwhile 57.8% of passing entries have gone untouched for a year or more, and 15.5% for five years or more. There is no expiry. I looked for one: the scheduled jobs are a statistics task and a reminder mailer, neither recomputes criteria, the recurring-jobs config is an empty stub, and no CI cron touches badges.

While a project sits at 100% the main reminder query skips it, but "never emailed again" would be too strong. Drop below 100% and you re-enter the queue after a 30-day grace, which has happened to 49 entries since they first passed, GitLab and Syncthing among them. A separate warning mailer does reach projects still at 100%: ten were queued the day I looked.

Kubernetes got its last reminder on 15 June 2017. It earned the badge two months later, and nothing has emailed it since.

### But are the old answers actually wrong?

"Old" and "wrong" are different words. If a project's practices did not change, its answers did not need editing.

For the famous stale entries, that defence holds. Lynis has not touched its entry since May 2016 and its repository was pushed to this morning. POCO and cjdns are both still alive, and the specific URLs their justifications point at still resolve.

But the decay is measurable. I resolved every hostname in every passing entry's repository and homepage URLs:

| entry last touched | entries | dead hosts | share |
|---|---|---|---|
| under 1 year | 1,301 | 3 | 0.23% |
| 1 to 3 years | 860 | 5 | 0.58% |
| 3 to 5 years | 444 | 7 | 1.58% |
| 5 years or more | 477 | 8 | 1.68% |

That is 23 dead hosts across the whole passing set, so read the shape rather than the multiple: single-digit counts per cohort, and moving two entries would break the monotonicity. Opus claims a repository at a host that no longer exists. GnuPG's vulnerability-reporting URL times out. Scraps has had no commits since 2020 and still shows `maintained` as Met, which is an answer it never gave: that criterion arrived in 2021, five years after its last save.

Staleness is not the only route in, either. One entry edited the day before I looked points its homepage at a host that does not resolve, and another holds passing with a `repo_url` that is a dead link to a foundation page rather than a repository.

The sharper failure in that table is not decay. Five entries serve a passing badge while claiming `sites_https` is Met with an `http://` URL, which is the exact example the maintainers' own documentation gives of a claim the app will not accept. None of them has been edited since 2016, so those answers were wrong when they were saved rather than rotting later. The check that would strip them today was written in April 2016, before all five saves, but I could not confirm from the commit history whether it was wired into the save path by then. It is also three people rather than five: one of them filed three near-identical entries thirty-three seconds apart.

One thing does re-check you, and it happens without you. When the maintainers change a criterion, a bulk task re-scores every project's stored answers against the new rules, and it writes with `touch: false`, so your `updated_at` never moves. On 11 April 2021 nine projects lost their passing badge inside a 72-second window. Two of them had not been touched by their owners since 2016 and 2017.

So revocation exists, and it fires when the maintainers change a criterion. Nothing fires when a project simply goes quiet.

## The maintainer already said all this

In March 2024 somebody [opened an issue](https://github.com/ossf/best-practices-badge/issues/2117) pointing out that dead projects sit in the badge table looking healthy. Wheeler replied:

> Also: We do need a way to withdraw badges if no one's checked it in a long time. The "obvious" way to do it is to add a passing criteria like "badge answers have been validated within the last 3 years by a badge applicant". That means every 3 years someone the badge will drop unless someone does something.

The reporter agreed it was a good idea. Then nothing was built. The issue is still open, the roadmap has no expiry item, and it opens by describing the project as "essentially in a 'sustainment' mode."

One related mechanism did ship, in 2021: a new criterion reading "The project MUST be maintained," added outside the usual yearly cycle. The working-group minutes explain the design choice plainly:

> it doesn't risk existing badges because the default value is 'Met'

The criterion that exists to catch abandoned projects defaults to claiming they are fine, and the automatic detection Wheeler sketched alongside it was never implemented.

The program diagnosed itself correctly, wrote the roadmap entry calling itself sustainment mode, and has not built the fix.

## Who comes back

The write-once pattern is not uniform, and the split is sharper than I expected.

| top tier reached | entries | last edit within a day of earning | median gap |
|---|---|---|---|
| passing only | 2,820 | 2,278 (80.8%) | 0 days |
| silver, not gold | 176 | 78 (44.3%) | 3 days |
| gold | 86 | 29 (33.7%) | 48 days |

The tier a project chases tracks whether it comes back, and I do not think that is virtue. Gold's gates are staffing gates, so gold holders are by definition projects with more than one person available to do the coming back.

Forty-four entries have been edited more than three years after earning passing and also within the last year. The long-horizon group names itself: curl, the badge site's own app, the Linux kernel, GitLab, OpenSSL, Weblate, Jaeger. curl first passed in March 2016 and last edited in May 2026, ten years apart.

## Who requires it, and does that work?

The [CNCF requires a passing badge](https://github.com/cncf/toc/blob/main/.github/ISSUE_TEMPLATE/template-graduation-application.md) for both incubation and graduation. The Academy Software Foundation, LF AI & Data, LF Energy and FINOS each set their own rung.

Then reality. Two CNCF incubating projects have no badge entry at all. Kubeflow's umbrella entry sits at 88%, below passing. Not one graduated Academy Software Foundation project displays gold, although that one is unfair to score: their rule is gold-minus-ten-exemptions, and the site has no way to show that variant, so those projects correctly display passing.

A mandate gets you an entry. It does not get you a maintained one.

## Which ladder, and where Scorecard fits

Most people who have heard of any of this are thinking of [OpenSSF Scorecard](https://github.com/ossf/scorecard), which is a different tool: it scans your repository and gives you a score out of ten without asking you anything.

I picked ten projects to see how far apart the two can get, so read this as an existence proof rather than a correlation:

| project | badge | badge updated | Scorecard | scanned |
|---|---|---|---|---|
| curl/curl | gold | 2026-05-13 | 6.9 | 2022-11-09 |
| kubernetes/kubernetes | passing | 2017-08-16 | 7.6 | 2026-07-27 |
| rails/rails | in progress, 94% | 2020-10-15 | 6.3 | 2026-07-27 |
| nodejs/node | passing | 2024-05-07 | 6.1 | 2026-07-31 |
| facebook/react | in progress, 81% | 2018-02-19 | 7.0 | 2026-07-27 |
| ossf/best-practices-badge | gold | 2026-07-18 | 8.0 | 2026-07-31 |
| ossf/scorecard | passing | 2023-09-19 | 8.7 | 2026-07-25 |
| thephpleague/commonmark | gold | 2019-06-20 | 5.1 | 2026-07-27 |
| daurnimator/lua-http | passing | 2018-08-26 | 2.7 | 2026-07-27 |
| FoveaCentral/google_maps_geocoder | passing | 2024-11-12 | 8.4 | 2026-07-30 |

Scorecard last looked at curl in November 2022 and re-scanned most of the others this week.

commonmark holds gold on every tier and scores 5.1. React has no badge worth speaking of and scores 7.0. The disagreement runs both ways, which is the point.

The two tools are not independent: Scorecard includes your badge as one of its own checks. It fetches bestpractices.dev directly. But it is a low-weighted check, and removing it entirely moved these ten scores by between 0.0 and 0.3.

The clearest writing I found on either tool is the maintainers' [own comparison](https://github.com/ossf/best-practices-badge/blob/main/docs/badge-vs-scorecards.md), which concedes both sides:

> Scorecards: This is *entirely* automated. Pros: You can evaluate *any* OSS project with it, immediately. Cons: It focuses on what can be automatically measured (not necessarily what's important...)

> Best practices badge: this requires projects to fill in a form. Pros: It tries to focus on what's important (not what's easily automated); it can handle arbitrary situations & hosting platforms. Cons: It requires projects to work with it.

Scorecard can tell you whether branch protection is on, which no questionnaire can verify. The badge can ask whether you fix medium-severity vulnerabilities within 60 days, which no scanner can observe. Scorecard also re-runs itself, in principle: its published data for curl is from November 2022, so automated is not the same as current either.

If you are starting today: the metal ladder if you want the full interrogation, Baseline if you want the MUST-only subset that foundations are beginning to reference. FINOS already mandates Baseline rather than the metal ladder.

## The Ruby corner

I went looking for my own ecosystem and it is thin. 105 entries list Ruby as their primary language: 1 gold, 1 silver, 18 passing, 85 still in progress.

The single Ruby gold is BadgeApp, the badge site itself. A Rails application, it holds gold on every tier including all three Baseline levels, and it is the only Ruby project on that list I would call well known.

Rails opened an entry in November 2015. It sits at 94%, has never earned the badge, and was last touched in October 2020. Ruby itself sits at 16%, edited exactly once, the day after the entry was created.

No entry at all for rubygems, rspec, rubocop, sidekiq, puma, devise, jekyll, rack, sinatra, hanami, or anything under hotwired. If you maintain a Ruby library and want a genuinely uncrowded thing to do this weekend, there it is.

## Does any of it make software safer?

No study has measured badge status against security outcomes, and I went looking through the obvious places: Scholar, arXiv, the OpenSSF's own writing, and the foundation reports that track this sort of thing. [The paper people reach for](https://arxiv.org/abs/2210.14884) studies OpenSSF Scorecard rather than the badge, on 2,422 npm and PyPI packages, and its headline finding points the opposite way from how it gets summarised: vulnerability counts went *up* as the aggregate security score went up, at an R-squared of 0.04. There is a paper often cited as an independent study of the badge criteria. It turns out to be the text of a 2016 LWN article.

Only 16 of the 67 passing criteria are security criteria. The rest are about whether the project is run in a way a stranger can participate in.

So: the badge measures whether you did a specific set of sensible things once. Whether that makes your software safer is an open question that ten years of data has not been pointed at.

## How to read one, and whether to get one

Read the date before you read the level. It is on the project page, and the badge image will never tell you.

You can check any project in one line:

```bash
curl -sL 'https://www.bestpractices.dev/projects.json?url=https://github.com/kubernetes/kubernetes' \
  | jq -r '.[] | "\(.name): \(.badge_level), last updated \(.updated_at[0:10])"'
```

```text
Kubernetes: passing, last updated 2017-08-16
```

The `-L` matters: the API redirects to a URL-encoded form of your query, and without it you get an empty response and no error.

Two readers should skip it. If you want a signal that a project is healthy today, this is not that, and nothing on the site is. And if you are alone on your project, know where the ceiling is before you spend the day: silver costs you a written justification, and gold is closed to you outright. The Baseline ladder has no such gate, which is one practical reason to prefer it.

For everyone else, the honest case for filling one in is not the image. It is the questions. Ten years of public argument went into choosing them, the first pull request against them was from Greg Kroah-Hartman, and answering them costs a day if you go by the one maintainer who timed it. The badge at the end is a receipt for that day and nothing more.

Which is fine, as long as you read it as one.

Just put the re-check in your own calendar. The site will not send you one.
