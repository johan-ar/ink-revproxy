import { useInput } from "ink";
import _ from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import Text, { TextProps } from "../Text.js";
import { eventEmitter } from "./eventEmitter.js";
import noop from "./noop.js";
import {
	sequenceMatch,
	sequenceToString,
	ShortcutSequence,
	ShortcutSequenceProp,
	toSequence,
} from "./shortcutDefinitions.js";
import { useMemoProp } from "./useMemoProp.js";
import { useTimeout } from "./useTimeout.js";

export type ShortcutProps = {
	sequence: ShortcutSequenceProp;
	onPressed?: (event: ShortcutSequence) => void;
	active?: boolean;
	disabled?: boolean;
	activeColor?: TextProps["color"];
	activeBackgroundColor?: TextProps["backgroundColor"];
} & TextProps;

const Shortcut: React.FC<ShortcutProps> = ({
	sequence,
	onPressed = noop,
	active,
	disabled,
	activeColor,
	activeBackgroundColor,
	children,
	...props
}) => {
	const timeout = useTimeout();
	const [pressed, setPressed] = useState(false);
	const isActive = pressed || active;

	const seq = useShortcut(
		sequence,
		(event) => {
			setPressed(true);
			timeout.start(setPressed, 250, false);
			onPressed(event);
		},
		disabled,
	);

	const text = useMemo(() => {
		const seqStr = sequenceToString(seq);
		const childrenArray = Array.isArray(children) ? children : [children];
		const textNodes: string[] = _.takeWhile(childrenArray, _.isString);
		const nodes: React.ReactNode = childrenArray.slice(textNodes.length);

		if (textNodes.length) {
			const text = textNodes.join("");
			const index = text.toLowerCase().indexOf(seqStr.toLowerCase());
			if (index !== -1)
				return [
					text.slice(0, index),
					text.slice(index, index + seqStr.length),
					text.slice(index + seqStr.length),
					nodes,
				];
		}
		return ["", seqStr, "️:", children];
	}, [children, seq]);

	const noInverse = Boolean(activeColor || activeBackgroundColor);

	return (
		<Text
			{...props}
			color={isActive && noInverse ? activeColor : props.color}
			backgroundColor={
				isActive && noInverse ? activeBackgroundColor : props.backgroundColor
			}
			inverse={noInverse ? false : isActive}
		>
			{text[0]}
			<Text underline bold color="inherit">
				{text[1]}
			</Text>
			{text[2]}
			{text[3]}
		</Text>
	);
};

export default Shortcut;

/**
 * Handles a shortcut sequence.
 *
 * @param sequence The shortcut sequence, given as an array of
 * InkKey objects or a string that will be split into InkKey
 * objects.
 * @param onPressed Called when the shortcut is pressed, given the
 * InkKey array pressed.
 * @param disabled If true, the shortcut is not processed.
 */
export function useShortcut(
	sequence?: ShortcutSequenceProp,
	onPressed: (event: ShortcutSequence) => void = noop,
	disabled = false,
) {
	const seq = useMemoProp(sequence, toSequence);

	useEffect(() => {
		if (disabled) return;

		return inputEmitter.subscribe((ev) => {
			if (sequenceMatch(seq, ev)) onPressed(ev);
		});
	}, [disabled, seq, onPressed]);

	return seq;
}

const inputEmitter = eventEmitter<ShortcutSequence>();

/**
 * Listens to the current input context and emits input events to
 * registered shortcut listeners.
 */
export function useInputContext() {
	useInput((input, key) => {
		inputEmitter([key, input]);
	});
}
