import {Key, useInput} from 'ink';
import {useEffect, useState} from 'react';
import noop from './noop.js';

export type KeyCode = keyof Key | (string & {}) | undefined;

export function keyCodeMatch(
	keycode: KeyCode,
	input: string,
	key: Key,
): boolean {
	if (!keycode) return false;
	return keycode === input || keycode in key;
}

const keyMap = {
	backspace: '⌫',
	delete: '⌦',
	ctrl: '⌃',
	meta: '⌥',
	shift: '⇧',
	upArrow: '↑',
	downArrow: '↓',
	leftArrow: '←',
	rightArrow: '→',
	escape: 'ESC',
	pageDown: 'PG▼',
	pageUp: 'PG▲',
	return: '⮐',
	tab: 'Tab',
} as const satisfies Record<keyof Key, string>;

export function keyCodeText(keycode: KeyCode): string {
	if (!keycode) return '';
	if (keycode in keyMap) {
		return keyMap[keycode as keyof typeof keyMap];
	}
	return keycode;
}

export type UseShortcutResult = {
	keycode: KeyCode;
	pressed?: boolean;
	disabled: boolean;
};

export const useShortcut = (
	keycode: KeyCode,
	onPressed: (input: string, key: Key) => void = noop,
	disabled = false,
): UseShortcutResult => {
	const [pressed, setPressed] = useState(false);

	useInput(
		(input, key) => {
			if (keyCodeMatch(keycode, input, key)) {
				onPressed?.(input, key);
				setPressed(true);
			}
		},
		{isActive: !disabled},
	);

	useEffect(() => {
		const timer = setTimeout(setPressed, 100);
		return () => clearTimeout(timer);
	}, [pressed]);

	return {pressed, keycode, disabled};
};
