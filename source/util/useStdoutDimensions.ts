import {useStdout} from 'ink';
import {useEffect, useState} from 'react';

export default function useStdoutDimensions(): [columns: number, rows: number] {
	const {stdout} = useStdout();

	const [dimensions, setDimensions] = useState<[number, number]>([
		stdout.columns,
		stdout.rows - 1,
	]);

	useEffect(() => {
		const handler = () => setDimensions([stdout.columns, stdout.rows - 1]);

		stdout.on('resize', handler);

		return () => {
			stdout.off('resize', handler);
		};
	}, [stdout]);

	return dimensions;
}
