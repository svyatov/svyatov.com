---
title: "Omarchy on a Late 2015 iMac 5K: Fixing the Login Loop"
description: "Omarchy 4.0.5-1 login loop on a Late 2015 iMac 5K: how adding amdgpu.dpm=0 got the desktop back, with a one-boot test, persistence config, and rollback."
date: "2026-10-21"
tags: ["linux", "omarchy", "tutorial", "debugging"]
---

[Apple’s official macOS support for this model stops at Monterey](https://support.apple.com/en-us/108054). [Omarchy](https://omarchy.org/) literally gave my iMac a second life. Credit to DHH and the team for making old hardware useful again with a modern Linux desktop.

Getting there required one workaround. My fresh Omarchy installation accepted my password, waited, then returned to the login screen. It had never reached the desktop.

Here is what worked.

## Hardware and symptoms

My configuration:

- **Model:** iMac17,1, 27-inch Retina 5K, Late 2015
- **GPU:** Radeon R9 M395 / M395X Mac Edition, using `amdgpu`
- **Omarchy:** 4.0.5-1

The machine appeared to reboot after login, but neither the Apple logo nor the Limine boot menu reappeared. It was returning to the graphical login screen.

Pressing **Ctrl + Option + F3** opened a text console. You may also need **Fn** on an Apple keyboard. My username and password worked there.

That established that the system had booted and my credentials were valid.

## Identify the failure

From the text console, run these commands one at a time.

Check the model and graphics driver:

```sh
cat /sys/class/dmi/id/product_name
```

```sh
lspci -nnk -d ::03xx
```

Read the desktop startup log:

```sh
journalctl --user -b -u 'wayland-wm@*' -u wayland-session-waitenv.service --no-pager -n 60
```

Read the graphics-driver log:

```sh
journalctl -b -k --grep='amdgpu|drm|GPU|ring|timeout' --no-pager -n 50
```

My logs showed successful authentication, followed by Hyprland startup. UWSM then timed out waiting for `WAYLAND_DISPLAY` and `HYPRLAND_INSTANCE_SIGNATURE`. Systemd eventually killed Hyprland.

The kernel repeatedly reported:

```text
amdgpu 0000:01:00.0: last message was failed ret is 0
```

These messages pointed toward the graphics driver. The successful test below strongly implicated GPU power management.

## Test the workaround for one boot

1. Reboot. At the **Limine** menu, select the normal Omarchy entry and press **E**.
2. Find the `cmdline:` line. Append a space followed by:
   ```text
   amdgpu.dpm=0
   ```
   Preserve the existing parameters. If `amdgpu.dpm` is already present, change its value instead of adding a duplicate.
3. Press **Ctrl + X** or **F10** to boot, then try logging in.

This change lasts for one boot and does not modify the saved configuration.

**With this single parameter, my desktop started.**

The [AMD driver documentation](https://github.com/torvalds/linux/blob/master/drivers/gpu/drm/amd/amdgpu/amdgpu_drv.c) defines `dpm=0` as disabling dynamic power management.

If your login still fails, return to the text console and check:

```sh
cat /sys/module/amdgpu/parameters/dpm
```

Expected output:

```text
0
```

If it shows `0` and the desktop still fails, this workaround has not solved your case.

## Make it persistent

Only do this after the temporary test succeeds.

1. Open a dedicated boot-configuration file:
   ```sh
   sudoedit /etc/limine-entry-tool.d/imac-gpu.conf
   ```

2. Add this line, preserving any existing content:
   ```sh
   KERNEL_CMDLINE[default]+=" amdgpu.dpm=0"
   ```
   Save and close the editor.

3. Rebuild the boot configuration:
   ```sh
   sudo limine-mkinitcpio
   ```

Wait for the rebuild to finish successfully. If it reports errors, resolve them before rebooting.

Omarchy uses this [additive configuration pattern for Apple hardware settings](https://github.com/omacom/omarchy/blob/94a8fbc2d67eec5673c7f16b8c5e8a9c8452ffdc/install/hardware/apple/fix-t2.sh#L35-L39).

Reboot normally, without editing the Limine entry. Check that the desktop starts, then verify:

```sh
cat /sys/module/amdgpu/parameters/dpm
```

It should print `0`. Saving the parameter this way kept login working across reboots on my iMac.

## Scope and rollback

This was tested on the hardware and Omarchy version listed above. There is also a [related M395 report](https://github.com/omacom/omarchy/discussions/5151#discussioncomment-17789456). The broader discussion covers different GPUs, so do not copy every parameter from it.

Disabling dynamic power management may affect performance and power consumption. The exact driver defect remains unconfirmed. This is a working workaround.

To undo it, remove the added line from `/etc/limine-entry-tool.d/imac-gpu.conf`, run `sudo limine-mkinitcpio`, and reboot.
