import { Prettify } from "./types.js";

export type Extendable<T> = {
	/**
	 * @param plugin a plugin factory function
	 * @returns `T & U`
	 */
	extend<U extends Record<string | number | symbol, any>>(
		plugin: ((self: T) => U) | U,
	): Extendable<Prettify<U & T>>;
} & T;

export function extendImpl(target: any, plugin: any): any {
	const extension =
		(typeof plugin === "function" ? plugin(target) : plugin) ?? {};

	for (const key in extension)
		if (Object.hasOwn(extension, key))
			Object.defineProperty(target, key, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: extension[key],
			});

	return target;
}
