import {spawn} from 'child_process';

export default function clearOutput() {
	return spawn(`clear;clear;`, {
		shell: 'sh',
		stdio: 'inherit',
	});
}
