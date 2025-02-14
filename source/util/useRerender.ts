import {useReducer} from 'react';

const rerender = (v: number) => v + 1;

const useRerender = () => {
	const [, trigger] = useReducer(rerender, 0);
	return trigger;
};

export default useRerender;
