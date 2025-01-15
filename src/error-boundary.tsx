import React, { Component, ReactNode } from 'react';
import { NetworkErrorPage } from './shared/components';

// Ref: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
class ErrorBoundary extends Component<{ children: ReactNode | ReactNode[] }> {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
    // TODO: refactor after testing.
    if (
      /Loading chunk [0-9]+ failed/.test(error.message) ||
      /Failed to load resource: the server responded with status of [\d]+ .*/.test(
        error.message,
      ) ||
      /.*Failed to fetch dynamically imported module:.*/.test(error.message)
    ) {
      // Force a reload if it's a chunk error.
      location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI.
      return <NetworkErrorPage />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
