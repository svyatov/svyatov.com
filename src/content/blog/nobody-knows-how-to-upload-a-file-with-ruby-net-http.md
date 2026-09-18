---
title: "Nobody knows how to upload a file with Ruby Net::HTTP"
description: "Every answer online tells you to reach for a wrapper gem or shell out to curl. Ruby's standard Net::HTTP can send a multipart/form-data file upload on its own, and here is how."
date: "2013-09-16"
tags: ["ruby", "webdev", "tutorial", "opensource"]
---

As a hobby project, I'm currently working on my gem [http_wrapper](https://github.com/Svyatov/http_wrapper/ "http_wrapper gem"), and right now I'm implementing file uploads. I'm not a big fan of reinventing wheels, especially when someone has already invented a perfectly round one, so the first thing I did was google possible solutions. And this is where it gets funny: I couldn't find a single one that showed **the right way to upload a file** with `Net::HTTP`. People suggest ready-made wrappers (like [Rest Client](https://github.com/rest-client/rest-client "Rest Client") and [httparty](https://github.com/jnunemaker/httparty "HTTParty")), or gems that implement `multipart/form-data` specifically (for example, [multipart-post](https://github.com/nicksieger/multipart-post "multipart-post")), or even calling `curl` through a system call. Horrifying, really.

None of that appealed to me, so I started digging through the guts of `Net::HTTP`. In the end I unearthed a big secret (judging by the fact that I couldn't find it anywhere else on the internet), and now I'm sharing it with you: how to properly upload a file with Ruby's standard library `Net::HTTP`:

```ruby
require 'net/http'

# prepare the uri we'll be sending the data to
uri = URI 'http://example.com/upload_form'

# set up a new connection
connection = Net::HTTP.new uri.host, uri.port

# create the POST request object
request = Net::HTTP::Post.new uri

# build the form data
form_data = [
  ['user_avatar', File.read('kartinko.jpg'), {filename: 'picture.jpg'}], # file content given as a "string"
  ['user_photo',  File.open('photo.jpg')], # file content given as a File object
  # any other form fields go right here in the same format:
  ['submit', 'true'],
  ['user_name', 'valera']
]

# attach the data to the request
request.set_form form_data, 'multipart/form-data'

# send the request
response = connection.request request

#...
```

Profit! :)
