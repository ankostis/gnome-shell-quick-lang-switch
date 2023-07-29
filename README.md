# Gnome-shell: Quick language Switch extension

A *X11*/*Wayland* extension to quickly switch keyboard language layouts,
that bypass the switcher popup and preserves the focus of the active window/widget.

> **TIP:** to facilitate typing while switching language, assign the _"Switch to next/previous input source"_ keyboard shortcut to a single keystroke,
> like then **[SysRq/Print]** key.

## Install
Install it from [Gnome-extensions site](https://extensions.gnome.org/extension/4559/quick-lang-switch/), or directly from GitHub with this command:
```bash
git clone https://github.com/ankostis/gnome-shell-quick-lang-switch ~/.local/share/gnome-shell/extensions/quick-lang-switch@ankostis.gmail.com
```

and then ensure it is enabled:
```bash
gnome-extensions info quick-lang-switch@ankostis.gmail.com
gnome-extensions enable quick-lang-switch@ankostis.gmail.com
```
If the 1st command above reports that extension does not exist,
logout and re-login (required for *Wayland*).

## Rational

The language switcher popup by default takes ~0.7sec to appear,
meaning that roughly 2-4 strokes are lost till the switch completes.
This affects heavily users typing languages with non-latin based alphabets
(e.g. Greek, Cyrilic, Arabic, Japanese), particularly when writting technical documents.

Furthermore, the popup messes with the focus of the active window/widget,
(eg. IntelliJ's search popup gets closed, the active widget loses focus when
the screen is shared, etc).

Since `gsettings` cannot reliably switch keyboard layouts both on *X* and *Wayland*,
some of the recipes below suggest binding a "custom keyboard shortcut" to a bash-script
performing the switch through *dbus* command, which bypasses the popup:

* https://askubuntu.com/questions/972926/how-to-not-show-keyboard-layout-chooser-popup-when-changing-language-in-gnome-3
* https://itectec.com/unixlinux/how-to-change-keyboard-layout-in-gnome-3-from-command-line/
* https://unix.stackexchange.com/a/449475/156357
* https://askubuntu.com/a/1136485/251379
* https://askubuntu.com/questions/1042845/disable-popup-notification-on-ubuntu-18-04-language-switch/1480203
* https://askubuntu.com/questions/1123163/modeless-stateless-layout-language-switching-with-caps-lock-again-18-04-lts-bi
* https://askubuntu.com/questions/969784/fast-switch-input-source-via-capslock-button-in-ubuntu-17-10
* https://askubuntu.com/questions/1084049/switch-layouts-with-one-key-on-18-04-bug
*
Unfortunately since Gnome-shell v41 (e.g. pushed downstream to *Debian unstable "SID"* roughly on Sept 2021)
*dbus* no longer allows calling method  `org.gnome.Shell.Eval` with arbitrary code,
due to [security concerns](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/3943).
The workaround to keep using *dbus* is to [use a custom `eval` method](https://askubuntu.com/questions/1406542/shortcuts-for-keyboard-layout-ubuntu-22-04/1428946#1428946),
but this extension cuts to the chase.
.

## Improvements

A better solution would be to modify the [original `ui/status/keyboard.js` code](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/keyboard.js#L407-410)
to skip the switcher-popup based on some new boolen preference (e.g. settable from `Tweaks` ),
as requested by [gnome-shell#2945](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2945) issue.

If you want to [switch between **multiple layouts** immediately](https://askubuntu.com/questions/1406542/shortcuts-for-keyboard-layout-ubuntu-22-04/1428946#1428946),
ie. without cycling through them,
there is now (June 2023) [Osamu Aoki's extension](https://extensions.gnome.org/extension/6066/shortcuts-to-activate-input-methods/).

## Packaging instructions

0. [Test the code](https://gjs.guide/extensions/development/creating.html#extension-js):
   unfortunatly the nested gnome-shell cannot test the language switch key,
  it's consumed by the outer shell - under *Wayland* (at least) you must re-login,
  and check:
  * Follow extension logs with `journalctl  -fg 'quick`.
  * Cycle with 3+ layouts installed.
  * Enable, disable, re-enable extension and check that both the switcher popup
    and the immediate cycling work fine in each state.
  * Check both **Xorg** and **Wayland**.

1. Check the latest version present in the  *Gnome-extensions site* (link above).
2. Populate the [Changes](#Changes), below, for the version+1.
3. `git tag -sm '<msg>'  <latest-release + 1>`
4. `git push origin main --tag`
5. Archive extension & include the commit-id as a zip-comment
   (with the `-z` option to set a comment with the git-hash on the zip):

   ```bash
   git rev-parse HEAD | zip ../gnome-shell-quick-lang-switch-$(git describe).zip -z *
   ```

6. Convert the tag into  a GitHub relase.
7. Upload it in https://extensions.gnome.org/upload/

## Changes

### 31 Jul 2023, v8: cycle-backward, fix restoring switcher popup

* FEAT: bind also `switch-input-source-backward`
  (fix [#4](https://github.com/ankostis/gnome-shell-quick-lang-switch/issues/4).
  thanks to [Yevhen Popok](https://github.com/xalt7x), [@PotatoXPC](https://github.com/PotatoXPC))
* FIX: previously, disabling the extension and reinstating the switcher popup
  would brake repeated cycling, making it impossible to cycle further than 
  the immediate next layout, not without first releasing keys and re-pressing them.
  - FIX: this could possibly also fix [#5](https://github.com/ankostis/gnome-shell-quick-lang-switch/issues/5)
    crashing when disabling the extensein (can't be sure, couldn't reproduce).
* refact: refetch sourceManager on each cycie-call, in case it has changed
  (instead of storing it in a global var on initialization).
* doc: comments describe new method's provenance
* doc: enhance README from user feedback & SO;  mention similar extension by Osamu Aoki,
  better for multiple layouts.
* DOC: add LICENSE file AGPL.
* DOC: describe implementation provenance and challenges in comments.

### 6 Apr 2023, v7: <= gnome-44

* version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42, 43, 44
* thanks to [Oleg Arefyev](https://github.com/imareo)'s
  [PR#9](https://github.com/ankostis/gnome-shell-quick-lang-switch/pull/9).

### 23 Oct 2022, v6: <= gnome-43

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42, 43

### 27 May 2022, v5: <= gnome-42

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42

### 2 Nov 2021, v4: <= gnome-41

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41

### 22 Oct 2021, v3: gnome-40 & 41

version: 40, 41

### 21 Oct 2021, v1: re-bind `switch-input-source` shortcut to direct switch

It re-binds the `'switch-input-source'` shortcut:

* when enabled, the shortcut delegates to the direct-switching method `InputSourceManager._modifiersSwitcher`, and
* when disabled, it the shortcut is restored to the original `InputSourceManager._switchInputSource` method.
  Note, it won't reset it to any previous monkeypatches.
