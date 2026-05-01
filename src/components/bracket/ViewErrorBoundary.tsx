// src/components/bracket/ViewErrorBoundary.tsx
// Captura errores de renderizado de las vistas (clásica/cósmica) y muestra
// un mensaje en pantalla en vez de fallar silenciosamente.

"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  viewName: string;
}
interface State {
  error: Error | null;
}

export default class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[bracket/${this.props.viewName}] error:`, error, info);
  }

  componentDidUpdate(prev: Props) {
    // Reset cuando cambia la vista
    if (prev.viewName !== this.props.viewName && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 32,
            margin: 24,
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 16,
            background: "rgba(239,68,68,0.06)",
            color: "#fca5a5",
            fontFamily: "Outfit, sans-serif",
          }}
          role="alert"
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#fff" }}>
            Error en la vista <code>{this.props.viewName}</code>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, marginBottom: 12 }}>
            {this.state.error.message}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "8px 16px",
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <details style={{ marginTop: 14, fontSize: 11, color: "#94a3b8" }}>
            <summary style={{ cursor: "pointer" }}>Stack trace</summary>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{this.state.error.stack}</pre>
          </details>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
