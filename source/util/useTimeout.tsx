import { useMemo } from "react";

export const useTimeout = () =>
	useMemo(() => {
		let timeout: NodeJS.Timeout | undefined = undefined;

		return {
			/**
			 * Starts a new timeout with the given callback and arguments.
			 * If a timeout is already running, it will be stopped first.
			 * @param {Function} cb - the callback to call when the timeout completes
			 * @param {number} ms - the number of milliseconds to wait before calling the callback
			 * @param {...any} args - any arguments to pass to the callback
			 */
			start<Args extends any[]>(
				cb: (...args: Args) => void,
				ms: number,
				...args: Args
			) {
				clearTimeout(timeout);
				timeout = setTimeout(cb, ms, ...args);
			},
			/**
			 * Stops the currently running timeout, if any.
			 */
			stop() {
				timeout = void clearTimeout(timeout);
			},
		};
	}, []);
