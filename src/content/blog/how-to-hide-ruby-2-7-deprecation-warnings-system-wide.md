---
title: "How to hide Ruby 2.7 deprecation warnings system-wide"
description: "Are you using rbenv? Want to hide Ruby 2.7 deprecation warnings system-wide and not to deal with it on a per-project basis? This small tutorial is for you!"
date: "2020-04-24"
tags: ["ruby", "rails", "rbenv", "tutorial"]
devto: "https://dev.to/svyatov/how-to-hide-ruby-2-7-deprecation-warnings-system-wide-1ajh"
---

Are you using `rbenv`? Want to hide Ruby 2.7 deprecation warnings system-wide and not to deal with it on a per-project basis? This small tutorial is for you!

All you have to do is create file `~/.rbenv/rbenv.d/exec/hide-deprecations-for-2.7.bash` with the following content:

```bash
# ~/.rbenv/rbenv.d/exec/hide-deprecations-for-2.7.bash

if [[ ${RBENV_VERSION%.*} == '2.7' ]]; then
  export RUBYOPT="-W:no-deprecated -W:no-experimental"
else
  unset RUBYOPT
fi
```

Done.

How exactly does it work can be found [here](https://github.com/rbenv/rbenv/wiki/Authoring-plugins#rbenv-hooks).

I've tested it in Zsh. It should work in Bash, but I can't guarantee it.
