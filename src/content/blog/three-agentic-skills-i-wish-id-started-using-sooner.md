---
title: "Three agentic skills I wish I'd started using sooner"
description: "improve-tests, debrief-skill, and retro: three agent skills that handle the maintenance work that always loses to something urgent, from slow test suites to friction in skills and tooling."
date: "2026-09-26"
tags: ["ai", "productivity", "testing"]
---

Your test suite takes five minutes to run. You know at least half of those tests are not pulling their weight. And yet, you never fix it, because fixing it isn't the work – it's the meta-work, the thing you do after the real thing.

That's exactly why I built two of these skills myself and adopted the third.

Two of them – improve-tests and debrief-skill – live in my [agent-toolkit](https://github.com/svyatov/agent-toolkit), right next to two dozen other plugins. It's MIT-licensed, so fork it, tweak it to fit your own setup, or send a contribution back.

The third one – retro – lives in [SuperMatt](https://github.com/svyatov/supermatt), my take on [Matt Pocock's skills](https://github.com/mattpocock/skills) that turns them into one self-checking flow for Claude Code and Codex, from idea to reviewed code. If retro resonates with you, give the rest of the flow a try.

## improve-tests: because agents run tests constantly, and slow tests compound

The idea behind [improve-tests](https://github.com/svyatov/agent-toolkit/blob/main/plugins/improve-tests/skills/improve-tests/SKILL.md) is simple: measure first, then cut. The skill profiles your test suite, identifies which tests cost the most time while catching the least, and then actually fixes them. Slow setup, redundant assertions, tests that can never fail – gone.

I ran it across three projects. The results were not subtle.

A client's Rails app went from 319 seconds wall time down to 41-72 seconds. That's a 4-8x speedup. Single files saw even sharper drops – the PDF spec fell from 98 seconds to 13, the anonymization spec from 110 seconds to 9. `ouroboros`, a Bun project, went from 221 seconds to about 83, a 62% reduction. The slowest file alone (which was taking 180 seconds) came down to 40.

In total, about 140 tests were removed across all three projects. No lost coverage was reported.

There was also a bonus: the skill found a real bug. A row-lock waiter in `ouroboros` was giving up silently, so one concurrency test was claiming to prove something it was never actually verifying. Three flaky tests were fixed as well – one had been failing 47 out of 90 runs and came down to zero.

That last part matters. The skill doesn't just delete tests to hit a faster number. It checks that whatever stays can actually catch a real break.

## debrief-skill: your skills, but better, automatically

[debrief-skill](https://github.com/svyatov/agent-toolkit/blob/main/plugins/debrief-skill/skills/debrief-skill/SKILL.md) is the one I find hardest to explain, and also the one I'd be most reluctant to give up.

After any skill runs, you point debrief-skill at it. It reads through the whole session transcript, finds every piece of friction – errors, retries, confusing steps, dead ends – and traces each one back to a specific line in the skill definition that caused it. Then it proposes a fix.

The part that makes this interesting: it works on itself, too. The debrief-skill has been improved by running debrief-skill on debrief-skill sessions. It's a self-reinforcing loop, and it means your whole toolkit quietly gets better over time without you having to sit down and audit it manually.

It's read-only by default, so nothing changes without your approval. But the proposals are usually specific enough that approving them takes seconds.

## retro: because the code isn't always the problem

[retro](https://github.com/svyatov/supermatt/blob/main/skills/retro/SKILL.md) runs after an implementation phase and looks at something different: not the code you wrote, but the environment you wrote it in. It reads the Claude Code session files directly from disk, finds friction in the tooling and instructions, and suggests what to change for next time.

Where debrief-skill improves skills, retro improves everything around them. The prompts, the setup, the configuration. The stuff that's easy to blame on a bad day rather than fix properly.

You can run it after any phase, really. I've started running it more liberally than just post-implementation.

## Why I regret not starting sooner

The honest answer is that all three of these hit the same category of problem: maintenance work that's real and important and always loses to whatever is urgent right now.

Slow tests? You know they're slow. You'll fix them eventually. Friction in a skill? You'll remember it next time. Tooling that's slightly off? Good enough.

The skills make the "eventually" automatic. They close the loop that otherwise just stays open.

If you're doing a lot of agentic work – and at this point, who isn't – these three are worth adding to your rotation. The compounding effect of debrief-skill and retro especially: the improvements stack, and six months from now you'll be working with a toolkit that's substantially sharper than what you started with.

The version of me from a year ago would have appreciated the nudge ;)
