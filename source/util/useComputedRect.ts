import { DOMElement } from "ink";
import { useMemo } from "react";
import { useRefState } from "./useRefState.js";

export const useComputedRect = () => {
	const ref = useRefState<DOMElement>(null);
	const rect = useMemo(
		() => ({
			get width() {
				return ref.current?.yogaNode?.getComputedWidth() || 0;
			},
			get height() {
				return ref.current?.yogaNode?.getComputedHeight() || 0;
			},
			get left() {
				return ref.current?.yogaNode?.getComputedLeft() || 0;
			},
			get right() {
				return ref.current?.yogaNode?.getComputedRight() || 0;
			},
		}),
		[],
	);

	return [rect, ref] as const;
};
