import {Box} from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import StatusCode from './StatusCode.js';
import Text from './Text.js';
import Divider from './util/Divider.js';
import {LogRecord} from './util/logger.js';
import useResponsePending from './util/useResponsePending.js';

type HeadersViewProps = {
	record: LogRecord;
};

const HeadersView: React.FC<HeadersViewProps> = ({record}) => {
	const {res, req, url} = record;
	const isPending = useResponsePending(record);

	return (
		<Box flexDirection="column" borderStyle="single" width={'100%'}>
			<Box paddingX={1} gap={1}>
				<Box width={7}>
					<Text bold>{req.method}</Text>
				</Box>
				<Text>
					https://{req.headers.host}
					{req.path} {url}
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
				<Box paddingX={1}>
					<Text bold p={1}>
						Response
					</Text>
					{isPending && (
						<Box paddingLeft={1}>
							<Text color="greenBright">
								<Spinner type="triangle" />
							</Text>
						</Box>
					)}
				</Box>
			</Divider>
			{res
				.getHeaderNames()
				.sort()
				.map((name, i) => (
					<Box key={i} marginX={1}>
						<Text color="blueBright" bold mr={1}>
							{name}:
						</Text>
						<Text>{res.getHeader(name)}</Text>
					</Box>
				))}
			<Divider>
				<Text bold p={1}>
					Request
				</Text>
			</Divider>
			{Object.entries(req.headers)
				.sort()
				.map(([name, value], i) => (
					<Box key={i} marginX={1}>
						<Text color="blueBright" bold mr={1}>
							{name}:
						</Text>
						<Text>{value}</Text>
					</Box>
				))}
		</Box>
	);
};

export default HeadersView;
