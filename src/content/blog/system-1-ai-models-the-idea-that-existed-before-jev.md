---
title: "System 1 AI models: the idea that existed before Jev, and why you should use it anyway"
description: "System 1 models separate structured decisions from text generation. A look at Jev, earlier research, open models, and five possible applications."
date: "2026-09-21"
tags: ["ai", "classification", "llm"]
---

TypeSafe [announced Jev on September 15, 2026](https://typesafe.ai/blog/introducing-system-one-models-and-jev), presenting it as its first System One model: a model built to return structured decisions instead of generated text.

It's a useful idea with a longer history than the branding suggests. Classification without text generation existed well before Jev. That does not mean Jev's architecture or training method is identical to earlier work. But if you're building anything that involves routing, classification, or structured decisions, the broader pattern deserves a look.

---

## What these models actually do

A common way to use an LLM for classification is to ask a question, wait for generated tokens, then read the answer. Is this message spam? Which intent does this query match? Does this content violate a policy? The output can be a single label or structured JSON, but it still passes through text generation.

The models discussed here score defined outcomes without generating a text answer token by token. Their implementations differ, so a shared interface does not establish a shared architecture. [Jev's API](https://docs.typesafe.ai/introduction), also available through [Cloudflare AI](https://developers.cloudflare.com/ai/models/typesafe/jev/) as `typesafe/jev`, evaluates typed questions against an input state:

1. [**Noul**](https://docs.typesafe.ai/primitives/noul) returns the probability that a statement is true, from 0 to 1. It has no separate confidence field.
2. [**Choice**](https://docs.typesafe.ai/primitives/choice) returns a selected option, probabilities over your options, and a confidence value.
3. [**Score**](https://docs.typesafe.ai/primitives/score) returns a probability-weighted score over ordered rubric levels, plus the distribution and confidence.

TypeSafe reports end-to-end responses of 70 to 500 ms and speedups of 40 to 200 times in its comparisons. Its headline results, 193.6 times faster and 444.6 times cheaper, come from its own workflow evaluations. The company says those gains are likely at the high end of real-world results. Treat these as [vendor benchmark results](https://typesafe.ai/blog/introducing-system-one-models-and-jev), not a guarantee for your workload.

A probability output is also not proof of calibration. Neural classifiers can be [overconfident](https://proceedings.mlr.press/v70/guo17a.html). TypeSafe's [confidence field](https://docs.typesafe.ai/confidence) summarizes the shape of the output distribution; it is not itself a measured probability that the selected answer is correct. Test accuracy and calibration on your own data before using thresholds to automate decisions.

## The idea before the branding

There is clear prior work on choosing labels from natural-language descriptions. For example, [Yin, Hay, and Roth's 2019 paper](https://arxiv.org/abs/1909.00161) frames zero-shot text classification as textual entailment. That establishes a history for the broader pattern, without establishing that Jev uses the same mechanism.

There is also a more recent connection. On March 30, 2025, Nandakishor Mukkunnoth published [SalesRLAgent](https://arxiv.org/abs/2503.23303), a reinforcement-learning approach to predicting conversion probability during sales conversations. In his [Laya write-up](https://laya.convaiinnovations.com/), he connects that research to his later general-purpose decision models. The earlier paper is about a sales-specific system; it does not establish that today's Laya was available in March 2025 or that it has Jev's exact architecture.

Several public projects now offer related models or local inference tools:

1. [**Laya**](https://huggingface.co/convaiinnovations/laya) is an Apache-2.0 model family with English and multilingual checkpoints. Its model card reports 39.5 ms for the English checkpoint and 32.8 ms for the multilingual checkpoint on one question using a T4 GPU. The multilingual variant advertises support for more than 100 languages; that does not imply equal accuracy across them.
2. [**von-1.0**](https://huggingface.co/wfzyx/von-1.0) uses a ModernBERT-large encoder. Its card advertises sub-25 ms inference, but its benchmark table lists about 62 ms on MPS/GPU and 300 ms on CPU. Those figures need their workload and hardware context.
3. [**decider-2b**](https://huggingface.co/Mapika/decider-2b) builds on Qwen3.5-2B-Base and returns distributions over typed question options in one forward pass. Its card explicitly describes it as an open reproduction of Jev.
4. [**plek-1**](https://huggingface.co/Drenel/plek-1) describes itself as Jev-inspired and scores candidate choices using sequence log-likelihoods. It is a related implementation, not evidence that this particular model preceded Jev.
5. [**Foq**](https://github.com/yohanargentina-oss/Foq) is a local System 1 inference engine. It belongs in the tooling category, rather than being another interchangeable model checkpoint.

Jev's typed API and Cloudflare availability make the pattern easy to explore. TypeSafe says the System One name draws on Daniel Kahneman's distinction between fast, intuitive thinking and slow, deliberate reasoning. I find that a useful framing for deciding when software needs a quick judgment.

Good packaging and distribution are real contributions. They can make an established class of problems easier to solve. The architectural and performance claims still need to be judged model by model.

## The familiar use cases

Intent detection, content moderation, support ticket triage, and agent routing are natural classification tasks. If your system currently uses a generative LLM for them, a decision model is a candidate to benchmark. Whether it helps depends on accuracy, latency, cost, and the cases that need more reasoning or context.

But I find the applications beyond that list more interesting.

## Five applications to explore

These are design ideas, not claims that the models above have been validated for each task.

### IoT and edge decision gates

Your temperature sensor reads 47°C. A fixed safety threshold belongs in ordinary code. A decision model could help with a different part of the workflow: combining an alert with a technician's notes and maintenance history to route a service request using natural-language criteria.

Keep the safety rule independent of the classifier. Measure latency and memory use on the target device. Laya's GPU timings do not establish sub-millisecond inference or suitability for a small sensor controller, and calling a cloud service from an edge function does not mean the model runs on the device.

### Adaptive UX branching

Onboarding flows are full of decisions: does this user need the advanced tutorial or the beginner one? Should we show the integration setup screen or skip it? A decision model could classify a user's stated goal and suggest the next step, with a default path for uncertain results.

This is most interesting when the input is free-form text. For an explicit account setting, a simple rule may be enough. Measure the added response time before putting a model call on every step, and let users correct the route.

### Contract pre-screening

Contract clause classification has an established research basis: [CUAD](https://www.atticusprojectai.org/cuad/) contains 510 contracts annotated for 41 clause types. A decision model could help reviewers find relevant clauses and prioritize review against defined criteria.

That needs testing on representative contracts, including clauses whose meaning depends on other sections. A missed clause can matter more than an extra flag. Classification can help organize review; it does not establish legal compliance or justify treating unflagged sections as safe.

### Game NPC decisions

TypeSafe's launch post includes a Doom demonstration making roughly ten queries per second from structured game state. That suggests a possible role for these models in high-level decisions, such as interpreting a player's instruction or choosing an NPC's next goal.

It does not establish frame-rate inference. A game running at 60 frames per second has about 16.7 ms for the entire frame. Run model decisions asynchronously or on selected events, and let normal game logic handle movement and immediate reactions. Checking whether health is below a known threshold still needs only a comparison.

### Targeted experiments

A classifier could identify users whose stated goal makes them eligible for an experiment. For example, an onboarding experiment might apply only to users who want to import data.

Define and freeze that eligibility rule using information available before treatment, then randomly assign eligible users to control or variant B. [Microsoft's experimentation guidance](https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-pre-experiment-stage/) explains why targeting must preserve comparable treatment and control groups.

Sending high-confidence users to B and everyone else to control would introduce selection bias. A targeted experiment measures the effect within the eligible population, and a smaller sample does not guarantee faster statistical significance. A classifier's confidence also does not establish how much a user will benefit from treatment.

---

## The actual recommendation

Test the pattern on a classification or routing task that currently goes through a generative LLM. Compare it with your current system and with a simple classifier or rule. Measure wrong decisions and missed cases as well as latency and cost.

The linked model cards give you a starting point for local alternatives. Similar API shapes can reduce integration work, but context limits, language coverage, calibration, and deployment requirements still differ. Open weights also leave you with hosting costs.

The useful question is simple: does this part of the system need generated text, or does it need a decision over known outcomes? Answer that first, then choose the model.
