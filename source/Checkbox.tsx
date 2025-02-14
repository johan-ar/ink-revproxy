import {Text, TextProps} from 'ink';
import React from 'react';

type CheckboxProps = TextProps & {
	checked?: boolean;
	disabled?: boolean;
};

const Checkbox: React.FC<CheckboxProps> = ({
	checked,
	children,
	disabled,
	color,
	...props
}) => {
	return (
		<Text {...props} color={disabled ? 'gray' : color}>
			{checked ? '\udb81\udf65' : '\udb81\udf66'}
			{children}
		</Text>
	);
};

export default Checkbox;
