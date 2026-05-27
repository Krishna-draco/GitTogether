import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#1e1e2e', color: '#f8f8f2', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ff5555' }}>Something went wrong.</h2>
          <details open style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <p style={{ color: '#ffb86c', marginTop: '8px' }}>{this.state.error && this.state.error.toString()}</p>
            <pre style={{ background: '#282a36', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginTop: '8px' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '16px', padding: '8px 16px', background: '#50fa7b', color: '#282a36', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
