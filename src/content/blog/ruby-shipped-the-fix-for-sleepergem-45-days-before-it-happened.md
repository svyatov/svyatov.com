---
title: "Ruby shipped the fix for SleeperGem 45 days before it happened"
description: "How Bundler cooldown could have blocked the SleeperGem releases, what the published download figures mean, and where delayed updates cannot protect you."
date: "2026-07-21"
tags: ["ruby", "security", "opensource", "devops"]
devto: "https://dev.to/svyatov/ruby-shipped-the-fix-for-sleepergem-45-days-before-it-happened-19dh"
---

On June 3rd, Bundler 4.0.13 shipped [a feature called cooldown](https://blog.rubygems.org/2026/06/03/cooldown-let-new-gems-be-vetted.html). The release post described the problem it solves like this: "an account is compromised, a malicious version ships, and any `bundle install` in the minutes that follow resolves straight to it."

Forty-five days later, someone did exactly that to three gems.

[Aikido Security disclosed the campaign](https://www.aikido.dev/blog/sleepergem-rubygems-supply-chain-attack) on July 19th and named it SleeperGem: malicious versions of `git_credential_manager`, `Dendreo`, and `fastlane-plugin-run_tests_firebase_testlab`. Two of those gems had sat untouched since 2019 and 2020, which is where the name comes from. (The third impersonates Microsoft's Git Credential Manager, and no report says whether that account was hijacked or simply the attacker's.)

The clever part is what the payload does when it lands. Aikido found a `skip_install?` check that "scans for roughly 30 environment variables belonging to CI platforms, GitHub Actions, GitLab CI, CircleCI, Travis, Jenkins, Vercel, and does nothing if it spots one." It sits still in your pipeline and wakes up on your laptop. [StepSecurity reversed the native binary](https://www.stepsecurity.io/blog/sleepergem-compromised-rubygems-drop-persistent-backdoor) it drops: a daemon in `~/.local/share/gcm/`, a systemd user unit, a cron entry, and if you installed as root, a setuid shell at `/usr/local/sbin/ping6`.

Most of the coverage stopped at "supply chain attack, be careful out there," then repeated numbers that do not survive a look at the registry.

## The numbers being repeated are not the numbers

[The most-syndicated writeup](https://thehackernews.com/2026/07/sleepergem-uses-three-malicious.html) lists `Dendreo` versions 1.1.3 and 1.1.4 as "Published on October 14, 2017." The registry says 2017-10-14 is version **1.0.1**'s date, and that 1.1.2 shipped in October 2020. A 1.1.3 published three years before 1.1.2 is not a date, it is a copy-paste of the gem's first release. Same error on the fastlane plugin, where "February 06, 2018" belongs to 0.1.0. Both malicious releases went up in July 2026. That is the article the aggregators spent the next day copying.

The scale number has the same shape. Aikido's "574,661 total downloads" is honest in context (it says all versions), but downstream it sits next to the attack and reads like blast radius. Here is where they live:

| `fastlane-plugin-run_tests_firebase_testlab` | published | downloads | relative downloads |
|---|---|---|---|
| 0.3.1 | 2019-03-04 | **531,859** | `################################` |
| 0.2.0 | 2018-07-17 | 16,509 | `#` |
| 0.1.0 | 2018-02-06 | 10,619 | `#` |
| 0.2.2 | 2018-11-29 | 6,323 | |
| 0.3.0 | 2019-01-11 | 4,965 | |
| 0.2.1 | 2018-09-27 | 4,892 | |
| **0.3.2** | **2026-07-19** | yanked, count deleted | |

One benign release from 2019 is 92.5% of it. `Dendreo` has 14,435 downloads across its entire seven-year life. Nobody publishes install counts for the malicious versions, and they can't: yanking a version removes it from the API.

## The mitigation was already on the shelf

Cooldown makes Bundler refuse to resolve to a release younger than N days. The first malicious version went up on July 18th, and all of them were gone from the registry by the 21st. Nobody published the actual yank time, so three days is an upper bound, not a measurement, but a cooldown of seven would have skipped every one of them for as long as they existed.

It is one line:

```ruby
source "https://rubygems.org", cooldown: 7
```

I checked it against a recent release. `concurrent-ruby` 1.3.8 went up on July 19th, the same day SleeperGem's last gem did:

| Gemfile | resolves to |
|---|---|
| `source "https://rubygems.org"` | concurrent-ruby **1.3.8** (2 days old) |
| `source "https://rubygems.org", cooldown: 7` | concurrent-ruby **1.3.7** |

It also fails closed. If nothing in the registry is old enough to satisfy your cooldown, Bundler does not quietly install the newest version anyway. I forced that case with an absurd window, `cooldown: 36500`, about a hundred years, against `concurrent-ruby`: it refused and told me what it held back, `79 versions excluded by the cooldown setting; pass --cooldown 0 to bypass`. A guard that gives up silently when it cannot be satisfied is worse than no guard, because you think you have one.

Cooldown is unset by default, so if you never added that line, June changed nothing for you. None of the SleeperGem coverage I can find mentions that the feature exists.

## What it doesn't buy you

Cooldown is a delay, not a defense. It works here because this attacker was loud and got caught in days. Against a version that ages quietly for three weeks, seven days of patience buys nothing.

It also does nothing about the actual hole. Neither Aikido nor StepSecurity says how the accounts were taken over. No vector, no phishing story, no statement about MFA in either direction. So every "this is why we need mandatory 2FA" reply is guessing, and mandatory MFA on RubyGems kicks in at 180 million downloads anyway. These gems are at 0.32% and 0.008% of that. It was never going to apply.

RubyGems built the right thing early and left it switched off. Go switch it on.
