import { useReducer } from "react";

function rerender(state: number) {
	return state + 1;
}

export default function useRerender() {
	const [, trigger] = useReducer(rerender, 0);
	return trigger;
}
