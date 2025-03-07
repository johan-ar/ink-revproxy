import {eventEmitter, Subscriber} from './eventEmitter.js';

export const unmount = eventEmitter().extend(self => ({
	once: (run: Subscriber<void>) =>
		self.subscribe((value, unsub) => {
			run(value, unsub);
			unsub();
		}),
}));
