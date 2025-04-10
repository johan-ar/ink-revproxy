import React, {
	PropsWithChildren,
	ReactNode,
	useEffect,
	useState,
} from "react";
import { useReadable, writable, WritableExtendable } from "./writable.js";

export const Portal: React.FC<
	PropsWithChildren<{ id: string; order?: number }>
> = ({ children, order = 0, id }) => {
	useEffect(
		() => getPortalStore(id).mount(children, order),
		[children, order, id],
	);
	return null;
};

function first<T>(obj: T): string | undefined {
	for (let key in obj) return key;
}

export const PortalContainer: React.FC<{ [id: string]: true }> = (props) => {
	const id = first(props) || "";
	const [context, setContext] = useState<PortalContext>();

	useEffect(() => {
		setContext(acquirePortal(id));

		return () => {
			setContext(void releasePortal(id));
		};
	}, [id]);

	return context ? <PortalContainerRenderer context={context} /> : null;
};
const PortalContainerRenderer: React.FC<{ context: PortalContext }> = ({
	context,
}) => {
	return useReadable(context);
};

const PortalBucket = new Map<string, PortalContext>();
const PortalAcquisition = new Set<string>();

function acquirePortal(id: string) {
	if (PortalAcquisition.has(id)) {
		throw new Error(`Portal "${id}" is already acquired`);
	}
	PortalAcquisition.add(id);
	return getPortalStore(id);
}

function releasePortal(id: string) {
	PortalAcquisition.delete(id);
	PortalBucket.delete(id);
}

function getPortalStore(id: string) {
	if (PortalBucket.has(id)) {
		return PortalBucket.get(id)!;
	}
	const context: PortalContext = writable<ReactNode[][]>([]).extend((self) => ({
		mount(children, order): Unmount {
			self.update((nodes) => {
				nodes[order] ??= [];
				nodes[order].push(children);
			});
			return () => {
				self.update((nodes) => {
					const subNodes = nodes[order]!;
					const index = subNodes.indexOf(children);
					subNodes.splice(index, 1);
					if (subNodes.length === 0) delete nodes[order];
				});
			};
		},
	}));
	PortalBucket.set(id, context);
	return context;
}

type Unmount = () => void;
type PortalContext = WritableExtendable<ReactNode[][]> & {
	mount(children: ReactNode, order: number): Unmount;
};
