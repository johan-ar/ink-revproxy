import { Box } from "ink";
import Spinner from "ink-spinner";
import mime from "mime";
import React, { useEffect, useMemo, useState } from "react";
import FetchPreview from "./FetchView.js";
import Radio, { useToggle } from "./Radio.js";
import StatusCode from "./StatusCode.js";
import Text, { TextProps } from "./Text.js";
import VirtualList, { VirtualListItemComponentProps } from "./VirtualList.js";
import Divider from "./util/Divider.js";
import ErrorBoundary from "./util/ErrorBoundary.js";
import { Portal } from "./util/Portal.js";
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

	const [showPreview, togglePreview] = useToggle(true);

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
					rows={rows - 1}
					items={items}
					ItemComponent={ListItem}
					nextShortcut="t"
					prevShortcut="n"
					width={50}
					onSelectedChange={setSelected}
					followOutputAt="top"
					followOutputShortcut="f"
					followOutput={followOutput}
					onFollowOutputChange={setFollowOutput}
				/>
				<Box width={cols - 52} height={rows - 1} flexDirection="column">
					{selected && showPreview && (
						<ErrorBoundary key={selected?.key}>
							<FetchPreview record={selected} tab={tab} onTabChange={setTab} />
						</ErrorBoundary>
					)}
				</Box>
			</Box>
			<Portal id="footer" order={3}>
				<Shortcut sequence="t" pr={1}>
					↓
				</Shortcut>
				<Shortcut sequence="n" pr={1}>
					↑
				</Shortcut>
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
				<Shortcut sequence="p" onPressed={() => togglePreview()}>
					<Radio checked={showPreview} pr={1} />
					Preview
				</Shortcut>
			</Portal>
		</Box>
	);
};

const ListItem: React.FC<VirtualListItemComponentProps<LogRecord>> = ({
	item,
	selected,
}) => {
	const isPending = useResponsePending(item);

	const style: TextProps = selected
		? {
				color: "blackBright",
				backgroundColor: "whiteBright",
				bold: true,
				wrap: "truncate",
			}
		: {};

	if (!item) return <Divider />;

	const contentType = item.res.getHeaders()["content-type"]?.toString();

	return (
		<Box flexWrap="nowrap" overflowX="hidden" width="100%">
			<Box flexWrap="nowrap" width={4} flexShrink={0} overflowX="hidden">
				{isPending ? (
					<Text {...style} color="greenBright" pl={1} pr={2}>
						<Spinner type="triangle" />
					</Text>
				) : (
					<StatusCode {...style} pl={1} code={item.res.statusCode} />
				)}
			</Box>
			<Box
				flexWrap="nowrap"
				flexShrink={0}
				width={item.req.method.length + 1}
				overflowX="hidden"
			>
				<Text {...style} wrap="truncate-end" pl={1}>
					{item.req.method}
				</Text>
			</Box>
			<Box flexWrap="nowrap" flexShrink={0} overflowX="hidden">
				<Text {...style} pl={1} pr={1}>
					{`${contentType ? mime.getExtension(contentType) : ""}`.padEnd(7)}
				</Text>
			</Box>
			<Box flexShrink={1} flexGrow={1} overflowX="hidden">
				<Text {...style} pl={2} pr={2} wrap="truncate-start">
					{decodeURIComponent(item.url)}
				</Text>
				<Text color={style.backgroundColor}>{selected ? "\ue0b0" : " "}</Text>
			</Box>
		</Box>
	);
};
