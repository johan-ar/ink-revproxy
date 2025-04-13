#!/usr/bin/env node
import { render } from "ink";
import meow from "meow";
import process from "node:process";
import React from "react";
import App from "./app.js";
import proxy from "./proxy.js";
import { appStore } from "./store.js";
import "./util/arrayExtensions.js";
import clearScreen from "./util/clearScreen.js";
import { unmount } from "./util/unmountEmitter.js";

globalThis.process = process;

meow(
  `
	Usage
	  $ ink-revproxy
`,
  {
    importMeta: import.meta,
  }
);

appStore.init();
proxy.init();

const app = render(<App />, {
  exitOnCtrlC: false,
  patchConsole: false,
});

unmount.once(() => {
  app.unmount();
  app.cleanup();
  app.clear();
  clearScreen();
  process.exit(0);
});

process.on("SIGINT", () => {
  unmount.dispatch();
});
