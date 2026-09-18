---
title: "Upload and download files on a remote server with iTerm2 and Z-Modem"
description: "How to send files to a remote server and pull them back from inside an SSH session, without opening a separate scp session, using the Z-Modem protocol, lrzsz and iTerm2 triggers."
date: "2014-07-16"
tags: ["macos", "terminal", "devops", "tutorial"]
---

Does this sound familiar: you're in a terminal on a remote server and you need to download some file from it (a database dump or a log)? Or the other way around, upload some file from your local machine to the server? I run into this all the time, and usually the problem is solved with the `scp` utility.

However, if you use Mac OS and iTerm2 (specifically iTerm2 v2.0 and above), there is a slightly more convenient solution for most cases: the Z-Modem protocol and triggers in iTerm2.

## Steps for the local Mac OS machine

1.  install *lrzsz* with *brew*: `brew install lrzsz`

2.  install the [*iterm2-zmodem*](https://github.com/aurora/iterm2-zmodem) script into `/usr/local/bin`:

    ```bash
    $ cd /usr/local/bin
    $ wget https://raw.githubusercontent.com/aurora/iterm2-zmodem/master/iterm2-zmodem
    $ chmod +x iterm2-zmodem
    ```

3.  go to iTerm2 preferences: *Profiles > Advanced > Triggers > Edit*

4.  add 2 triggers with the following parameters:

    ```
    Regular expression: \*\*B0100
    Action:             Run Silent Coprocess
    Parameters:         /usr/local/bin/iterm2-zmodem sz

    Regular expression: \*\*B00000000000000
    Action:             Run Silent Coprocess
    Parameters:         /usr/local/bin/iterm2-zmodem rz
    ```

That's it for the local machine.

## Steps for the remote server

The remote server also needs the *lrzsz* package. It seems to be available in every distribution, and on Debian/Ubuntu it's installed with a trivial `sudo apt-get install lrzsz`. That's all we need from the server.

## Let's use it!

To **upload** a file to the remote server, run the `rz` command in the server's console:

```bash
$ ssh user@remote-server.com
user@remote-server.com:~$ rz
```

A Mac OS dialog pops up to pick the file you want to send to the remote server. Pick it, send it. The file is written to the directory we called `rz` from.

To **download** a file, run the `sz filename.ext` command in the server's console:

```bash
$ ssh user@remote-server.com
user@remote-server.com:~$ sz database.sql apache.log
```

A Mac OS dialog pops up on the local machine again, this time to pick the folder where the files should be saved. Pick it, download. Keep in mind that if the folder you picked already has a file with the same name, it will be **silently overwritten**, so be careful!

That's a simple and convenient way to work with files on a server without leaving the console and without opening a new session with `scp`. Happy administering! :)
