export default function capitalize(text: string) {
	return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
}
