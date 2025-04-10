import { Text as InkText, type TextProps as InkTextProps } from "ink";
import React from "react";

export type TextProps = InkTextProps & {
	[key in `p${"l" | "r" | ""}`]?: number;
};

const Text: React.FC<TextProps> = ({ p = 0, pl, pr, children, ...props }) => {
	pl ??= p;
	pr ??= p;

	return (
		<InkText {...props}>
			{sp.repeat(pl)}
			{children}
			{sp.repeat(pr)}
		</InkText>
	);
};

const sp = " ";

export default Text;
