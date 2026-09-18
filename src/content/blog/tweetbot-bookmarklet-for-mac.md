---
title: "A bookmarklet for Tweetbot for Mac"
description: "Two ways to share the current browser page to Tweetbot for Mac in one click: a tiny bookmarklet built on the Tweetbot URL scheme, and a Chrome extension for those who prefer not to bother."
date: "2014-10-04"
tags: ["javascript", "macos", "productivity", "webdev"]
---

On Mac OS X I use Tweetbot as my Twitter client. It's extremely convenient and syncs automatically with its siblings on iOS.

But for the umpteenth time I wanted to share a link from the browser, and copy-pasting into Tweetbot had gotten old, so I decided to look for a way to share the current page from Chrome to Tweetbot in one click. And I found one, simple and effective. Two, actually, to be precise.

**Solution 1**: for those who like to control everything, plus it's "browser-independent"

```javascript
javascript:window.location='tweetbot:///post?text='+encodeURIComponent(document.title)+encodeURIComponent(' ')+encodeURIComponent(window.location.href);
```

Paste this in place of the URL in a browser bookmark and you get a handy bookmarklet.

You can read more about the Tweetbot scheme here: [Tweetbot URL scheme](http://tapbots.com/blog/development/tweetbot-url-scheme "Tweetbot URL scheme").

**Solution 2**: for the lazy, and only for Google Chrome

An extension in the Chrome Web Store: [Tweetbot This](https://chrome.google.com/webstore/detail/tweetbot-this/foeamhdoegndlfpbghhjbbhkjolnkkef?hl=en "Tweetbot This").

I haven't tried it, I use the first solution.
