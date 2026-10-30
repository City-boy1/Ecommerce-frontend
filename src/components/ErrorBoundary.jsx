import { Component } from "react";

// If one page throws while rendering, show a message instead of a blank white screen.
// Pass resetKey={location.pathname} so moving to another page tries again.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) this.setState({ hasError: false });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px", textAlign: "center", fontFamily: "inherit" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something went wrong on this page</h1>
        <p style={{ color: "#737373", margin: "0 0 20px" }}>The rest of the app is fine. Please reload, or go back to the home page.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: "10px 18px", marginRight: 8, border: 0, borderRadius: 8, background: "#111", color: "#fff", cursor: "pointer" }}>
          Reload
        </button>
        <a href="/" style={{ padding: "10px 18px", border: "1px solid #e5e5e5", borderRadius: 8, color: "#111", textDecoration: "none" }}>Home</a>
      </div>
    );
  }
}