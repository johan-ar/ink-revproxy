import { deepEqual } from "fast-equals";
import _ from "lodash";
import { useRef } from "react";

/**
 * Like useMemo, but automatically memoizes the result of `transform` function.
 * @param value the value that changes
 * @param transform a function that transforms the value into the desired output
 * @returns the transformed value, memoized
 */
export function useMemoProp<T, U = T>(
	value: T,
	transform: (value: T) => U = _.identity,
): U {
	const next = transform(value);
	const ref = useRef<U>(next);
	if (!deepEqual(ref.current, next)) ref.current = next;

	return ref.current;
}
