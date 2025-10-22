'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for GamePlayer component
 * Prevents entire page crash if game demo fails to load
 */
export class GamePlayerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GamePlayer error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center">
          <div className="mb-4">
            <svg 
              className="w-16 h-16 mx-auto text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Game Demo Unavailable
          </h3>
          <p className="text-red-700 mb-4">
            We&apos;re sorry, but this game demo failed to load. This might be because:
          </p>
          <ul className="text-left text-sm text-red-600 space-y-1 max-w-md mx-auto mb-6">
            <li>• The game file is missing or corrupted</li>
            <li>• Your browser blocked the content (check privacy settings)</li>
            <li>• The game is still being built</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
          {this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-red-600 cursor-pointer hover:text-red-700">
                Technical details (for parents/developers)
              </summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-xs overflow-x-auto text-red-900">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
