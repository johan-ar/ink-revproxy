import {Box, Text} from 'ink';
import React, {useMemo} from 'react';

type VScrollbar = {
	top: number;
	height: number;
	scrollHeight: number;
	style?: {
		track: string;
		thumb: string;
	};
};

const Track = '▏';
const Thumb = '▌';

const VScrollbar: React.FC<VScrollbar> = ({
	top,
	height,
	scrollHeight,
	style = {track: Track, thumb: Thumb},
}) => {
	const thumbY = Math.floor((top / scrollHeight) * height);
	const track = useMemo(() => style.track.repeat(height), [height]);

	return (
		<Box width={1} position="relative" height={height}>
			<Text wrap="wrap">{track}</Text>
			<Box position="absolute" marginTop={thumbY}>
				<Text>{style.thumb}</Text>
			</Box>
		</Box>
	);
};

export default VScrollbar;
