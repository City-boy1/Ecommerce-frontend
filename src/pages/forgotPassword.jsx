import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/passwordService";
import apiMessage from "../utils/apiMessage";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/passwordPages.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setErr("Enter a valid email address.");
    setErr("");
    setBusy(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (error) {
      setErr(apiMessage(error, "We couldn't send the link. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="lm-pw">
      <div className="lm-pw__card">
        {sentTo ? (
          <>
            <h1>Check your email</h1>
            <p>
              If an account exists for <strong>{sentTo}</strong>, we've sent a link to reset your password.
              It works once and expires in 30 minutes.
            </p>
            <p className="lm-pw__hint">Nothing arrived? Check your spam folder, or wait a minute and try again.</p>
            <button className="lm-btn lm-btn--ghost lm-btn--block" onClick={() => setSentTo("")}>Use a different email</button>
            <p className="lm-pw__foot"><Link to="/auth/login">Back to log in</Link></p>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1>Forgot your password?</h1>
            <p>Enter your email and we'll send you a link to choose a new one.</p>
            <div className="lm-d-field">
              <label htmlFor="lm-fp-email">Email</label>
              <input
                id="lm-fp-email"
                className="lm-input"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {err && <div className="lm-err" role="alert">{err}</div>}
            <button className="lm-btn lm-btn--block" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p className="lm-pw__foot"><Link to="/auth/login">Back to log in</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}