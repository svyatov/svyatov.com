---
title: "Easier usage of Rails 5.2 credentials and app-specific configuration"
description: "Have you ever thought “isn’t there a simpler, more concise way to write `Rails.application.credentials[:something]`?” This post suggests a solution to this problem."
date: "2019-02-24"
tags: ["ruby", "rails", "tutorial", "learning"]
devto: "https://dev.to/svyatov/easier-usage-of-rails-52-credentials-and-app-specific-configuration-461g"
---

As you all know by now, Rails 5.2 introduced a new feature called [`Credentials`](https://github.com/rails/rails/pull/30067). DHH said the following in the PR:

> This new file is a flat format, not divided by environments like secrets.yml has been. Most of the time, these credentials are only relevant in production, and if someone does need to have some keys duplicated for different environments, it can be done by hand.

And as you should know by now, Rails 6.0 [fixes](https://github.com/rails/rails/pull/33521) this obvious inconvenience.

Meantime, a commonly proposed solution for Rails 5.2 was just to add environments by hands, something like so:

```yaml
development:
  facebook_app_id: '...'
  facebook_app_secret: '...'
  facebook_app_namespace: '...'
  stripe_publishable_key: '...'
  stripe_secret_key: '...'
  stripe_signing_secret: '...'

production:
  facebook_app_id: '...'
  facebook_app_secret: '...'
  facebook_app_namespace: '...'
  stripe_publishable_key: '...'
  stripe_secret_key: '...'
  stripe_signing_secret: '...'
```

And then use it like this:

```ruby
Rails.application.credentials[Rails.env.to_sym][:facebook_app_secret]
```

Pretty long and not very readable, right? Yeah, you probably don’t use credentials in that many places in your app anyway, but still. This line has 47 characters about Rails and just 22 characters about what you need. Not the best ratio, in my opinion.

The solution I’d like to show you is quite obvious, but I’ve never seen it being suggested anywhere (maybe I didn’t search right enough, sorry if that’s the case). 

Just open `config/application.rb` and add `credentials` method like so:

```ruby
require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module YourApp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.
  end

  def self.credentials
    @credentials ||= Rails.application.credentials[Rails.env.to_sym]
  end
end
```

Let’s see what it changes:

```ruby
# Before:
Rails.application.credentials[Rails.env.to_sym][:facebook_app_secret]

# After
YourApp.credentials[:facebook_app_secret]
```

This approach abstracts Rails-specific details away, makes it concise, expressive and about your application. As a bonus it gives you a lot of flexibility: you can replace Rails credentials with something else, you can merge credentials from different places, you can easily upgrade to Rails 6 credentials by removing `[Rails.env.to_sym]` part, and so on.

OK, that’s great, but post’s title was also saying something about “app-specific configuration,” right? Correct! I want to show you one more thing that can make your life with Rails a little easier.

As your Rails application grows sooner or later, you will need a place to store various environment-specific details for your app: things that aren’t secrets or credentials, just some custom configuration. Rails documentation even has a section with this exact name: [Custom configuration](https://guides.rubyonrails.org/v5.2/configuring.html#custom-configuration).

According to the documentation Rails offers us two pretty powerful options:

1. `config.x` namespace
2. `config_for` method

Neat! How about we use our credentials approach described above and combine with these two options?

Step 1: create `config/app.yml`

```yaml
shared: &shared
  facebook_url: 'https://www.facebook.com/mysite'
  twitter_url: 'https://twitter.com/mysite'

development:
  <<: *shared
  domain: 'localhost:3000'
  devise_mailer_sender: 'no-reply@localhost'
  orders_mailer_sender: 'no-reply@localhost'

production:
  <<: *shared
  domain: 'mysite.com'
  devise_mailer_sender: 'no-reply@mysite.com'
  orders_mailer_sender: 'orders@mysite.com'
```

Step 2: fill in `config.x` from `app.yml` in the `config/application.rb`

```ruby
# App specific configuration
config.x = config_for(:app).with_indifferent_access
```

Step 3: add `config` method to the `config/application.rb` file

```ruby
  def self.config
    @config ||= Rails.configuration.x
  end
```

So your `config/application.rb` file now looks like this:

```ruby
require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module YourApp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.

    # App-specific configuration
    config.x = config_for(:app).with_indifferent_access
  end

  def self.config
    @config ||= Rails.configuration.x
  end

  def self.credentials
    @credentials ||= Rails.application.credentials[Rails.env.to_sym]
  end
end
```

And we can use our custom configuration like so:

```ruby
YourApp.config[:devise_mailer_sender]
```

How cool is that? :)
