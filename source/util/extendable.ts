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
	const obj = plugin(target) ?? {};
	for (const key in obj) {
		if (Object.hasOwn(obj, key))
			Object.defineProperty(target, key, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: obj[key],
			});
	}
	return target;
}
