import { Box } from "ink";
import Spinner from "ink-spinner";
import mime from "mime";
import React, { useEffect, useMemo, useState } from "react";
import FetchPreview from "./FetchView.js";
import StatusCode from "./StatusCode.js";
import Text, { TextProps } from "./Text.js";
import VirtualList, { VirtualListItemComponentProps } from "./VirtualList.js";
import Divider from "./util/Divider.js";
import ErrorBoundary from "./util/ErrorBoundary.js";
import Shortcut from "./util/Shortcut.js";
import { LogRecord, browserLogger } from "./util/logger.js";
import useResponsePending from "./util/useResponsePending.js";
import useStdoutDimensions from "./util/useStdoutDimensions.js";
import { useReadable } from "./util/writable.js";

export const FetchInspector = () => {
	const [cols, rows] = useStdoutDimensions();
	const log = useReadable(browserLogger);
	const [selected, setSelected] = useState<LogRecord | undefined>(log[0]);
	const [followOutput, setFollowOutput] = useState(true);
	const items = useMemo(() => log.toReversed(), [log.length]);
	useEffect(() => {
		if (!selected) {
			setSelected(items[0]);
		}
	}, [items]);

	const [tab, setTab] = useState(0);

	return (
		<Box
			flexDirection="column"
			justifyContent="space-between"
			height={rows - 1}
		>
			<Box
				flexDirection="row"
				justifyContent="space-between"
				width={cols}
				flexGrow={1}
			>
				<VirtualList
					rows={rows - 2}
					items={items}
					ItemComponent={ListItemComponent}
					nextShortcut="t"
					prevShortcut="n"
					width={50}
					onSelectedChange={setSelected}
					followOutputAt="top"
					followOutputShortcut="f"
					followOutput={followOutput}
					onFollowOutputChange={setFollowOutput}
				/>
				<Box width={cols - 52}>
					{selected && (
						<ErrorBoundary key={selected?.key}>
							<FetchPreview record={selected} tab={tab} onTabChange={setTab} />
						</ErrorBoundary>
					)}
				</Box>
			</Box>
			<Box gap={2} width="100%">
				<Shortcut sequence="t">↓</Shortcut>
				<Shortcut sequence="n">↑</Shortcut>
				<Shortcut sequence="f" active={followOutput}>
					Follow Output
				</Shortcut>
				<Shortcut
					sequence="c"
					onPressed={() => {
						browserLogger.clear();
						setSelected(undefined);
					}}
					disabled={items.length === 0}
				>
					Clear
				</Shortcut>
			</Box>
		</Box>
	);
};

const ListItemComponent: React.FC<VirtualListItemComponentProps<LogRecord>> = ({
	item,
	selected,
	index,
}) => {
	return <Item value={item} index={index} isSelected={selected} />;
};

type ItemProps = {
	isSelected: boolean;
	value: LogRecord;
	index: number;
};

const Item: React.FC<ItemProps> = ({ value, isSelected }) => {
	const isPending = useResponsePending(value);

	const style: TextProps = isSelected
		? {
				color: "blackBright",
				backgroundColor: "whiteBright",
				bold: true,
				wrap: "truncate",
			}
		: {};

	if (!value) return <Divider />;

	const contentType = value.res.getHeaders()["content-type"]?.toString();

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
					{`${contentType ? mime.getExtension(contentType) : ""}`.padEnd(7)}
				</Text>
			</Box>
			<Box flexShrink={1} flexGrow={1} overflowX="hidden">
				<Text {...style} pl={2} pr={2} wrap="truncate-start">
					{decodeURIComponent(value.url)}
				</Text>
				<Text color={style.backgroundColor}>{isSelected ? "\ue0b0" : " "}</Text>
			</Box>
		</Box>
	);
};
