import { DOMElement } from "ink";
import { useRef } from "react";
export {
	EDGE_ALL,
	EDGE_BOTTOM,
	EDGE_LEFT,
	EDGE_RIGHT,
	EDGE_TOP,
} from "yoga-wasm-web";

export function useYogaNode() {
	const ref = useRef<DOMElement>(null);
	return [ref.current?.yogaNode, ref] as const;
}
