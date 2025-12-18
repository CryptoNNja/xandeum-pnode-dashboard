'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error Boundary caught an error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default professional error UI
      return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="kpi-card p-8 space-y-6 border-2 border-red-500/30">
              {/* Icon & Title */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-text-main mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-text-soft">
                    The application encountered an unexpected error. Don't worry, your data is safe.
                  </p>
                </div>
              </div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-bg-bg rounded-lg p-4 border border-border-app">
                  <p className="text-xs font-mono text-red-400 mb-2 font-bold">
                    Error Details (Development Mode):
                  </p>
                  <p className="text-xs font-mono text-text-soft break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-xs font-mono text-text-faint cursor-pointer hover:text-text-soft">
                        Component Stack
                      </summary>
                      <pre className="text-xs font-mono text-text-faint mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent-aqua hover:bg-accent-aqua/90 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-bg border border-border-app text-text-main rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-bg border border-border-app text-text-main rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <div className="text-xs text-text-faint text-center pt-4 border-t border-border-app">
                If this problem persists, please{' '}
                <a
                  href="https://github.com/CryptoNNja/xandeum-pnode-dashboard/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-aqua hover:underline"
                >
                  report an issue on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 * Usage: export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
