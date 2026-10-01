/**
 * Error Boundary
 * Catches render errors thrown by built-in or custom renderers
 * @module renderer/ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Props for HtmlErrorBoundary
 */
export interface HtmlErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children after an error */
  fallback: ReactNode;
  /** Called once for every caught error */
  onError?: (error: Error) => void;
  /** The boundary resets itself when this value changes (e.g. the html string) */
  resetKey?: unknown;
}

interface HtmlErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary that keeps a broken renderer from taking down the whole screen
 */
export class HtmlErrorBoundary extends Component<HtmlErrorBoundaryProps, HtmlErrorBoundaryState> {
  state: HtmlErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): HtmlErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: HtmlErrorBoundaryProps): void {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default HtmlErrorBoundary;
