export type AppConfig = {
	server: {
		httpPort: string;
		httpsPort: string;
	};
	env: {
		[env: string]: EnvConfig;
	};
};

export type EnvConfig = {
	origin: string;
	routes: {
		'/': RouteConfig;
		[pathname: string]: RouteConfig;
	};
	routesEntries: [pathname: string, config: RouteConfig][];
};
type RouteConfig = {
	type: 'spa' | 'forward' | 'websocket';
	url: string;
	transformResponse?(data: any): any;
};

const appConfig = {
	server: {
		httpPort: '80',
		httpsPort: '443',
	},
	env: {
		development: {
			origin: 'https://devappm.b2chat.io',
			routes: {
				'/': {
					type: 'spa',
					url: 'https://mac.local:3000',
				},
				'@default/services/user/current': {
					type: 'forward',
					url: 'https://devservices.b2chat.io',
					transformResponse(data: any) {
						data.employer.trialRemainingDays = 0;
						data.employer.expired = 0;
						return data;
					},
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
	},
};

Object.entries(appConfig.env).forEach(([env, config]: any) => {
	config.env = env;
	config.routesEntries = Object.entries(config.routes) as any;
});

export default appConfig as unknown as AppConfig;
