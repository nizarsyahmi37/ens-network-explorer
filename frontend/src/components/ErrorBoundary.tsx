import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Swallow — UI already shows the fallback. Wire telemetry here if added later.
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className="rounded-card flex flex-col items-center justify-center text-center px-6 py-10"
        style={{
          background: 'var(--c-washi)',
          border: '0.5px solid var(--c-border-gold)',
          minHeight: 360,
        }}
        role="alert"
      >
        <div
          className="font-mono text-[42px] font-light"
          style={{ color: 'var(--c-gold)', opacity: 0.5 }}
          aria-hidden
        >
          ⚠
        </div>
        <h3 className="t-heading text-[22px] mt-2">The graph crashed unexpectedly</h3>
        <p className="t-body mt-2 max-w-[360px]" style={{ fontSize: 13 }}>
          Something broke while drawing the network. The error has been contained — your data is
          safe. Try again, or refresh the page.
        </p>
        {this.state.error.message && (
          <code
            className="t-mono text-[11px] mt-3 px-3 py-2 rounded"
            style={{ background: 'var(--c-cream)', color: 'var(--c-rust)', maxWidth: 420 }}
          >
            {this.state.error.message}
          </code>
        )}
        <button type="button" className="btn-ghost mt-5" onClick={this.reset}>
          Try Again
        </button>
      </div>
    );
  }
}
