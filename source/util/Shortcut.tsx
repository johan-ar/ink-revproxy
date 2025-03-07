import {useInput} from 'ink';
import _ from 'lodash';
import React, {useMemo, useRef, useState} from 'react';
import Text, {TextProps} from '../Text.js';
import noop from './noop.js';
import {
	ShortcutSequence,
	sequenceMatch,
	sequenceToString,
	toSequence,
} from './shortcutDefinitions.js';

export type ShortcutProps = {
	pressedColor?: TextProps['color'];
	children?: React.ReactNode;
	sequence: ShortcutSequence | string;
} & Omit<TextProps, 'children'> &
	Omit<Partial<UseShortcutResult>, 'sequence'>;

const Shortcut: React.FC<ShortcutProps> = ({
	sequence,
	pressedColor,
	disabled,
	pressed,
	children,
	...props
}) => {
	const shortcutStr = sequenceToString(toSequence(sequence));
	const text = useMemo(() => {
		let childrenArray = Array.isArray(children) ? children : [children];
		let textNodes: string[] = _.takeWhile(childrenArray, _.isString);
		let nodes: React.ReactNode = childrenArray.slice(textNodes.length);

		if (textNodes.length) {
			let text = textNodes.join('');
			const index = text.toLowerCase().indexOf(shortcutStr.toLowerCase());
			if (index !== -1)
				return [
					text.slice(0, index),
					text.slice(index, index + shortcutStr.length),
					text.slice(index + shortcutStr.length),
					nodes,
				];
		}
		return ['', shortcutStr, '️:', children];
	}, [children]);

	return (
		<Text
			{...props}
			color={pressed ? 'white' : props.color}
			bgColor={pressed ? 'greenBright' : props.backgroundColor}
		>
			{text[0]}
			<Text underline bold color={disabled ? undefined : pressedColor}>
				{text[1]}
			</Text>
			{text[2]}
			{text[3]}
		</Text>
	);
};

export default Shortcut;

export type UseShortcutResult = {
	sequence: ShortcutSequence;
	pressed?: boolean;
	disabled: boolean;
};
export const useShortcut = (
	sequence: ShortcutSequence | string,
	onPressed: (sequence: ShortcutSequence) => void = noop,
	disabled = false,
): UseShortcutResult => {
	const [pressed, setPressed] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | undefined>();

	const [key, input] = toSequence(sequence);
	const sequence_: ShortcutSequence = useMemo(() => [key, input], [key, input]);

	useInput(
		(input, key) => {
			if (sequenceMatch(sequence_, [key, input])) {
				onPressed?.([key, input]);
				setPressed(true);
				clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(setPressed, 100, false);
			}
		},
		{isActive: !disabled},
	);

	return {pressed, sequence: sequence_, disabled};
};
