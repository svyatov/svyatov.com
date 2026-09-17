---
title: "clsx for Rails views"
description: "Hey, fellow Rubyists!"
date: "2024-03-03"
tags: ["rails", "ruby", "css", "opensource"]
devto: "https://dev.to/svyatov/clsx-for-rails-views-i3"
---

Hey, fellow Rubyists!

Have you ever found yourself wrestling with conditional class strings in your Rails views? Juggling string interpolation, conditional logic, and array manipulation to apply a class or two conditionally? It's like trying to thread a needle in a hurricane. Well, fret no more! Say hello to [clsx-rails](https://github.com/svyatov/clsx-rails), the newest member of the Ruby gems family, here to make your life a tad bit easier.

Inspired by the simplicity of the [clsx](https://github.com/lukeed/clsx) npm package, `clsx-rails` is your Rails view's new best friend. It's a tiny helper with a mighty purpose: to streamline how you handle CSS classes, making your code cleaner, more readable, and, let's be honest, more elegant.

## Why `clsx-rails`?

Because we've all been there:

```erb
<div class="<%= ['foo', 'bar', condition ? 'baz' : nil].compact.join(' ') %>">
  Hello, Rails world!
</div>
```

It gets the job done, but it's about as graceful as a giraffe on ice skates. With `clsx-rails`, you can turn that mess into a one-liner marvel:

```erb
<div class="<%= clsx(:foo, :bar, baz: condition) %>">
  Hello, Rails world!
</div>
```

## Usage Examples

Whether it's a string, a hash, or an array, `clsx-rails` handles them all, even nesting them like Russian dolls if that's your jam. It even eliminates any duplicates while at it! And for those who like their code like their coffee—short and strong - there's the `cn` alias.

```ruby
# Variadic strings
cn('this', true && 'is', 'awesome')
# => 'this is awesome'

# Hashes with truthy/falsy values
cn(foo: true, bar: false, baz: condition)
# => 'foo baz' (assuming the condition is true)
```

Although not advised, it can handle any level of "complexity":

```ruby
clsx(
  [[[['a'], 'b']]],
  { a: 1, b: 2 },
  [1, 2, 3, 4],
  { [1, 2, { %w[foo bar] => true }] => true }
)
# => 'a b 1 2 3 4 foo bar'
```

You can find more details and usage examples in the [repo](https://github.com/svyatov/clsx-rails).

## Why It's Useful

* Keeps your views DRY and readable.
* Reduces the mental overhead of handling conditional classes.
* It's like giving your views a neat little toolbelt for CSS class manipulation.

So, if you're tired of the conditional class string chaos and want to add some syntactic sugar to your Rails views, give [clsx-rails](https://github.com/svyatov/clsx-rails) a whirl. Your views will thank you, and who knows, you might find yourself with a bit more time for coffee breaks :)

Happy coding!
