import { type Key as InkKey } from "ink";

const KeyMap = {
	backspace: "⌫",
	delete: "⌦",
	ctrl: "⌃",
	meta: "⌥",
	shift: "⇧",
	upArrow: "↑",
	downArrow: "↓",
	leftArrow: "←",
	rightArrow: "→",
	escape: "ESC",
	pageDown: "PG▼",
	pageUp: "PG▲",
	return: "⮐",
	tab: "tab",
	space: "⎵",
} as const satisfies Record<keyof Key, string>;

export type Key = Partial<InkKey> & {
	[key: string]: boolean;
};

export type ShortcutSequence = [key: Key, input: string];
export type ShortcutSequenceProp = Key | string | ShortcutSequence;

const KEY = 0;
const INPUT = 1;

const none: ShortcutSequence = [{}, ""];
export function toSequence(sequence?: ShortcutSequenceProp): ShortcutSequence {
	if (!sequence) return none;
	if (Array.isArray(sequence)) return sequence;
	if (typeof sequence === "string") return [none[KEY], sequence];
	if (typeof sequence === "object") return [sequence, ""];

	return none;
}

export function sequenceMatch(
	sequence: ShortcutSequence,
	pressed: ShortcutSequence,
): boolean {
	if (sequence === none) return false;
	if (sequence[INPUT] !== pressed[INPUT]) return false;

	for (const name of new Set([
		...Object.keys(sequence[KEY]),
		...Object.keys(pressed[KEY]),
	])) {
		if (Boolean(sequence[KEY][name]) !== Boolean(pressed[KEY][name]))
			return false;
	}

	return true;
}

export function sequenceToString(sequence?: ShortcutSequence): string {
	if (!sequence) return "";

	let input = sequence[INPUT];
	if (input === " ") input = KeyMap["space"];

	return Object.entries(sequence[KEY])
		.reduce(
			(out, [key, value]) =>
				value ? [...out, KeyMap[key as keyof InkKey]] : out,
			[] as string[],
		)
		.concat(input)
		.join("+");
}
