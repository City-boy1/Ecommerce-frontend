import { useEffect, useState } from "react";
import "../../css/adminOversight.css";

// Reason list + optional note. onConfirm({ reasonCode, note }).
export default function CancelDialog({
  open, title, message, warning, reasons, confirmLabel = "Cancel order", cancelLabel = "Keep order",
  busy = false, onConfirm, onClose,
}) {
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setCode(""); setNote(""); setErr(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const submit = () => {
    if (!code) return setErr("Choose a reason.");
    if (code === "other" && note.trim().length < 3) return setErr("Please add a short note.");
    setErr("");
    onConfirm({ reasonCode: code, note: note.trim() });
  };

  return (
    <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-cx-title">
        <h2 id="lm-cx-title">{title}</h2>
        {message && <p>{message}</p>}
        {warning && <p><strong>{warning}</strong></p>}

        <div role="radiogroup" aria-label="Reason">
          {reasons.map((r) => (
            <label className="lm-ao-radio" key={r.value}>
              <input type="radio" name="cancel-reason" value={r.value} checked={code === r.value} onChange={() => setCode(r.value)} />
              <div><strong>{r.label}</strong></div>
            </label>
          ))}
        </div>

        <div className="lm-d-field">
          <label htmlFor="lm-cx-note">Note {code === "other" ? "(required)" : "(optional)"}</label>
          <textarea id="lm-cx-note" className="lm-input" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {err && <div className="lm-err" role="alert">{err}</div>}

        <div className="lm-modal__actions">
          <button className="lm-btn lm-btn--ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button className="lm-btn" onClick={submit} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}