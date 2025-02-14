import {readFileSync} from 'node:fs';
import fs from 'node:fs/promises';
import config from './config.js';
import {writable} from './util/observable.js';

export type Store = {
	preferences: {
		envSelected: string;
	};
	runtime: {
		[env: string]: {cookie: string[]};
	};
};

const initialValue: Store = {
	preferences: {envSelected: 'production'},
	runtime: {},
};

function readStore(): Store {
	try {
		const value = JSON.parse(readFileSync(`./store.json`).toString());
		return value || initialValue;
	} catch {
		return initialValue;
	}
}

async function writeStore(value: Store) {
	try {
		await fs.writeFile(`./store.json`, JSON.stringify(value, null, '  '));
		return value;
	} catch {
		return value;
	}
}

export const runtime = writable<Store>(readStore()).extend(self => ({
	envs: config.envConfig,
	envSelected() {
		return config.envConfig[self.get().preferences.envSelected!]!;
	},
	selectEnv(env: string) {
		self.update($store => ({
			...$store,
			preferences: {...$store.preferences, envSelected: env},
		}));
	},
	nextEnv() {
		const envs = Object.keys(config.envConfig)
		const currentEnv = this.envSelected().env
		const index = envs.indexOf(currentEnv);
		const nextEnv = envs[(index + 1) % envs.length] || currentEnv;
		this.selectEnv(nextEnv)
	},
	getCookie() {
		return self.get().runtime[this.envSelected().env]?.cookie || [];
	},
	setCookie(cookie?: null | string | string[]) {
		if (!cookie) cookie = [];
		else if (Array.isArray(cookie)) cookie = cookie;
		else if (typeof cookie === 'string') cookie = [cookie];
		else cookie = [];

		self.update($store => ({
			...$store,
			runtime: {
				...$store.runtime,
				[this.envSelected().env]: {cookie: cookie as string[]},
			},
		}));
		return cookie;
	},
}));

runtime.subscribe(writeStore);
//  ^?
