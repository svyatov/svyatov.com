---
title: "Rails already ships class_names. I built clsx anyway."
description: "Compare Rails class_names with clsx: standalone Ruby use, empty values, accepted inputs, performance measurements, and optional Tailwind class merging."
date: "2026-07-21"
tags: ["rails", "ruby", "tailwindcss", "webdev"]
devto: "https://dev.to/svyatov/rails-already-ships-classnames-i-built-clsx-anyway-5h4h"
---

When I published a little gem for conditional CSS classes two years ago, the first comment was Adrien Poly asking the obvious thing: "What is the main difference with rails class_names helper?" My honest reply at the time: I didn't know `class_names` existed. I had written a gem for something Rails already shipped.

So I went and looked, guessed the difference was performance, and left it there. That answer bugged me for two years. Here is the real one.

`class_names` is a good view helper. It also only ships with ActionView, it spills a few inputs, it is slower than it needs to be, and it has no idea that `px-2` and `px-4` are the same knob. None of those matter until they do. When they did, for me, the fix turned one small Rails gem into two: [clsx-ruby](https://github.com/svyatov/clsx-ruby), a framework-agnostic core, and [clsx-rails](https://github.com/svyatov/clsx-rails), a thin adapter over it.

This is the tour I wish I could have given Adrien in that comment thread.

## First, credit where it is due

If you are on Rails 6.1 or later, you can build a class string conditionally today, no gems:

```erb
<%= tag.div class: class_names("btn", "btn-primary", active: @active) do %>
  Click me
<% end %>
```

`class_names` is a public alias for `token_list` in `ActionView::Helpers::TagHelper`. It takes strings, arrays, and hashes, splits on whitespace, drops falsy values, dedups the tokens, and hands back an HTML-safe string. For the everyday cases it is genuinely fine, and clsx agrees with it token for token:

```ruby
require "clsx"
require "action_view"
# In an ERB template you call class_names(...) bare; here we mix it into an object.
view = Object.new.extend(ActionView::Helpers::TagHelper)

view.class_names("a", "b")                 # => "a b"
Clsx["a", "b"]                             # => "a b"

view.class_names(foo: true, bar: false)    # => "foo"
Clsx[foo: true, bar: false]                # => "foo"

view.class_names("a b", "b c")             # => "a b c"   (dedups across tokens)
Clsx["a b", "b c"]                         # => "a b c"

view.class_names("a", ["b", ["c"]])        # => "a b c"   (flattens nesting)
Clsx["a", ["b", ["c"]]]                    # => "a b c"
```

So if that is all you need, you need nothing. Use the built-in. I mean it.

The rest of this post is about the four places that "all you need" runs out.

## Reason 1: it comes bundled with ActionView

`class_names` is a method on `ActionView::Helpers::TagHelper`. It does not actually need a live view, no request, no output buffer. It needs the module. But the module is part of ActionView, so to join two strings in a Sinatra app or a plain service object, you load a whole view framework and mix it in by hand:

```ruby
# In a plain object with nothing required, class_names is not defined:
class_names("a", active: true)   # => NoMethodError

# You pull ActionView in and extend the module onto an object:
require "action_view"
view = Object.new.extend(ActionView::Helpers::TagHelper)
view.class_names("a", active: true)   # => "a"
```

That is the itch that started the split. I had put the class builder inside a Rails gem because Rails is where I was working that week. Then I wanted the same thing in a Phlex component, and in a plain presenter object, and reaching for ActionView to get it felt absurd. There is nothing Rails-specific about joining class names. So I pulled the logic into clsx-ruby, one file, about 130 lines, zero runtime dependencies, and left clsx-rails as a shim on top:

```ruby
require "clsx"

is_active, is_disabled = true, false
Clsx["btn", "btn-primary", active: is_active, disabled: is_disabled]
# => "btn btn-primary active"
```

## Reason 2: empty results, and what happens on garbage

`class_names` and clsx agree on the common cases. The one difference I lean on daily is what they return when nothing applies:

```ruby
view.class_names(nil, false)   # => ""    (renders class="")
Clsx[nil, false]               # => nil   (Rails tag helpers skip it)
```

Rails skips a `nil` class attribute, so `Clsx[...]` never renders an empty `class=""` on a component that had nothing to add. `class_names` gives you `""`, which renders.

There is one honest point the other way. `class_names` returns an `html_safe` string; clsx returns a plain `String`. Inside a `class:` attribute that is a wash, Rails escapes the value either way and class tokens have nothing to escape. If you interpolate clsx output raw somewhere else, it is a normal string and gets escaped like one, which is the safe default, not a footgun. But if you specifically want `html_safe` output, `class_names` hands it to you and clsx does not.

The rest is robustness. Neither of these inputs is something you write on purpose, but a helper somewhere eventually hands the builder something weird, and the two disagree on what to do with it:

```ruby
# A complex value used as a hash key.
view.class_names([{ foo: true }, "bar"] => true)  # => "[{foo: true}, &quot;bar&quot;]"
Clsx[[{ foo: true }, "bar"] => true]              # => "foo bar"

# An uncalled lambda and a stray boolean.
view.class_names(proc {}, true)  # => "#&lt;Proc:0x...&gt; true"   (escaped into your markup)
Clsx[proc {}, true]              # => nil
```

`class_names` stringifies whatever it gets and escapes it into the attribute; clsx resolves a complex key recursively and ignores a bare `Proc` or `true`. When an `admin_link` helper accidentally hands you an uncalled lambda, clsx drops it and `class_names` prints a `Proc`'s address into your HTML. (There is also a cosmetic gap: `class_names("  a\tb  ")` keeps a leading empty token, `" a b"`; clsx normalizes to `"a b"`. Browsers ignore the extra space, so this one is tidiness, not a bug.)

## The full vocabulary

The name is a homage: clsx-ruby is modeled on [lukeed's `clsx`](https://github.com/lukeed/clsx), the tiny JavaScript package, so the argument model lines up with what React developers already know. Since the differences above are really about what counts as a class and what counts as truthy, here are the rules in one place. clsx takes strings, symbols, numbers, hashes, arrays, and any nesting of those:

```ruby
Clsx["foo", true && "bar", "baz"]          # => "foo bar baz"
Clsx[:foo, :"bar-baz"]                      # => "foo bar-baz"
Clsx[1, 2, 3]                               # => "1 2 3"
Clsx[["foo", nil, false, "bar"]]            # => "foo bar"
Clsx["foo", ["bar", { baz: false }, ["hi", ["there"]]]]
# => "foo bar hi there"
```

A hash includes each key whose value is truthy, in declaration order:

```ruby
Clsx[foo: true, bar: false, baz: 2 > 1]   # => "foo baz"
```

The one rule that trips up people coming from JavaScript: in Ruby only `false` and `nil` are falsy. So `0`, `""`, `[]`, and `{}` are all truthy and all keep their key.

```ruby
Clsx["foo" => 0, bar: []]   # => "foo bar"
```

And two conveniences the JS `clsx` does not have. Duplicates are removed even across multi-token strings, and an empty result is `nil`, not `""`:

```ruby
Clsx["foo bar", "foo"]   # => "foo bar"
Clsx["   "]              # => nil
```

Every line above is a real result. `bundle add clsx-ruby`, drop them into a REPL, and check.

## Reason 3: it is slower, and here is the honest version of that

clsx is faster than `class_names` per call. I reproduced it against the real `ActionView` helper (not a stand-in), timing only the cases where both produce identical output, on Ruby 4.0.6 and an M1 Pro:

| Scenario | clsx-ruby | Rails `class_names` | Speedup |
|---|---|---|---|
| Token | 5.1M i/s | 674K i/s | **7.5x** |
| Long utility | 572K i/s | 116K i/s | **4.9x** |
| Utility string | 1.2M i/s | 248K i/s | **4.9x** |
| Multiple strings | 1.4M i/s | 334K i/s | **4.1x** |
| String array | 1.2M i/s | 307K i/s | **4.0x** |
| Hash | 1.5M i/s | 475K i/s | **3.2x** |
| String + hash | 1.0M i/s | 365K i/s | **2.9x** |

That table is one representative run; the geometric mean held around 4x across three. The interesting number is not the 7.5x on a lone token, which is the least realistic input anyone would reach for a builder to handle, it is the 2.9x on the busiest, most Tailwind-like input. The speedup shrinks as the work grows, so the low end is the honest one.

A caveat on that gap. The gem's README quotes a more conservative 2 to 4x, because it benchmarks against a dependency-free replica of `class_names`. Part of the extra margin here is not a faster join, it is work clsx skips: `class_names` builds an `html_safe` buffer and un-escapes HTML on every call, and my identical-output filter compares string content, not that safety step. So the pure algorithm-to-algorithm number is the README's 2 to 4x; the wider figure is end-to-end against the real helper, which is what a Rails view actually pays. The gem ships its [benchmark](https://github.com/svyatov/clsx-ruby/blob/main/benchmark/vs_rails.rb); run it yourself.

Now the honest part. This will almost never make a page faster. A class builder runs a handful of times per request, and your render time lives somewhere else entirely: allocations, HTML escaping, partial lookup, the N+1 you have not found yet. A 4x speedup on 0.1% of the work rounds to nothing.

Where it actually shows up is call count. Render a table with 5,000 rows and three conditional-class calls each, and now the helper runs 15,000 times in one response. That is the case where "4x faster per call" stops being a micro-benchmark and starts being real milliseconds. If your views do not do that, treat the speed as a nice-to-have and pick clsx for the other three reasons.

## Reason 4: it cannot merge Tailwind classes

This is the one neither `class_names` nor plain clsx can touch:

```ruby
view.class_names("px-2", "px-4")   # => "px-2 px-4"
Clsx["px-2 px-4"]                  # => "px-2 px-4"
```

Both keep both classes, because neither knows that `px-2` and `px-4` are the same knob set twice. And in Tailwind, shipping both is a bug you cannot see. The winner is not the last class in the attribute, it is whichever rule Tailwind emitted later in the compiled stylesheet, and Tailwind orders by its own scale, not by what you wrote. That is deterministic, so it will not flip between machines, but it is also not your call: you ship a silently dead class, and which one dies is decided by Tailwind's internal ordering rather than your intent.

If you have written React with Tailwind, you already know the fix, even if you have never looked at it. That `cn(...)` helper everyone copies out of shadcn/ui is literally `twMerge(clsx(inputs))`: clsx builds the string, `tailwind-merge` collapses the conflicts so the class you wrote last is the one that survives. clsx does the same, split into two functions so you only pay for merging when you ask for it.

The merge is opt-in. clsx-ruby stays dependency-free; you add the [`tailwind_merge`](https://github.com/gjtorikian/tailwind_merge) gem and wire it up once:

```ruby
# Gemfile
gem "tailwind_merge"

# config/initializers/clsx.rb
require "clsx/tailwind_merge"
Clsx.merger = TailwindMerge::Merger.new
```

That adds `twm` (and `Twm[]`, and `Clsx.twm`) alongside `clsx`. `clsx` and `cn` stay pure; only `twm` merges, and the last one you wrote wins, whichever order you wrote it in:

```ruby
Twm["px-2 px-4"]                          # => "px-4"
Twm["px-4 px-2"]                          # => "px-2"   (written order, not Tailwind's)
Twm["p-4", "p-2", "bg-red", "bg-blue"]    # => "p-2 bg-blue"
Clsx["px-2 px-4"]                         # => "px-2 px-4"   (unchanged)
```

That second line is the whole point: your written order becomes authoritative, which is exactly what raw Tailwind does not honor. It is also group-aware, so it only collapses classes that genuinely conflict. `px-3` and `pr-4` set different things, so both survive, but `px-3` is the broader knob (it includes padding-right), so written last it wins:

```ruby
Twm["px-3 pr-4"]   # => "px-3 pr-4"   (different groups, both kept)
Twm["pr-4 px-3"]   # => "px-3"        (px-3 covers pr, and it came last)
Twm["px-[13px] px-[14px]"]   # => "px-[14px]"   (arbitrary values too)
```

And because `twm` takes the same inputs as `clsx`, you get the conditional syntax and the merge in one call:

```ruby
Twm[["px-2", "rounded"], "px-4", "px-6": active]   # => "rounded px-6"   (active)
```

You set `Clsx.merger` once at boot and read it per request. Merging is real work: `tailwind_merge` parses each class into its group, which is why it keeps a result cache and why it is worth doing only when asked. That is also why I kept `clsx` and `twm` separate. An early prototype had a global switch that routed every call through the merger (never shipped, so do not go looking for it), and I talked myself out of it: most calls have no conflict to resolve, so paying the merge cost on all of them to help a few is the wrong default.

The merger slot is pluggable, it just has to respond to `merge`. The default is Garen Torikian's `tailwind_merge`, which I use enough that I have [two](https://github.com/gjtorikian/tailwind_merge/pull/79) [PRs](https://github.com/gjtorikian/tailwind_merge/pull/80) in it, one making that result cache thread-safe and one speeding up the hot path, both shipped in its 1.5.2. If you need more throughput, a Rust-backed alternative (`tail_merge`) exists, though confirm its Tailwind version support against your setup.

## Which call do I reach for?

There are a few ways in, which looks like more than it is. They all run the same code.

- `Clsx[...]` and `Cn[...]` (the bracket form) work anywhere, no setup. This is what I use in plain Ruby.
- In Rails views (ERB, HAML, or Slim), clsx-rails gives you `clsx(...)` and `cn(...)` as bare helpers, no include.
- In a ViewComponent, a Phlex component, or any object, `include Clsx::Helper` once and you get `clsx`/`cn` (and `twm` if you wired it up) as methods.
- `Clsx.clsx(...)` / `Clsx.cn(...)` are the module-method form for when you do not want either.

`cn` is just a shorter alias for `clsx`. Pick whichever reads better in the line.

## Using it outside Rails

The whole point of the split is that none of this needs Rails. In a Phlex component you include the helper once and call it like any method:

```ruby
require "phlex"
require "clsx"

class Badge < Phlex::HTML
  include Clsx::Helper

  def initialize(color: :blue, pill: false, class: nil)
    @color = color
    @pill = pill
    @html_class = binding.local_variable_get(:class)  # `class` is a keyword
  end

  def view_template(&block)
    span(class: clsx("badge", "badge-#{@color}", @html_class, pill: @pill), &block)
  end
end

Badge.new(color: :red, pill: true, class: "badge ml-2").call { "New" }
# => <span class="badge badge-red ml-2 pill">New</span>
```

One line in there is pure Ruby trivia. You can name a keyword argument `class:`, but you cannot read it back as `class` (it is a reserved word, so `@html_class = class` is a syntax error). `binding.local_variable_get(:class)` is the escape hatch that fetches the local by name.

The payoff is the cross-argument dedup: `badge` appears once even though the caller passed it and the component added it too. That is the thing you actually want when a component merges its classes with a caller's, and it is tedious to write by hand every time. The same include works in a ViewComponent base class, a Sinatra route, or a bare presenter.

Phlex, for the record, has its own answer for the simple case: `class:` accepts an array and compacts falsy entries, and its `mix` helper merges attribute hashes. Reach for clsx when you want the hash-conditional syntax or the cross-argument dedup, and `twm` when you want Tailwind conflicts resolved, which none of Rails, ViewComponent, or Phlex do on their own.

## What changed since 2024, and do you have to migrate

The old post covered clsx-rails around v1: the basic string, array, and hash syntax, Rails only. Since then:

- v2 (2025) rewrote the algorithm for a 2 to 5x speedup and dropped Rails 6.1 and 7.0.
- v3 (2026) extracted the engine into clsx-ruby and made clsx-rails a thin adapter over it. It raised the floor to Ruby 3.2+ and Rails 7.2+.
- v3.1 added the `twm` Tailwind merge through clsx-ruby 1.2.

If you are on an older clsx-rails, the upgrade is quiet. The breaking changes in v3 are the Ruby and Rails version floors, not the helpers. Same `clsx` and `cn`, same output. The one snag: `Clsx::VERSION` now reports the clsx-ruby core version, and the adapter's own version moved to `Clsx::Rails::VERSION`, so anything that read the old constant needs a one-line update. New since you last looked: everything runs outside Rails now, and `twm` exists.

## When to use something else

clsx builds a class string. That is the whole job. If your problem is bigger, it is the wrong tool:

- You just need conditional classes in a Rails view and none of the four reasons bite? Use `class_names`. It is already there.
- You want a variant system, the `size: :lg, intent: :danger` to full-class-list mapping React people know as CVA? That is [`class_variants`](https://github.com/avo-hq/class_variants), a different and larger idea, and it can lean on a merger like `twm` for the final conflict pass.
- You want another plain conditional-class helper to compare against? [`klassnames`](https://github.com/komposable/klassnames) is the closest same-purpose gem for Rails; it does the conditional join without the framework-agnostic core, the `nil` return, or the Tailwind merge.
- You want the smallest possible dependency and only ever pass plain strings? You can hand-roll a `compact.join(" ")` and skip the gem. You lose dedup, the hash syntax, `nil` handling, and the merge, but if you never wanted those, that is a fair trade.

For everything between "join two strings" and "design a variant DSL," which is most of what view code actually does, clsx is the size that fits.

`class_names` builds class strings inside a view. clsx builds them anywhere, keeps the weird inputs from leaking, and knows what to do when two Tailwind utilities disagree. That is the whole difference, and now it is one `bundle add` away.
