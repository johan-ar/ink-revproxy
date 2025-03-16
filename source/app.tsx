import { Box } from "ink";
import _ from "lodash";
import os from "node:os";
import React from "react";
import { FetchInspector } from "./FetchInspector.js";
import { history, Route, Router } from "./Router.js";
import { appStore } from "./store.js";
import Text from "./Text.js";
import Shortcut, { useInputContext, useShortcut } from "./util/Shortcut.js";
import { unmount } from "./util/unmountEmitter.js";
import { derived, useReadable } from "./util/writable.js";
import WebSocketInspector from "./WebSocketInspector.js";

const websocketPath = "/inspector/websocket";
const fetchPath = "/inspector/fetch";

export default function App() {
	useInputContext();

	useShortcut("i", () => {
		history.match(fetchPath)
			? history.go(websocketPath)
			: history.go(fetchPath);
	});
	useShortcut([{ ctrl: true }, "c"], unmount.dispatch);
	useShortcut("q", unmount.dispatch);

	return (
		<>
			<Router
				initialPath={appStore.get().router.currentPath || fetchPath}
				onChange={(path) =>
					appStore.update(($store) => {
						$store.router.currentPath = path;
					})
				}
			>
				<Route path={fetchPath}>
					<FetchInspector />
				</Route>
				<Route path={websocketPath}>
					<WebSocketInspector />
				</Route>
			</Router>
			<Box gap={1}>
				<Text>
					Listen
					<Text ml={1} color="cyanBright" underline>
						https://{os.hostname()}
					</Text>
				</Text>
				<EnvDisplay />
				<Text>{history.location().path}</Text>
			</Box>
		</>
	);
}

const envSelected = derived(appStore, "env.selected");

const EnvDisplay = () => {
	const env = useReadable(envSelected);

	return (
		<Shortcut sequence="e" onPressed={appStore.selectNextEnv}>
			Env:
			<Text color="blueBright">{_.capitalize(env)}</Text>
		</Shortcut>
	);
};
