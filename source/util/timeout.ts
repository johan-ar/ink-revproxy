export default (time = 0) => new Promise<void>(r => setTimeout(r, time));
