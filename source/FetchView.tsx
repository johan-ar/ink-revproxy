import { Box } from "ink";
import React, { Dispatch, SetStateAction, useMemo } from "react";
import HeadersView from "./HeadersView.js";
import Radio, { useToggle } from "./Radio.js";
import Text from "./Text.js";
import Divider from "./util/Divider.js";
import { formatJSON } from "./util/formatJSON.js";
import { Body, LogRecord } from "./util/logger.js";
import ScrollableBox, { ScrollableBoxRef } from "./util/ScrollableBox.js";
import Shortcut, { useShortcut } from "./util/Shortcut.js";
import { useRefState } from "./util/useRefState.js";
import { useReadable } from "./util/writable.js";

type FetchPreviewProps = {
	record: LogRecord;
	tab: number;
	onTabChange: Dispatch<SetStateAction<number>>;
};

const FetchPreview: React.FC<FetchPreviewProps> = ({
	record,
	tab,
	onTabChange,
}) => {
	const [showPreflight, togglePreflight] = useToggle(false);
	const hasPreflight = Boolean(record.preflight);
	const current = hasPreflight && showPreflight ? record.preflight! : record;

	useShortcut("r", () => {
		if (tab === 1) onTabChange(2);
		else onTabChange(1);
	});

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box flexDirection="row" gap={2}>
				<Shortcut
					sequence="h"
					onPressed={() => onTabChange(0)}
					active={tab === 0}
					p={1}
				>
					Headers
				</Shortcut>
				<Shortcut sequence="r" active={tab === 1} disabled p={1}>
					Response
				</Shortcut>
				<Shortcut sequence="r" active={tab === 2} disabled p={1}>
					Request
				</Shortcut>
				{hasPreflight && (
					<Radio
						checked={showPreflight}
						color={showPreflight ? "greenBright" : undefined}
					>
						<Shortcut sequence="f" p={1} onPressed={() => togglePreflight()}>
							Preflight
						</Shortcut>
					</Radio>
				)}
			</Box>
			{tab === 0 ? (
				<HeadersView record={current} />
			) : tab === 1 ? (
				<BodyPreview
					mime={current.res.getHeaders()["content-type"]?.toString() || ""}
					body={current.resBody}
					encoding={current.res.getHeaders()["content-encoding"]?.toString()}
				/>
			) : tab === 2 ? (
				<BodyPreview
					mime={current.req.headers["content-type"]}
					body={current.reqBody}
				/>
			) : null}
		</Box>
	);
};

export default FetchPreview;

export type BodyPreview = {
	encoding?: string;
	mime?: string;
	body: Body;
};

export const BodyPreview: React.FC<BodyPreview> = ({ mime, body }) => {
	let buff = useReadable(body);

	const render = useMemo(() => {
		let data: string;
		const mimeType = mime?.split(";")[0];
		switch (mimeType) {
			case "application/x-www-form-urlencoded":
				data = buff?.toString("utf-8") ?? "<empty>";
				return (
					<Box flexDirection="column">
						{map(new URLSearchParams(data), ([key, value]) => (
							<Box key={key} gap={1}>
								<Text color="greenBright" bold>
									{key}:
								</Text>
								<Text wrap="wrap">{value}</Text>
							</Box>
						))}
					</Box>
				);
			case "application/json":
				data = buff?.toString("utf-8") ?? "<empty>";
				return (
					<Box gap={1}>
						<Text wrap="wrap">{formatJSON(data)}</Text>
					</Box>
				);
			case "text/plain":
			case "text/html":
			case "text/xml":
			case "application/xml":
				data = buff?.toString("utf-8") ?? "<empty>";
				return <Text wrap="wrap">{data}</Text>;
			default:
				if (buff) 
					return (
						<Text wrap="wrap">
							data:{mimeType};base64,{buff.toString("base64")}
						</Text>
					);
				
				return "<empty>";
		}
	}, [buff, mime]);

	const ref = useRefState<ScrollableBoxRef>(null);

	return (
		<Box flexDirection="column" borderStyle="single" width="100%">
			<Box paddingX={1}>
				<Text color="whiteBright">{mime}</Text>
			</Box>
			<Divider />
			<Box paddingX={1} flexWrap="wrap" height="100%">
				<ScrollableBox
					ref={ref}
					height="100%"
					width="100%"
					upShortcut={{ upArrow: true }}
					downShortcut={{ downArrow: true }}
					leftShortcut={{ leftArrow: true }}
					rightShortcut={{ rightArrow: true }}
					innerProps={{ width: ref.current?.width }}
				>
					{render}
				</ScrollableBox>
			</Box>
		</Box>
	);
};

function map<T, U>(it: Iterable<T>, cb: (item: T) => U) {
	const result: U[] = [];
	for (const item of it) result.push(cb(item));
	return result;
}
