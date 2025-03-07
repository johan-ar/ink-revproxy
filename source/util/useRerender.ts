import {useReducer} from 'react';

const rerender = (i: number) => i + 1;

const useRerender = () => {
	const [, trigger] = useReducer(rerender, 0);
	return trigger;
};

export default useRerender;
