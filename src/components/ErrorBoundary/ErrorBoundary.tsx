import React from "react";
import { captureError } from "../../utils/telemetry";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "var(--color-bg-primary, #0f1115)",
            color: "var(--color-text-primary, #f8fafc)",
          }}
        >
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <h2 style={{ marginBottom: 12 }}>Что-то пошло не так</h2>
            <p style={{ opacity: 0.85, marginBottom: 16 }}>
              Произошла непредвиденная ошибка интерфейса.
            </p>
            {this.state.errorMessage && (
              <p style={{ opacity: 0.65, marginBottom: 24 }}>{this.state.errorMessage}</p>
            )}
            <button type="button" onClick={this.handleReload}>
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
