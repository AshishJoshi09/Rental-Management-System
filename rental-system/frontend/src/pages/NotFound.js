import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", paddingTop: "5rem" }}>
      <div style={{ fontSize: "5rem" }}>🏚</div>
      <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)", margin: "1rem 0" }}>404</h1>
      <p style={{ fontSize: "1.1rem", color: "var(--text-light)", marginBottom: "2rem" }}>This page doesn't exist or was moved.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}
