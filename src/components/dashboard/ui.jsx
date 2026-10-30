import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_FLOW, STATUS_LABEL } from "../../utils/orderStatus";
import { formatShort } from "../../utils/dateHelpers";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="lm-d-head">
      <div>
        <h1 className="lm-d-title">{title}</h1>
        {subtitle && <p className="lm-d-sub">{subtitle}</p>}
      </div>
      {actions && <div className="lm-d-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, to, tone }) {
  const body = (
    <>
      <span className="lm-d-stat__label">{label}</span>
      <span className="lm-d-stat__value">{value}</span>
      {hint && <span className="lm-d-stat__hint">{hint}</span>}
    </>
  );
  const cls = `lm-d-stat ${to ? "lm-d-stat--link" : ""} ${tone ? `lm-d-stat--${tone}` : ""}`;
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Tabs({ tabs, value, onChange, label = "Filter" }) {
  return (
    <div className="lm-d-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={t.value === value} className="lm-d-tab" onClick={() => onChange(t.value)}>
          {t.label}
          {t.count != null && <small>{t.count}</small>}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`lm-d-badge lm-d-badge--${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function OrderTimeline({ status, timeline = [] }) {
  const at = (s) => timeline.find((t) => t.status === s)?.at;
  if (status === "cancelled") {
    const c = timeline.find((t) => t.status === "cancelled");
    return (
      <div className="lm-d-alert lm-d-alert--danger">
        Cancelled{c?.at ? ` · ${formatShort(c.at)}` : ""}
        {c?.note ? ` · ${c.note}` : ""}
      </div>
    );
  }
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <ol className="lm-tl" aria-label="Order progress">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className={i < idx ? "is-done" : i === idx ? "is-current" : ""} aria-current={i === idx ? "step" : undefined}>
          <span className="lm-tl__dot" aria-hidden="true">{i < idx ? "✓" : ""}</span>
          <span className="lm-tl__label">{STATUS_LABEL[s]}</span>
          <span className="lm-tl__time">{at(s) ? formatShort(at(s)) : ""}</span>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="lm-d-empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function RowSkeleton({ rows = 3, height = 84 }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="lm-skel" style={{ height }} />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, text = "We couldn't load this. Please try again." }) {
  return (
    <div className="lm-d-alert lm-d-alert--danger" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span>{text}</span>
      {onRetry && <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={onRetry}>Retry</button>}
    </div>
  );
}

// Confirm dialog, with an optional required "reason" box.
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Keep it", danger, askReason, busy, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setReason("");
    setErr("");
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    setTimeout(() => boxRef.current?.querySelector("textarea, button")?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const submit = () => {
    if (askReason && reason.trim().length < 3) {
      setErr("Please give a short reason.");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-modal-title" ref={boxRef}>
        <h2 id="lm-modal-title">{title}</h2>
        {message && <p>{message}</p>}
        {askReason && (
          <div className="lm-d-field">
            <label htmlFor="lm-reason">Reason</label>
            <textarea id="lm-reason" className="lm-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            {err && <div className="lm-err" role="alert">{err}</div>}
          </div>
        )}
        <div className="lm-modal__actions">
          <button className="lm-btn lm-btn--ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button className="lm-btn" style={danger ? { background: "var(--inv-danger)", borderColor: "var(--inv-danger)" } : undefined} onClick={submit} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}