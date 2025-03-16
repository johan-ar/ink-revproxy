import { Text as InkText, type TextProps as InkTextProps } from "ink";
import React from "react";

export type TextProps = InkTextProps & {
	[key in `${"p" | "m"}${"l" | "r" | ""}`]?: number;
};

const Text: React.FC<TextProps> = ({
	p = 0,
	pl,
	pr,
	m = 0,
	ml,
	mr,
	children,
	...props
}) => {
	pl ??= p;
	pr ??= p;
	ml ??= m;
	mr ??= m;

	return (
		<>
			{ml > 0 && <InkText>{sp.repeat(ml)}</InkText>}
			<InkText {...props}>
				{sp.repeat(pl)}
				{children}
				{sp.repeat(pr)}
			</InkText>
			{mr > 0 && <InkText>{sp.repeat(mr)}</InkText>}
		</>
	);
};

const sp = " ";

export default Text;
