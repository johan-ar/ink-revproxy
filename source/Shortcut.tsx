import _ from 'lodash';
import React, {useMemo} from 'react';
import Text, {TextProps} from './Text.js';
import {UseShortcutResult, keyCodeText} from './util/keycode.js';

export type ShortcutProps = {
	pressedColor?: TextProps['color'];
	children?: React.ReactNode;
} & Omit<TextProps, 'children'> &
	Partial<UseShortcutResult>;

const Shortcut: React.FC<ShortcutProps> = ({
	keycode,
	pressedColor,
	disabled,
	pressed,
	children,
	...props
}) => {
	const shortcut = keyCodeText(keycode);

	const text = useMemo(() => {
		let children_ = _.isArray(children) ? children : [children];
		let textNodes = _.takeWhile(children_, _.isString);

		let rest = children_.slice(textNodes.length);

		if (textNodes.length) {
			let text = textNodes.join('');
			const index = text.toLowerCase().indexOf(shortcut.toLowerCase());
			if (index !== -1)
				return [
					text.slice(0, index),
					text.slice(index, index + shortcut.length),
					text.slice(index + shortcut.length),
					rest,
				];
		}
		return ['', shortcut, '️:', children];
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
