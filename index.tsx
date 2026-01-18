import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
// This catches JavaScript errors anywhere in the child component tree,
// log those errors, and display a fallback UI instead of the component tree that crashed.
class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '10%' }}>
          <h1 style={{ color: '#e11d48' }}>앱 실행 중 오류가 발생했습니다.</h1>
          <p>아래 오류 내용을 확인해주세요:</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', maxWidth: '600px', margin: '1rem auto' }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ color: '#64748b' }}>
            Firebase 설정(API Key)이 올바르지 않거나 환경 변수 설정 문제일 수 있습니다.<br/>
            <code>firebase.ts</code> 파일을 확인해주세요.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);