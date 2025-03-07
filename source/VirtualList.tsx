import {Box, BoxProps} from 'ink';
import React, {
	Dispatch,
	SetStateAction,
	useEffect,
	useMemo,
	useState,
} from 'react';
import noop from './util/noop.js';
import Shortcut, {useShortcut} from './util/Shortcut.js';
import {ShortcutSequence} from './util/shortcutDefinitions.js';
import VScrollbar from './VScrollbar.js';

export type VirtualListItem<T = any> = {
	key: string;
	value: T;
	noSelectable?: boolean;
};

export type VirtualListItemComponentProps<T> = {
	item: VirtualListItem<T>;
	index: number;
	selected: boolean;
};

export type MenuProps<T> = {
	onChange: (item?: VirtualListItem<T>) => void;
	items: VirtualListItem<T>[];
	ItemComponent: React.FC<VirtualListItemComponentProps<T>>;
	rows: number;
	next: ShortcutSequence | string;
	prev: ShortcutSequence | string;
	followOutput?: {
		active?: boolean;
		setActive?: Dispatch<SetStateAction<boolean>>;
		top?: boolean;
		bottom?: boolean;
		toggle?: ShortcutSequence | string;
	};
	footer?: React.ReactNode;
} & BoxProps;

const Menu = <T,>({
	items: items_,
	onChange,
	ItemComponent,
	next,
	prev,
	rows,
	followOutput = {setActive: noop, toggle: 'f'},
	footer,
	...props
}: MenuProps<T>) => {
	const [current, setCurrent] = useState<{
		lastIndex: number;
		item?: VirtualListItem<T>;
	}>({lastIndex: -1});

	if (followOutput.active) {
		if (followOutput.top) {
			current.lastIndex = 0;
			current.item = items_[0];
		} else if (followOutput.bottom) {
			current.lastIndex = items_.length - 1;
			current.item = items_.at(-1);
		}
	}

	useEffect(() => {
		onChange(current.item);
	}, [current.item]);

	const items = useMemo(() => {
		const {item, lastIndex} = current;
		if (!item) return items_;

		const currentIndex = fastIndexOf(items_, item, lastIndex);
		if (currentIndex !== -1) return items_;

		return items_.concat(item);
	}, [current.item, items_]);

	const window = useMemo(() => {
		let index = current.item
			? fastIndexOf(items, current.item, current.lastIndex)
			: 0;
		let start = index - rows / 2;
		let end = index + rows / 2;

		if (end > items.length) {
			start = start - (end - items.length);
			end = items.length;
		}

		if (start < 0) {
			end = end - start;
			start = 0;
		}

		return {start, currentIndex: index, items: items.slice(start, end)};
	}, [current.item, items, rows]);

	const nextShortcut = useShortcut(next, () => {
		setCurrent(current => moveCurrent(items, current, +1));
		followOutput.setActive?.(false);
	});
	const prevShortcut = useShortcut(prev, () => {
		setCurrent(current => moveCurrent(items, current, -1));
		followOutput.setActive?.(false);
	});
	const followOutputShortcut = useShortcut(followOutput.toggle!, () => {
		followOutput.setActive?.(true);
	});

	return (
		<Box flexDirection="column" {...props} height={rows + 1}>
			<Box flexWrap="nowrap" width="100%">
				<VScrollbar
					height={Math.min(rows, items.length)}
					top={window.currentIndex}
					scrollHeight={items.length}
				/>
				<Box flexDirection="column" flexWrap="wrap" flexGrow={1} height={rows}>
					{window.items.map((item, i) => (
						<ItemComponent
							key={item.key}
							item={item}
							index={window.start + i}
							selected={item.key === current.item?.key}
						/>
					))}
				</Box>
			</Box>
			<Box gap={2} width="100%">
				<Shortcut {...nextShortcut}>↓</Shortcut>
				<Shortcut {...prevShortcut}>↑</Shortcut>
				<Shortcut {...followOutputShortcut} pressed={followOutput.active}>
					Follow Output
				</Shortcut>
				{footer}
			</Box>
		</Box>
	);
};

export default Menu;

function moveCurrent<T>(
	items: VirtualListItem<T>[],
	current: {item?: VirtualListItem<T>; lastIndex: number},
	inc: number,
) {
	current = fixCurrent(items, current);
	current.lastIndex = (current.lastIndex + inc) % items.length;

	if (current.lastIndex < 0) {
		current.lastIndex = items.length - 1;
	}
	current.item = items[current.lastIndex];

	if (items[current.lastIndex]?.noSelectable) {
		return moveCurrent(items, current, inc);
	}

	return current;
}

function fixCurrent<T>(
	items: VirtualListItem<T>[],
	current: {lastIndex: number; item?: VirtualListItem<T>},
) {
	let {lastIndex, item} = current;
	if (!item) return {lastIndex: -1};

	lastIndex = fastIndexOf(items, item, lastIndex);

	if (lastIndex === -1) return {lastIndex: -1};

	return {lastIndex, item: items[lastIndex]};
}

function fastIndexOf<T extends {key: string}>(
	array: T[],
	item: T,
	hintIndex: number,
) {
	if (hintIndex === -1) hintIndex = array.length / 2;
	const {key} = item;

	for (let i = 0; i < Math.max(hintIndex, array.length - hintIndex); i++) {
		if (key === array[hintIndex + i]?.key) {
			return hintIndex + i;
		} else if (key === array[hintIndex - i]?.key) {
			return hintIndex - i;
		}
	}

	return -1;
}
