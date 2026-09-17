---
title: "I wrote down 61 rules, then failed my own repos"
description: "Nobody starts a library because they wanted to write a SECURITY.md."
date: "2026-08-04"
tags: ["opensource", "ai", "devops", "showdev"]
devto: "https://dev.to/svyatov/i-wrote-down-61-rules-then-failed-my-own-repos-5351"
---

Nobody starts a library because they wanted to write a SECURITY.md.

You start it because there is a thing you want to exist. Then you publish it, and a second job arrives that nobody signed up for: issue templates, a code of conduct, pinned action SHAs, a changelog that survives contact with a release, a publish job that does not leave a long-lived token lying around, and a README that still tells the truth eighteen months later.

That is the boring half. It is mostly mechanical, and it decides whether a stranger with a good patch can figure out how to send it to you.

So I wrote it down. [oss-kit](https://oss-kit.svyatov.com) is 61 rules about that half of the job and nine agent skills that fix them. Then I pointed it at two repositories of my own. The first failed 27 rules. The second I had already put through the fixing loop, so it is the one that shows what is left at the other end.

## What the boring half contains

Before you can hand the work off, somebody has to say what the work is. Seven areas:

| Area | Rules | What it covers |
|---|---|---|
| Documentation | 10 | README order, claims that match the source, prose that is not marketing copy |
| Community | 9 | License, contributing guide, code of conduct, security policy, issue forms, governance |
| Continuous integration | 6 | What runs on push and on every change request, on which runtimes, and whether tests exist |
| Security posture | 15 | Pinned action SHAs, workflow permissions, branch and tag rules, lockfiles, signed tags |
| Release and publishing | 7 | Trusted publishing, provenance, approval gates, bills of materials |
| Changelog and versioning | 7 | Keep a Changelog structure, the right bump, release notes that match |
| Agent skills | 7 | Layout, frontmatter, licensing and portability, if your repo ships skills |

Two areas are gated by a precondition rather than by a setting. Publishing needs a repository that ships a built artifact, and it then splits again: on the registry-push track every rule applies, and on the tag-published track, where the registry reads your forge and no publishing credential exists at all, four of the seven have nothing to attach to. Go modules and Packagist live on that second track. The agent-skills area needs a `SKILL.md` somewhere in the repo.

That scoping is most of what an audit spends its time on. On the untouched repository below, 18 of the 61 rules came back not applicable, each with the reason: no skills, one principal holding every merge path, a release carrying no built asset, a package manager that gives you no way to decline dependency install code. That is how you tell a rule that does not reach you from one that quietly got dropped.

On forges: 57 of the 61 rules score GitHub and GitLab alike. Three are GitHub-only, one is GitLab-only, and every rule states which.

## Why an agent needed a standard first

A table like that is easy to write and useless on its own, which is the part I got wrong the first time. Ask an agent to improve your README and you get something plausible. It will be well-written. You will have no way to tell whether it is better, because "better" was never defined, and neither of you can point at anything.

So every opinion in oss-kit lives in one file as a numbered rule, and every rule carries a line naming the evidence you can go look at. Not "the README should be welcoming" but: the first paragraph after the title is a single sentence naming what the project is, and it appears before any table of contents or badge row. That is a claim you can go and check for yourself, and tell me I am wrong about. "Welcoming" is not.

The same discipline is what makes the kit reach past the language I happen to write in. Eleven ecosystems get a real answer rather than a footnote: npm, PyPI, RubyGems, crates.io, Go modules, Packagist, NuGet, Maven Central, Hex, pub.dev, and container images. Seven of the nine skills carry one file per ecosystem, 77 files in total, each ending with the date its source was last read. A script fails CI on a missing file, a file no roster lists, a declared heading left empty, or a date that does not parse.

Whether a library commits a lockfile is not one question with one answer, so the files answer it per ecosystem, each citing the documentation that settles it.

This is also the honest answer to "why not just use OpenSSF Scorecard." Scorecard is good and I use its data, but it is security-scoped: branch protection, pinned dependencies, code review, fuzzing. It has no opinion about your README, your changelog, or whether a contributor can find out how to run your tests.

CNCF's [CLOMonitor](https://github.com/cncf/clomonitor) does have those opinions, and it is the closest thing to this that already exists. It scores documentation, community files, licensing and security posture against a public checklist. It is also a hosted dashboard aimed at foundation-hosted projects, it does not read GitLab, and it stops at the report. Nothing in it hands a finding to the thing that fixes it.

## What you actually get

`clsx-ruby` is a gem of mine: green CI, published to RubyGems, six releases, and I would have told you it was in decent shape. I audited it a week ago, fixed none of what it found, and let exactly one commit land since, a development-dependency bump. So the report below is that same repository, untouched.

```bash
cd clsx-ruby
npx skills add svyatov/oss-kit --skill '*'
```

Then, to the agent: *Audit this repository against the oss-kit standard.*

Sixty-one verdict lines came back: 16 pass, 27 fail, 0 unknown, 18 not applicable. Every fail carries the evidence it read and the skill that owns the fix. Three of them, verbatim, with the `Check:` text each one quotes cut for length:

```text
- R-COM-04 fail no `SECURITY.md` at the repository root, in `.github/`, or in `docs/`
  Fixed by: oss-community
- R-SEC-11 fail rubygems: `dependency-graph/sbom` lists 11 packages, every one a direct `Gemfile`
  entry, plus the 3 actions; the on-disk `Gemfile.lock` resolves 29 gems, so the 18 transitive
  dependencies are watched by nothing, because no lockfile is committed for the graph to read.
  `vulnerability-alerts` answers 204, so the alerting itself is enabled
  Fixed by: oss-harden
- R-PUB-03 fail rubygems: `https://rubygems.org/api/v1/attestations/clsx-ruby-1.2.0.json` answers
  200 with an empty array, so the registry serves no attestation for the exact published version
  Fixed by: oss-publish
```

A few of the twenty-seven, in the order that they bother me:

**Nobody can report a vulnerability in this gem privately.** There is no SECURITY.md, so a person who finds something either opens a public issue describing it or gives up.

**Eighteen of the twenty-nine gems it resolves are watched by nothing.** The dependency graph reads the `Gemfile`, the `Gemfile.lock` is in `.gitignore`, so everything transitive is invisible to the one tool that would tell me about an advisory.

**Three of its actions are pinned to a tag rather than a commit.** `actions/checkout@v4`, `ruby/setup-ruby@v1` and `codecov/codecov-action@v5`, each a name whoever publishes it can repoint whenever they like.

**The README opens with "The fastest".** There is a benchmark table that backs that up, 55 lines down, past the point where a reader decides. A superlative with its evidence out of reach is the exact thing I wrote a rule against, in a README I wrote myself.

**The published gem has no attestation.** Nothing ties `clsx-ruby-1.2.0.gem` back to the commit it was built from. The audit did not conclude that from a 404, which is the difference between a fail and an honest `unknown`: a guessed URL answering 404 proves nothing about the gem.

The report is a file now, `oss-audit-report.md`, written at the root of the repo and untracked. It carries a verdict line for all 61 rules, passes included, and it ends by grouping the 27 fails into seven pull requests with the dependencies between them spelled out. Community files first, because SECURITY.md is what the security rules build on. Commit the lockfile before the rule that reads the dependency graph, because one closes the other. Publishing last, because two of its rules can only be verified against a newly published artifact.

## Then you fix them

None of that is work that gets done by reading a report, which is what the other repository is for.

`sec_id` is a gem I have maintained for years: 17 published releases, every community file present, contributing guide, code of conduct, security policy, issue templates. When I first ran this audit on it, against a standard that held 46 rules, it scored 19 pass, 18 fail, and one honest `unknown`.

Then I ran the fixing loop on that report. Eight pull requests, which I grouped by owning skill myself, because the report file did not exist yet: pin the actions and commit the lockfiles, publish through trusted publishing, state the governance, give the README a differentiator, resolve the changelog version links.

Same prompt, same repo, seven days and 61 rules later:

```bash
cd ../sec_id
```

```text
Audited 51 applicable rules: 44 pass, 7 fail, 0 unknown, 10 not applicable.
```

Eighteen fails to seven, while the standard grew by fifteen rules underneath it. The `unknown` closed too, and on real evidence: the sigstore bundle's digest matches the published gem's checksum, and the certificate names the workflow and the tag it was built from.

The standard moving did not only cost me. `R-COM-06` wanted a CODEOWNERS file and `sec_id` failed it on the first run. It now scores not applicable, because the rule gained an exclusion for a repository where one principal holds every merge path. No file was ever written. Some of the drop from eighteen to seven is the rule moving rather than the repo.

The seven survivors are what a fixing pass could not close.

Two are rules that did not exist when I fixed it, and the next section is about them. Two are failures the fixing caused: one pull request added a `SKILL.md`, which pulled the whole agent-skills area into scope, and two of its seven rules fail. One is a rule whose text changed under a config I never touched, and one is a check I think is simply wrong. Those two get the sections after that.

The seventh is the one I would call plain old debt. `R-CHG-05` wants a removal to have been deprecated in some earlier release, and two of `sec_id`'s major versions removed things that never were. Both are published, so nothing can go back and deprecate them now. The contributing guide already states the gap outright, which is about as honest as that gets.

Fixing a repository is how you find the rules that were never reaching it.

## The standard moves under you

Fifteen rules in seven days, and both repositories fail the same two new ones.

`R-SEC-14` asks your dependency updater to wait before proposing a version published minutes ago, through Dependabot's `cooldown` or Renovate's `minimumReleaseAge`. `R-SEC-13` asks for a ruleset over `refs/tags/*` that blocks tag updates and deletions and names who may create one. Both repos guard their default branch, neither guards a tag, so a released version number can still be repointed at a different commit. That is the one change a version number exists to make visible.

The cooldown rule is the one I would have defended hardest, so here is what writing this post did to it.

The argument goes: what ends a registry compromise is other people looking, and that takes hours. An updater with no cooldown opens its pull request inside that window, so the project that merges its bumps promptly is the one that installs the bad version first. Diligence becomes the exposure.

Both my repos fail on a Dependabot config with no `cooldown` block, which is a fair reading of the check. But GitHub [applies a default cooldown of three days](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) to version updates when you have configured none, and three days outlasts the window the rule was written about. The exposure I just described is not present in either repository.

Renovate is where it survives. Its `minimumReleaseAge` [defaults to `null`](https://docs.renovatebot.com/renovate-schema.json), so a Renovate repo with nothing set waits zero days. Same rule, same fail, two situations that are not remotely alike, and the rule text cannot tell you which one you are in. I have [filed that against my own standard](https://github.com/svyatov/oss-kit/issues/69).

What is left of the rule is still worth having, and it is a narrower thing than I wrote down: a written setting does not move when the platform changes its default, and it is a decision somebody can audit.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "bundler"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
      semver-patch-days: 3
```

That is the whole fix, and both of my repos still do not have it.

A third new rule reaches neither repository and is the one I would read first. `R-SEC-15` asks CI to install dependencies without running the code they ship. That is the step the September 2025 npm worm used to spread. [Unit 42's writeup](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/) records that the malicious versions "contain a worm that executes a post-installation script." Installing was enough.

It falls outside eight of the eleven ecosystems rather than failing them, RubyGems among them, which is why both gems score it not applicable. Cargo, RubyGems and Hex give you no documented way to decline. Maven, NuGet, Go modules, container images and pub.dev run nothing during resolution at all.

There is a cost to writing rules this fast, and one of `sec_id`'s seven fails is it. `R-CI-01` scores a trigger block that has not changed since February. What changed is the rule: a `pull_request` trigger carrying a `branches:` filter now fails where it used to pass. The project is below 1.0.0, so an incompatible change ships in a minor release, and a repo that passed yesterday can fail today.

## What it will not do

The rules are the part you can argue with. The scoring is the part I would argue with.

Five rules ship with a real checker, a dependency-free script that either exits 0 or does not. The other 56 are scored by a model reading a check line. That ratio has moved the wrong way: the standard grew by fifteen rules and the checker still covers the same five.

The kit did gain five scripts in that time, and not one of them scores a rule. They collect the facts a check line refers to. The one script that returns a verdict is the one it already shipped with.

A collector can also be wrong. On `sec_id`, the bundled one reported two CI jobs where the repository has seven, with a `steps: 0` beside each as the tell. The rule it fed passes either way. An audit that filtered on that output would have scored a five-job blind spot without noticing.

The model half is worse. One check asks that every code block name the file or tool it goes to. `sec_id`'s README fails that on roughly 35 REPL-style blocks under a literal reading, and passes under the intent reading.

A check that would fail essentially every library README ever written is telling you about the check, not the README. Another rule passed on judgement while the bundled validator exits 1, because counting it would have reported one gap twice.

Then there is the one I did not see coming. The kit added a closing step that re-audits after the fixes and diffs the two reports, so a fix that broke something else surfaces as a verdict that went from pass to fail.

I could not run it. The first audit predated the report file, so its verdicts were chat output and nothing else. A verdict nobody wrote down cannot be compared, and my own repo is the worked example.

## The nine skills

| Skill | What it does |
|---|---|
| `oss-audit` | Scores the repository and routes each gap to a skill. |
| `oss-community` | Writes every community file, from the license to issue forms. |
| `oss-readme` | Orders the README and checks its claims against the source. |
| `oss-ci` | Writes the test, lint, and build jobs for either forge. |
| `oss-harden` | Pins action SHAs, trims permissions, and guards branches and tags. |
| `oss-publish` | Publishes to eleven ecosystems, gates the run, and signs it. |
| `oss-changelog` | Keeps CHANGELOG.md, picks the bump, writes release notes. |
| `oss-writing` | Fixes the sentences in commits, reviews, docs, and issues. |
| `oss-skill` | Fixes the structure and portability of the skills you ship. |

What these skills actually do is refuse things, and the refusals are why I let them near my repositories at all. (These are design commitments written into the skills, not behavior this post tested end to end.)

The missing SECURITY.md goes to `oss-community`, which will not write `security@example.com`, or any plausible-looking address nobody confirmed, and will not promise a response window you never agreed to. If the repo does not tell it where security reports should land, it stops and asks me. It also prefers GitHub issue forms over Markdown templates, because a template made of Markdown headings cannot require a field, so a contributor can delete every heading and submit an empty issue.

The README's out-of-reach superlative goes to `oss-readme`, which matches every claim in a README against the manifest, the source and the CI config. It also will not pick your README's facts for you: it sweeps the repo, sorts candidates into the questions a reader has, lists what it rejected and why, then stops and makes you choose three to five. Left alone, a writer picks whatever the source tree makes easy, which is how a facts list ends up describing how a project is built instead of what it does.

The three actions pinned to mutable tags go to `oss-harden`, which pins them to full commit SHAs. What it will not do is pin a dependency whose origin it could not establish in the first place. Pinning gives you the same unverified code at a known revision, and the next person to read that line will assume somebody vouched for it. It reports that as an observation with no rule ID attached, because no rule reaches it.

The unattested gem goes to `oss-publish`, which moves publishing into a workflow that authenticates without a stored token. It will not fake a missing approval gate with some third-party action it found; it reports the rule as unmet and says so.

`oss-writing` is the one I use before writing anything at all. It gives a commit or a pull request a body only when one of six named triggers applies, and the default is no body. It also refuses to add `Co-Authored-By: Claude` trailers, on the grounds that a trailer records who is accountable for a change and a tool cannot be.

## The rules you will argue with

All of which assumes you accept the rules doing the routing. I am not going to tell you these are 61 uncontroversial best practices, because several of them are not.

The README rule puts your badge row *below* the opening sentence. PostCSS and Nano ID put badges above, and they are more successful projects than anything I have written. The skill concedes the divergence in writing and states the condition under which it holds.

The prose rule bans every emoji character in project documentation. I argued against my own rule on this one, wrote "banning emojis in open source might be way too strict, emojis are fun," and then never changed it.

Two of the agent-skill rules are deliberately stricter than the Agent Skills specification. The spec permits Python, Bash and JavaScript in a bundled script and leaves the choice to the implementation; oss-kit allows only `sh` or dependency-free Node. The spec marks the `license:` field optional; oss-kit requires it, because an installer may extract one skill directory without your repository's license file. That second one is a rule `sec_id` now fails, which is how I know it bites.

And the versioning rule overrides SemVer during `0.y.z`, using MINOR for incompatible changes rather than forcing a premature 1.0.0.

You can read every rule, with its reasoning and its check, [without installing anything](https://oss-kit.svyatov.com/standard/). That is deliberate. Disagreeing with rule R-DOC-05 by name is a better outcome than nodding along to a prompt you never read, and there is a rule-proposal issue form for doing something about it.

## Where to start

Install the whole kit:

```bash
npx skills add svyatov/oss-kit --skill '*'
```

Or one skill at a time, if you only want the README one:

```bash
npx skills add svyatov/oss-kit --skill oss-readme
```

In Claude Code or GitHub Copilot CLI, type these two at the prompt instead:

```text
/plugin marketplace add svyatov/oss-kit
/plugin install oss-kit@oss-kit
```

Nine hosts are recorded, each with the paths it reads and the date that was checked. Two of them have no command-line install at all, so placing the directory is the install. Then ask your agent:

```text
Audit this repository against the oss-kit standard.
```

Authenticate `gh` before you do, because a checkout cannot answer what the audit needs to score. Rulesets, environments, the dependency graph and release bodies are all forge reads. Without them those rules come back `unknown` rather than wrong, which is the correct answer and a much thinner report.

Read the report, then run whichever skill each line named. The audit changes nothing it scores; it writes one file. The skills do change things, and they are not silent about it: they stop and ask when a file needs a fact your repository does not contain, they propose forge settings rather than changing them under you, and they finish by listing every file written or proposed and every fact that came from asking rather than reading. Skills install independently, so you can take one and ignore the rest.

If the repo is brand new there is nothing to score yet, so skip the audit and go in order: `oss-community` for the license and community files, `oss-readme`, `oss-ci`, `oss-harden`, `oss-changelog`, then `oss-publish` if you ship a package.

Run it on something you already maintain. Not a toy repo, the one you would be embarrassed to have someone read. You will get a list. Some of it you will disagree with. The rest is the boring half, finally written down, in an order somebody thought about.

Then hand it to the agent, because you did not start this project to write a SECURITY.md.
