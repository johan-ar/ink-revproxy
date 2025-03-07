import {Box} from 'ink';
import {gunzipSync} from 'node:zlib';
import React, {useMemo, useState} from 'react';
import Checkbox from './Checkbox.js';
import HeadersView from './HeadersView.js';
import Text from './Text.js';
import Divider from './util/Divider.js';
import {formatJSON} from './util/formatJSON.js';
import {LogRecord} from './util/logger.js';
import {useObservable} from './util/observable.js';
import Shortcut, {useShortcut} from './util/Shortcut.js';

type FetchPreviewProps = {
	record: LogRecord;
};

const FetchPreview: React.FC<FetchPreviewProps> = ({record}) => {
	const [showPreview, setShowPreview] = useState(true);
	useShortcut(' ', () => setShowPreview(value => !value));

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

	if (showPreview)
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
							<Shortcut sequence="p" ml={1}>
								Preflight
							</Shortcut>
						</Checkbox>
					)}
				</Box>
				{(() => {
					switch (selected) {
						case 0:
							return <HeadersView record={current} />;
						case 1:
							return (
								<BodyPreview
									mime={
										current.res.getHeaders()['content-type']?.toString() || ''
									}
									data={resBody}
									encoding={current.res
										.getHeaders()
										['content-encoding']?.toString()}
								/>
							);
						case 2:
							return (
								<BodyPreview
									mime={current.req.headers['content-type']}
									data={reqBody}
								/>
							);
						default:
							return null;
					}
				})()}
			</Box>
		);

	return null;
};

export default FetchPreview;

export type BodyPreview = {
	encoding?: string;
	mime?: string;
	data: string;
};

export const BodyPreview: React.FC<BodyPreview> = ({mime, data, encoding}) => {
	if (encoding?.startsWith('gzip')) {
		data = gunzipSync(data).toString('utf-8');
	}

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
			case 'text/plain':
				return <Text wrap="truncate">{data}</Text>;
			case 'text/html':
			case 'text/xml':
			case 'application/xml':
				return <Text wrap="truncate">{data}</Text>;
			default:
				return <Text wrap="truncate">Binary data</Text>;
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
