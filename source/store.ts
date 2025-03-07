import {readFileSync} from 'node:fs';
import fs from 'node:fs/promises';
import appConfig from './config.js';
import {mergePlugin, writable} from './util/observable.js';

export type AppStore = {
	route: {
		currentPath: string;
	};
	env: {
		selected: string;
		state: {
			[env: string]: {cookie: string[]};
		};
	};
};
const initialEnv = Object.keys(appConfig.env)[0]!;

export const appStore = writable<AppStore>(
	readStore({
		route: {
			currentPath: '',
		},
		env: {
			selected: initialEnv,
			state: {},
		},
	}),
)
	.extend(mergePlugin)
	.extend(self => ({
		init() {},
		get config() {
			return appConfig;
		},
		selectedEnv() {
			const $store = self.get();
			const selected = $store.env.selected;

			return {
				selected,
				config: this.config.env[selected]!,
				state: {
					get cookie(): string[] {
						const $store = self.get();
						return $store.env.state[selected]?.cookie || [];
					},
					setCookie(cookie?: null | string | string[]) {
						if (!cookie) cookie = [];
						else if (Array.isArray(cookie)) cookie = cookie;
						else if (typeof cookie === 'string') cookie = [cookie];
						else cookie = [];

						self.merge({
							env: {
								state: {
									[selected]: {
										cookie: cookie as string[],
									},
								},
							},
						});
						return cookie;
					},
				},
			};
		},
		selectEnv(env: string) {
			self.merge({env: {selected: env}});
		},
		nextEnv() {
			const $store = self.get();
			const envKeys = Object.keys(this.config.env);
			const index = envKeys.indexOf($store.env.selected);
			const nextEnv =
				envKeys[(index + 1) % envKeys.length] || $store.env.selected;
			this.selectEnv(nextEnv);
		},
	}));

appStore.subscribe(writeStore);

function readStore(defaultValue: AppStore): AppStore {
	try {
		return JSON.parse(readFileSync(`./store.json`).toString()) || defaultValue;
	} catch {
		return defaultValue;
	}
}
async function writeStore(value: AppStore) {
	try {
		await fs.writeFile(`./store.json`, JSON.stringify(value, null, '  '));
		return value;
	} catch {
		return value;
	}
}
