---
title: "Stop Committing Secrets to Git"
description: "Run Betterleaks as a global Git pre-commit hook alongside project hooks, and use Handrail to block hook bypasses in Codex."
date: "2026-11-18"
tags: ["git", "security", "ai", "devops"]
---

Can you run Betterleaks once configured globally and still keep each project's own hooks? Yes. That question is what makes the whole setup worth more than dropping a tool in your PATH and hoping you remember to call it.

## Named hooks compose with your repository hooks

[Git 2.54 introduced named-hook config](https://git-scm.com/docs/git-hook/2.54.0) (tested on Apple Git 2.54). It lets you register global commands by name and event. When Git fires a pre-commit hook, it runs the registered named hooks first, then runs the executable `pre-commit` script in the hook directory, if present. They stack.

Configure Betterleaks once:

```sh
git config --global hook.betterleaks.command 'betterleaks git --pre-commit --staged --redact --no-banner'
git config --global hook.betterleaks.event pre-commit
```

If your project has Lefthook installed as `.git/hooks/pre-commit`, it still fires afterward. Setting `core.hooksPath` to another directory would change where Git looks for that script, which is why you don't set it here.

Verify the composition with:

```sh
git hook list --show-scope pre-commit
```

The named hook appears with scope `global` and name `betterleaks`; the traditional repository hook appears as `hook from hookdir`. Coexistence was verified in a temporary repo using command-scoped config (global settings were not changed in that test).

## What Betterleaks actually does

It scans the staged diff for potential secrets and exits nonzero on a detection. That nonzero exit stops the commit before it records. The command prints a summary by default. Add `--verbose` to see individual findings, with secret values redacted by `--redact`. The [Betterleaks 1.x scanning docs](https://github.com/betterleaks/betterleaks/blob/v1.x/docs/scanning.md#git) cover what it scans. `betterleaks` needs to be on the Git client's PATH (not just in the shell PATH you use interactively).

## Closing the agent bypass gap

Coding agents can call `git commit --no-verify` or `git commit -n`, which [bypasses all pre-commit hooks](https://git-scm.com/docs/githooks#_pre_commit) by design. An agent that generates code and commits autonomously can skip Betterleaks without you noticing.

[Handrail](https://github.com/svyatov/handrail) addresses this when configured as a Codex PreToolUse hook. My global rule, `no-skip-hooks`, blocks shell calls to `git commit --no-verify` and `git commit -n` that it sees going through that channel. I replayed `git commit --no-verify -m "test"` with that configuration and got the block. Handrail covers the Codex shell calls it intercepts (human commands and commits outside that channel are a different matter).

## The surrounding layers

Credentials belong in a secret manager or in env files listed in `.gitignore`. That `.gitignore` protection only applies to untracked files; once a file is committed, adding it to `.gitignore` afterward doesn't untrack it.

On GitHub, [push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) is worth enabling for covered secret types. It complements this setup rather than duplicating it, because other laptops, GUI clients, and automation that push to your repos may not have any of these hooks in place. CI scanning that runs on push can catch secrets after they arrive.

If a credential reaches a remote, treat it as exposed from that moment on. Revoke and rotate first. [History cleanup](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) is worth coordinating if the situation warrants it. Old commits can persist in forks or caches even after you've rewritten the canonical repo, so a deletion rarely ends the story cleanly.
