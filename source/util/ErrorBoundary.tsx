import { Box, Text } from "ink";
import React, {
	Component,
	type ErrorInfo,
	type PropsWithChildren,
} from "react";

type State = { fail: boolean; error?: Error; errorInfo?: ErrorInfo };

export default class ErrorBoundary extends Component<PropsWithChildren, State> {
	state: State = {
		fail: false,
		error: undefined,
		errorInfo: undefined,
	};
	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		this.setState({
			fail: true,
			error,
			errorInfo,
		});
	}
	render(): React.ReactNode {
		const { fail, error, errorInfo } = this.state;
		if (fail) {
			return (
				<Box flexDirection="column">
					<Text color="redBright" bold inverse>
						{error?.name}: {error?.message}
					</Text>
					<Text color="redBright">{error?.stack}</Text>
					<Text color="redBright" bold inverse>
						{"\n"}Component Stack
					</Text>
					<Text color="redBright">
						{errorInfo?.componentStack}
						{errorInfo?.digest}
					</Text>
				</Box>
			);
		}
		return this.props.children;
	}
}
