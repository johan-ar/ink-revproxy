import { animate, AnimationOptions, distance, steps } from "popmotion";
import { useCallback, useEffect, useRef, useState } from "react";
import noop from "./noop.js";

export type AnimateControls<T> = {
	stop: () => void;
	start: (options: AnimationOptions<T>) => void;
	get latest(): T | undefined;
};

const createAnimate = <T,>(): AnimateControls<T> => {
	let stop_ = noop;
	let latest_: T | undefined = undefined;

	return {
		get latest() {
			return latest_;
		},
		set latest(value) {
			latest_ = value;
		},
		stop() {
			stop_();
		},
		start(options) {
			stop_();
			stop_ = animate<T>({
				...options,
				onUpdate(latest) {
					options.onUpdate?.((latest_ = latest));
				},
			}).stop;
		},
	};
};

export const useAnimate = <T,>() => {
	const animate = useRef<ReturnType<typeof createAnimate<T>>>(null);
	if (!animate.current) animate.current = createAnimate();
	useEffect(() => animate.current!.stop, []);

	return animate.current;
};

export type AnimateToAction<T> = T | ((latest: T) => T);

type AnimateTo = (
	action: AnimateToAction<number>,
	options?: AnimationOptions<number>,
) => void;

export const useIntAnimation = (
	initialFrom: number,
): [latest: number, start: AnimateTo] => {
	const animate = useAnimate<number>();
	const [value, setValue] = useState(initialFrom);

	const start = useCallback<AnimateTo>((action, options = {}) => {
		const latest = animate.latest ?? initialFrom;
		const to = typeof action === "function" ? action(latest) : action;

		animate.start({
			from: latest,
			to,
			ease: steps(distance(to, latest) || 1, "start"),
			onUpdate(latest) {
				setValue(latest);
				options.onUpdate?.(latest);
			},
			onComplete() {
				options.onComplete?.();
				setValue(to);
			},
			...options,
		});
	}, []);

	return [value, start];
};
