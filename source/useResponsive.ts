import {useCallback, useMemo} from 'react';
import useStdoutDimensions from './util/useStdoutDimensions.js';

const col = 30;

const min_sm = col * 4;
const min_md = col * 6.5;
const min_lg = col * 7.5;

const sm = 'sm';
const md = 'md';
const lg = 'lg';
const any = '_';
const colon = ':';
const percent = '%';

const useResponsive = () => {
	const [cols] = useStdoutDimensions();

	const breakpoint = useMemo(() => {
		if (cols > min_lg) return lg;
		if (cols > min_md) return md;
		if (cols > min_sm) return sm;
		return any;
	}, [cols]);

	const r = useCallback(
		(template: TemplateStringsArray, ...substitutions: (string | number)[]) => {
			const input = String.raw(template, ...substitutions);

			const state: State = {
				sm: undefined,
				md: undefined,
				lg: undefined,
				_: undefined,
				col: 0,
			};

			while (state.col < input.length) {
				parse(input, state);
				if (state[breakpoint] !== undefined) {
					return state[breakpoint];
				}
			}
			if (breakpoint === lg) {
				return state.md || state.sm || state._;
			}
			if (breakpoint === md) {
				return state.sm || state._;
			}
			return state._;
		},
		[cols, breakpoint],
	);

	return r;
};

export default useResponsive;

export type State = {
	sm?: string;
	md?: string;
	lg?: string;
	_?: string;
	col: number;
} & {[key: string]: any};

function parse(input: string, state: State) {
	let breakpoint = '';
	let value = '';
	let col = state.col;

	while (input[col] === ' ') {
		col += 1;
	}

	breakpoint = input.slice(col, col + 2);
	switch (breakpoint) {
		case sm:
		case md:
		case lg:
			col += 2;
			if (input[col] !== colon) {
				throw new Error(`Expect a ':' col:${col} '${input}'`);
			}

			col += 1;
			break;

		default:
			breakpoint = any;
	}

	while (true) {
		if (isDigit(input[col])) {
			value += input[col];
			col += 1;
		} else {
			break;
		}
	}

	if (value === '') {
		throw new Error(`Expect a 'number' col:${col} '${input}'`);
	}

	if (input[col] === percent) {
		value = input[col]!;
		col += 1;
	}

	state[breakpoint] = value;
	state.col = col;
}

function isNil(val: unknown): val is undefined | null {
	return val === undefined || val === null;
}

function isDigit(val: string | undefined): val is string {
	return !isNil(val) && val >= '0' && val <= '9';
}
