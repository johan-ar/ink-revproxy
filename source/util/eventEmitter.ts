import {Extendable, extendImpl} from './extendable.js';

export type Subscriber<T> = (value: T, unsubscribe: Unsubscriber) => void;

export type Unsubscriber = () => void;

export interface EventEmitter<T = void> {
	/** dispatch */
	(value: T): void;
	dispatch: (value: T) => void;
	subscribe: (run: Subscriber<T>) => Unsubscriber;
	Type: T;
}

export type EventEmitterExtendable<T = unknown> = Extendable<EventEmitter<T>>;

/**
 * Start and Stop callback lifecycle of `eventEmitter`
 */
export type StartStopNotifier<T> = (
	dispatcher: (value: T) => void,
) => void | Stop;

/**
 * This will be called just after the last unsubscription for cleanup purposes
 */
export type Stop = () => void;

/**
 * Creates a minimalist EventEmitter for a single event name
 * @param start Executed after the first subscription, it could returns a `stop`
 * callback that will be executed after the last unsubscription just cleanup purposes
 */
export const eventEmitter = <T = void>(
	start?: StartStopNotifier<T>,
): EventEmitterExtendable<T> => {
	const subscribers = new Map<Subscriber<T>, Unsubscriber>();

	let stop: Stop | void;

	const subscribe = (run: Subscriber<T>): Unsubscriber => {
		const unsubscriber = () => {
			subscribers.delete(run);
			if (subscribers.size === 0) stop?.();
		};

		subscribers.set(run, unsubscriber);

		if (subscribers.size === 1) {
			stop = start?.(dispatch);
		}

		return unsubscriber;
	};

	const dispatch = (value: T) => {
		subscribers.forEach((unsubscriber, run) => run(value, unsubscriber));
	};

	const extend = (plugin: any) => extendImpl(dispatch, plugin);

	return Object.defineProperties(dispatch, {
		extend: {value: extend, enumerable: true},
		subscribe: {value: subscribe, enumerable: true},
		dispatch: {value: dispatch, enumerable: true},
	}) as EventEmitterExtendable<T>;
};
