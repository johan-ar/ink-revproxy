import React from 'react';
import {FetchInspector} from './FetchInspecton.js';
import {Route, Router, useHistory} from './Router.js';
import {runtime} from './store.js';
import {useShortcut} from './util/keycode.js';
import {useObservable} from './util/observable.js';
import WebSocketInspector from './WebSocketInspector.js';

const websocketPath = '/inspector/websocket';
const fetchPath = '/inspector/fetch';

export default function App() {
	useObservable(runtime);
	const history = useHistory();

	useShortcut('-', () => {
		history.match(fetchPath)
			? history.go(websocketPath)
			: history.go(fetchPath);
	});

	return (
		<>
			<Router initialPath={websocketPath}>
				<Route path={fetchPath}>
					<FetchInspector />
				</Route>
				<Route path={websocketPath}>
					<WebSocketInspector />
				</Route>
			</Router>
		</>
	);
}
