import http from 'node:http';
import https from 'node:https';
import {appStore} from '../store.js';

//@ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function patch(http: any) {
	const httpRequest = http.request;

	Object.defineProperty(http, 'request', {
		writable: true,
		enumerable: true,
		value: (arg0: any, arg1: any, arg2: any) => {
			const [url, options, cb] =
				typeof arg0 === 'string' || arg0 instanceof URL
					? [arg0, arg1, arg2]
					: [undefined, arg0, arg1];

			const cookie = appStore.env().state.cookie || [];

			options.headers = {
				...options.headers,
				...(cookie.length > 0 ? {cookie} : {}),
			};

			return url ? httpRequest(url, options, cb) : httpRequest(options, cb);
		},
	});
}

patch(http);
patch(https);

export default {
	http,
	https,
};
