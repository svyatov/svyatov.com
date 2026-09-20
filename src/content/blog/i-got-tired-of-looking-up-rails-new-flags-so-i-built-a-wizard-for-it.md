---
title: "I got tired of looking up `rails new` flags, so I built a wizard for it"
description: "Create Rails applications with an interactive CLI wizard that explains rails new options, remembers choices, saves presets, and shows the final command."
date: "2026-02-27"
tags: ["ruby", "rails", "cli", "productivity"]
devto: "https://dev.to/svyatov/i-got-tired-of-looking-up-rails-new-flags-so-i-built-a-wizard-for-it-1adl"
---

Every time I start a new Rails project, the same thing happens. I open the terminal, type `rails new`, and then... pause. What was the flag for PostgreSQL? Is it `--skip-test` or `--skip-tests`? Do I want Propshaft or Sprockets? What about Solid Queue — is that a flag now?

So I open `rails new --help`, scroll through a wall of options, and piece together a command I'll forget by next week.

After doing this too many times, I built [create-rails-app](https://github.com/svyatov/create-rails-app) — an interactive CLI wizard that walks you through every `rails new` option one at a time.

## What it does

Instead of memorizing flags, you answer simple questions:

```
[01/31] API only application? (no)  ›  Yes / No
[03/31] Database (postgresql)       ›  sqlite3 / postgresql / mysql / trilogy ...
[04/31] JavaScript approach (importmap) › importmap / bun / esbuild / webpack ...
```

Each question shows your last-used choice as the default, so repeat projects take seconds.

At the end, you see the full `rails new` command — review it, then run it or go back and tweak your choices.

## A few things I find useful

**It remembers your choices.** Next time you run it, your previous selections are pre-filled. Change one or two things and go.

**Presets.** Save a named configuration and reuse it:

```bash
create-rails-app myapp --preset api
```

I have presets for "api", "fullstack", and "minimal" — covers 90% of my projects.

**Smart skip rules.** Disable Active Record? It won't ask about databases. Choose API mode? It skips CSS and JavaScript framework questions. The wizard stays short and relevant.

**Back navigation.** Changed your mind three questions in? `Ctrl+B` goes back. No need to start over.

**Version-aware.** It detects your installed Rails version (supports 7.2, 8.0, and 8.1) and only shows options that apply.

## Install

```bash
gem install create-rails-app
```

That's it. Run `create-rails-app` and follow the prompts.

## Why not just use a template?

Rails templates are great for adding code *after* project creation. But they don't help with the `rails new` flags themselves — the database, JS bundler, asset pipeline, which frameworks to skip. That's the part I kept forgetting, and that's what this tool handles.

---

If you start new Rails projects more than once a year and find yourself googling the same flags, give it a try. Feedback and contributions welcome on [GitHub](https://github.com/svyatov/create-rails-app).
