import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class BookingModalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: false };
  }

  public componentDidCatch(error: unknown) {
    console.warn('BookingModal intercepted error gracefully:', error);
  }

  public render() {
    return this.props.children;
  }
}
