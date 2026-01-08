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
     * Custom switching logic (still WITHOUT the GNOME language switcher popup).
     *
     * Target behaviour for 3 layouts (Latin + 2 Cyrillic):
     *   - "switch-input-source" (forward): toggles only between Latin <-> current Cyrillic
     *   - "switch-input-source-backward" (reverse): switches Cyrillic to the NEXT Cyrillic
     *     and activates it (so the active pair becomes: Latin <-> that Cyrillic)
     *
     * Example with En / Ru / Ua:
     *   forward: En <-> Ru
     *   reverse: (from En OR Ru) => Ua  (pair becomes En <-> Ua)
     *   reverse again: => Ru (pair becomes En <-> Ru)
     *
     * If we can't confidently detect "Latin" and "Cyrillic" sources (or there are not 3
     * sources), we fall back to the default cycle behaviour (still without popup).
     */
    _quickSwitchLayouts(display, window, binding) {
        const sources = this._inputSources || {};

        // Build an ordered list of valid indices (don't assume they are consecutive).
        const indices = Object.keys(sources)
            .map(k => parseInt(k, 10))
            .filter(i => Number.isInteger(i) && sources[i])
            .sort((a, b) => a - b);

        const nsources = indices.length;
        if (nsources <= 1) {
            _log(`WARN: Empty or singular inputSources list(x${nsources}) - doing nothing.`);
            KeyboardManager.releaseKeyboard();
            return;
        }

        const reversed = binding && typeof binding.is_reversed === 'function'
            ? binding.is_reversed()
            : false;

        const currentIndex = this._currentSource
            ? this._currentSource.index
            : indices[0];

        // --- Helpers -------------------------------------------------------
        const _safeStr = v => {
            if (v === null || v === undefined)
                return '';
            try {
                return String(v);
            } catch (e) {
                return '';
            }
        };

        const _sourceSignature = src => {
            // InputSource shape is private API; keep this very defensive.
            const parts = [];
            if (!src)
                return '';
            // Properties that exist across many gnome-shell versions.
            parts.push(_safeStr(src.shortName));
            parts.push(_safeStr(src.id));
            parts.push(_safeStr(src.name));
            parts.push(_safeStr(src.displayName));
            parts.push(_safeStr(src.type));
            return parts.join(' ').toLowerCase();
        };

        // Identify Russian / Ukrainian (Cyrillic) using multiple hints.
        // NOTE: We intentionally handle both "ua" (xkb layout code) and "uk" (language code).
        const _isRussian = sig =>
            /\bru\b/.test(sig) || sig.includes('russian') || sig.includes('xkb:ru') || sig.includes(':ru:');

        const _isUkrainian = sig =>
            /\bua\b/.test(sig) || /\buk\b/.test(sig) || sig.includes('ukrain') || sig.includes('ukr') ||
            sig.includes('xkb:ua') || sig.includes(':ua:');

        const _isEnglishish = sig =>
            /\ben\b/.test(sig) || /\bus\b/.test(sig) || /\bgb\b/.test(sig) || sig.includes('english') ||
            sig.includes('xkb:us') || sig.includes('xkb:gb') || sig.includes(':us:') || sig.includes(':gb:');

        const _cycleAllSources = (direction) => {
            // direction: +1 (forward), -1 (reverse)
            const pos = indices.indexOf(currentIndex);
            const safePos = pos >= 0 ? pos : 0;
            const nextPos = (safePos + direction + nsources) % nsources;
            sources[indices[nextPos]].activate(true);
        };

        // --- Detect Latin + Cyrillic sources ------------------------------
        // We primarily expect 3 layouts (En + Ru + Ua), but we keep the detection
        // generic and only apply the "pair" logic when it looks sane.
        const cyrIndices = [];
        for (const i of indices) {
            const sig = _sourceSignature(sources[i]);
            if (_isRussian(sig) || _isUkrainian(sig))
                cyrIndices.push(i);
        }

        // Determine Latin as "the one that is not Cyrillic" (best for the 3-layout case).
        const latinCandidates = indices.filter(i => !cyrIndices.includes(i));
        let latinIndex = null;
        if (latinCandidates.length === 1) {
            latinIndex = latinCandidates[0];
        } else if (latinCandidates.length > 1) {
            // If user has more than 1 non-Cyrillic, prefer something that looks like English.
            let preferred = null;
            for (const i of latinCandidates) {
                if (_isEnglishish(_sourceSignature(sources[i]))) {
                    preferred = i;
                    break;
                }
            }
            latinIndex = preferred !== null ? preferred : latinCandidates[0];
        }

        // Apply pair logic only when:
        //   - We have 2+ Cyrillic layouts AND
        //   - We have a Latin layout to pair with.
        // Otherwise just cycle normally.
        if (!latinIndex || cyrIndices.length === 0) {
            // latinIndex can be 0, so check explicitly for null/undefined.
            if (latinIndex === null || latinIndex === undefined || cyrIndices.length === 0) {
                _cycleAllSources(reversed ? -1 : 1);
                return;
            }
        }

        if (latinIndex === null || latinIndex === undefined || cyrIndices.length === 0) {
            _cycleAllSources(reversed ? -1 : 1);
            return;
        }

        // Keep current Cyrillic selection as state on the InputSourceManager.
        // (We don't want any additional files/settings for a tiny tweak.)
        if (typeof this._noPopupPairCyrIndex !== 'number' || !cyrIndices.includes(this._noPopupPairCyrIndex)) {
            this._noPopupPairCyrIndex = cyrIndices.includes(currentIndex)
                ? currentIndex
                : cyrIndices[0];
        }

        if (reversed) {
            // Reverse = rotate Cyrillic and ALWAYS activate Cyrillic.
            const baseCyr = cyrIndices.includes(currentIndex)
                ? currentIndex
                : this._noPopupPairCyrIndex;

            const pos = cyrIndices.indexOf(baseCyr);
            const safePos = pos >= 0 ? pos : 0;
            const nextCyr = cyrIndices[(safePos + 1) % cyrIndices.length];

            this._noPopupPairCyrIndex = nextCyr;
            sources[nextCyr].activate(true);
            return;
        }

        // Forward = toggle only between Latin <-> selected Cyrillic.
        let targetIndex;
        if (currentIndex === latinIndex) {
            targetIndex = this._noPopupPairCyrIndex;
        } else if (cyrIndices.includes(currentIndex)) {
            // If user manually selected the other Cyrillic via indicator/menu,
            // sync our state so future toggles behave naturally.
            this._noPopupPairCyrIndex = currentIndex;
            targetIndex = latinIndex;
        } else {
            // Unknown current -> go to Latin.
            targetIndex = latinIndex;
        }

        const nextSource = sources[targetIndex];
        if (!nextSource) {
            _log(`ERROR: target input source missing at index ${targetIndex}; falling back to normal cycle.`);
            _cycleAllSources(1);
            return;
        }

        nextSource.activate(true);
    }
}

function init() {
    return new Extension();
}

function _log(...args) {
    log(`extension '${Me.metadata.name}': ` + args.join("\n"));
}
