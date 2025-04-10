// const FPS = () => {
// 	const [fps, setFps] = useState(0);
// 	const start = useRef(process.hrtime.bigint());

// 	return (
// 		<FPSText
// 			fps={() => {
// 				const end = process.hrtime.bigint();
// 				if (end - start.current <= 1_000_000_000n) {

// 				} else {
// 					setFps((fps) => {
// 						logger.log("fps", fps);
// 						return 0;
// 					});
// 				}
// 				return fps;
// 			}}
// 		/>
// 	);
// };
// const FPSText: React.FC<{ fps: () => number }> = ({ fps }) => {
// 	return (
// 		<Text>
// 			{(() => {
// 				let f = fps();
// 				logger.log("fps", f);
// 				return f;
// 			})()}
// 		</Text>
// 	);
// };

// const FPS = () => {
// 	const [count, setCount] = useState(0);
// 	const [fps, setFps] = useState(0);

// 	useEffect(() => {
// 		let start = performance.now();
// 		const cb = (end: number) => {
// 			if (end - start <= 1_000) {
// 				setCount((count) => count + 1);
// 			} else {
// 				setCount((count) => {
// 					setFps(count);
// 					return 0;
// 				});
// 				start = end;
// 			}
// 			requestAnimationFrame(cb);
// 		};
// 		const id = requestAnimationFrame(cb);
// 		return () => cancelAnimationFrame(id);
// 	}, []);

// 	return <Text>fps: {fps}</Text>;
// };

// var lastTime = 0;
// function requestAnimationFrame(callback: (t: number) => void) {
// 	let now = performance.now();
// 	let nextTime = Math.max(lastTime + 16, now);
// 	return setTimeout(function () {
// 		callback((lastTime = nextTime));
// 	}, nextTime - now);
// }
// const cancelAnimationFrame = clearTimeout;
