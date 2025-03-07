import {Key as KeyInk} from 'ink';

const KEY = 0;
const INPUT = 1;

const KeyMap = {
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

const KEYS = Object.keys(KeyMap) as (keyof KeyInk)[];
export type Key = Partial<KeyInk> & {
	[key: string]: boolean;
};

export type ShortcutSequence = [key: Partial<Key>, input: string];

export function toSequence(
	sequence: ShortcutSequence | string,
): [key: Partial<Key>, input: string] {
	return Array.isArray(sequence) ? sequence : [{}, sequence];
}

export function sequenceMatch(
	sequence: ShortcutSequence,
	pressed: ShortcutSequence,
): boolean {
	return (
		sequence[INPUT] === pressed[INPUT] &&
		KEYS.every(name => {
			return (pressed[KEY][name] || false) === (sequence[KEY][name] || false);
		})
	);
}

export function sequenceToString(sequence?: ShortcutSequence): string {
	if (!sequence) return '';

	return Object.entries(sequence[KEY])
		.reduce(
			(out, [key, value]) =>
				value ? [...out, KeyMap[key as keyof KeyInk]] : out,
			[] as string[],
		)
		.concat(sequence[INPUT])
		.join('+');
}
