import {Prettify} from './types.js';

export type Extendable<T> = T & {
	/**
	 * @param plugin a plugin factory function
	 * @returns `T & U`
	 */
	extend: <U extends Record<string | number | symbol, any>>(
		plugin: (self: T) => U,
	) => Extendable<Prettify<T & U>>;
};

export function extendImpl(target: any, plugin: (self: any) => any): any {
	const extension = plugin(target) ?? {};
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
