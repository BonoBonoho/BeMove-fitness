import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Index.tsx is running...");

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '10%' }}>
          <h1 style={{ color: '#e11d48', marginBottom: '1rem' }}>앱 실행 중 문제가 발생했습니다.</h1>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            라이브러리 로딩 또는 렌더링 중 오류가 발생했습니다.
          </p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("React mounted successfully.");
  } catch (e) {
    console.error("Failed to mount React app:", e);
    rootElement.innerHTML = `<div style="padding:20px; color:red;"><h3>Critical Error</h3><p>React failed to mount. Check console for details.</p></div>`;
  }
} else {
  console.error("Failed to find the root element.");
}