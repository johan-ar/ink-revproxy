declare global {
	interface Array<T> {
		findReplace(
			predicate: (value: T, index: number, array: T[]) => unknown,
			newValue: T | ((value: T, index: number, array: T[]) => T),
		): boolean;
	}
}

Array.prototype.findReplace = function (predicate, newValue) {
	const index = this.findIndex(predicate);
	if (index === -1) return false;
	this.splice(
		index,
		1,
		typeof newValue === 'function'
			? newValue(this[index], index, this)
			: newValue,
	);
	return true;
};
