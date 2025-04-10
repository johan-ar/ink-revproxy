export type Prettify<T> = { [key in keyof T]: T[key] } & {};

export type Get<T, Path> =
	/**/
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
	/**/
	Path extends [infer Key, ...infer Rest]
		? ShallowGet<T, Key> extends infer Value
			? Rest extends []
				? Value
				: Get_<Value, Rest>
			: never
		: never;

export type ShallowGet<T, Key> =
	/**/
	FixKey<T, Key> extends infer FixedKey
		? FixedKey extends keyof T
			? T[FixedKey]
			: never
		: never;

export type FixKey<T, Key> =
	/**/
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
	/**/
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

export type AsNumber<T> = T extends `${infer N extends number}` ? N : never;

export type AnyKey = keyof any;

/**
 * A type that maps each number as a string to an array with the result of
 * subtracting 1 and adding 1 to that number.
 *
 * Used to implement the `Sub1` and `Add1` types.
 */
type LookupTable = {
	"-10": [-11, -9];
	"-9": [-10, -8];
	"-8": [-9, -7];
	"-7": [-8, -6];
	"-6": [-7, -5];
	"-5": [-6, -4];
	"-4": [-5, -3];
	"-3": [-4, -2];
	"-2": [-3, -1];
	"-1": [-2, 0];
	"0": [-1, 1];
	"1": [0, 2];
	"2": [1, 3];
	"3": [2, 4];
	"4": [3, 5];
	"5": [4, 6];
	"6": [5, 7];
	"7": [6, 8];
	"8": [7, 9];
	"9": [8, 10];
	"10": [9, 11];
} & {
	[_: keyof any]: never;
};

export type Sub1<N> = LookupTable[AsString<N>][0];

export type Add1<N> = LookupTable[AsString<N>][1];
export type Add<L extends number, R extends number> =
	Sign<R> extends "+" ? Add_R_Positive<L, R> : Add_R_Negative<L, R>;

type Add_R_Positive<L extends number, R extends number> = R extends 0
	? L
	: Add_R_Positive<Add1<L>, Sub1<R>>;
type Add_R_Negative<L extends number, R extends number> = R extends 0
	? L
	: Add_R_Negative<Sub1<L>, Add1<R>>;

export type Sign<N extends number> =
	StartsWith<AsString<N>, "-"> extends 1 ? "-" : "+";

type T2 = Get<
	//   ^?
	{ a: { b: { [Symbol.iterator]: 1 } } },
	["a", "b", typeof Symbol.iterator, "toFixed"]
>;
type T3 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, null>;
//   ^?
type T4 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, undefined>;
//   ^?
type T5 = Get<{ a: { b: { [Symbol.iterator]: 1 } } }, void>;
//   ^?
