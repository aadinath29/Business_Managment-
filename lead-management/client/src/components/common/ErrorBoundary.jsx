import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../UI/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an uncaught rendering error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center select-none bg-slate-50 border border-slate-200 rounded-2xl max-w-2xl mx-auto my-8 shadow-xs">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-full mb-4 shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Something went wrong.</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-md">
            The multi-branch workspace encountered an unexpected rendering crash. Malformed or invalid data has been safely intercepted.
          </p>

          {isDev && this.state.error && (
            <div className="mt-4 w-full bg-slate-100 border border-slate-200 rounded-lg p-4 text-left font-mono text-[10px] text-rose-700 max-h-48 overflow-auto">
              <p className="font-bold text-xs mb-1">Error: {this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin-reverse" /> Retry & Reload
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="text-gray-600 border border-gray-200 text-xs font-semibold py-2 px-4 cursor-pointer"
            >
              <Home className="w-4 h-4 mr-1.5" /> Return Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
