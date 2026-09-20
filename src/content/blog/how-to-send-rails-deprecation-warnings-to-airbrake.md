---
title: "How to send Rails deprecation warnings to Airbrake"
description: "Send Rails production deprecation warnings to Airbrake with an ActiveSupport::Notifications subscriber that preserves the message and call stack."
date: "2019-02-18"
tags: ["ruby", "rails", "todayilearned", "tutorial"]
devto: "https://dev.to/svyatov/how-to-send-rails-deprecation-warnings-to-airbrake-51bh"
---

We’re upgrading our Ruby on Rails version from 4.2 to 5.2 this week. A long-awaited change for us. Of course, there are a lot of deprecation warnings that was thrown at us during this process. Rubocop and tests caught the vast majority of those, but we don’t have 100% code coverage, so some of these warnings got into production.

In development Rails send these warnings to the log file:

```ruby
# Print deprecation notices to the Rails logger.
config.active_support.deprecation = :log
```

A reasonable default, but I changed it to `:raise`. It's way faster to find and deal with the warnings this way in development.

For production environment Rails uses [`ActiveSupport::Notifications`](https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html):

```ruby
# Send deprecation notices to registered listeners.
config.active_support.deprecation = :notify
```

The problem is that nobody listens for it in production. Fortunately, that was easy to fix with Airbrake. I tried to “google” the solution at first but didn’t find anything useful, so I’m sharing my solution for other seeking souls like me :)

```ruby
# config/initializers/deprecations_notifier.rb

ActiveSupport::Notifications.subscribe('deprecation.rails') do |_name, _start, _finish, _id, payload|
  error = ActiveSupport::DeprecationException.new(payload[:message])
  error.set_backtrace(payload[:callstack].map(&:to_s))
    
  params = {
    gem_name: payload[:gem_name],
    deprecation_horizon: payload[:deprecation_horizon]
  }

  Airbrake.notify(error, params) do |notice|
    notice[:context][:severity] = 'warning'
  end
end
```

If you’re using [`CurrentAttributes`](https://api.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html) and storing `request.uuid` there it would be a good idea to add current request UUID to the `params` as well.
