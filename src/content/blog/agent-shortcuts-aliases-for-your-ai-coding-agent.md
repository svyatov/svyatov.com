---
title: "Agent shortcuts: aliases for your AI coding agent"
description: "Shell-style shortcuts for Claude Code and Codex: commit, push, open pull requests, fix CI, and keep common agent workflows predictable."
date: "2026-09-22"
tags: ["ai", "productivity", "git"]
---

I have 100+ shell aliases in my [dotfiles](https://github.com/svyatov/dotfiles). `ai` for `claude`. `cx` for `codex`. `be` for `bundle exec`. You get the idea. After 15 years at the terminal, typing the full command feels almost rude.

When I started using Claude Code, it took me about a week before I felt the same itch. The agent is great at what it does, but asking it to "commit everything, make a good conventional commit message, scan for secrets first, don't commit on main" every single time gets old fast. I added slash commands in Claude Code. Problem solved – for Claude Code.

Then I started using Codex too. Back to square one.

Yesterday I finally fixed this properly. I moved all my agent shortcuts into a `shortcuts` plugin in my [agent-toolkit](https://github.com/svyatov/agent-toolkit), where they work across Claude Code and Codex both.

## Why shortcuts matter more than you'd think

Repeating a workflow by voice or text gets old when you could select a named command instead. The same is true with agents. Invoking `/cpr` takes less effort than spelling out "commit, push, and open a pull request", and gives the agent the same written workflow every time.

That consistency is the underrated part. When you invoke `/cb`, the instructions tell the agent to read the full diff, scan for credentials, create a branch if you're on the default branch, prefer explicit staging paths, write a conventional commit message that matches your log's existing style, and commit. No need to repeat qualifiers like "but don't commit on main" or "check for secrets first": those are already written down. `/c` deliberately stays on your current branch, including main. These are instructions for an agent, so they make the workflow explicit without guaranteeing identical results.

Think of them as microskills. Each one is a tiny, named unit of knowledge you can invoke on demand. The shortcuts disable automatic invocation in both hosts. Their full instructions load when used. Context costs still differ: Claude Code excludes these manual-only skills' descriptions until invocation, while Codex documents loading skill metadata up front. The benefit is keeping the full workflow out of the initial context, not a universal promise of zero overhead.

## The shortcuts

Here's what's in the plugin. I've grouped them by the workflow phase they belong to.

### Committing

| Command | What it does |
| --- | --- |
| [/c](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/c/SKILL.md) | Commit all changes on the current branch. Main included if that's where you are. Scans for credentials before staging or committing. |
| [/cb](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cb/SKILL.md) | Same as /c, but if you're on the default branch, creates a new branch first with a sensible type/kebab-description name. This is the one I use 80% of the time. |
| [/cp](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cp/SKILL.md) | Commit, then push. |
| [/cbp](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cbp/SKILL.md) | Commit (branching off the default branch first if needed), then push. |

### The full loop

| Command | What it does |
| --- | --- |
| [/cpr](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cpr/SKILL.md) | Commit, push, and open a pull request, or reuse the branch's existing PR. Creates a branch first if you're on the default branch. Uses a conventional commit title. |
| [/cprw](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cprw/SKILL.md) | Commit, push, open a PR, wait for CI to pass, and squash merge. Creates a branch first if you're on the default branch. Stops on failed checks; repository protections still apply. |

### Git operations

| Command | What it does |
| --- | --- |
| [/p](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/p/SKILL.md) | Push the current branch. Sets upstream when the branch has none. Refuses to force-push. |
| [/m](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/m/SKILL.md) | Attempt to squash merge the current PR without waiting for CI. Required checks, reviews, and other repository protections still apply. Deletes the branch after merging. |
| [/wm](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/wm/SKILL.md) | Wait for CI to pass, then squash merge. Stops and reports on failure; never merges past a red check. |

### CI

| Command | What it does |
| --- | --- |
| [/ci](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/ci/SKILL.md) | Report CI status for the current branch or its PR. Pulls the failing job's log and gives you the smallest excerpt that shows the cause. Read-only. |
| [/fci](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/fci/SKILL.md) | Diagnose the failing CI run, fix the root cause, push, and watch the rerun. Does not skip or loosen checks. Stops on external blockers or after one unsuccessful fix round. |

### Pull requests

| Command | What it does |
| --- | --- |
| [/prd](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/prd/SKILL.md) | Rewrite the PR title and description from the full diff against the base branch. Useful when your commits evolved beyond the original description. The diff is the source of truth. |
| [/cl](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/cl/SKILL.md) | Close issues resolved by the branch's PR. Checks completed checklist items, closes only fully resolved issues, and leaves incomplete issues open with a progress comment. |

### Code quality

| Command | What it does |
| --- | --- |
| [/lint](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/lint/SKILL.md) | Run every linter, formatter, and typecheck the repository has. Fix to zero, pre-existing violations included. Won't touch lint configuration to make output clean. |
| [/fa](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/fa/SKILL.md) | Address findings from the most recent review, audit, or check in this session. After /ci or a code review reports problems, /fa attempts each fix and reports anything skipped. Pass a range to narrow it down (e.g., /fa 2-4). |

### Rules and dependencies

| Command | What it does |
| --- | --- |
| [/rule](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/rule/SKILL.md) | Create or update a project rule. |
| [/deps](https://github.com/svyatov/agent-toolkit/blob/main/plugins/shortcuts/skills/deps/SKILL.md) | Detect package managers from manifests and lockfiles, update outdated dependencies, run the repository's checks, and commit without pushing. Requires a clean working tree. Respects version constraints and reports updates it cannot keep after verification. |

## How to install shortcuts

Two commands:

```bash
claude plugin marketplace add svyatov/agent-toolkit
claude plugin install shortcuts@svyatov-agent-toolkit
```

For Codex, use these two commands:

```bash
codex plugin marketplace add svyatov/agent-toolkit
codex plugin add shortcuts@svyatov-agent-toolkit
```

That's it. The shortcuts show up as `/c`, `/cb`, `/cpr`, etc. in your agent's slash command list.

## What else is in agent-toolkit

Shortcuts is one plugin in the toolkit, and yes, my most-used one, which is the whole point of naming it that. But there are others I reach for almost as often. `refactor` assesses code structure and makes justified changes while preserving behavior. `improve-architecture` works at a higher level: you point it at a broader slice of the codebase and it assesses module boundaries and coupling. Both can conclude that no changes are needed. Both see heavy use after long agentic sessions where the code works but the design has drifted.

The most recent addition is `atomic-commits`, whose Claude Code hook nudges the agent when a diff grows too large. That's useful when a session has gone long and the agent keeps appending to the same branch instead of splitting work out. There's also `browser-bugs` (audits frontend code against a catalog of cross-browser problems), `prior-art` (searches arXiv for relevant work before you design a non-trivial technical mechanism), `contribute` (prepares an upstream issue or PR for a third-party dependency and asks before submitting it), `browser-qa`, `generate-dockerfile`, and `generate-favicon`. The full list is in the [repo](https://github.com/svyatov/agent-toolkit).

## The point

You aliased your shell commands after the third time you typed the same thing. This is the same instinct. Your agent is just a slower terminal.

My specific shortcuts reflect my specific workflows. Yours would probably look different. The repo is there if you want to clone it and gut the parts that don't fit — or just read through the skill files and write your own from scratch. The idea is the thing worth stealing, not the commands themselves.
