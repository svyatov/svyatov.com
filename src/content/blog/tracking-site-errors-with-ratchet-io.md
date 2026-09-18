---
title: "Tracking site errors with Ratchet.io"
description: "Why Ratchet.io (soon to be Rollbar) beats Airbrake for small projects: official support for Rails, Python, PHP, Node.js and JavaScript, deploy tracking, GitHub integration and a free plan that is actually usable."
date: "2013-02-14"
tags: ["webdev", "monitoring", "debugging", "devops"]
---

Almost every time you build a site and launch it, you need to keep an eye on the errors that will inevitably show up. You can do that with logging, email notifications, some homegrown contraption of your own, or you can use a service built specifically for the job. One of the best-known services of this kind is [Airbrake](https://airbrake.io "Airbrake"), but it has a number of drawbacks: officially they only support Ruby on Rails and iOS, JavaScript is experimental, and everything else is handled by third-party developers. On top of that, the free plan is completely useless (1 user, 1 project, no GitHub integration, no deploy tracking). Want more, pay up, and that is not always justified, especially when you are hacking on a couple of small side projects that throw a production error two or three times a week.

But not so long ago I came across [a post](http://rmcreative.ru/blog/post/ratchet.io) by Alexander Makarov (Sam Dark) in my RSS reader about [Ratchet.io](https://ratchet.io "Ratchet.io").

At the moment Ratchet.io is still in closed beta (they send out invites without any fuss), but they have already published preliminary pricing. In the next couple of weeks they plan to rebrand as Rollbar and move to rollbar.com, and along with that open up registration and finalize the prices.

So, what makes **Ratchet.io** a better deal than **Airbrake**?

- official out-of-the-box support for Rails, Python, PHP, Node.js, JavaScript and even Flash (plus, naturally, any other platform through the API);
- besides automatic reporting, errors can be sent manually through the library APIs;
- on top of errors you can log plain useful information (5 levels: critical, error, warning, info, debug);
- deploy tracking, GitHub integration, bug tracker integration (currently Asana, Pivotal Tracker and GitHub Issues), instant error replay (GET requests only), real-time notifications and [much more](http://ratchet.io/features/).

And the best part is that all of this is available even on the starter free plan, with no limits on the number of deploys, projects or users. The only restrictions of the free plan: **3000 events** per month and data is kept for **30 days** only. That is perfectly livable for small projects. The paid plans are priced sensibly too.

All in all, the pricing is more than reasonable. I sincerely recommend giving it a try. If you do not feel like waiting for the company itself to approve you, I have **5 invites**, drop me a line :)
