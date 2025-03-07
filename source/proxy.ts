import express from 'express';
import fs from 'node:fs';
import SockjsServer from 'sockjs';
import SockjsClient from 'sockjs-client';
import appConfig from './config.js';
import {appStore} from './store.js';
import protocol from './util/http.js';
import {browserLogger, wsLogger} from './util/logger.js';
import noop from './util/noop.js';
import {StompParser} from './util/stompParser.js';
import timeout from './util/timeout.js';

const {http, https} = protocol;

export function createProxy() {
	const app = express();
	//#region http|https server creation
	let httpServer = http.createServer({}, app);
	let httpsServer = https.createServer(
		{
			key: fs.readFileSync('./source/ssl_cert/server.key'),
			cert: fs.readFileSync('./source/ssl_cert/server.crt'),
		},
		app,
	);
	httpServer
		.on('error', error => {
			console.log(error);
		})
		.listen(appConfig.server.httpPort);
	httpsServer
		.on('error', error => {
			console.log(error);
		})
		.listen(appConfig.server.httpsPort);
	const close = () => {
		httpServer.close();
		httpServer.closeAllConnections();
		httpsServer.close();
		httpsServer.closeAllConnections();
	};
	//#endregion

	//#region WEBSOCKET
	const wsBrowserServers: SockjsServer.Server[] = [];
	appStore
		.selectedEnv()
		.config.routesEntries.filter(([_, route]) => route.type === 'websocket')
		.forEach(([prefixBrowser, route]) => {
			const wsBrowserServer = SockjsServer.createServer({
				prefix: prefixBrowser,
				log: noop,
			});
			wsBrowserServers.push(wsBrowserServer);
			wsBrowserServer.installHandlers(httpServer, {prefix: prefixBrowser});
			wsBrowserServer.installHandlers(httpsServer, {prefix: prefixBrowser});
			wsBrowserServer.on('connection', wsBrowserClient => {
				const incomingParser = new StompParser();
				const outgoingParser = new StompParser();

				incomingParser.onFrame(frame => {
					wsLogger.logStompFrame({frame, incoming: true});
				});
				outgoingParser.onFrame(frame => {
					wsLogger.logStompFrame({frame, outgoing: true});
				});
				try {
					const wsBackendClient = new SockjsClient(route.url);
					wsBackendClient.onmessage = ev => {
						const message = ev.data;
						wsBrowserClient.write(message);
						incomingParser.parseChunk(message);
					};
					wsBackendClient.onclose = async ev => {
						await timeout(100);
						wsBrowserClient.close(`${ev.code}`, ev.reason);
						wsLogger.logError({
							incoming: true,
							code: `${ev.code}`,
							reason: ev.reason,
						});
					};
					wsBackendClient.onerror = ev => {
						console.log('backendClient error:', ev);
					};

					const buffer: string[] = [];

					wsBrowserClient.on('data', message => {
						if (wsBackendClient.readyState === SockjsClient.OPEN) {
							wsBackendClient.send(message);
						} else {
							buffer.push(message);
						}
					});
					// wsBrowserClient.on('close', (code: any, reason: any) => {
					// 	wsBackendClient.close(code, reason);
					// });
					wsBrowserClient.on('error', (code: any, reason: any) => {
						wsBackendClient.close(code, reason);
					});
					wsBackendClient.onopen = _ev => {
						// console.log('backend open', ev);
						wsBrowserClient.on('close', (code: any, reason: any) => {
							// console.log('browser');
							wsBackendClient.close(code, reason);
						});

						buffer
							.splice(0, buffer.length)
							.forEach(message => wsBackendClient.send(message));
					};
				} catch (error) {
					console.log(error);
				}
			});
		});
	//#endregion

	const root = appStore.selectedEnv().config.routes['/'];

	//#region HTTP
	app.all('/*', async (browserReq, browserRes) => {
		browserReq.on('error', err => {
			console.error(err);
		});
		browserRes.on('error', err => {
			console.error(err);
		});
		const [prefix, routeConfig] = appStore
			.selectedEnv()
			.config.routesEntries.findLast(([pathname]) =>
				browserReq.originalUrl.startsWith(pathname),
			) || ['/', root];

		const pathname =
			browserReq.originalUrl.replace(new RegExp(`^${prefix}`), '') || '/';
		const backendUrl = new URL(pathname, routeConfig.url);

		const log = browserLogger.logFetch(browserRes, backendUrl.toString());

		const httpClient = backendUrl.protocol === 'http:' ? http : https;

		const backendReq = httpClient
			.request(
				backendUrl,
				{
					headers: {...browserReq.headers, cache: 'no-cache'},
					method: browserReq.method,
					checkServerIdentity: () => undefined,
				},
				backendRes => {
					if ('set-cookie' in backendRes.headers) {
						appStore
							.selectedEnv()
							.state.setCookie(backendRes.headers['set-cookie']);
					}
					Object.entries(backendRes.headers).forEach(([key, value]) => {
						if (value !== undefined && value !== null)
							browserRes.setHeader(key, value);
					});
					const browserOrigin = browserReq.headers['origin'];

					browserRes.setHeader('cache-control', 'no-cache');
					browserRes.setHeader('access-control-allow-credentials', 'true');
					if (browserOrigin) {
						browserRes.setHeader('access-control-allow-origin', browserOrigin);
					}
					if (backendRes.statusCode) {
						browserRes.status(backendRes.statusCode);
					}
					if (backendRes.statusMessage) {
						browserRes.statusMessage = backendRes.statusMessage;
					}
					// const buffer = Buffer.alloc(
					// 	Number(backendRes.headers['content-length'] || 0),
					// );
					backendRes
						.on('data', chunk => {
							browserRes.write(chunk);
							// buffer.write(
							// 	chunk,
							// 	(backendRes.headers['content-encoding'] ||
							// 		'utf-8') as BufferEncoding,
							// );
							log.resBody.append(chunk);
						})
						.on('end', () => {
							// if (backendRes.headers['content-type'] === 'application/json') {
							// 	try {
							// 		routeConfig.transformResponse?.(buffer.toJSON())
							// 	} catch (e) {
							// 		console.log('transform fail', e)
							// 	}
							// }
							browserRes.end();
						})
						.on('error', () => {
							browserRes.end();
						});
				},
			)
			.setHeader('host', backendUrl.host)
			.setHeader('origin', appStore.selectedEnv().config.origin)
			.setHeader('referer', appStore.selectedEnv().config.origin)
			.setHeader('cookie', appStore.selectedEnv().state.cookie)
			.on('error', err => {
				browserRes.sendStatus(500);
				console.log(err);
			});

		browserReq
			.on('data', chunk => {
				if (!browserReq.complete) {
					backendReq.write(chunk);
					log.reqBody.append(chunk);
				}
			})
			.on('end', () => {
				backendReq.end();
			});
	});
	//#endregion

	return {
		init() {},
		app,
		wsBrowserServers,
		close,
	};
}

export default createProxy();
