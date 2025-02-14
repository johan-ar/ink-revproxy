import {Box, Text} from 'ink';
import React, {useMemo} from 'react';

type VScrollbar = {
	top: number;
	height: number;
	scrollHeight: number;
};

const Track = '▏';
const Thumb = '▌';

const VScrollbar: React.FC<VScrollbar> = ({top, height, scrollHeight}) => {
	const thumbY = Math.floor((top / scrollHeight) * height);
	const track = useMemo(() => Track.repeat(height), [height]);

	return (
		<Box width={1} position="relative" height={height}>
			<Text wrap="wrap">{track}</Text>
			<Box position="absolute" marginTop={thumbY}>
				<Text>{Thumb}</Text>
			</Box>
		</Box>
	);
}; 

export default VScrollbar;
