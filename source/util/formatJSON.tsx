export function formatJSON(data: string) {
	try {
		return JSON.stringify(JSON.parse(data), null, ' ');
	} catch {
		return data;
	}
}
