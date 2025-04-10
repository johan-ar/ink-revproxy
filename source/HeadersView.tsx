import { Box } from "ink";
import Spinner from "ink-spinner";
import React, { useMemo } from "react";
import StatusCode from "./StatusCode.js";
import Text from "./Text.js";
import Divider from "./util/Divider.js";
import { LogRecord } from "./util/logger.js";
import useResponsePending from "./util/useResponsePending.js";

type HeadersViewProps = {
	record: LogRecord;
};

const HeadersView: React.FC<HeadersViewProps> = ({ record }) => {
	const { res, req, url } = record;
	const isPending = useResponsePending(record);

	const reqHeaders = useMemo(() => {
		return Object.entries(req.headers).sort();
	}, []);

	const resHeaders = useMemo(() => {
		return res
			.getHeaderNames()
			.sort()
			.map((name) => [name, res.getHeader(name)]);
	}, [isPending]);

	return (
		<Box flexDirection="column" marginTop={1} borderLeft width="100%">
			<Box paddingX={1} gap={1}>
				<Box width={7}>
					<Text bold>{req.method}</Text>
				</Box>
				<Text>
					https://{`${req.headers.host}${req.path}`} → {url}
				</Text>
			</Box>
			<Box columnGap={1}>
				<Box marginLeft={1} minWidth={7}>
					<StatusCode code={res.statusCode} message={res.statusMessage} />
				</Box>
				<Box flexWrap="wrap">
					{Object.entries(req.query).map(([key, value]) => (
						<Box key={key} flexWrap="nowrap" marginRight={1}>
							<Text wrap="end">
								<Text bold>{key}=</Text>
								<Text color="green" wrap="wrap">
									{value?.toString()}
								</Text>
							</Text>
						</Box>
					))}
				</Box>
			</Box>

			<Divider>
				<Text p={1}>
					<Text bold>Response</Text>
					{isPending && (
						<Text pl={1} color="greenBright">
							<Spinner type="triangle" />
						</Text>
					)}
				</Text>
			</Divider>
			{resHeaders.map(([name, value], i) => (
				<Box key={i} marginX={1}>
					<Text color="blueBright" bold>
						{name}:
					</Text>
					<Text>{value}</Text>
				</Box>
			))}
			<Divider>
				<Text bold p={1}>
					Request
				</Text>
			</Divider>
			{reqHeaders.map(([name, value], i) => (
				<Box key={i} marginX={1}>
					<Text color="blueBright" bold>
						{name}:
					</Text>
					<Text>{value}</Text>
				</Box>
			))}
		</Box>
	);
};

export default HeadersView;
