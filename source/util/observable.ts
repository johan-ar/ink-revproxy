import {createDraft, isDraftable, Objectish, produce} from 'immer';
import _ from 'lodash';
import {useEffect, useRef} from 'react';
import {Partial} from 'ts-toolbelt/out/Object/Partial.js';
import {
	eventEmitter,
	type Stop,
	type Subscriber,
	type Unsubscriber,
} from './eventEmitter.js';
import {extendImpl, type Extendable} from './extendable.js';
import useRerender from './useRerender.js';
export type {Stop, Subscriber, Unsubscriber};
// enableMapSet();

export interface Readable<T = unknown> {
	/**
	 * subscribe to value changes
	 */
	subscribe: (run: Subscriber<T>) => Unsubscriber;
	/**
	 * @returns the current store's value
	 */
	get: () => T;
	/**
	 * Wait for specific value
	 * @param predicate a condition for fulfill the promise
	 * @returns the current value
	 */
	when: (predicate: (value: T) => boolean) => Promise<T>;
	Type: T;
}
export type ReadableExtendable<T = unknown> = Extendable<Readable<T>>;

export interface Writable<T = unknown> extends Readable<T> {
	update: (fn: Updater<T>) => void;
}
export type WritableExtendable<T = unknown> = Extendable<Writable<T>>;

export type EqualFn<T> = (currentValue: T, nextValue: T) => boolean;

export const strictEquals = <T>(currentValue: T, nextValue: T) =>
	currentValue === nextValue;

/**
 * Start and Stop callback lifecycle of the `Writable` or `Readable` observable
 */
export type StartStopNotifier<T> = (
	update: (fn: Updater<T>) => void,
	get: () => T,
) => void | Stop;

export type Updater<T> = (value: T) => T;

/**
 * Creates a Observable that internally use a `eventEmitter` to store the subscriptions
 * @param initialValue
 * @param start executed just before the first subscription, it could returns a `stop`
 * callback that will be executed after the last unsubscription for cleanup purposes
 * @param equalFn by default strictEquals `===` will be use to detect when the value has changed
 * @returns a writable observable
 */
export const writable = <T>(
	initialValue: T,
	start?: StartStopNotifier<T>,
): WritableExtendable<T> => {
	let currentValue = initialValue;

	const emitter = eventEmitter<T>(() => start?.(update, get));

	const get = isDraftable(currentValue)
		? () => createDraft(currentValue as Objectish) as T
		: (): T => currentValue;

	const update = isDraftable(currentValue)
		? (fn: Updater<T>) => {
				const nextValue = produce(currentValue, fn);
				if (currentValue !== nextValue) {
					currentValue = nextValue;
					emitter(currentValue);
				}
		  }
		: (fn: Updater<T>) => {
				const nextValue = fn(currentValue);
				if (currentValue !== nextValue) {
					currentValue = nextValue;
					emitter(currentValue);
				}
		  };

	const subscribe = (run: Subscriber<T>): Unsubscriber => {
		const unsubscriber = emitter.subscribe(run);

		run(currentValue, unsubscriber);

		return unsubscriber;
	};

	const when = (predicate: (value: T) => boolean) =>
		new Promise<T>(resolve => {
			subscribe((value, unsubscribe) => {
				if (predicate(value)) {
					unsubscribe();
					resolve(value);
				}
			});
		});

	return {
		extend(plugin) {
			return extendImpl(this, plugin);
		},
		get,
		update,
		subscribe,
		when,
		Type: true as T,
	};
};

/**
 * Creates a Observable that internally use a `eventEmitter` to store the subscriptions
 * @param initialValue
 * @param start executed after the first subscription to init, it could returns a `stop`
 * callback that will be executed after the last unsubscription for cleanup purposes
 * @param equalFn by default `===` will be use to detect when the value has changed
 * @returns a readonly observable
 */
export const readable = <T>(
	initialValue: T,
	start?: StartStopNotifier<T>,
): ReadableExtendable<T> => writable(initialValue, start);

export type AsReadable<T> = T extends Writable<infer U>
	? Readable<U> & Omit<T, keyof Writable<T>>
	: never;

export const asReadable = <T>(store: T) => store as AsReadable<T>;

export const useObservable = <T extends Readable<any>>(observable: T) => {
	const ref = useRef<ReturnType<T['get']>>();
	ref.current ??= observable.get();

	const rerender = useRerender();

	useEffect(
		() =>
			observable.subscribe($value => {
				ref.current = $value;
				rerender();
			}),
		[observable],
	);

	return ref.current!;
};

export function mergePlugin<T extends object>(observable: Writable<T>) {
	return {
		merge: (partial: Partial<T, 'deep'>) =>
			observable.update($store => _.merge($store, partial)),
	};
}
