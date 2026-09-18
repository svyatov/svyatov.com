---
title: "How to partition and format a drive with GNU Parted"
description: "Four commands in the parted shell are all it takes to repartition and format a drive on Linux: pick the disk from parted -l, create a gpt or msdos label, make one ext4 partition, and quit."
date: "2014-08-12"
tags: ["linux", "devops", "tutorial", "cli"]
---

Easy as pie :)

First we need *parted* itself, if we don't have it yet: `apt-get install parted`

Next we need to know which disk we're going to work with. You can list the disks in the system with `parted -l`. Its output will look something like this:

```
$ sudo parted -l
Model: ATA ST33000650NS (scsi)
Disk /dev/sda: 3001GB
Sector size (logical/physical): 512B/512B
Partition Table: gpt

Number  Start   End     Size    File system  Name  Flags
 5      1049kB  2097kB  1049kB                     bios_grub
 1      2097kB  34.4GB  34.4GB                     raid
 2      34.4GB  34.9GB  537MB                      raid
 3      34.9GB  1134GB  1100GB                     raid
 4      1134GB  3001GB  1866GB                     raid


Model: ATA ST33000650NS (scsi)
Disk /dev/sdb: 3001GB
Sector size (logical/physical): 512B/512B
Partition Table: gpt

Number  Start   End     Size    File system  Name  Flags
 5      1049kB  2097kB  1049kB                     bios_grub
 1      2097kB  34.4GB  34.4GB                     raid
 2      34.4GB  34.9GB  537MB                      raid
 3      34.9GB  1134GB  1100GB                     raid
 4      1134GB  3001GB  1866GB                     raid
```

In the example we see two disks, `/dev/sda` and `/dev/sdb`, along with their partitions.

Let's say we need to repartition and format `/dev/sdb`. Here's what we do:

1. `sudo parted /dev/sdb`
2. `(parted) mklabel gpt` or `(parted) mklabel msdos`
3. `(parted) mkpartfs primary ext4 0% 100%`
4. `(parted) quit`

Done. The disk is partitioned and formatted.

A few notes. `mklabel gpt` sets the partition table format. If you don't know what that is, either read the docs or just use `gpt` or `msdos`. You can also take a hint from the partition table format of the disks already in your system. In my `parted -l` output above both disks use `gpt`.

`mkpartfs primary ext4 0% 100%` creates a partition with the `ext4` file system, gives it 100% of the space and formats it right away. You can use `mkpart` instead of `mkpartfs`, in which case you can format the partition later.

For more details on `parted` commands and features, see the [official documentation](https://www.gnu.org/software/parted/manual/html_mono/parted.html) or `man parted`.

**Important!** Do all of this on an unmounted disk! If the disk is new to the system, don't forget to mount it and add it to `/etc/fstab`.

You can find the `UUID` of every partition on every disk with `blkid`.
