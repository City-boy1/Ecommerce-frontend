import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/passwordService";
import { useNotify } from "../hooks/useNotify";
import apiMessage from "../utils/apiMessage";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/passwordPages.css";

export default function ResetPassword() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setErr("Your new password must be at least 8 characters.");
    if (password !== confirm) return setErr("The two passwords don't match.");
    setErr("");
    setBusy(true);
    try {
      await resetPassword(token, password);
      notify.success("Password reset. You can log in now.");
      navigate("/auth/login", { replace: true });
    } catch (error) {
      setErr(apiMessage(error, "We couldn't reset your password. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return (
      <main className="lm-pw">
        <div className="lm-pw__card">
          <h1>This link doesn't work</h1>
          <p>The reset link is incomplete, expired or already used. Ask for a new one.</p>
          <Link className="lm-btn lm-btn--block" to="/forgot-password">Get a new link</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="lm-pw">
      <div className="lm-pw__card">
        <form onSubmit={submit} noValidate>
          <h1>Choose a new password</h1>
          <p>Use at least 8 characters. You'll be signed out of other devices.</p>
          <div className="lm-d-field">
            <label htmlFor="lm-rs-pw">New password</label>
            <input id="lm-rs-pw" className="lm-input" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="lm-d-field">
            <label htmlFor="lm-rs-pw2">Confirm new password</label>
            <input id="lm-rs-pw2" className="lm-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {err && (
            <div className="lm-err" role="alert">
              {err} {/expired|invalid/i.test(err) && <Link to="/forgot-password">Get a new link</Link>}
            </div>
          )}
          <button className="lm-btn lm-btn--block" type="submit" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
        </form>
      </div>
    </main>
  );
}