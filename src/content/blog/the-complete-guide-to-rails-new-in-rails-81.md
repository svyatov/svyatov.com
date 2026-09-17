---
title: "The complete guide to `rails new` in Rails 8.1"
description: "rails new --help prints 30+ options. Most tutorials stop at rails new myapp -d postgresql and move on. This post covers every Rails 8.1 option - what it does, when to use it, and what most people..."
date: "2026-03-03"
tags: ["ruby", "rails", "tutorial", "beginners"]
devto: "https://dev.to/svyatov/the-complete-guide-to-rails-new-in-rails-81-346c"
---

`rails new --help` prints 30+ options. Most tutorials stop at `rails new myapp -d postgresql` and move on. This post covers every Rails 8.1 option - what it does, when to use it, and what most people pick.

## App Mode

**`--api`** - Strips views, cookies, sessions, asset pipeline, [Hotwire](https://hotwired.dev/), CSS, and JavaScript. Use for pure JSON or GraphQL backends.

**`--minimal`** - Generates the smallest possible app. Skips Action Mailer, Action Mailbox, Action Text, Active Job, Active Storage, Action Cable, Hotwire, [Jbuilder](https://github.com/rails/jbuilder), tests, system tests, [Kamal](https://kamal-deploy.org/), [Thruster](https://github.com/basecamp/thruster), Solid, and [Bootsnap](https://github.com/Shopify/bootsnap). A good starting point when you want to add only what you need.

## Database (`--database=X`)

| Adapter | Pros | Cons | Best for |
|---------|------|------|----------|
| **[sqlite3](https://www.sqlite.org/)** (default) | Zero setup, no server, works with Solid stack. [37signals](https://37signals.com/) runs [ONCE](https://once.com/) products on it in production. | Single-writer, no multi-server scaling. | Solo devs, prototypes, single-server apps |
| **[postgresql](https://www.postgresql.org/)** ⭐ | Full-featured (JSONB, arrays, full-text search), every PaaS supports it, best managed DB options. | Requires a running server. | Most production apps |
| **[mysql](https://www.mysql.com/)** | Widely deployed, mature. | No native arrays, JSON can't be indexed directly (unlike PostgreSQL's JSONB). | Existing MySQL infrastructure |
| **[trilogy](https://github.com/trilogy-libraries/trilogy)** | Modern MySQL client by GitHub, no C library dependency, simpler install. GitHub & Shopify use it in production. | Newer, smaller ecosystem. | New MySQL projects |
| **[mariadb](https://mariadb.org/)-mysql** | For MariaDB specifically with [mysql2](https://github.com/brianmario/mysql2) adapter. | Same as mysql. | Existing MariaDB setups |
| **mariadb-trilogy** | For MariaDB specifically with Trilogy adapter. | Same as trilogy. | New MariaDB projects |

PostgreSQL is the most common choice. When in doubt, pick it.

**`--skip-active-record` / `-O`** - Drops the ORM entirely. Cascading effect: also skips database, Action Mailbox, Action Text, and Active Storage.

## Frontend Stack

### JavaScript (`--javascript=X` / `-j`)

| Approach | Pros | Cons | Best for |
|----------|------|------|----------|
| **[importmap](https://github.com/rails/importmap-rails)** (default) ⭐ | No Node.js, no build step, browser-native ES modules, HTTP/2 parallel downloads. | No tree-shaking, no TypeScript/JSX transpilation. | Standard Rails + Hotwire apps |
| **[esbuild](https://esbuild.github.io/)** | Extremely fast (Go-based), handles TypeScript/JSX, mature. | Requires Node.js. | Apps needing a bundler |
| **[bun](https://bun.sh/)** | ~1.75x faster than esbuild, doubles as package manager + bundler. | Newer, smaller ecosystem than esbuild. | Speed-first, Bun ecosystem |
| **[webpack](https://webpack.js.org/)** | Full-featured, huge plugin ecosystem. | Slow, complex config, legacy choice. | Not recommended for new projects |
| **[rollup](https://rollupjs.org/)** | Good for libraries, ES module focused. | Niche in Rails context. | Not recommended for new projects |

Importmap is the Rails default for a reason - it eliminates Node.js from your stack entirely. Reach for esbuild or bun only when you need TypeScript, JSX, or tree-shaking.

**`--skip-javascript` / `-J`** - No JS setup at all.

### CSS (`--css=X` / `-c`)

| Framework | Pros | Cons | Best for |
|-----------|------|------|----------|
| **(none)** (default) | No dependencies, write plain CSS. | No utilities or components. | Minimal apps, custom design systems |
| **[tailwind](https://tailwindcss.com/)** ⭐ | Rails-blessed ([`tailwindcss-rails`](https://github.com/rails/tailwindcss-rails) gem), no Node.js required, v4 is 5x faster with CSS-first config. | Verbose HTML classes, learning curve. | Most new Rails apps |
| **[bootstrap](https://getbootstrap.com/)** | Pre-built components, familiar to most devs. | Requires Node.js (via [`cssbundling-rails`](https://github.com/rails/cssbundling-rails)), heavier. | Apps needing ready-made UI components |
| **[bulma](https://bulma.io/)** | CSS-only (no JS), clean modern design. | Requires Node.js via `cssbundling-rails`, smaller community. | Lightweight component needs |
| **[postcss](https://postcss.org/)** | Plugin-based CSS transforms, flexible. | Requires Node.js, config overhead. | Custom CSS toolchains |
| **[sass](https://sass-lang.com/)** | Variables, nesting, mixins, mature. | Requires Node.js ([Propshaft](https://github.com/rails/propshaft) doesn't compile Sass). | Teams already using Sass |

No CSS framework is included by default. Tailwind is the most popular choice for new Rails apps - the `tailwindcss-rails` gem runs standalone, no Node.js required.

### Asset Pipeline (`--asset-pipeline=X`)

| Pipeline | Pros | Cons |
|----------|------|------|
| **[propshaft](https://github.com/rails/propshaft)** (default) ⭐ | Modern, lightweight - just fingerprinting and serving. Precompiles in seconds vs minutes. | No built-in preprocessing (delegates to external tools). |
| **[sprockets](https://github.com/rails/sprockets)** | Built-in Sass/CoffeeScript/ERB compilation, `//= require` directives. | Slow, complex, legacy. |

Propshaft does one thing well: fingerprint and serve assets. If you need Sass or CoffeeScript compilation, Sprockets handles it - but you probably don't in 2025.

**`--skip-asset-pipeline` / `-A`** - No asset pipeline at all.

### Hotwire (`--skip-hotwire`)

[Turbo](https://turbo.hotwired.dev/) + [Stimulus](https://stimulus.hotwired.dev/) - the default Rails frontend framework. Turbo 8 introduced morphing (DOM diffing via [idiomorph](https://github.com/bigskysoftware/idiomorph)) that makes full-page refreshes feel SPA-smooth. Skip only if you're using a JS SPA framework (React, Vue) or building an API-only app (auto-skipped with `--api`).

## The Solid Stack & Deployment

These are Rails 8 additions that replace external services with database-backed alternatives.

### `--skip-solid`

[Solid Cache](https://github.com/rails/solid_cache) + [Solid Queue](https://github.com/rails/solid_queue) + [Solid Cable](https://github.com/rails/solid_cable) - replaces [Redis](https://redis.io/) for caching, background jobs, and WebSockets. All database-backed, works with SQLite, PostgreSQL, and MySQL. 37signals runs 20M jobs/day on Solid Queue for [HEY](https://www.hey.com/).

- **Solid Cache** - database-backed caching. Higher latency than Redis RAM, but terabytes of SSD capacity at a fraction of the cost.
- **Solid Queue** - uses `FOR UPDATE SKIP LOCKED` for efficient polling. Replaces [Sidekiq](https://sidekiq.org/)/[Resque](https://github.com/resque/resque) for most apps.
- **Solid Cable** - database-backed Action Cable. Polls every 100ms. Fine for moderate real-time needs.

**Skip if:** you already run Redis and need Sidekiq's advanced features (batches, rate limiting) or sub-millisecond cache latency.

### `--skip-kamal`

[Kamal 2](https://kamal-deploy.org/) deploys Docker containers to any VPS (Hetzner, DigitalOcean, AWS EC2). Uses [kamal-proxy](https://github.com/basecamp/kamal-proxy) (replaces [Traefik](https://traefik.io/)) with automatic [Let's Encrypt](https://letsencrypt.org/) SSL. Zero-downtime deploys, rolling restarts.

**Skip if:** you deploy to a PaaS (Heroku, Render, Fly.io) or use Kubernetes.

### `--skip-thruster`

[Thruster](https://github.com/basecamp/thruster) - HTTP/2 proxy (written in Go by 37signals) that sits in front of [Puma](https://puma.io/). Provides HTTP/2, gzip compression, asset caching, X-Sendfile, and automatic SSL. Replaces [Nginx](https://nginx.org/)/[Caddy](https://caddyserver.com/) for simple deployments.

**Skip if:** you already have a reverse proxy (Nginx, ALB, Cloudflare) or deploy to a PaaS.

## Frameworks You Can Skip

### Email & Rich Content

**`--skip-action-mailer` / `-M`** - No email sending or receiving infrastructure. Skip if your app never sends email.

**`--skip-action-mailbox`** - No inbound email routing to controller-like mailboxes. Requires Active Record. Skip if you don't process incoming email.

**`--skip-action-text`** - No [Trix](https://trix-editor.org/) rich text editor integration. Requires Active Record. Auto-skipped in API mode.

### Background & Storage

**`--skip-active-job`** - No background job framework. Also disables Solid Queue integration. Skip only if you handle no async work at all.

**`--skip-active-storage`** - No file uploads to S3/GCS/Azure. Requires Active Record. Skip if your app handles no file uploads.

**`--skip-action-cable` / `-C`** - No WebSocket framework. Also disables Solid Cable. Skip if you don't need real-time features.

### JSON

**`--skip-jbuilder`** - Removes the [Jbuilder](https://github.com/rails/jbuilder) JSON template DSL. Most API apps prefer `render json:` with serializers instead.

## Testing & Code Quality

**`--skip-test` / `-T`** - Removes [Minitest](https://github.com/minitest/minitest) setup. Most people skip this to add [RSpec](https://rspec.info/) instead.

**`--skip-system-test`** - Skips [Capybara](https://github.com/teamcapybara/capybara) browser tests. Auto-skipped in API mode or when tests are skipped.

**`--skip-brakeman`** - [Brakeman](https://brakemanscanner.org/) is a static security scanner for Rails that catches SQL injection, XSS, and 33+ other vulnerability types. Runs in seconds. **Keep it.**

**`--skip-bundler-audit`** - New in Rails 8.1. [bundler-audit](https://github.com/rubysec/bundler-audit) scans your `Gemfile.lock` for gems with known CVEs. Complements Brakeman: code scanning + dependency scanning. **Keep it.**

**`--skip-rubocop`** - [RuboCop](https://rubocop.org/), Ruby linter, included by default since Rails 8. Keep it or swap in [Standard Ruby](https://github.com/standardrb/standard).

**`--skip-ci`** - Skips the generated [GitHub Actions](https://github.com/features/actions) workflow. Rails 8.1 CI includes Brakeman and Bundler Audit steps by default.

## Infrastructure & Housekeeping

**`--skip-docker`** - Skips Dockerfile, .dockerignore, and bin/docker-entrypoint. Skip if you're not containerizing.

**`--devcontainer`** - Opt-in (not included by default). Generates [VS Code dev container](https://code.visualstudio.com/docs/devcontainers/containers) config with Redis, database, and Ruby all preconfigured.

**`--skip-bootsnap`** - [Bootsnap](https://github.com/Shopify/bootsnap) caches expensive computations to speed up boot time. Rarely worth skipping.

**`--skip-dev-gems`** - Skips [web-console](https://github.com/rails/web-console) and similar development gems.

**`--skip-keeps`** - Skips .keep files in empty directories. Git doesn't track empty dirs, so .keep files exist to preserve the directory structure.

**`--skip-decrypted-diffs`** - Skips git config for showing decrypted diffs of encrypted credentials.

**`--skip-git` / `-G`** - Skips `git init`, .gitignore, and .gitattributes.

**`--skip-bundle` / `-B`** - Skips `bundle install` after generation. Useful in CI or Docker builds where you control dependency installation separately.

## Putting It Together - Common Recipes

**Full-stack SaaS:**

```bash
rails new myapp -d postgresql -c tailwind -T \
  --skip-action-mailbox --skip-action-text --skip-jbuilder
```

The workhorse setup. PostgreSQL, Tailwind, Solid stack, Kamal - all defaults. Skips Minitest (most teams add RSpec), Action Mailbox (few apps process incoming email), Action Text (add it later if you need a rich text editor), and Jbuilder (you'll use `render json:` or a serializer).

**API backend:**

```bash
rails new myapi --api -d postgresql -T \
  --skip-action-mailbox --skip-jbuilder
```

`--api` strips views, assets, cookies, and Hotwire. Skips Minitest for RSpec. Action Mailbox and Jbuilder rarely belong in an API.

**Single-server indie app (the "one person framework"):**

```bash
rails new myapp -d sqlite3 -c tailwind -T \
  --skip-action-mailbox --skip-action-text --skip-jbuilder
```

SQLite + Solid stack = no Redis, no PostgreSQL, no external services. Kamal and Thruster handle deployment and SSL. One server, one process, one database file. Add PostgreSQL later if you outgrow it.

**PaaS deploy (Heroku, Render, Fly.io):**

```bash
rails new myapp -d postgresql -c tailwind -T \
  --skip-action-mailbox --skip-action-text --skip-jbuilder \
  --skip-kamal --skip-thruster
```

Same as the SaaS setup but skips Kamal and Thruster - the PaaS handles containers, routing, and SSL for you.

**Lean prototype:**

```bash
rails new proto --minimal -d sqlite3
```

Bare minimum: no mailer, no jobs, no cable, no Hotwire, no Kamal. Add frameworks back as you need them.

---

If you don't want to memorize any of this, I built a tool for that. [create-rails-app](https://dev.to/svyatov/i-got-tired-of-looking-up-rails-new-flags-so-i-built-a-wizard-for-it-1adl) is an interactive CLI wizard that walks you through each option, remembers your choices, and saves reusable presets.

```bash
gem install create-rails-app
```
