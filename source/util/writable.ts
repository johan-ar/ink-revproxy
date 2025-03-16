import { nothing, produce } from "immer";
import _, { identity } from "lodash";
import { Dispatch, useCallback, useEffect, useState } from "react";
import { Partial } from "ts-toolbelt/out/Object/Partial.js";
import {
	EmitterExtendable,
	eventEmitter,
	type Stop,
	type Subscriber,
	type Unsubscriber,
} from "./eventEmitter.js";
import { extendImpl, type Extendable } from "./extendable.js";
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
	readonly _value: T;
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

	const emitter = eventEmitter<T>(() => start?.(update, get));

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

	return {
		extend(plugin) {
			return extendImpl(this, plugin);
		},
		get,
		update,
		subscribe,
		when,
		emitter,
		Type: true as T,
		get _value() {
			return currentValue;
		},
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
		transformFn = identity;
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
	return <T>(source: T): Internal.Get<T, P> => {
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
	const [state, setState] = useState<T>(observable.get);
	useEffect(() => observable.subscribe(setState), []);
	return state;
}

type UseWritableResult<T> = [T, Dispatch<Updater<T> | T>];

export function useWritable<T>(observable: Writable<T>): UseWritableResult<T> {
	const state = useReadable(observable);
	const setState: Dispatch<Updater<T> | T> = useCallback(
		(nextState) => {
			if (typeof nextState === "function")
				return observable.update(nextState as Updater<T>);

			observable.update(() => nextState as T);
		},
		[observable],
	);
	return [state, setState];
}

export function mergePlugin<T extends object>(observable: Writable<T>) {
	return {
		merge(partial: Partial<T, "deep">) {
			observable.update(($store) => _.merge($store, partial));
		},
	};
}

export function setPlugin<T>(observable: Writable<T>) {
	return {
		set(value: T) {
			observable.update(() => (value === undefined ? (nothing as T) : value));
		},
	};
}

export function writableHookPlugin<T>(observable: Writable<T>) {
	return {
		useWritable: () => useWritable(observable),
	};
}

export function readableHookPlugin<T>(observable: Writable<T>) {
	return {
		useReadable: () => useReadable(observable),
	};
}

export type Get<
	T,
	Path extends
		| string
		| (string | number | bigint | symbol)[]
		| undefined
		| null
		| void = void,
> = Internal.Get<T, Path>;

export namespace Internal {

	export type Get<T, Path> =
		/***/
		Path extends void | []
			? T
			: Path extends any[]
				? Get_<T, Path>
				: Path extends string
					? SplitPath<Path> extends infer Keys
						? Get_<T, Keys>
						: never
					: never;

	type Get_<T, Path> =
		/***/
		Path extends [infer Key, ...infer Rest]
			? ShallowGet<T, Key> extends infer Value
				? Rest extends []
					? Value
					: Get_<Value, Rest>
				: never
			: never;

	export type ShallowGet<T, Key> =
		/***/
		FixKey<T, Key> extends infer FixedKey
			? FixedKey extends keyof T
				? T[FixedKey]
				: never
			: never;

	type FixKey<T, Key> =
		/***/
		Key extends keyof T
			? Key
			: AsString<Key> extends infer KeyStr extends string
				? { [K in keyof T as AsString<K>]: K } extends infer KeyRecord
					? KeyStr extends keyof KeyRecord
						? KeyRecord[KeyStr]
						: never
					: never
				: never;

	export type SplitPath<P, List extends any[] = []> =
		FirstKey<P> extends infer Tuple
			? Tuple extends [infer Key]
				? [...List, Key]
				: Tuple extends [infer Key, infer Rest]
					? SplitPath<Rest, [...List, Key]>
					: never
			: never;


	export type FirstKey<Path> = string extends Path
		? [Path]
		: Path extends string
			? FirstKey_<Path, "">
			: never;

	export type FirstKey_<Path extends string, Key extends string> =
		/***/
		Path extends ""
			? [Key]
			: StartsWith<Path, "\\."> extends 1
				? FirstKey_<Tail<Tail<Path>>, `${Key}.`>
				: StartsWith<Path, "."> extends 1
					? [Key, Tail<Path>]
					: FirstKey_<Tail<Path>, `${Key}${Head<Path>}`>;



	export type StartsWith<
		S extends string,
		Start extends string,
	> = S extends `${Start}${string}` ? 1 : 0;

	export type Head<S> = S extends `${infer Head}${string}` ? Head : never;

	export type Tail<S> = S extends `${string}${infer Tail}` ? Tail : never;

	export type AsString<T> = T extends string | number | bigint ? `${T}` : never;

	type T1 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, "a.b">;
	//   ^?
	type T2 = Get<
		{ a: { b: { [Symbol.iterator]: 1 } } },
		["a", "b", typeof Symbol.iterator]
	>;
	//   ^?
	type T3 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, null>;
	//   ^?
	type T4 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, undefined>;
	//   ^?
	type T5 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, void>;
	//   ^?
}
