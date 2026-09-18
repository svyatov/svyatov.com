---
title: "Munin: LWP::UserAgent and Cache::Cache"
description: "Munin shows no MySQL or Nginx data on a fresh Debian install because two Perl libraries are missing. Here are the packages to install and the Nginx status config the plugin expects."
date: "2013-09-02"
tags: ["devops", "monitoring", "perl", "linux"]
---

Every time I install Munin (which happens rarely, so I forget everything) I end up figuring out why there is no data from MySQL and Nginx. The causes are these: the Nginx plugin reports `LWP::UserAgent not found`, and the MySQL plugin complains about `Missing dependency Cache::Cache`. Both messages subtly hint at missing Perl libraries.

Fixing the dependencies:

- "LWP::UserAgent not found": `apt-get install libwww-perl`
- "Missing dependency Cache::Cache": `apt-get install libcache-cache-perl`

If you install these libraries before installing Munin, you won't have to fiddle with `munin-node-configure` afterwards. That is, provided you already have Nginx status set up, i.e. your Nginx config has something like this:

```
server {
        listen 127.0.0.1:80;
        server_name localhost;

        location /nginx_status {
                stub_status     on;
                access_log      off;
                allow           127.0.0.1;
                deny            all;
        }
}
```

I hope this post saves time not only for me next time :)
