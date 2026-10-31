import { useEffect } from "react";
import "../css/tokens.css";
import "../css/legal.css";

// Shared layout for About, Terms and Privacy.
export default function LegalPage({ eyebrow, title, updated, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <main className="lm-legal">
      <article className="lm-legal__card">
        {eyebrow && <span className="lm-legal__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {updated && <p className="lm-legal__updated">Last updated {updated}</p>}
        {children}
      </article>
    </main>
  );
}