import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
// 앱이 예상치 못한 에러로 중단되었을 때, 흰 화면 대신 안내 문구를 보여줍니다.
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
            아래 오류 내용을 확인해주세요.
          </p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            앱 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 'root' 요소를 안전하게 가져오고, 없을 경우 에러를 출력합니다.
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. index.html 파일에 <div id='root'></div>가 있는지 확인해주세요.");
}