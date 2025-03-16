import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import appConfig from "./config.js";
import { writable } from "./util/writable.js";

export type AppStore = {
	router: {
		currentPath: string;
	};
	env: {
		selected: string;
		state: {
			[env: string]: { cookie?: string[] };
		};
	};
};
const initialEnv = Object.keys(appConfig.env)[0]!;

export const appStore = writable<AppStore>(
	readStore({
		router: {
			currentPath: "",
		},
		env: {
			selected: initialEnv,
			state: {},
		},
	}),
)
	.extend({
		config: appConfig,
	})
	.extend((self) => ({
		init() {},
		env: () => {
			const $store = self.get();
			const selected = $store.env.selected;

			return {
				selected,
				config: self.config.env[selected]!,
				state: {
					get cookie(): readonly string[] {
						const $store = self.get();
						return $store.env.state[selected]?.cookie || [];
					},
					set cookie(cookie: null | undefined | string | string[]) {
						if (!cookie) cookie = [];
						else if (!Array.isArray(cookie)) cookie = [cookie];

						self.update(($store) => {
							$store.env.state[selected] ??= {};
							$store.env.state[selected].cookie = cookie;
						});
					},
				},
			};
		},
		selectNextEnv: () => {
			self.update(($store) => {
				const envs = Object.keys(self.config.env);
				const index = envs.indexOf($store.env.selected);
				const nextEnv = envs[(index + 1) % envs.length] || "";
				$store.env.selected = nextEnv;
			});
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
		await fs.writeFile(`./store.json`, JSON.stringify(value, null, "  "));
		return value;
	} catch {
		return value;
	}
}
