import os from 'node:os';

export default function addresses() {
	const interfaces = os.networkInterfaces();
	const addresses: string[] = [];

	for (const name in interfaces) {
		for (const n_interface in interfaces[name]!) {
			const address = interfaces[name]![n_interface]!;
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}

	return addresses;
}
