import { Component } from "react"
import type { ReactNode, ErrorInfo } from "react"

type Props = { children: ReactNode; fallback?: (error: Error) => ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error)
      return (
        <div style={{ padding: "1.5rem", fontFamily: "monospace", fontSize: "0.85rem" }}>
          <strong>Error en el plugin</strong>
          <pre style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap", opacity: 0.7 }}>
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
