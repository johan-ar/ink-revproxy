export default <T = true>(time = 0, result: T = true as T) =>
	new Promise<T>(r => setTimeout(r, time, result));
