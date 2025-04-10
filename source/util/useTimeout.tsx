import { useEffect, useMemo } from "react";

export type Stop = () => void;

const createTimeout = () => {
	let timer: NodeJS.Timeout | undefined;

	return {
		/**
		 * Starts a timeout that will execute the given callback after the
		 * specified delay. The callback will be invoked with the given
		 * arguments.
		 *
		 * @param {Function} cb - The callback to execute after the delay
		 * @param {number} ms - The delay to wait before executing the callback
		 * @param {...*} args - The arguments to pass to the callback
		 * @return {Stop} A function that can be used to stop the timeout
		 */
		start<Args extends any[]>(
			cb: (...args: Args) => void,
			ms: number,
			...args: Args
		): Stop {
			clearTimeout(timer);
			timer = setTimeout(cb, ms, ...args);
			return () => clearTimeout(timer);
		},
		stop() {
			clearTimeout(timer);
		},
	};
};

export const useTimeout = () => {
	const timeout = useMemo(() => {
		return createTimeout();
	}, []);
	useEffect(() => {
		return timeout.stop;
	}, []);
	return timeout;
};
