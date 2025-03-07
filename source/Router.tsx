import React, {createContext, useContext, useEffect} from 'react';
import clearOutput from './util/clearOutput.js';
import {asReadable, useObservable, writable} from './util/observable.js';

export type Location<T = undefined> = T extends undefined
	? {path: string}
	: {path: string; state: T};

export type HistoryState = {
	current: number;
	history: [Location, ...Location[]];
};

export interface History extends ReturnType<typeof createHistory> {}

export const createHistory = () => {
	const toLocation = (location: Location<any> | string): Location<any> =>
		typeof location === 'object' ? location : {path: location};

	const history = writable<HistoryState>(
		{current: 0, history: [{path: ''}]},
		undefined,
	).extend(self => {
		const location = <T,>() => {
			const $state = self.get();
			return $state.history[$state.current]! as Location<T>;
		};

		return {
			location,
			reset(initialLocation: Location) {
				self.update($state => {
					$state.current = 0;
					$state.history = [initialLocation];
					return $state;
				});
			},
			go(location: Location<any> | string) {
				const location_ = toLocation(location);
				location_.path = location_.path.split(/[/]+/g).join('/');
				self.update($state => {
					$state.history.splice($state.current + 1, Infinity, location_);
					$state.current = $state.history.length - 1;
					return $state;
				});
			},
			back() {
				self.update($state => {
					$state.current = Math.max($state.current - 1, 0);
					return $state;
				});
			},
			forward() {
				self.update($state => {
					$state.current = Math.min(
						$state.current + 1,
						$state.history.length - 1,
					);
					return $state;
				});
			},
			match(other: Location | string) {
				const location_ = toLocation(other);
				const currentPath = location().path;
				return location_.path.startsWith(currentPath);
			},
		};
	});

	history.subscribe(() => clearOutput());

	return asReadable(history);
};

const defaultHistory: History = createHistory();
export const history = defaultHistory;

export type RouterPros = React.PropsWithChildren<{
	initialPath?: string;
	history?: History;
	onChange?: (path: string) => void;
}>;

export const Router: React.FC<RouterPros> = ({
	history = defaultHistory,
	children,
	initialPath = '/',
	onChange,
}) => {
	if (history.get().history[0].path !== initialPath) {
		history.reset({path: initialPath});
	}

	useEffect(() => {
		return history.subscribe(() => onChange?.(history.location().path));
	}, []);

	return (
		<HistoryContext.Provider value={history}>
			{children}
		</HistoryContext.Provider>
	);
};

export type RouteProps = React.PropsWithChildren<{
	path?: string | string[];
}>;

export const Route: React.FC<RouteProps> = ({children, path = ''}) => {
	const location = useHistory<null>();
	const paths = Array.isArray(path) ? path : [path];
	const matched = paths.some(path => location.match({path}));

	return <>{matched ? children : null}</>;
};

const HistoryContext = createContext(defaultHistory);

export const useHistory = <T = any,>() => {
	const history = useContext(HistoryContext);
	useObservable(history);

	return {
		...history,
		location: history.location<T>(),
	};
};
