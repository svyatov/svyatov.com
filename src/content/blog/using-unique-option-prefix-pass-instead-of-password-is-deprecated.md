---
title: "Using unique option prefix pass instead of password is deprecated"
description: "If MySQL or your cron logs suddenly started printing this warning, the culprit is most likely a shortened option name in your ~/.my.cnf. Here is the one-line fix."
date: "2013-09-27"
tags: ["mysql", "devops", "linux", "cli"]
---

If, while working with MySQL or in your cron logs, you suddenly started seeing this message:

    Warning: Using unique option prefix pass instead of password is deprecated and will be removed in a future release. Please use the full name instead.

The problem is most likely in your `~/.my.cnf` file, which looks something like this:

```ini
[client]
user=root
pass=sEcReT
```

But it should look like this:

```ini
[client]
user=root
password=sEcReT
```
