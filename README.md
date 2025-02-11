# Gnome-shell: Quick language Switch extension

A *X11*/*Wayland* extension to quickly switch keyboard language layouts,
that bypass the switcher popup and preserves the focus of the active window/widget.

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

Hence the many relevant questions on the web:

* https://askubuntu.com/questions/972926/how-to-not-show-keyboard-layout-chooser-popup-when-changing-language-in-gnome-3/
* https://itectec.com/unixlinux/how-to-change-keyboard-layout-in-gnome-3-from-command-line/
* https://askubuntu.com/questions/1123163/modeless-stateless-layout-language-switching-with-caps-lock-again-18-04-lts-bi/
* https://askubuntu.com/questions/969784/fast-switch-input-source-via-capslock-button-in-ubuntu-17-10/
* https://askubuntu.com/questions/1084049/switch-layouts-with-one-key-on-18-04-bug/
* https://askubuntu.com/questions/1200586/ubuntu-19-very-slow-f-keys-response-and-input-language-switch/
* https://unix.stackexchange.com/questions/316998/how-to-change-keyboard-layout-in-gnome-3-from-command-line/
* https://askubuntu.com/questions/209597/how-do-i-change-keyboards-from-the-command-line/
* https://askubuntu.com/questions/1056802/how-to-assign-caps-lock-first-lang-and-shiftcaps-lock-second-lang-in-ubuntu/
* https://askubuntu.com/questions/1134629/manipulate-the-default-shortcut-superspace-for-switching-to-next-input-source-w/
* https://askubuntu.com/questions/998077/how-to-disable-the-keyboard-layouts-choosing-screen-in-gnome/
* https://askubuntu.com/questions/1048805/how-can-i-switch-keyboard-source-quickly-in-ubuntu-18-04-gnome-shell/

Since `gsettings` cannot reliably switch keyboard layouts both on *X* and *Wayland*,
some of the recipes above suggest binding a "custom keyboard shortcut" to a bash-script
performing the switch through *dbus* command, which bypasses the popup.

Unfortunately since Gnome-shell v41 (e.g. pushed downstream to *Debian unstable "SID"* roughly on Sept 2021)
*dbus* no longer allows calling method  `org.gnome.Shell.Eval` with arbitrary code,
due to [security concerns](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/3943).
The workaround to keep using *dbus* is to [use a custom `eval` method](https://askubuntu.com/questions/1406542/shortcuts-for-keyboard-layout-ubuntu-22-04/1428946#1428946),
but this extension cuts to the chase.

Furthemore, since the extension does not define a *custom-shortcut*,
all keyboard customizations with `gnome-tweak-tool`/`setxkbmap` in X11 or *Wayland*
still work fine, on all Gnome versions.

## Improvements

A better solution would be to modify the [original `ui/status/keyboard.js` code](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/keyboard.js#L407-410)
to skip the switcher-popup based on some new boolen preference (e.g. settable from `Tweaks` ),
as requested by [gnome-shell#2945](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2945) issue.

If you want to [switch between **multiple layouts** immediately](https://askubuntu.com/questions/1406542/shortcuts-for-keyboard-layout-ubuntu-22-04/1428946#1428946),
ie. without cycling through them,
there is now (June 2023) [Osamu Aoki's extension](https://extensions.gnome.org/extension/6066/shortcuts-to-activate-input-methods/).

**TIP:** to facilitate typing while switching language, you may assign
 the _"Switch to next/previous input source"_ keyboard shortcut to a single keystroke,
like **[SysRq/Print]** or **[CapsLock]** keys.
![Screenshot of Gnome Tweaks tool to enable **[CapsLock]** as language switcher](CapsLockSwitcherSettings.png)

## Release instructions

0. Test the code:
   * Follow the extension's logs with: `journalctl  -fg 'quick`.
   * [Install the extension locally](https://gjs.guide/extensions/development/creating.html#extension-js):

     ```bash
     cd ~/.local/share/gnome-shell/extensions
     ln -s <your-project-folder> quick-lang-switch@loca
     ```

     > **Note:** Unfortunately testing the extension under *Wayland* in a nested gnome-shell,
     > as _gnome-shell_ docs suggest, does not work for the language switch key,
     > because it is consumed by the outer shell; you must re-login to reload your changes.

   * Cycle with 3+ layouts installed.
   * Enable, disable, re-enable extension and check that both the switcher popup
     and the immediate cycling work fine in each state.
   * Check both **Xorg** and **Wayland**.

1. Discover the latest version present in the  *Gnome-extensions site* (link above).
2. Populate the [Changes](#Changes) section, below, for the discovered `version + 1`.
3. `git tag -sm '<msg>'  v<latest-release + 1>`
4. `git push origin main --tag`
5. Archive the extension & include the commit-id as a zip-comment
   (the `-z` option sets the git-hash as zip's comment):

   ```bash
   git rev-parse HEAD | \
       zip ../gnome-shell-quick-lang-switch-$(git describe).zip \
       -z \
       extension.js \
       metadata.json
   ```

6. Upload it in https://extensions.gnome.org/upload/
7. Convert the tag into a GitHub release, paste the changelog and attach archive as an asset.

## Changes


### 11 Feb 2024, v13: +shell-v48

### 8 Dec 2024, v12: +shell-v47

### 17 Apr 2024, v11: +shell-v46

### 15 Nov 2023, v10: gdm & lock-screen: REJECTED

* feat: mark `metadata.js` as working also in gdm & lock-sreen.
* [Rejected by Gnome-extensions site](https://extensions.gnome.org/review/48228),
  because it `gdm` is not allowed on ego extensions since they are not going
  to be installed as system extension.

### 12 Nov 2023, v9: ECMAScript-modules (ESM) for shell-v45

**NOTE:** the new code is incompatible with previous gnome-shell-44 and below.
In case bugs are discovered, old releases would have to be bugfixed separately.

* FEAT/REFACT: revamp code for ESM modules, thanks to @hankjura (Yury thankjura).
  * feat: old imports system wouldn't working on gnome-shell-45.
  * refact: rename classname from `Extension` --> `QuickLangSwitchExtension`
  * refact: use console.log/warn.error
* refact: cycle layouts WITHOUT checking conjecutive nulls.
  Maybe conjecutive null check was a relic from when their keys were non-ints
  (if that era ever existed).
* fix: had forgotten `return` in the 2 bail-out/error conditional branches,
  indeterminate action would have happen then (not really tested :-().
* doc: coallesce demand for this plugin in StackOverflow.

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
