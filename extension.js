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

const { Gio, Meta, Shell } = imports.gi
const Main = imports.ui.main;
const SWITCH_SHORTCUT_NAME = 'switch-input-source'
const InputSourceManager = imports.ui.status.keyboard.getInputSourceManager();

class Extension {
    constructor() {
    }

    enable() {
        log(`enabling extension '${Me.metadata.name}':  bypassing language switcher popup.`);
        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
        Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME,
                              new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
                              Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL,
                              this._quickSwitch);
    }

    disable() {
        log(`disabling extension '${Me.metadata.name}':  restoring language switcher popup.`);
        Main.wm.removeKeybinding(SWITCH_SHORTCUT_NAME);
        Main.wm.addKeybinding(SWITCH_SHORTCUT_NAME,
                              new Gio.Settings({ schema_id: "org.gnome.desktop.wm.keybindings" }),
                              Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL,
                              InputSourceManager._switchInputSource.bind(InputSourceManager));
    }

    _quickSwitch(display, window, binding) {
        InputSourceManager._modifiersSwitcher.bind(InputSourceManager)();
    }
}

function init() {
    log(`initializing extension '${Me.metadata.name}'`);
    return new Extension();
}
