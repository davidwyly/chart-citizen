import React, { Component, ErrorInfo, PropsWithChildren, ComponentType } from 'react';
import { errorReporter } from '../services/error-reporter';
import { RenderingError } from '../types/errors';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  fallback?: ComponentType<ErrorBoundaryState & { onRetry?: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, only catches errors from direct children
  name?: string; // Name for error context
}

interface DefaultErrorFallbackProps extends ErrorBoundaryState {
  onRetry?: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  errorId, 
  onRetry 
}) => (
  <div className="error-boundary-fallback" style={{
    padding: '20px',
    margin: '20px',
    border: '2px solid #ff6b6b',
    borderRadius: '8px',
    backgroundColor: '#fff5f5',
    color: '#c92a2a'
  }}>
    <h2>Something went wrong</h2>
    <p>An unexpected error occurred while rendering this component.</p>
    {process.env.NODE_ENV === 'development' && error && (
      <details style={{ marginTop: '10px' }}>
        <summary>Error Details (Development Only)</summary>
        <pre style={{ 
          fontSize: '12px', 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    {errorId && (
      <p style={{ fontSize: '12px', color: '#868e96', marginTop: '10px' }}>
        Error ID: {errorId}
      </p>
    )}
    {onRetry && (
      <button 
        onClick={onRetry}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#228be6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

export class ErrorBoundary extends Component<
  PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: PropsWithChildren<ErrorBoundaryProps>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Create a rendering error with component context
    const renderingError = new RenderingError(
      `Component error in ${this.props.name || 'Unknown Component'}: ${error.message}`,
      {
        componentName: this.props.name,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.retryCount,
        isolate: this.props.isolate
      }
    );

    // Report error to monitoring service
    errorReporter.report(renderingError, {
      originalError: error.message,
      originalStack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined
      });
    }
  };

  componentDidUpdate(prevProps: PropsWithChildren<ErrorBoundaryProps>) {
    // Reset error state if children change (new props might fix the error)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      const canRetry = this.retryCount < this.maxRetries;
      
      return (
        <FallbackComponent 
          {...this.state} 
          onRetry={canRetry ? this.handleRetry : undefined}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: ErrorBoundaryProps
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} name={Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different parts of the app
export const SystemViewerErrorBoundary: React.FC<PropsWithChildren> = ({ children }) => (
  <ErrorBoundary 
    name="SystemViewer"
    fallback={({ error, onRetry }) => (
      <div className="system-viewer-error" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3>Unable to render system view</h3>
        <p>There was an error loading the 3D system visualization.</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry Rendering
          </button>
        )}
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const UIErrorBoundary: React.FC<PropsWithChildren> = ({ children }) => (
  <ErrorBoundary 
    name="UI"
    isolate={true}
    fallback={({ error, onRetry }) => (
      <div style={{
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        color: '#856404'
      }}>
        <small>This component encountered an error and couldn't render.</small>
        {onRetry && (
          <button 
            onClick={onRetry}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
); 