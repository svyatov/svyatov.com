---
title: "Handrail: write your guardrails once, enforce them everywhere"
description: "Share guardrails across Claude Code, Codex, and oh-my-pi with a single rule definition, evaluated by native hooks at event time."
date: "2026-10-06"
tags: ["ai", "opensource", "productivity"]
---

You write a rule in Claude Code: never run `git push` without asking first. It fires every time, exactly as intended. Then you open Codex CLI for a different project. The rule doesn't exist there. So you crack open Codex's configuration, figure out its hook format (different from Claude Code's), and wire up the same rule again. Then oh-my-pi ships a new version, you add it to your workflow, and the whole cycle repeats.

This is the problem nobody warned you about when AI coding agents got good: they each have their own hook system, their own event names, their own JSON schemas, and their own opinions about where config lives. Your guardrails are real: the problem is they only live in one place.

I built [Handrail](https://github.com/svyatov/handrail) to fix that.

## The fragmentation problem, in concrete terms

Claude Code has many lifecycle points you can [hook into](https://code.claude.com/docs/en/hooks). `PreToolUse` can block an action outright; exit code 2 blocks the tool call, not the entire agent. `PostToolUse` lets you validate or reformat after the fact. Configuration lives in `.claude/settings.json` (project-level configuration), and the hook system is genuinely powerful.

Codex CLI has a similar set: `PreToolUse`, `PermissionRequest`, `PostToolUse`, `UserPromptSubmit`, `Stop`, and more. Its hooks receive a JSON payload on stdin and communicate decisions back through stdout. It shares Claude-shaped hook groups and decision structures, though with differing event coverage, tool payloads, and supported decisions. Powerful, and structurally related but distinct. [See the docs](https://learn.chatgpt.com/docs/hooks).

Oh-my-pi takes yet another approach. Its [extension system](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md) is TypeScript-first: you define an `ExtensionFactory` that binds handlers to the runtime event bus with `api.on("tool_call", ...)`, and you return `{ block: true, reason: "..." }` to deny an action. Expressive, but nothing like the other two.

If you use more than one of these, and I do, you end up maintaining three separate, increasingly divergent rule sets for what is essentially the same policy. "Don't force-push to main" shouldn't need to be written three times.

## What Handrail does

One file per rule. One binary. Handrail reads the files and syncs native hooks into each harness. Those hooks invoke the Go engine to evaluate the shared rule files at event time.

Handrail v0.5.1 or later must be installed to use all three adapters.

You declare a rule once, in Handrail's neutral format, and then run:

```bash
handrail sync --harness claude
handrail sync --harness codex
handrail sync --harness omp
```

Each `sync` installs hook entries for Claude and Codex (the full plugin packages are available separately), or an owned, profile-aware native extension for oh-my-pi. The agent sees its native hooks; Handrail handles the translation.

One caveat on rules: as of v0.5.0, Codex ask rules degrade to warn. Matching calls can proceed without hook-enforced approval. Use block for actions that must be denied; sync and doctor will report which rules degrade. See the [changelog](https://github.com/svyatov/handrail/blob/main/CHANGELOG.md) for details.

No third-party runtime sprawl, either. The binary has one third-party runtime dependency: `mvdan.cc/sh/v3/syntax`, a shell parser. A lint allow-list keeps it that way. The whole thing is a single binary you drop onto your machine.

## The rule format

Handrail's rule format is harness-neutral. Canonical event names use Claude Code's vocabulary; payload fields and actions are normalized across harnesses. You describe what you want to happen (at which lifecycle point, under what conditions, with what consequence), and Handrail figures out the right native hook to install. Native capabilities differ by platform, but the format bridges them.

The [spec](https://github.com/svyatov/handrail/blob/main/docs/spec.md) treats all input as potentially hostile. That's intentional. A prompt-injected agent produces every input a careless agent does and then some, so the rule engine assumes the worst. It's also upfront about the limits of this: hooks are best-effort, never a security boundary. Every harness has a documented way to disable its hooks (managed policies may restrict disabling of user-installed hooks), and Handrail detects the ones it can see rather than claiming to defend against all of them. I'd rather have that honesty in the spec than a false sense of coverage.

## Migrating from hookify

If you started building rules with [hookify](https://github.com/anthropics/claude-code/tree/main/plugins/hookify), which is Claude Code's own plugin for this, you know it uses a nice lightweight format: markdown files with YAML frontmatter and regex patterns. It works, but it's written for Claude Code.

Handrail can import what you already wrote:

```bash
handrail import hookify
```

That converts your existing hookify rules into Handrail's neutral format, so you're not starting from scratch. The import skips unsupported fields, patterns, tool matchers, and ambiguous rules, and reports what it skipped. You keep the rules you've accumulated, but full portability to all harnesses isn't guaranteed immediately, especially with degraded features (Codex ask rules).

## The oh-my-pi adapter

Oh-my-pi support shipped in [v0.5.1](https://github.com/svyatov/handrail/releases/tag/v0.5.1). The adapter is more involved than the Claude Code and Codex ones because oh-my-pi's extension system is natively TypeScript and structurally different.

What landed: a binary-managed native extension that is profile-aware and delegates tool and lifecycle decisions to the existing Go engine. Native denial and approval work, once-only main-session Stop hooks work. The extension installs via `handrail sync --harness omp` and doesn't require a skill package or a separate bootstrap downloader; the binary manages it directly. Prompt submission and child-stop denial are unsupported.

## Performance

The Go engine targets single-digit milliseconds end-to-end for each hook event. That covers the full round-trip: receive the event, evaluate every applicable rule, log or act on any that match, return a decision. Linux CI's [timing tests](https://github.com/svyatov/handrail/blob/main/main_test.go) fail when the median exceeds 20ms in three representative Claude adapter scenarios: no-match PreToolUse, matching-and-logging PreToolUse, and SessionStart with rule examples. macOS skips the timing test.

I care about this because hooks that add noticeable latency to every agent action get disabled. A guardrail that's switched off because it made the agent feel sluggish isn't protecting anything.

## Where things stand

Handrail is at v0.5.1, pre-1.0, and the public surface (command set, rule file format, exit codes) is stable enough that I've documented it formally in the spec. The current versioning policy: a minor bump may break you, a patch bump will not. I'll also keep at least one deprecation release before removing anything, so you'll see a warning with the replacement name before anything disappears.

If you use Claude Code, Codex, or oh-my-pi, or any combination of them, and you've ever found yourself copy-pasting the same policy into a third config file, Handrail is for you. The repo is at [github.com/svyatov/handrail](https://github.com/svyatov/handrail), and the docs include a quick-start, the full rule format reference, and the spec.

Write the rule once. Let Handrail handle the rest.
