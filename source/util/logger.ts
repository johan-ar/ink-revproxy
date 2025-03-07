import {Request, Response} from 'express';
import {Console} from 'node:console';
import fs from 'node:fs';
import {O} from 'ts-toolbelt';
import {nextKey} from './nextKey.js';
import {writable} from './observable.js';
import {IRawFrameType} from './stompParser.js';

export type LogRecord = Key & {
	type: 'fetch';
	url: string;
	req: Request;
	res: Response;
	reqBody: Body;
	resBody: Body;
	preflight?: Key & {
		type: 'fetch';
		url: string;
		req: Request;
		res: Response;
		reqBody: Body;
		resBody: Body;
	};
	[key: string]: any;
};

type Body = ReturnType<typeof body>;

const body = () =>
	writable<string>('').extend(self => ({
		append(chunk: string) {
			self.update(value => value.concat(chunk));
		},
	}));

const isPreflight = (req: Request) =>
	req.method === 'OPTIONS' && req.headers['access-control-request-method'];

const createLogger = () => {
	const prefligths: LogRecord[] = [];
	let clearTimeout: NodeJS.Timeout | undefined;

	const httpLogger = writable<LogRecord[]>([], undefined).extend(self => ({
		logFetch(res: Response, url: string) {
			const record: LogRecord = {
				type: 'fetch',
				key: nextKey(),
				t: Date.now(),
				url,
				req: res.req,
				res: res,
				reqBody: body(),
				resBody: body(),
			};

			if (isPreflight(record.req)) {
				prefligths.push(record);
				self.update($data => ($data.push(record), $data));
			} else {
				const prefIndex = prefligths.findIndex(
					pref =>
						pref.req.url === record.req.url &&
						pref.req.headers['access-control-request-method'] ===
							record.req.method,
				);
				if (prefIndex !== -1) {
					record.preflight = prefligths.splice(prefIndex, 1)[0]!;
					record.key = record.preflight.key;
					self.update(
						$data => (
							$data.findReplace(({key}) => key === record.key, record), $data
						),
					);
				} else {
					self.update($data => ($data.push(record), $data));
				}
			}
			self.update($data => $data.slice($data.length - 120, $data.length));

			return record;
		},
		clear() {
			if (clearTimeout) return;
			clearTimeout = setInterval(() => {
				self.update($data => {
					$data.shift();
					if (!$data.length)
						clearTimeout = (clearInterval(clearTimeout), undefined);
					return $data;
				});
			}, 5);
		},
	}));

	return httpLogger;
};

export default createLogger;

export const browserLogger = createLogger();

type WSRecord = Key &
	Direction &
	(
		| {
				type: 'stomp/frame';
				command?: string;
				headers: [string, string][];
				body?: Uint8Array;
		  }
		| {
				type: 'ping';
				raw: string;
		  }
		| {
				type: 'readyState';
				state: number;
		  }
		| {
				type: 'error';
				code?: string;
				reason?: string;
		  }
	);

type Direction = {incoming?: boolean; outgoing?: boolean};
type Key = {key: string; t: number};

export const wsLogger = writable<WSRecord[]>([], undefined)
	.extend(self => ({
		push(record: O.Optional<WSRecord, keyof Key>) {
			record.t = Date.now();
			record.key = nextKey();
			self.update($data => ($data.push(record as WSRecord), $data));
		},
	}))
	.extend(self => ({
		logStompFrame(
			data: {
				frame: IRawFrameType;
			} & Direction,
		) {
			self.push({
				type: 'stomp/frame',
				incoming: data.incoming,
				outgoing: data.outgoing,
				command: data.frame.command,
				headers: data.frame.headers,
				body: data.frame.binaryBody,
			});
		},
		logPing(data: {raw: string} & Direction) {
			self.push({
				type: 'ping',
				incoming: data.incoming,
				outgoing: data.outgoing,
				raw: data.raw,
			});
		},
		logReadyState(data: {state: number} & Direction) {
			self.push({
				type: 'readyState',
				state: data.state,
				incoming: data.incoming,
				outgoing: data.outgoing,
			});
		},
		logError(data: {code?: string; reason?: string} & Direction) {
			self.push({
				type: 'error',
				code: data.code,
				reason: data.reason,
				incoming: data.incoming,
				outgoing: data.outgoing,
			});
		},
	}));

export const logger = new Console({
	stdout: fs.createWriteStream('./log.txt', {encoding: 'utf-8'}),
});
