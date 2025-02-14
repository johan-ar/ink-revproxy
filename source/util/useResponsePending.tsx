import {useEffect, useState} from 'react';
import {LogRecord} from './logger.js';

const useResponsePending = ({res, req}: LogRecord) => {
	const [pending, setPending] = useState(!res.writableEnded);

	useEffect(() => {
		if (res.writableEnded) {
			return setPending(false);
		}

		const onEnded = () => setPending(false);
		const events = ['finish', 'error', 'close'];
		events.forEach(event => res.on(event, onEnded));
		req.on('end', onEnded);

		return () => {
			events.forEach(event => res.off(event, onEnded));
			req.off('end', onEnded);
		};
	}, [res, req]);

	return pending;
};

export default useResponsePending;
