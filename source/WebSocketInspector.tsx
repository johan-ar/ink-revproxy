import {Box} from 'ink';
import React from 'react';
import Text from './Text.js';
import {wsLogger} from './util/logger.js';
import {useObservable} from './util/observable.js';
import useStdoutDimensions from './util/useStdoutDimensions.js';

type WebSocketInspectorProps = {};

const ReadyState: Record<string | number, string> = {
	0: 'Connecting',
	1: 'Open',
	2: 'Closing',
	3: 'Closed',
};

const WebSocketInspector: React.FC<WebSocketInspectorProps> = ({}) => {
	const log = useObservable(wsLogger);
	const [cols, rows] = useStdoutDimensions();

	return (
		<>
			{log.map(item => (
				<Box key={item.key} width={cols} height={rows}>
					{item.type === 'stomp/frame' ? (
						<Box gap={1}>
							<Text>{item.command}</Text>
						</Box>
					) : item.type === 'readyState' ? (
						<>
							<Text>
								{item.state} {ReadyState[item.state]}
							</Text>
						</>
					) : item.type === 'error' ? (
						<Box>
							<Text>
								{item.code}:{item.reason}
							</Text>
						</Box>
					) : item.type === 'ping' ? (
						<>
							<Text>Ping ⏺</Text>
						</>
					) : null}
				</Box>
			))}
		</>
	);
};

export default WebSocketInspector;
