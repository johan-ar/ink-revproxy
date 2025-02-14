#!/usr/bin/env node
import {render} from 'ink';
import meow from 'meow';
import process from 'node:process';
import React from 'react';
import App from './app.js';
import './util/arrayExtensions.js';
import clearOutput from './util/clearOutput.js';

globalThis.process = process;

meow(
	`
	Usage
	  $ ink-revproxy
`,
	{
		importMeta: import.meta,
	},
);

const app = render(<App />, {exitOnCtrlC: true});

Object.defineProperty(globalThis, '$app', {
	value: app,
	enumerable: true,
	configurable: true,
});

declare global {
	var $app: typeof app;
}

process.on('SIGINT', () => {
	app.unmount();
	app.cleanup();
	app.clear();

	clearOutput().on('exit', () => process.exit(0));
});
