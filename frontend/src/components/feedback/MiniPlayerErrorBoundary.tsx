import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class MiniPlayerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[MiniPlayer] Error caught — hiding MiniPlayer:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently hide MiniPlayer on error
    }
    return this.props.children;
  }
}
