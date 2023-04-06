# Gnome-shell: Quick language Switch extension

Gnome shell extension to quickly switch keyboard language layout,
without waiting for the switcher popup to appear.

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

The language switcher popup by defaulttakes ~0.7sec to appear,
meaning that roughly 2-4 strokes are lost till the switch completes.
This affects heavily users typing languages with non-latin based alphabets
(e.g. Greek, Cyrilic, Arabic, Japanese), particularly when writting technical documents.

Acording to the recipes below, to safely workaround this issue both on *X* and *Wayland*
you could employe a "custom keyboard shortcut" to delegate to a bash-script
performing the switch through *dbus*, which bypasses the popup:

* https://askubuntu.com/questions/972926/how-to-not-show-keyboard-layout-chooser-popup-when-changing-language-in-gnome-3
* https://itectec.com/unixlinux/how-to-change-keyboard-layout-in-gnome-3-from-command-line/
* https://unix.stackexchange.com/a/449475/156357
* https://askubuntu.com/a/1136485/251379

Unfortunately, due to [security concerns](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/3943),
*dbus* can no longer call method  `org.gnome.Shell.Eval` with arbitrary code,
since Gnome-shell v41 (e.g. pushed downstream to *Debian unstable "SID"* roughly on Sept 2021).

## Improvements

A better solution would be to modify the [original `ui/status/keyboard.js` code](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/keyboard.js#L407-410)
to skip the switcher-popup based on some new boolen preference (e.g. settable from `Tweaks` ),
as requested by [gnome-shell#2945](https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2945) issue.

## Packaging instructions

1. Check the latest version present in the  *Gnome-extensions site* (link above).
2. Update [Changes](#Changes), below.
3. `git tag -sm '<msg>'  <latest-release + 1>`
4. `git push origin main --tag`
5. Archive extension & include the commit-id as a zip-comment
   (with the `-z` option to set a comment with the git-hash on the zip):

   ```bash
   git rev-parse HEAD | zip ../gnome-shell-quick-lang-switch-$(git describe).zip -z *
   ```

6. Upload it in https://extensions.gnome.org/upload/

## Changes

### Version-7: <= gnome-44

- version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42, 43, 44
- thanks to [Oleg Arefyev](https://github.com/imareo)'s
  [PR#9](https://github.com/ankostis/gnome-shell-quick-lang-switch/pull/9).

### Version-6: <= gnome-43

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42, 43

### Version-5: <= gnome-42

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41, 42

### Version-4: <= gnome-41

version: 3.28, 3.30, 3.34, 3.32, 3.36, 3.38, 40, 41

### Version-3: gnome-40 & 41

version: 40, 41

### Version-1: re-bind `switch-input-source` shortcut to direct switch

It re-binds the `'switch-input-source'` shortcut:

* when enabled, the shortcut delegates to the direct-switching method `InputSourceManager._modifiersSwitcher`, and
* when disabled, it the shortcut is restored to the original `InputSourceManager._switchInputSource` method.
  Note, it won't reset it to any previous monkeypatches.
