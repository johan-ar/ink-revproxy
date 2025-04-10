import express from "express";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import SockjsServer from "sockjs";
import SockjsClient from "sockjs-client";
import appConfig from "./config.js";
import { appStore } from "./store.js";
import protocol from "./util/http.js";
import { browserLogger, logger, wsLogger } from "./util/logger.js";
import noop from "./util/noop.js";
import { StompParser } from "./util/stompParser.js";
import timeout from "./util/timeout.js";
import { derived } from "./util/writable.js";

const { http, https } = protocol;

export function createProxy() {
	const app = express();
	//#region http|https server creation
	let httpServer = http.createServer({}, app);
	let httpsServer = https.createServer(
		{
			key: fs.readFileSync("./source/ssl_cert/server.key"),
			cert: fs.readFileSync("./source/ssl_cert/server.crt"),
		},
		app,
	);
	httpServer
		.on("error", (error) => {
			console.log(error);
		})
		.listen(appConfig.server.httpPort);
	httpsServer
		.on("error", (error) => {
			console.log(error);
		})
		.listen(appConfig.server.httpsPort);
	//#endregion

	//#region WEBSOCKET
	let wsBrowserServers: SockjsServer.Server[] = [];
	derived(appStore, <const>["env", "selected"]).subscribe(() => {
		wsBrowserServers = [];

		appStore
			.env()
			.config.routesEntries.filter(([_, route]) => route.type === "websocket")
			.forEach(([prefixBrowser, route]) => {
				const wsBrowserServer = SockjsServer.createServer({
					prefix: prefixBrowser,
					log: noop,
				});
				wsBrowserServers.push(wsBrowserServer);
				wsBrowserServer.installHandlers(httpServer, { prefix: prefixBrowser });
				wsBrowserServer.installHandlers(httpsServer, { prefix: prefixBrowser });
				wsBrowserServer.on("connection", (wsBrowserClient) => {
					const incomingParser = new StompParser();
					const outgoingParser = new StompParser();

					incomingParser.onFrame((frame) => {
						wsLogger.logStompFrame({ frame, incoming: true });
					});
					outgoingParser.onFrame((frame) => {
						wsLogger.logStompFrame({ frame, outgoing: true });
					});
					try {
						const wsBackendClient = new SockjsClient(route.url);
						wsBackendClient.onmessage = (ev) => {
							const message = ev.data;
							wsBrowserClient.write(message);
							incomingParser.parseChunk(message);
						};
						wsBackendClient.onclose = async (ev) => {
							await timeout(100);
							wsBrowserClient.close(`${ev.code}`, ev.reason);
							wsLogger.logError({
								incoming: true,
								code: `${ev.code}`,
								reason: ev.reason,
							});
						};
						wsBackendClient.onerror = (ev) => {
							console.log("backendClient error:", ev);
						};

						const buffer: string[] = [];

						wsBrowserClient.on("data", (message) => {
							if (wsBackendClient.readyState === SockjsClient.OPEN) {
								wsBackendClient.send(message);
							} else {
								buffer.push(message);
							}
						});
						// wsBrowserClient.on('close', (code: any, reason: any) => {
						// 	wsBackendClient.close(code, reason);
						// });
						wsBrowserClient.on("error", (code: any, reason: any) => {
							wsBackendClient.close(code, reason);
						});
						wsBackendClient.onopen = (_ev) => {
							// console.log('backend open', ev);
							wsBrowserClient.on("close", (code: any, reason: any) => {
								// console.log('browser');
								wsBackendClient.close(code, reason);
							});

							buffer
								.splice(0, buffer.length)
								.forEach((message) => wsBackendClient.send(message));
						};
					} catch (error) {
						console.log(error);
					}
				});
			});
	});
	//#endregion

	const root = appStore.env().config.routes["/"];

	//#region HTTP
	app.all("/*", async (browserReq, browserRes) => {
		browserReq.on("error", (err) => {
			console.error(err);
		});
		browserRes.on("error", (err) => {
			console.error(err);
		});
		const [prefix, routeConfig] = appStore
			.env()
			.config.routesEntries.findLast(([pathname]) =>
				browserReq.originalUrl.startsWith(pathname),
			) || ["/", root];

		const pathname =
			browserReq.originalUrl.replace(new RegExp(`^${prefix}`), "") || "/";
		const backendUrl = new URL(pathname, routeConfig.url);

		const log = browserLogger.logFetch(browserRes, backendUrl.toString());

		const httpClient = backendUrl.protocol === "http:" ? http : https;

		const backendReq = httpClient
			.request(
				backendUrl,
				{
					headers: { ...browserReq.headers, cache: "no-cache" },
					method: browserReq.method,
					checkServerIdentity: () => undefined,
				},
				(backendRes) => {
					if ("set-cookie" in backendRes.headers) {
						appStore.env().state.cookie = backendRes.headers["set-cookie"];
					}
					Object.entries(backendRes.headers).forEach(([key, value]) => {
						if (value !== undefined && value !== null)
							browserRes.setHeader(key, value);
					});
					const browserOrigin = browserReq.headers["origin"];

					browserRes.setHeader("cache-control", "no-cache");
					browserRes.setHeader("access-control-allow-credentials", "true");
					if (browserOrigin) {
						browserRes.setHeader("access-control-allow-origin", browserOrigin);
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
					const contentLength = Number(
						backendRes.headers["content-length"] || 0,
					);
					const buffer = Buffer.alloc(contentLength);
					backendRes
						.on("data", (chunk: Buffer) => {
							logger.log(typeof chunk, chunk.constructor.name);
							browserRes.write(chunk);
							chunk.copy(buffer);
							// buffer.write(chunk, backendRes.readableEncoding || "utf-8");
						})
						.on("end", () => {
							browserRes.end();
							log.resBody.set(buffer);
						})
						.on("error", () => {
							browserRes.end();
						});
				},
			)
			.setHeader("host", backendUrl.host)
			.setHeader("origin", appStore.env().config.origin)
			.setHeader("referer", appStore.env().config.origin)
			.setHeader("cookie", appStore.env().state.cookie)
			.on("error", (err) => {
				browserRes.sendStatus(500);
				console.log(err);
			});

		const contentLength = Number(backendReq.getHeader("content-length") || 0);
		const buffer = Buffer.alloc(contentLength);
		browserReq
			.on("data", (chunk: Buffer) => {
				if (!browserReq.complete) {
					backendReq.write(chunk);
					chunk.copy(buffer);
				}
			})
			.on("end", () => {
				backendReq.end();
				log.reqBody.set(buffer);
			});
	});
	//#endregion

	const close = () => {
		httpServer.close();
		httpServer.closeAllConnections();
		httpsServer.close();
		httpsServer.closeAllConnections();
		wsBrowserServers = [];
	};
	return {
		init() {},
		app,
		wsBrowserServers,
		close,
	};
}

export default createProxy();
