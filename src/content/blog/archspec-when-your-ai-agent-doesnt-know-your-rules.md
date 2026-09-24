---
title: "ArchSpec: when your AI agent doesn't know your rules, make the rules unbreakable"
description: "ArchSpec turns Rails architecture conventions into rules that CI enforces, so code from AI agents, new hires, and seniors alike has to respect your layer boundaries."
date: "2026-09-23"
tags: ["ruby", "rails", "ai", "architecture"]
devto: "https://dev.to/svyatov/archspec-when-your-ai-agent-doesnt-know-your-rules-make-the-rules-unbreakable-4dpj"
---

A thing is happening in Rails shops everywhere right now: AI coding assistants are writing large chunks of production code. Cursor. Claude. Copilot. Whatever your team has adopted, the output is real and it's landing in your codebase at a pace that code review alone can't fully absorb.

These tools are genuinely good at writing Ruby. They understand Rails conventions pretty well. They don't understand *your* conventions – the ones that live in your CONTRIBUTING.md, your team wiki, and the collective memory of however many sprint retrospectives you've sat through.

[ArchSpec](https://archspecrb.dev) is the most direct answer I've found to this problem.

## The idea: executable architecture

The insight behind ArchSpec is deceptively simple. Your architecture already has rules. The rules just aren't enforced. So enforce them.

You write your conventions in a file called `Archspec.rb`:

```ruby
architecture :rails

controllers.cannot_use :helpers, :mailers, :jobs
models.cannot_use :controllers
services.cannot_call :render, :redirect_to
jobs.cannot_reference_constants "Current"
```

Then you add `bundle exec archspec check` to your CI pipeline. A PR that violates those rules fails. It doesn't matter who wrote the code – a senior engineer, a new hire, or a model with no memory of your last architecture discussion.

That last part is the point.

## What you can actually enforce

The built-in `architecture :rails` preset handles the most common Rails boundary violations: models reaching into controllers, services calling `render`, that kind of thing. The custom component system is the interesting part:

```ruby
component :queries, in: "app/queries/**/*.rb"
queries.cannot_call :save!, :update!, :destroy!

component :commands, in: "app/commands/**/*.rb"
commands.must_implement :call

component :services, in: "app/services/**/*.rb"
services.must_be_empty because: "rich model"
```

You're not limited to Rails defaults. If your app has a command pattern, a query layer, or any other structural convention, you can encode it here. The `must_implement` check is particularly useful – it's a contract that every class in that layer exposes the right interface.

The `jobs.cannot_reference_constants "Current"` rule deserves a specific callout. It catches a real bug class: `CurrentAttributes` data set during a web request is not available in background jobs. ArchSpec can enforce this statically, before the bug surfaces at 2am in a production log.

## Fast by design

ArchSpec indexes Ruby source with [Rubydex](https://github.com/Shopify/rubydex) and [Prism](https://github.com/ruby/prism), and reads constant names from your class and module declarations. It never boots your application. This matters: the feedback loop for architecture violations should be as short as possible, and a linter that takes 45 seconds to start defeats its own purpose.

## The error output is CI-ready

```plaintext
[error] services must not call #render [methods.forbid]

app/services/create_user.rb:7:5

    6 │   def call
  → 7 │     render :new
      │     ^~~~~~~~~~~
    8 │   end

  note: CreateUser calls render

1 architecture violation found.
```

Clear enough for a developer to act on immediately. Clear enough for a CI log that you're skimming at 11pm. That's the bar good static analysis output should clear.

## Getting it running takes five minutes

```ruby
# Gemfile
group :development, :test do
  gem "archspec"
end
```

```bash
bundle install
bundle exec archspec init
bundle exec archspec check
```

`archspec init` creates a starter `Archspec.rb` with `architecture :rails`. From there, you add your custom rules incrementally. Start with the violations that have burned you before. The gem is at v1.1.0, requires Ruby 3.2+, and is MIT licensed.

## The bigger shift

We spent the last decade building tools to catch code quality issues automatically – RuboCop, Brakeman, database linters. Architecture was the one thing that stayed manual, enforced through review and culture and the occasional frustrated comment in a PR.

AI agents have accelerated the cost of that gap. If a single assistant can generate a week's worth of code in a day, the architectural drift that used to accumulate over months can now happen in an afternoon.

ArchSpec isn't a complete answer to this. It's the right kind of answer: make the rules explicit, make them executable, and let the machine enforce them so you don't have to.
