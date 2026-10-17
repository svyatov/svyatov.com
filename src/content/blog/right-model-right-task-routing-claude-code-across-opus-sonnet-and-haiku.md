---
title: "Right model, right task: routing Claude Code across Opus, Sonnet, and Haiku"
description: "Let Opus plan, Haiku scan, and Sonnet patch, with a rerunnable workflow script holding the orchestration outside the main context."
date: "2026-10-17"
tags: ["ai", "llm", "productivity"]
---

Most of your Opus context can disappear before any real thinking happens. It goes into reading files, into parsing agent transcripts, into tracking which of a hundred subagents finished and which one retried. By the time Opus gets to the actual hard problem, the one you brought Opus in for, it's carrying the weight of a thousand lines of boilerplate it never needed to touch.

There's a better split. This is what it looks like.

---

## The core idea: let Opus write the script, then get out of the way

You launch Claude Code like this:

```bash
claude --model opus --effort ultracode
```

You're not asking Opus to run the whole show. You're asking it to do one specific thing: turn your objective into an executable workflow script. A JavaScript file that knows the work, holds the loop, and orchestrates everything else.

Once that script exists, Opus steps back. The proposed design uses [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) for bounded-concurrency narrow file scans: fast, cheap reads that extract candidate locations without touching anything. It's reading, extracting candidates, flagging anything that looks wrong. The broader architecture questions need a more thorough look.

Sonnet 5.5 handles the patching. Each fix gets its own isolated worktree. An independent reviewer agent and tests check the result before main-branch integration. The combined changes need verification too. Nothing touches the main branch until it's been confirmed.

Then Opus comes back. It reads the verified findings and the unresolved cases, not every raw transcript.

**Opus plans · Haiku scans · Sonnet ships.**

---

## The three moments Opus actually shows up

This is the key shift in how the workflow is designed. Opus isn't absent. It appears at exactly three points:

1. **Before the run**: authoring the workflow script that defines how everything executes
2. **After the swarm finishes**: reading the verified findings and unresolved cases (not the raw transcripts, not the intermediate steps)
3. **Before anything ships to git**: signing off

Everything in between goes to faster, cheaper models. And because the workflow script is explicit and rerunnable, you don't rewrite the plan on every run. Opus wrote the playbook once. The rest of the system follows it. Runtime still costs every time through, so the savings aren't automatic.

---

## What the full tree looks like

Here's the execution flow:

```plaintext
Opus 5.5 runs the main session and writes workflow.js
└── pipeline() fans out bounded Haiku 5.5 file scans
    └── parallel() runs independent finding verifiers
        └── Sonnet 5.5 patches verified fixes in separate worktrees
            └── independent review and tests check patches and integration
                └── Opus 5.5 reviews results, including unresolved findings
```

[Claude Code dynamic workflows](https://code.claude.com/docs/en/workflows) are JavaScript scripts that orchestrate background agents using `pipeline()` and `parallel()` primitives. [Worktrees](https://code.claude.com/docs/en/worktrees) isolate working files, but they do not isolate all shared state, and integration can still conflict. JSON schema validation checks that output has the right shape; it does not verify that the content is factually correct. These per-stage model assignments aren't defaults, by the way. You have to request them explicitly.

The script holds the loop so Opus doesn't have to.

---

## Jev and the micro-forks

Deterministic branches (which file to read, which tool to call, how many retries before giving up) belong in plain JavaScript. You do not need a model for those; you need a condition.

Jev is an optional probabilistic semantic classifier that routes among a fixed set of known options when the routing decision is genuinely ambiguous in natural language. The name comes from William Stanley Jevons, not from an acronym. TypeSafe describes the approach in [their System One introduction](https://typesafe.ai/blog/introducing-system-one-models-and-jev). Your application owns the thresholds (how confident Jev needs to be before routing) and the escalation policy (what happens when confidence falls below the threshold); those are documented in [the System One build guide](https://docs.typesafe.ai/concepts/how-to-build-with-system-one).

Jev is not built into Claude Code workflows. Wiring it in means building a separate integration that your agents can call.

It's the same principle one layer down. You're asking "which *moment* in this task needs a model at all?"

Most of them don't.

---

## Why this maps to harness engineering

This SDLC design is really just harness engineering applied to model orchestration. The harness controls what each model reads, what tools it can trigger, what data survives context resets, and when execution must halt.

Andrej Karpathy's [model-as-CPU, context-as-RAM analogy](https://www.youtube.com/watch?v=zjkBMFhNj_g) is a practical framing: the model processes whatever you load into context, the same way a CPU works on whatever is in RAM. The useful implication is that orchestration state (counters, stage results, review outcomes) belongs outside the main context window, stored where it can be retrieved selectively rather than carried wholesale through every call.

The workflow script is the operating system. CLAUDE.md carries the durable rules (every finding gets an independent verifier, fix loops stop after two rounds with no progress), but those are instructions to the model, not hard constraints. The script itself implements the verifier gate and the loop counters. The isolated worktrees are the separate processes. Sonnet doesn't need to know what Haiku found two files ago, any more than one process needs to read another process's stack, though cross-file dependencies do travel when summaries get passed between stages.

Those [durable instructions are context, not enforced configuration](https://code.claude.com/docs/en/memory).

You can wire this up directly from the prompt:
> "Rebuild my Claude Code setup around this tree:
> 1. Run the main session on Opus 5.5 with ultracode on
> 2. In every workflow, run read-only scan stages on Haiku 5.5 and edit stages on Sonnet 5.5, each edit in its own isolated copy
> 3. Add one rule to CLAUDE.md: every finding gets an independent verifier agent before it's reported, and fix loops stop after two rounds with no progress. Implement the counters, gates, and combined verification step in the script.
> 4. Use plain JavaScript for all deterministic routing; consider a separately integrated Jev classifier only for decisions that are genuinely semantic, not for branching you can express as a condition.
> Show me every change as a diff first, no edits until I say go"

---

## A note on speed and scope

Independent benchmarks put Haiku 5.5 (Max) at [hundreds of output tokens per second](https://artificialanalysis.ai/models/claude-haiku-5-5).

Output token speed does not tell you how long an audit run will actually take. Input size, tool-call wait times, bounded concurrency limits, and review round-trips all contribute to wall time, and they vary by codebase. The plan/scan/patch split described above is a proposed structure, not a benchmark result; your numbers will depend on your files, your models, and how many rounds reach the reviewer.

One thing the rerunnable script does buy you: when something fails mid-run, you fix the failure and re-run the script rather than rewrite the orchestration. It does not guarantee lower total token use or lower cost. Splitting work across three model tiers can raise total consumption if scan and patch stages run many small calls. Budget for this before you commit to the architecture.

---

## What to do with this

If you're running Claude Code today and pointing Opus at everything, try the split. Let Opus write the workflow, then deliberately remove it from the loop until verification is done. Before scaling it, test quality, missed cases, latency, and cost on a representative slice of your repo. The per-Opus-call context does get cleaner, but overall token usage and cost can still increase once you count the full pipeline, so measure on something real before you decide it's an improvement.

A lot of what you were paying Opus to see didn't require Opus to see it. The work just needed somewhere to go.

Build the harness, and it has somewhere to go.
