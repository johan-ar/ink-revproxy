import {eventEmitter} from './eventEmitter.js';

export interface IRawFrameType {
	command: string | undefined;
	headers: RawHeaderType[];
	binaryBody: Uint8Array | undefined;
}
export type RawHeaderType = [string, string];
/**
 * @internal
 */
const NULL = 0;
/**
 * @internal
 */
const LF = 10;
/**
 * @internal
 */
const CR = 13;
/**
 * @internal
 */
const COLON = 58;

export class StompParser {
	private readonly encoder = new TextEncoder();
	readonly decoder = new TextDecoder();

	// @ts-ignore - it always has a value
	private results: IRawFrameType;

	private token: number[] = [];
	private headerKey: string | undefined;
	private bodyBytesRemaining: number | undefined;

	// @ts-ignore - it always has a value
	private onByte: (byte: number) => void;

	private onFrameEmitter = eventEmitter<IRawFrameType>();
	private onIncomingPingEmitter = eventEmitter();

	onFrame = this.onFrameEmitter.subscribe;
	onIncomingPing = this.onIncomingPingEmitter.subscribe;

	public constructor() {
		this.initState();
	}

	public parseChunk(
		segment: string | ArrayBuffer,
		appendMissingNULLonIncoming: boolean = false,
	) {
		let chunk: Uint8Array;

		if (typeof segment === 'string') {
			chunk = this.encoder.encode(segment);
		} else {
			chunk = new Uint8Array(segment);
		}

		// See https://github.com/stomp-js/stompjs/issues/89
		// Remove when underlying issue is fixed.
		//
		// Send a NULL byte, if the last byte of a Text frame was not NULL.F
		if (appendMissingNULLonIncoming && chunk[chunk.length - 1] !== 0) {
			const chunkWithNull = new Uint8Array(chunk.length + 1);
			chunkWithNull.set(chunk, 0);
			chunkWithNull[chunk.length] = 0;
			chunk = chunkWithNull;
		}

		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < chunk.length; i++) {
			const byte = chunk[i];
			this.onByte(byte!);
		}
	}

	public decodeText(data: Uint8Array) {
		try {
			return this.decoder.decode(data);
		} catch (e) {
			return data.toString();
		}
	}

	// The following implements a simple Rec Descent Parser.
	// The grammar is simple and just one byte tells what should be the next state

	private collectFrame(byte: number): void {
		if (byte === NULL) {
			// Ignore
			return;
		}
		if (byte === CR) {
			// Ignore CR
			return;
		}
		if (byte === LF) {
			// Incoming Ping
			this.onIncomingPingEmitter();
			return;
		}

		this.onByte = this.collectCommand;
		this.reinjectByte(byte);
	}

	private collectCommand(byte: number): void {
		if (byte === CR) {
			// Ignore CR
			return;
		}
		if (byte === LF) {
			this.results.command = this.consumeTokenAsUTF8();
			this.onByte = this.collectHeaders;
			return;
		}

		this.consumeByte(byte);
	}

	private collectHeaders(byte: number): void {
		if (byte === CR) {
			// Ignore CR
			return;
		}
		if (byte === LF) {
			this.setupCollectBody();
			return;
		}
		this.onByte = this.collectHeaderKey;
		this.reinjectByte(byte);
	}

	private reinjectByte(byte: number) {
		this.onByte(byte);
	}

	private collectHeaderKey(byte: number): void {
		if (byte === COLON) {
			this.headerKey = this.consumeTokenAsUTF8();
			this.onByte = this.collectHeaderValue;
			return;
		}
		this.consumeByte(byte);
	}

	private collectHeaderValue(byte: number): void {
		if (byte === CR) {
			// Ignore CR
			return;
		}
		if (byte === LF) {
			this.results.headers.push([
				this.headerKey as string,
				this.consumeTokenAsUTF8(),
			]);
			this.headerKey = undefined;
			this.onByte = this.collectHeaders;
			return;
		}
		this.consumeByte(byte);
	}

	private setupCollectBody() {
		const contentLengthHeader = this.results.headers.filter(
			(header: [string, string]) => {
				return header[0] === 'content-length';
			},
		)[0];

		if (contentLengthHeader) {
			this.bodyBytesRemaining = parseInt(contentLengthHeader[1], 10);
			this.onByte = this.collectBodyFixedSize;
		} else {
			this.onByte = this.collectBodyNullTerminated;
		}
	}

	private collectBodyNullTerminated(byte: number): void {
		if (byte === NULL) {
			this.retrievedBody();
			return;
		}
		this.consumeByte(byte);
	}

	private collectBodyFixedSize(byte: number): void {
		// It is post decrement, so that we discard the trailing NULL octet
		if ((this.bodyBytesRemaining as number)-- === 0) {
			this.retrievedBody();
			return;
		}
		this.consumeByte(byte);
	}

	private retrievedBody() {
		this.results.binaryBody = this.consumeTokenAsRaw();

		try {
			this.onFrameEmitter(this.results);
		} catch (e) {
			console.log(
				`Ignoring an exception thrown by a frame handler. Original exception: `,
				e,
			);
		}

		this.initState();
	}

	// Rec Descent Parser helpers

	private consumeByte(byte: number) {
		this.token.push(byte);
	}

	private consumeTokenAsUTF8() {
		return this.decoder.decode(this.consumeTokenAsRaw());
	}

	private consumeTokenAsRaw() {
		const rawResult = new Uint8Array(this.token);
		this.token = [];
		return rawResult;
	}

	private initState() {
		this.results = {
			command: undefined,
			headers: [],
			binaryBody: undefined,
		};

		this.token = [];
		this.headerKey = undefined;

		this.onByte = this.collectFrame;
	}
}
