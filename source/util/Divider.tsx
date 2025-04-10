import { Box } from "ink";
import React from "react";

type DividerProps = React.PropsWithChildren<{}>;

const Divider: React.FC<DividerProps> = ({ children }) => {
	if (!children)
		return (
			<Box
				borderStyle="single"
				borderTop={false}
				borderLeft={false}
				borderRight={false}
				flexGrow={1}
				overflow="hidden"
			/>
		);

	return (
		<Box flexDirection="row" flexWrap="nowrap" overflow="hidden">
			<Box
				borderStyle="single"
				borderTop={false}
				borderLeft={false}
				borderRight={false}
				flexGrow={1}
			/>
			{children}
			<Box
				borderStyle="single"
				borderTop={false}
				borderLeft={false}
				borderRight={false}
				flexGrow={1}
			/>
		</Box>
	);
};

export default Divider;
