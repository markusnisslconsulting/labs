import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: unknown, retry: () => void) => ReactNode;
  onReset?: () => void;
}
interface State {
  failed: boolean;
  error: unknown;
}

export class RecoveryBoundary extends Component<Props, State> {
  override state: State = { failed: false, error: undefined };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, error };
  }

  override componentDidUpdate(_previousProps: Props, previous: State) {
    if (previous.failed && !this.state.failed) this.props.onReset?.();
  }

  private retry = () => this.setState({ failed: false, error: undefined });

  override render() {
    return this.state.failed
      ? this.props.fallback(this.state.error, this.retry)
      : this.props.children;
  }
}
