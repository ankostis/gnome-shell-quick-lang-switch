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

import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as KeyboardManager from 'resource:///org/gnome/shell/misc/keyboardManager.js';
import { getInputSourceManager } from 'resource:///org/gnome/shell/ui/status/keyboard.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const SWITCH_SHORTCUT_NAME = 'switch-input-source'
const SWITCH_SHORTCUT_NAME_BACKWARD = 'switch-input-source-backward'

/**
 * Code below written by adapting 
 * https://github.com/GNOME/gnome-shell/blob/main/js/ui/status/keyboard.js#L330-L405
 * and specifically the function `InputSourceManager._modifiersSwitcher()` 
 * which is hackishly called when screenshotting (ie. GrabHelper activated) .
 */
export default class QuickLangSwitchExtension extends Extension {
    enable() {
        this._info(`ENABLING, bypassing language switcher popup.`);
        const sourceman = getInputSourceManager();

        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
        sourceman._keybindingAction = Main.wm.addKeybinding(
            SWITCH_SHORTCUT_NAME,
            new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            this._quickSwitchLayouts.bind(sourceman));

        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD);
        sourceman._keybindingActionBackward = Main.wm.addKeybinding(
            SWITCH_SHORTCUT_NAME_BACKWARD,
            new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
            Meta.KeyBindingFlags.IS_REVERSED,
            Shell.ActionMode.ALL,
            this._quickSwitchLayouts.bind(sourceman));
    }

    disable() {
        this._info(`DISABLING, restoring language switcher popup.`);
        const sourceman = getInputSourceManager();

        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
        sourceman._keybindingAction = Main.wm.addKeybinding(
            SWITCH_SHORTCUT_NAME,
            new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            sourceman._switchInputSource.bind(sourceman));

        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME_BACKWARD);
        sourceman._keybindingActionBackward = Main.wm.addKeybinding(
            SWITCH_SHORTCUT_NAME_BACKWARD,
            new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
            Meta.KeyBindingFlags.IS_REVERSED,
            Shell.ActionMode.ALL,
            sourceman._switchInputSource.bind(sourceman));
    }

    /**
     * Adapted from `InputSourceManager._modifiersSwitcher():
     * - simplified array indexing logic by assuming`_inputSources` always indexed
     *   with conjecutive integers without null gaps
     *   (actually keys are sorted stringified ints like `{"1": ,..., "2": ...}`),
     * - added reverse cycling,
     * - stop returning any bool (was always true), and 
     * - added warn/error logs.
     */
    _quickSwitchLayouts(...args) {
        /* shell-v48 added `event` argument. */
        const binding = args[args.length-1];
        const sources = this._inputSources;
        const nsources = Object.keys(sources).length;
        if (nsources === 0) {
            this._warn(`Empty inputSources - doing nothing.`);
            KeyboardManager.releaseKeyboard();
            return;
        }
        const dir = binding.is_reversed() ? -1 : 1;
        const ci = this._currentSource ? this._currentSource.index : 0;
        // Always add modulo to avoid negatives, tip: ((-1 % 4) = -1) + 4 = 3
        const ni = (ci + dir + nsources) % nsources;
        const nextSource = sources[ni];

        if (!nextSource) {
            this._error(
                `Cycling ${cycleDirection} in ${nsources} inputSources(${JSON.stringify(sources)})`,
                ` from ${ci}-->${ni} brought nothing.`);
            KeyboardManager.releaseKeyboard();
            return;
        }

        sources[ni].activate(true);
    }

    _log(logfunc, ...args) {
        logfunc(`${this.metadata.uuid}:`, ...args);
    }

    _info(...args) {
        this._log(console.log, ...args);
    }

    _warn(...args) {
        this._log(console.warn, ...args);
    }

    _error(...args) {
        this._log(console.error, ...args);
    }
}
