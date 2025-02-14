import {ColorName} from 'chalk';
import React from 'react';
import Text, {TextProps} from './Text.js';

export type StatusCodeProps = TextProps & {
	code: number;
	message?: string;
};

const StatusCode: React.FC<StatusCodeProps> = ({code, message, ...props}) => {
	const color: ColorName =
		code <= 199 ? 'blue' : code <= 299 ? 'green' : code <= 399 ? 'cyan' : 'red';

	return (
		<Text color={color} {...props}>
			{code}
			{message && ` ${message}`}
		</Text>
	);
};

export default StatusCode;
