import {Box} from 'ink';
import Spinner from 'ink-spinner';
import _ from 'lodash';
import mime from 'mime';
import React, {useEffect, useMemo, useState} from 'react';
import FetchPreview from './FetchView.js';
import {browserLogger} from './proxy.js';
import Shortcut from './Shortcut.js';
import StatusCode from './StatusCode.js';
import {runtime} from './store.js';
import Text, {TextProps} from './Text.js';
import Divider from './util/Divider.js';
import {useShortcut} from './util/keycode.js';
import {LogRecord} from './util/logger.js';
import {useObservable} from './util/observable.js';
import useResponsePending from './util/useResponsePending.js';
import useStdoutDimensions from './util/useStdoutDimensions.js';
import Menu, {VirtualListItemComponentProps} from './VirtualList.js';

export const FetchInspector = () => {
	const [cols, rows] = useStdoutDimensions();
	const log = useObservable(browserLogger);
	const [selected, setSelected] = useState(log[0]);
	const [followOutputActive, setFollowOutputActive] = useState(true);
	const envShortcut = useShortcut('e', () => runtime.nextEnv());
	// const r = useResponsive();

	const items = useMemo(() => {
		return log
			.map(item => ({
				key: item.key,
				value: item,
			}))
			.reverse();
	}, [log.length]);

	useEffect(() => {
		if (!selected) {
			setSelected(items[0]?.value);
		}
	}, [items]);

	return (
		<Box flexDirection="column" justifyContent="space-between" height={rows}>
			<Box
				flexDirection="row"
				justifyContent="space-between"
				width={cols}
				height={rows - 1}
			>
				<Menu
					rows={rows - 2}
					items={items}
					ItemComponent={MenuItem}
					next="t"
					prev="n"
					width={50}
					onChange={item => setSelected(item?.value)}
					followOutput={{
						top: true,
						toggle: 'f',
						active: followOutputActive,
						setActive: setFollowOutputActive,
					}}
				/>
				<Box width={cols - 52}>
					{selected && <FetchPreview record={selected} />}
				</Box>
			</Box>
			<Box gap={1}>
				<Text>
					Listen
					<Text ml={1} color="cyanBright" underline>
						http://localhost https://localhost
					</Text>
				</Text>
				<Shortcut {...envShortcut}>
					Env:
					<Text color="blueBright">
						{_.capitalize(runtime.envSelected().env)}
					</Text>
				</Shortcut>
			</Box>
		</Box>
	);
};

const MenuItem: React.FC<VirtualListItemComponentProps<LogRecord>> = ({
	item,
	selected,
	index,
}) => {
	return <Item value={item.value} index={index} isSelected={selected} />;
};

type ItemProps = {
	isSelected: boolean;
	value: LogRecord;
	index: number;
};

const Item: React.FC<ItemProps> = ({value, isSelected}) => {
	const isPending = useResponsePending(value);

	const style: TextProps = isSelected
		? {
				color: 'blackBright',
				bgColor: 'whiteBright',
				bold: true,
				wrap: 'truncate',
		  }
		: {};

	if (!value) return <Divider />;

	const contentType = value.res.getHeaders()['content-type']?.toString();

	return (
		<Box flexWrap="nowrap" overflowX="hidden" width="100%">
			<Box flexWrap="nowrap" width={4} flexShrink={0} overflowX="hidden">
				{isPending ? (
					<Text {...style} color="greenBright" pl={1} pr={2}>
						<Spinner type="triangle" />
					</Text>
				) : (
					<StatusCode {...style} pl={1} code={value.res.statusCode} />
				)}
			</Box>
			<Box
				flexWrap="nowrap"
				flexShrink={0}
				width={value.req.method.length + 1}
				overflowX="hidden"
			>
				<Text {...style} wrap="truncate-end" pl={1}>
					{value.req.method}
				</Text>
			</Box>
			<Box flexWrap="nowrap" flexShrink={0} overflowX="hidden">
				<Text {...style} pl={1} pr={1}>
					{`${contentType ? mime.getExtension(contentType) : ''}`.padEnd(7)}
				</Text>
			</Box>
			<Box flexShrink={1} flexGrow={1} overflowX="hidden">
				<Text {...style} pl={2} pr={1} wrap="truncate-start">
					{decodeURIComponent(value.url)}
				</Text>
				<Text color={style.bgColor}>{isSelected ? '\ue0b0' : ' '}</Text>
			</Box>
		</Box>
	);
};
