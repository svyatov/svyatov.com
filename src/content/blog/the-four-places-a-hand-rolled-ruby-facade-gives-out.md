---
title: "The four places a hand-rolled Ruby facade gives out"
description: "When a plain Ruby facade needs more: memoization, namespaces, reusable packs, and error handling, with examples from the briefly gem."
date: "2026-07-16"
tags: ["ruby", "rails", "showdev", "opensource"]
devto: "https://dev.to/svyatov/the-four-places-a-hand-rolled-ruby-facade-gives-out-3n77"
---

You don't need a gem to build a facade. This is a perfectly good one:

```ruby
class App
  def self.config = Rails.configuration
  def self.redis  = REDIS_POOL
end
```

`App.config` reads better than `Rails.configuration` for the fortieth time, and `App.redis` beats remembering which global holds the pool. These are real methods. `App.respond_to?(:redis)` is true, the console tab-completes them, your editor jumps straight to the definition, and a wrong call raises `ArgumentError` at the call site. Your test suite can stub them with a verifying double (a stub that refuses to fake a method the real object doesn't have). If your `App` stays this size, close the tab. The class is the right tool, and reaching for a dependency to replace two lines would be silly.

I want to be honest about that up front, because I wrote a gem called [briefly](https://github.com/svyatov/briefly) that builds this same object, and the interesting question isn't "isn't a facade nice." It's *when does a hand-rolled one start to cost you*, and whether the cost is worth a dependency. So here are the four places the plain class quietly gives out.

None of this is Rails-specific, by the way. briefly is a plain-Ruby facade; Rails is one optional pack it ships. I'll lean on Rails for examples because that's where most of us feel the pain, but the gem doesn't require it and the ideas don't either.

## The plain class already beats the clever options

Before we compare a class to a gem, notice the class already beats the two "smarter" things you might reach for.

The first is `method_missing`. It's the reflex when you want `App.anything` to work without declaring it:

```ruby
class App
  def self.method_missing(name, *) = REGISTRY.fetch(name) { super }
end
```

This works, and then quietly lies to everything that inspects it. `App.respond_to?(:redis)` is `false`, because there's no method there. Console completion shows nothing. Jump-to-definition lands nowhere. And in a test:

```ruby
allow(App).to receive(:redis).and_return(fake)
```

RSpec's verifying doubles refuse. Their docs say it plainly: they "do not support methods which the class reports to not exist... This is commonly the case when `method_missing` is used." You can change what the class reports: pair `method_missing` with `respond_to_missing?` (the standard discipline; RuboCop has a cop that insists on it) and `respond_to?` flips to true, which satisfies verifying doubles too. What no pairing fixes is that there is still no method behind the name: nothing to tab-complete, nothing to jump to, no arity to check. A call working and a method existing are different things.

The other option is a dependency-injection container, like dry-rb's `dry-container`. It's a fine tool, but a different shape: you register objects under string keys and resolve them at runtime.

```ruby
container.register("redis") { REDIS_POOL }
container["redis"]   # not container.redis
```

You look up `"redis"`, a string, not `redis`, a method. That buys you container-agnostic wiring (dry-system will even auto-register components from file paths), and it costs you the jump-to-definition and tab-completion the plain class had for free.

So the spectrum looks like this, and the plain class is already sitting in the good spot:

| | `method_missing` | plain class / facade | DI container |
|---|:---:|:---:|:---:|
| `respond_to?` sees it | with `respond_to_missing?` | **yes** | n/a (keyed) |
| console tab-completion | no | **yes** | no |
| jump-to-definition | no | **yes** | no |
| arity (argument count) checked | no | **yes** | past the lookup only |
| verifying doubles work | with `respond_to_missing?` | **yes** | stubs + injection instead |

Two cells deserve their fine print. The container's lookup is a string key, which is what completion and jump-to-definition can't follow; the object it returns has perfectly real methods, and dry-container ships a test-stub mode besides, while constructor injection lets a spec hand in a verifying `instance_double` directly. And the `method_missing` column earns its two upgrades only when someone remembered to write `respond_to_missing?`.

Interestingly, Rails itself lands in the middle column. `ActiveSupport::CurrentAttributes` compiles real accessor methods with string codegen rather than reaching for `method_missing`.

Which means "briefly gives you real methods" is not a reason to use it. The class already has those. (briefly keeps them: its shortcuts sit in the same column, so everything in that table works on `App` exactly as on the plain class. One asterisk, and it's the plain class's win: shortcuts are compiled at runtime, so static analysis (Sorbet, Steep) can't see them the way it sees a hand-written `def`. briefly ships RBS signatures for its own API and a pattern for declaring your shortcuts' types, but on a strictly-typed codebase that's real friction the class doesn't have.) The reasons are elsewhere.

## Tooth 1: memoization you can trust

Here is the first place the hand-rolled version can draw blood. You memoize something expensive:

```ruby
def self.cache = @cache ||= build_cache
```

This is not a strawman. It's [how Discourse does it](https://github.com/discourse/discourse/blob/main/lib/discourse.rb), in a real 1,300-line `Discourse` module that is exactly the facade we're talking about:

```ruby
def self.cache
  @cache ||=
    if GlobalSetting.skip_redis?
      ActiveSupport::Cache::MemoryStore.new
    else
      Cache.new
    end
end
```

`@x ||=` is the memoization idiom in every large app I looked at: Discourse, Mastodon, GitLab all reach for it. And it has two quiet bugs.

The first is threads. `@cache ||= build` is a check and then a set, and nothing makes those atomic: one thread can read `@cache` as nil and, before it assigns, another reads nil too, so both run `build`.

Whether that actually happens on MRI (the standard Ruby interpreter) comes down to one thing, and it isn't the one people usually reach for. MRI runs one thread at a time under its global VM lock, the GVL, but it *preempts* threads: the scheduler can pause one at a method call or a loop turn and let another run. A build that does I/O yields the moment it waits, and a pure-Ruby build gets paused too if it runs long enough to meet the timer. So the memo races when `build` is slow enough to be interrupted between the check and the set, and slips through clean only when it's short enough to finish in one time-slice.

I wrote the race out four ways, in three pieces that stack into one runnable file. First, the victim and the trigger: the classic idiom in a tiny facade, and a `hammer` that parks twenty-five threads on a `Queue` gate and releases them at once, so all of them hit the cold memo in the same instant:

<!-- verify-blocks: group=race-demo -->
```ruby
require "briefly"

THREADS = 25

# The classic idiom. The check-then-set is not atomic across threads.
class RawFacade
  def initialize(&build) = @build = build
  def catalog = @catalog ||= @build.call
end

def hammer(obj)
  gate = Queue.new
  threads = Array.new(THREADS) do
    Thread.new do
      gate.pop      # park here until the gate opens
      obj.catalog
    end
  end
  THREADS.times { gate << :go }
  threads.each(&:join)
end
```

Next, the measurement. Each build bumps a counter so we can see how many times it really ran, and the counter takes its own `Mutex`: `runs += 1` is itself a check-then-set, and a demo about a data race can't afford to undercount its own evidence with one:

<!-- verify-blocks: group=race-demo -->
```ruby
def counting(&build)
  runs = 0
  lock = Mutex.new
  facade = RawFacade.new do
    result = build.call
    lock.synchronize { runs += 1 }
    result
  end
  hammer(facade)
  runs
end
```

Last, the contestants: three builds through the raw idiom, then the same I/O build through briefly's `.memoize`. The I/O build is a `sleep` standing in for a connect, sized wide enough that all twenty-five threads clear the nil check before any finishes, so it collides every time. That 25-of-25 is a forced maximum to make the shape unmissable, and the forced part is the gate (twenty-five arrivals in the same instant), not the sleep. (I also measured the unforced version: the same harness with a 2ms build and the arrivals scattered across 50ms re-ran the build one to three times across ten trials: a caller duplicates the build when it shows up while the first build is still running, and scattered arrivals rarely do.)

<!-- verify-blocks: group=race-demo -->
```ruby
io_runs    = counting { sleep 0.02; Object.new }            # I/O: yields the GVL at once
short_runs = counting { (1..100).map { |i| i * 2 }.sum }    # short pure: one time-slice
long_runs  = counting do                                    # long pure: gets preempted
  n = 0
  40_000_000.times { n += 1 }
  n
end

brief_runs = 0
brief_lock = Mutex.new
app = Briefly.define do
  shortcut(:catalog) do
    sleep 0.02
    brief_lock.synchronize { brief_runs += 1 }
    Object.new
  end.memoize
end
hammer(app)

puts "raw `@x ||=`, I/O build (sleep):   #{io_runs} run(s) across #{THREADS} racing threads"
puts "raw `@x ||=`, short pure build:    #{short_runs} run(s) across #{THREADS} racing threads"
puts "raw `@x ||=`, long pure build:     #{long_runs} run(s) across #{THREADS} racing threads"
puts "briefly `.memoize`:                #{brief_runs} run(s) across #{THREADS} racing threads"
```

Stack the three pieces in one file with `gem "briefly"` and run it. It prints:

```plaintext
raw `@x ||=`, I/O build (sleep):   25 run(s) across 25 racing threads
raw `@x ||=`, short pure build:    1 run(s) across 25 racing threads
raw `@x ||=`, long pure build:     25 run(s) across 25 racing threads
briefly `.memoize`:                1 run(s) across 25 racing threads
```

The short pure build ran once; the long pure build, no I/O at all, still raced, because it ran long enough to be preempted (its body is a deliberately oversized loop, forced the same way the `sleep` is; what matters is that it races at all, not the count). So the line isn't I/O versus pure, it's fast versus slow.

Most of your memos are a fast computed value and are genuinely fine on MRI; this is no reason to distrust every `@x ||=` you've written. (Whether a real memo like Discourse's `Cache.new` above races comes down to the same line: does building it do the slow work up front, or defer it to first use? These apps also wrap the pools themselves in `ConnectionPool`, which is where their thread-safety actually lives.) And this whole picture is MRI's. JRuby and TruffleRuby run threads genuinely in parallel, no global lock narrowing the window, so the idiom has even less cover there.

The check-and-set was never atomic to begin with, which is why briefly's `.memoize` takes a real lock instead of trusting the runtime: the body runs once no matter how many threads race it or what it does. After that first write, reads hit a frozen snapshot and don't lock at all. The lock is one reentrant `Monitor` per facade, so a memoized body can read another memoized shortcut on the same facade without deadlocking itself. (The flip side of one lock per facade: two shortcuts on the same facade never build in parallel.)

```ruby
App = Briefly.define do
  shortcut(:cache) { build_cache }.memoize
end
```

Threads share a memo by accident one way; `fork` is the other. A forking server (Puma in cluster mode with `preload_app!`, Unicorn) boots the app once and forks workers from it, so a connection memoized before the fork arrives in every worker already open (the classic shared-socket bug), and no memoization scheme can know a fork happened; briefly has no fork hooks. The fix is the usual one: don't call connection-holding shortcuts during boot, or clear the facade in the server's worker-boot hook with `App.briefly.clear_memos!`. (`App.briefly` is the management handle: briefly keeps every non-shortcut method behind that one accessor so your shortcut names stay free.)

The second bug is staleness. If you memoize something that holds a reloadable class, like `ApplicationController.helpers`, it goes stale the moment Rails reloads your code in development. You edit a helper, refresh, and nothing changes, because `@helpers` is pinned to the class from before the reload. briefly's Rails pack clears memos on every reload (and never in production, where nothing reloads), so the thing you cached is dropped exactly when it might have changed. The plain `@x ||=` has no idea a reload happened. (Where a value is cheap the pack doesn't memoize at all: its `helpers` and `routes` shortcuts are live lookups, re-read on every call, so there's nothing to go stale.)

briefly's memoization also refuses to do the wrong thing. Shortcuts take arguments fine (`shortcut(:user) { |id| User.find(id) }` is a real one-argument method, arity and all), but memoize one and it raises when you define the facade, not later:

```ruby
Briefly.define { shortcut(:user) { |id| User.find(id) }.memoize }
# => Briefly::Error: cannot memoize user: its body takes arguments
```

because a value cached against nothing is all memoization can mean. And it caches `nil` and `false` correctly, which the bare `||=` famously does not.

The test suite leans on the same two facts. Shortcuts are real methods, so `allow(App).to receive(:cache)` passes verifying doubles exactly as it would on the plain class. And memos are process-global state, so drop them between examples:

```ruby
RSpec.configure do |config|
  config.after { App.briefly.clear_memos! }
end
```

## Tooth 2: the first namespace you reach for

This is the one that made me stop hand-rolling. A flat bag of `App.redis`, `App.cache`, `App.store` is fine right up until you need your first namespace, and real apps need them fast.

Look at what a big app's grab-bag actually holds. Even Mastodon, the leanest of the ones I checked, has three separate Redis configs (base, sidekiq, cache). GitLab has more than a dozen. And GitLab doesn't keep them in a flat bag, it nests them into modules:

```ruby
Gitlab::Redis::Cache.with { |r| ... }
Gitlab::Redis::Sessions.with { |r| ... }
Gitlab::Redis::SharedState.with { |r| ... }
# ~15 of these, each a subclass of a shared Wrapper
```

That's the natural end state. The bigger the app, the more it groups by subsystem rather than piling onto one object. Forem, the platform dev.to runs on, does the same with configuration: an `ApplicationConfig` facade over ENV plus a family of `Settings::General`, `Settings::SMTP`, `Settings::RateLimit` models, each its own little namespace. To be fair about what that evidence shows: these apps built their grouping by hand and maintain it fine: GitLab's Redis classes aren't grouped accessors, they're real classes carrying pooling and per-store config that no facade DSL would replace. The claim isn't that big apps fail without a gem. It's that grouping is where everyone ends up, and in a plain class every step of it is yours to build.

In a plain class, your first namespace means a nested module, or a second class, or prefixing method names by hand:

```ruby
class App
  def self.redis = Redis          # the namespace is a nested module
  module Redis
    def self.cache    = CACHE_POOL
    def self.sessions = SESSIONS_POOL
  end
end
```

It works, but you're now maintaining that grouping by hand, and the day you want the memoization and reset-on-reload from Tooth 1 inside it, you're hand-rolling those again per module. briefly has `namespace`, and the child is a real facade you can pass around:


```ruby
App = Briefly.define do
  namespace(:redis) do
    shortcut(:cache)    { CACHE_POOL }
    shortcut(:sessions) { SESSIONS_POOL }
  end
end

App.redis            # => a real Briefly::Facade, not a method_missing trick
App.redis.cache      # => CACHE_POOL
```

`App.redis` is a value, `App.redis.cache` is a real method on it, and the management claims are concrete APIs, not promises:

```ruby
App.briefly.clear_memos!    # drops every memo, root and namespaces alike
App.briefly.configure do    # add or replace shortcuts on a live facade
  shortcut(:store) { NEW_STORE }
end
```

Clearing cascades through the whole tree. And a `configure` pass is atomic across every namespace: the new configuration is built off to the side and swapped in at the end, so a pass that raises anywhere leaves the whole thing exactly as it was. That's a chunk of correctness you'd otherwise be writing and testing yourself the day you split `App.redis` into `App.redis.cache`.

## Tooth 3: packs, so you write it once

Real config repeats across apps. The `redis`, `cache`, `logger`, `env` block you set up in one service is the same block you set up in the next. In a plain class you copy-paste `def self.` across three repos and they drift.

A briefly pack is any object that responds to `install`. That's the whole protocol:

```ruby
module RedisPack
  module_function
  def install(builder)
    builder.shortcut(:redis) { REDIS_POOL }
  end
end

Api = Briefly.define { use RedisPack }
Api.redis   # => REDIS_POOL
```

Two conveniences round the protocol out. You can register a short string name for a pack, and packs take options. Give `install` a keyword parameter and `use` forwards it:

```ruby
Briefly.register("myapp/redis", RedisPack)    # once, e.g. in an initializer

Api = Briefly.define { use "myapp/redis", url: ENV["REDIS_URL"] }
```

(That version of `RedisPack` declares `def install(builder, url:)`.) A pack isn't take-it-or-leave-it, either: declare a shortcut again after `use` and the last declaration wins, silently. That's the intended way to override one piece of a pack, and worth knowing before you shadow something by accident.

Nothing here touches Rails; it's a plain module. The Rails support you may have seen (`use "rails"`, which gives you `config`, `logger`, `env` predicates, a `db` namespace, credentials, an error reporter, the live `helpers`/`routes` lookups from Tooth 1, and more) is just a pack shipped in the box, autoloaded only if you name it. You can write your own for your Stripe client, your feature flags, your search index, and share it.

That `db` namespace is the widest thing in the box, and it's the one I'd point at if you're deciding whether the Rails pack earns its keep. Aim it at one Active Record class and the multi-database surface comes back as shortcuts:

```ruby
App = Briefly.define { use "rails" }   # `db` is a namespace it ships

App.db.txn { App.db.query("insert into audits (msg) values (?)", "hi") }
App.db.reading { App.db.select("select count(*) from events") }  # to the replica, if you run one
```

`connection`/`conn` lease a connection and release it at block exit; `transaction`/`txn` wrap a transaction; `reading`/`writing` pin the Rails role so reads land on a replica and writes on the primary; `select` runs a read through `select_all`, and `query` runs arbitrary SQL (writes and DDL included) through `exec_query`. One safety line: a statement *with binds* goes through `sanitize_sql_array`, a bindless string does not. The `select`/`query` split is about the query cache and intent, not a runtime read/write guard, so an interpolated string is still yours to get wrong.

And because a facade is cheap, you make several. One per area, each composing only the packs it needs:

```ruby
Admin = Briefly.define do
  use "rails"
  shortcut(:audit_log) { AuditLog }
end

Worker = Briefly.define do
  use "rails/env"
  use "rails/reload"
end
```

Two independent facades, no shared state, each with its own memo cells and handlers. (Own locks, too, which cuts one boundary: two facades whose memoized bodies call each other can deadlock, like any pair of mutually-locking objects. Keep cross-facade calls out of memoized bodies.) You could share config another way, a module of `def self.` methods you `extend` into each app, and for a fixed handful of accessors that's fine. What a mixin doesn't give you is composition: packs stack (use several, pass each options), and every facade takes only the ones it needs, where an `extend`ed module hands every includer the same fixed surface.

## Tooth 4: errors, aliases, and one honest footgun

A few smaller things you'd otherwise hand-roll.

Aliases that share one memo cell, so `config` and `c` are the same computed value, not two:

```ruby
App = Briefly.define do
  shortcut(:config, :c) { expensive }.memoize
end
```

Scoped error handling, where the handler's return value becomes the shortcut's value:

```ruby
App = Briefly.define do
  shortcut(:redis) { REDIS_POOL }.rescue_from(Redis::BaseError) { nil }
end
```

You can register a handler per shortcut, per facade, or globally, and they resolve most-specific first. (One syntax note for the standalone form: `rescue_from StandardError { ... }` binds the block to `StandardError`, not to `rescue_from`. That's Ruby's precedence, not briefly's. So write `rescue_from(StandardError) { ... }` or use do/end.) Which brings me to the sharpest edge, the kind of thing a facade invites you to get wrong. A facade-wide handler over `StandardError` catches your app's errors and *also catches your own bugs*:

```ruby
App = Briefly.define do
  shortcut(:secret) { Rails.application.credentaisl.secret_key_base }  # typo: credentaisl
  rescue_from(StandardError) { nil }
end

App.secret   # => nil. No exception, no log, no clue.
```

At the moment the handler runs, a `NoMethodError` from a typo is indistinguishable from one the handler was written to absorb. A library can't read your intent from a backtrace, so briefly doesn't try. It documents the trap and points you at the narrow handlers that don't have it: scope the rescue to the shortcut that can actually fail, match the narrowest error class, and if you must go facade-wide, log and re-raise. I decided a sharp edge you can see beats a clever fix that's silently wrong a fraction of the time. That's a recurring theme in the gem, and it's worth more than any feature.

There's a second edge, subtler. Memoization doesn't compose with recovery. A rescue-backed shortcut that fails is careful *not* to cache its fallback: it retries next call and recovers. But if a memoized shortcut read it during that first, failing call, the reader has already baked the fallback into its own cached value, and pins it for the life of the process:

```ruby
Briefly.define do
  shortcut(:flaky) { down? ? raise("down") : "up" }
    .rescue_from(RuntimeError) { "unknown" }
    .memoize
  shortcut(:summary) { "build #{flaky}" }.memoize
end
# first call, flaky is down  -> summary caches "build unknown"
# later, flaky recovers to "up" -> summary stays "build unknown", forever
```

The inner shortcut did the right thing and came back; the outer one had already committed. It's the same rule as `.memoize` holding `nil` and `false`: a fallback is a real value, and memoize's job is to keep the value it got. Worth a beat of thought before you `.memoize` something that reads a shortcut which can fail.

## The gem underneath: candor

There's one thing briefly must not cost you compared to the plain class, and that's the honesty of its methods. A hand-written `def self.config` reports its real arity, its real parameters, and a `source_location` pointing at your code. If briefly's shortcuts were metaprogrammed stand-ins that reported `(*args)` and pointed into the gem, you'd have traded away exactly what made the class good.

Keeping that honesty turned out to be the hardest part of the whole project, and it lives in a second gem, [candor](https://github.com/svyatov/candor), which briefly depends on and which has no dependencies of its own. It turns a block into a real method that reports the block's own signature:

```ruby
mod = Module.new
Candor.define(mod, :greet) { |name, greeting: "hi"| "#{greeting}, #{name}" }

m = mod.instance_method(:greet)
m.parameters       # => [[:req, :__p0], [:key, :greeting]]
m.source_location  # => your block, not the gem
```

How it pulls that off is a story of its own. Ruby's reflection lies about blocks in more ways than you'd expect, and candor exists to un-lie each one. Even that `:__p0` in the output, where a hand-written `def greet(name, ...)` would say `:name`, is a deliberate seam with a reason behind it. The seams, the trade-offs, and the parts of Ruby that fought back all get a follow-up post of their own. For this one, the takeaway is simple: briefly's shortcuts are real methods, and honesty is not part of the price.

## So, when is it worth it?

If your `App` is five real methods, memoizes nothing that reloads, lives in one app, and never grew a namespace, keep the class. Same call if your team leans on Sorbet or Steep: a hand-written `def` is visible to the type checker, and a runtime-compiled shortcut isn't. You don't need a dependency for that, and I'd think less of the gem if it pretended you did. Even Rails' own `CurrentAttributes`, a facade blessed enough to ship in the framework, tells you in its docs not to overdo it: "only a few, top-level globals."

briefly earns its place at the first of these you hit: you memoize something expensive and want it correct under threads and reloads; you split one accessor into a namespace; you find yourself copying the same setup into a second app; or you add a rescue and want it scoped instead of swallowing everything. That's not day one. It's the day the drawer by the door stops closing, and you notice you've been maintaining the drawer.

```ruby
gem "briefly"
```

Ruby 3.2 or newer, one dependency, Rails optional (the Rails pack wants Rails 7.2+). It's [on GitHub](https://github.com/svyatov/briefly) and [RubyGems](https://rubygems.org/gems/briefly) under MIT. Write one less `def self.`, but only once you'd have written the tenth.
