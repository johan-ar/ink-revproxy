import {Box} from 'ink';
import React, {useMemo, useState} from 'react';
import Checkbox from './Checkbox.js';
import HeadersView from './HeadersView.js';
import Shortcut from './Shortcut.js';
import Text from './Text.js';
import Divider from './util/Divider.js';
import {useShortcut} from './util/keycode.js';
import {LogRecord} from './util/logger.js';
import {useObservable} from './util/observable.js';

type FetchPreviewProps = {
	record: LogRecord;
};

const FetchPreview: React.FC<FetchPreviewProps> = ({record}) => {
	const [showPreflight, setShowPreflight] = useState(false);
	const hasPreflight = Boolean(record.preflight);
	const current = hasPreflight && showPreflight ? record.preflight! : record;
	useShortcut(
		'p',
		() => {
			if (hasPreflight) setShowPreflight(value => !value);
		},
		hasPreflight,
	);

	const reqBody = useObservable(current.reqBody);
	const resBody = useObservable(current.resBody);

	const [selected, setSelected] = useState(0);
	const headersShortcut = useShortcut('h', () => setSelected(0));
	const bodyShortcut = useShortcut('r', () =>
		setSelected(value => (value === 1 ? 2 : 1)),
	);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box flexDirection="row" gap={2}>
				<Shortcut {...headersShortcut} pressed={selected === 0} p={1}>
					Headers
				</Shortcut>
				<Shortcut {...bodyShortcut} pressed={selected === 1} p={1}>
					Response
				</Shortcut>
				<Shortcut {...bodyShortcut} pressed={selected === 2} p={1}>
					Request
				</Shortcut>
				{hasPreflight && (
					<Checkbox
						checked={showPreflight}
						color={showPreflight ? 'greenBright' : undefined}
					>
						<Shortcut keycode="p" ml={1}>
							Preflight
						</Shortcut>
					</Checkbox>
				)}
			</Box>

			{selected === 0 && <HeadersView record={current} />}
			{selected === 1 && (
				<BodyPreview
					mime={current.res.getHeaders()['content-type']?.toString() || ''}
					data={resBody}
				/>
			)}
			{selected === 2 && (
				<BodyPreview
					mime={current.req.headers['content-type']}
					data={reqBody}
				/>
			)}
		</Box>
	);
};

export default FetchPreview;

export type BodyPreview = {
	mime?: string;
	data: string;
};

export const BodyPreview: React.FC<BodyPreview> = ({mime, data}) => {
	const render = useMemo(() => {
		switch (mime?.split(';')[0]) {
			case 'application/x-www-form-urlencoded':
				return (
					<Box flexDirection="column">
						{map(new URLSearchParams(data), ([key, value]) => (
							<Box key={key} gap={1}>
								<Text color="greenBright" bold>
									{key}:
								</Text>
								<Text>{value}</Text>
							</Box>
						))}
					</Box>
				);
			case 'application/json':
				return (
					<Box gap={1}>
						<Text>{formatJSON(data)}</Text>
					</Box>
				);
			default:
				return <Text wrap="end">{data}</Text>;
		}
	}, [data, mime]);

	return (
		<Box flexDirection="column" borderStyle="single" width="100%">
			<Box paddingX={1}>
				<Text color="whiteBright">{mime}</Text>
			</Box>
			<Divider />
			<Box paddingX={1} flexWrap="wrap">
				{render}
			</Box>
		</Box>
	);
};

function map<T, U>(it: Iterable<T>, cb: (item: T) => U) {
	const result: U[] = [];
	for (const item of it) result.push(cb(item));
	return result;
}

function formatJSON(data: string) {
	try {
		return JSON.stringify(JSON.parse(data), null, ' ');
	} catch {
		return data;
	}
}
