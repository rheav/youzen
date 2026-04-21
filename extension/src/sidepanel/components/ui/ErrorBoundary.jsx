import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--error-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              Something went wrong
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              This tab encountered an error. Try again or reload the extension.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={this.handleRetry}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
