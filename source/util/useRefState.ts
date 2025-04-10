import { RefObject, useMemo, useRef } from "react";
import useRerender from "./useRerender.js";

export function useRefState<T>(initialValue: T): RefObject<T>;
export function useRefState<T>(initialValue: T | null): RefObject<T | null>;
export function useRefState<T>(
	initialValue: T | undefined,
): RefObject<T | undefined>;

export function useRefState(initialValue: any) {
	const rerender = useRerender();
	const ref = useRef(initialValue);
	const refReactive = useMemo(
		() => ({
			get current() {
				return ref.current;
			},
			set current(value) {
				ref.current = value;
				rerender();
			},
		}),
		[],
	);

	return refReactive;
}
