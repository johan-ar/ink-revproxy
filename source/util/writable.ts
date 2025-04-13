import { nothing, produce } from "immer";
import _ from "lodash";
import { Dispatch, useSyncExternalStore } from "react";
import { Partial } from "ts-toolbelt/out/Object/Partial.js";
import {
	EmitterExtendable,
	eventEmitter,
	type Stop,
	type Subscriber,
	type Unsubscriber,
} from "./eventEmitter.js";
import { extendImpl, type Extendable } from "./extendable.js";
import { Get } from "./types.js";
export type { Stop, Subscriber, Unsubscriber };
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
	emitter: EmitterExtendable<T>;
	Type: T;
	readonly snapshot: () => T;
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

export type Updater<T> = (
	value: T,
) => T | void | undefined | (T extends undefined ? typeof nothing : never);

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
	let dirty = false;

	const emitter = eventEmitter<T>(() => {
		dirty = true;
		return start?.(update, get);
	});

	const get = (): T => {
		let value: any;
		subscribe(($value) => (value = $value))();
		return value;
	};

	const update = (fn: Updater<T>) => {
		const nextValue = produce(currentValue, fn);
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
		new Promise<T>((resolve) => {
			subscribe((value, unsubscribe) => {
				if (predicate(value)) {
					unsubscribe();
					resolve(value);
				}
			});
		});
	const snapshot = () => {
		return dirty ? currentValue : get();
	};

	return {
		extend(plugin) {
			return extendImpl(this, plugin);
		},
		subscribe,
		get,
		snapshot,
		when,
		update,
		emitter,
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

/**
 * Creates a derived observable that extracts a value from a path of the source observable
 * @param source source observable
 * @param path path to extract the value from
 * @returns a readonly observable with the extracted value
 */
export function derived<T, Path extends string | string[] | undefined>(
	source: Readable<T>,
	path: Path,
): ReadableExtendable<Get<T, Path>>;

/**
 * Creates a derived observable that computes a new value from the source observable
 * @param source source observable
 * @param transform function that takes the source value and the previous derived value
 * and returns the new derived value
 * @param initialValue initial derived value
 * @returns a readonly observable
 */
export function derived<T, U>(
	source: Readable<T>,
	transform: (source: T, derived: U) => U,
	initialValue: U,
): ReadableExtendable<U>;

export function derived<T, U>(
	source: Readable<T>,
	transform: (source: T, derived: U | undefined) => U,
): ReadableExtendable<U>;

export function derived(
	observable: Readable<any>,
	transform:
		| undefined
		| string
		| string[]
		| ((source: any, derived: any) => any),
	initialValue?: any,
) {
	let transformFn;
	if (typeof transform === "function") {
		transformFn = transform;
	} else if (Array.isArray(transform)) {
		transformFn = getPropFn(transform);
	} else if (typeof transform === "string") {
		transformFn = getPropFn(splitPathStr(transform));
	} else if (transform === undefined) {
		transformFn = _.identity;
	} else {
		throw new Error("Unknown transform type", { cause: transform });
	}
	return readable(initialValue, (update) =>
		observable.subscribe((source) =>
			update((derived) => {
				return transformFn(source, derived);
			}),
		),
	);
}

function splitPathStr(path: string): string[] {
	return path.split(/(?<!\\)[.]/).map((key) => key.replaceAll("\\.", "."));
}

function getPropFn<P extends string[]>(path: P) {
	return <T>(source: T): Get<T, P> => {
		try {
			let value: any = source;
			for (const key of path) value = value[key];
			return value;
		} catch (err) {
			throw new Error(`Error getting ${path.join(".")}`, { cause: err });
		}
	};
}

export type AsReadable<T> =
	T extends Readable<infer U>
		? ReadableExtendable<U> & Omit<T, keyof Writable<T>>
		: never;

/**
 * Converts a writable to a readable observable type.
 * Useful for ensuring a store is treated as a readonly observable.
 *
 * @param writable The store to be converted to a readable observable.
 * @returns The store as a readable observable type.
 */
export function asReadable<T>(writable: T) {
	return writable as AsReadable<T>;
}
export function useReadable<T>(observable: Readable<T>) {
	return useSyncExternalStore(observable.subscribe, observable.snapshot);
}

type UseWritableResult<T> = [T, Dispatch<Updater<T>>];

export function useWritable<T>(observable: Writable<T>): UseWritableResult<T> {
	const state = useSyncExternalStore(observable.subscribe, observable.snapshot);
	return [state, observable.update];
}

export namespace Plugin {
	export function merge<T extends object>(observable: Writable<T>) {
		return {
			merge(partial: Partial<T, "deep">) {
				observable.update(($store) => _.merge($store, partial));
			},
		};
	}

	export function set<T extends Writable<any>, Type = T["Type"]>(
		observable: T,
	) {
		return {
			set(value: Type | Updater<Type>) {
				if (typeof value === "function")
					observable.update(value as Updater<Type>);
				else observable.update(() => (value === undefined ? nothing : value));
			},
		};
	}

	export function writableHook<T>(observable: Writable<T>) {
		return {
			useWritable: () => useWritable(observable),
		};
	}

	export function readableHook<T>(observable: Writable<T>) {
		return {
			useReadable: () => useReadable(observable),
		};
	}
}
