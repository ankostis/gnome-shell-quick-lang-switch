# Gnome-shell: Quick language Switch extension

Gnome shell extension to quickly switch keyboard language layout,
without waiting for the switcher popup to appear.

## Rational

Due to [security concerns](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/3943),
since Gnome-shell v41, `dbus` can no longer call
method  `org.gnome.Shell.Eval`, needed by the following recipes,
the only ones working under *Wayland*:

* https://itectec.com/unixlinux/how-to-change-keyboard-layout-in-gnome-3-from-command-line/
* https://unix.stackexchange.com/a/449475/156357
* https://askubuntu.com/a/1136485/251379


## Improvements

A better solution eould be to odify the [original `ui/status/keyboard.js` code](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/keyboard.js#L407-410)
to skip the switcher-popup based on some new boolen preference (e.g. settable from `Tweaks` ),
as requested by [gnome-shell#2945](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2945) issue.

## Changes

### Version-1: re-bind `switch-input-source` shortcut to direct switch

When enabled (method `InputSourceManager._modifiersSwitcher`,
restore shortcut to original `InputSourceManager._switchInputSource`
method it when disabled.

Note, it won't reset it to any other monkeypatches.
