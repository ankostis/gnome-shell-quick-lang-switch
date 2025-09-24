/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { Gio, Meta, Shell, GLib } = imports.gi
const Main = imports.ui.main;
const SWITCH_SHORTCUT_NAME = 'switch-input-source'
const SWITCH_SHORTCUT_NAME_BACKWARD = 'switch-input-source-backward'
const KeyboardManager = imports.misc.keyboardManager;

/**
 * Code below written by adapting
 * https://github.com/GNOME/gnome-shell/blob/main/js/ui/status/keyboard.js#L330-L405
 * and specifically the function `InputSourceManager._modifiersSwitcher()`
 * which is hackishly called when screenshotting (ie. GrabHelper activated) .
 */
class Extension {
  constructor() {
    _log(`INITIALIZING`);
  }

  enable() {
    _log(`ENABLING, bypassing language switcher popup.`);
    const sourceman = imports.ui.status.keyboard.getInputSourceManager();
    Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
    sourceman._keybindingAction = Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME,
      new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      this._quickSwitchLayouts.bind(sourceman));
    Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD);
    sourceman._keybindingActionBackward = Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD,
      new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
      Meta.KeyBindingFlags.IS_REVERSED,
      Shell.ActionMode.ALL,
      this._quickSwitchLayouts.bind(sourceman));
  }

  disable() {
    _log(`DISABLING, restoring language switcher popup.`);
    const sourceman = imports.ui.status.keyboard.getInputSourceManager();
    Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
    sourceman._keybindingAction = Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME,
      new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      sourceman._switchInputSource.bind(sourceman));

    Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD);
    sourceman._keybindingActionBackward = Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD,
      new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
      Meta.KeyBindingFlags.IS_REVERSED,
      Shell.ActionMode.ALL,
      sourceman._switchInputSource.bind(sourceman));
  }

  /**
   * Simplified array indexing logic of `InputSourceManager._modifiersSwitcher()`
   * by assuming `_inputSources` indexed with conjecutive integers
   * (actually it is a dictionary with conjecutive stringified-integers as keys),
   * added reverse cycling, and
   * stop returning any bool (was always true).
   */
  _quickSwitchLayouts(display, window, binding) {
    const sources = this._inputSources;
    const nsources = Object.keys(sources).length;
    if (nsources <= 1) {
      _log(`WARN: Empty or singular inputSources list(x${nsources}) - doing nothing.`);
      KeyboardManager.releaseKeyboard();
      return;
    }

    const cycleDirection = binding.is_reversed() ? -1 : 1;

    // «Сессия» — короткий промежуток, пока Alt удерживается и Space нажимается многократно.
    const SEQ_TIMEOUT_MS = 600;

    // Если таймер не активен — это первое нажатие в сессии.
    const firstPress = !this._qlsTimerId;

    // (Пере)запускаем таймер завершения сессии.
    if (this._qlsTimerId)
      GLib.source_remove(this._qlsTimerId);
    this._qlsTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SEQ_TIMEOUT_MS, () => {
      this._qlsTimerId = 0;
      this._qlsPressCount = 0;
      return GLib.SOURCE_REMOVE;
    });

    this._qlsPressCount = (this._qlsPressCount || 0) + 1;

    // 1-е нажатие => MRU-переключение (между двумя последними).
    if (firstPress) {
      const mru = this._mruSources || this.mruSources; // у InputSourceManager обычно есть _mruSources
      let nextSource = null;

      if (mru && mru.length >= 2) {
        nextSource = mru[1];
      } else {
        // Фолбэк на соседний по порядку, если MRU недоступен
        let si = this._currentSource ? this._currentSource.index : 0;
        si = (si + cycleDirection + nsources) % nsources;
        nextSource = sources[si];
      }

      if (nextSource && typeof nextSource.activate === 'function') {
        nextSource.activate(true); // true => без попапа и без дерганья фокуса
      } else {
        _log(`ERROR: MRU nextSource not found.`);
        KeyboardManager.releaseKeyboard();
      }
      return;
    }

    // 2-е и далее нажатия в рамках одной «сессии» => крутим список по индексу.
    let si = this._currentSource ? this._currentSource.index : 0;
    let n = 0;  // защита от дыр в массиве
    do {
      si = (si + cycleDirection + nsources) % nsources;
      n++;
    } while (!(sources[si]) && n < nsources);

    const nextSource = sources[si];
    if (!nextSource) {
      _log(`ERROR: cycle(${cycleDirection}x${n}) in x${nsources} inputSources brought nothing.`);
      KeyboardManager.releaseKeyboard();
      return;
    }

    nextSource.activate(true); // тоже без попапа и без потери фокуса
  }
}

function init() {
  return new Extension();
}

function _log(...args) {
  log(`extension '${Me.metadata.name}': ` + args.join("\n"));
}
