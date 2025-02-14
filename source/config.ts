const config = {
	server: {
		httpPort: '80',
		httpsPort: '443',
	},
	envConfig: {
		development: {
			origin: 'https://devappm.b2chat.io',
			routes: {
				'/': {
					type: 'spa',
					url: 'https://mac.local:3000',
				},
				'/@default': {
					type: 'forward',
					url: 'https://devservices.b2chat.io',
				},
				'/@default/agentchatws': {
					type: 'websocket',
					url: 'https://devservices.b2chat.io/agentchatws',
				},
				'/@ecommerce': {
					type: 'forward',
					url: 'https://dev-ecommerceservices.b2chat.io',
				},
				'/@contacts': {
					type: 'forward',
					url: 'https://devcontacts.b2chat.io',
				},
			},
		},
		testing: {
			origin: 'https://testappm.b2chat.io',
			routes: {
				'/': {
					type: 'spa',
					url: 'https://mac.local:3000',
				},
				'/@default': {
					type: 'forward',
					url: 'https://testservices.b2chat.io',
				},
				'/@default/agentchatws': {
					type: 'websocket',
					url: 'https://testservices.b2chat.io/agentchatws',
				},
				'/@ecommerce': {
					type: 'forward',
					url: 'https://stg-ecommerceservices.b2chat.io',
				},
				'/@contacts': {
					type: 'forward',
					url: 'https://stgcontacts.b2chat.io',
				},
			},
		},
		testing2: {
			origin: 'https://testappm.b2chat.io',
			routes: {
				'/': {
					type: 'spa',
					url: 'https://mac.local:3000',
				},
				'/@default': {
					type: 'forward',
					url: 'https://testservices2.b2chat.io',
				},
				'/@default/agentchatws': {
					type: 'websocket',
					url: 'https://testservices2.b2chat.io/agentchatws',
				},
				'/@ecommerce': {
					type: 'forward',
					url: 'https://stg-ecommerceservices.b2chat.io',
				},
				'/@contacts': {
					type: 'forward',
					url: 'https://stgcontacts2.b2chat.io',
				},
			},
		},
		production: {
			origin: 'https://appm.b2chat.io',
			routes: {
				'/': {
					type: 'spa',
					url: 'https://mac.local:3000',
				},
				'/@default': {
					type: 'forward',
					url: 'https://services.b2chat.io',
				},
				'/@default/agentchatws': {
					type: 'websocket',
					url: 'https://services.b2chat.io/agentchatws',
				},
				'/@ecommerce': {
					type: 'forward',
					url: 'https://ecommerceservices.b2chat.io',
				},
				'/@contacts': {
					type: 'forward',
					url: 'https://contacts.b2chat.io',
				},
			},
		},
	} as any as Record<string, Env>,
};

Object.entries(config.envConfig).forEach(([env, config]) => {
	config.env = env;
	config.routesEntries = Object.entries(config.routes);
});

export default config;

export type Env = {
	env: string;
	origin: string;
	routes: {
		[pathname in string]: {
			type: 'spa' | 'forward' | 'websocket';
			url: string;
		};
	};
	routesEntries: [
		pathname: string,
		config: {
			type: 'spa' | 'forward' | 'websocket';
			url: string;
		},
	][];
};
