export const nextKey = (
	(k = 0) =>
	() =>
		`${++k}`
)();
