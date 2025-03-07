import React from 'react';
import {FetchInspector} from './FetchInspector.js';
import {Route, Router, useHistory} from './Router.js';
import {appStore} from './store.js';
import {useShortcut} from './util/Shortcut.js';
import {unmount} from './util/unmountEmitter.js';
import WebSocketInspector from './WebSocketInspector.js';

const websocketPath = '/inspector/websocket';
const fetchPath = '/inspector/fetch';

export default function App() {
	const history = useHistory();

	useShortcut('-', () => {
		history.match(fetchPath)
			? history.go(websocketPath)
			: history.go(fetchPath);
	});
	useShortcut([{ctrl: true}, 'c'], () => unmount.dispatch());
	useShortcut('q', () => unmount.dispatch());

	return (
		<>
			<Router
				initialPath={appStore.get().route.currentPath || fetchPath}
				onChange={path => appStore.merge({route: {currentPath: path}})}
			>
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
