import { Box } from "ink";
import _ from "lodash";
import { readFileSync } from "node:fs";
import os from "node:os";
import React from "react";
import { FetchInspector } from "./FetchInspector.js";
import { history, Route, Router } from "./Router.js";
import { appStore } from "./store.js";
import Text from "./Text.js";
import { PortalContainer } from "./util/Portal.js";
import ScrollableBox from "./util/ScrollableBox.js";
import Shortcut, { useInputContext, useShortcut } from "./util/Shortcut.js";
import { unmount } from "./util/unmountEmitter.js";
import useStdoutDimensions from "./util/useStdoutDimensions.js";
import { derived, useReadable } from "./util/writable.js";
import WebSocketInspector from "./WebSocketInspector.js";

const websocketPath = "/inspector/websocket";
const fetchPath = "/inspector/fetch";
const testPath = "/test";

const routes = [fetchPath, websocketPath, testPath];

export default function App() {
	useInputContext();

	useShortcut("i", () => {
		const i = routes.findIndex((route) => history.match(route));
		if (i === -1) history.go(routes[0]);
		else history.go(routes[(i + 1) % routes.length]);
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
				<Route path={testPath}>
					<ScrollArea />
				</Route>
				<Box gap={1} flexWrap="nowrap">
					<PortalContainer footer />
					<Box flexGrow={1} />
					<EnvDisplay />
					<Text color="cyanBright" underline>
						https://{os.hostname()}
					</Text>
				</Box>
			</Router>
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

const goku = readFileSync("./goku.txt", "utf-8");
const ScrollArea = () => {
	const [cols, rows] = useStdoutDimensions();

	return (
		<ScrollableBox height={rows - 1} width={cols}>
			<Box display="flex" flexDirection="column" width={200}>
				<Text>{goku}</Text>
			</Box>
		</ScrollableBox>
	);
};
