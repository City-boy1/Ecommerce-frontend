import { useEffect, useMemo, useRef, useState } from "react";
import { useNotify } from "../../hooks/useNotify";
import { confirmReceived, reportProblem } from "../../services/disputeService";
import { CONFIRM_WINDOW_DAYS, DISPUTE_STATUS_LABEL, REPORT_REASONS } from "../../utils/disputeLabels";
import { formatShort } from "../../utils/dateHelpers";
import apiMessage from "../../utils/apiMessage";
import "../../css/adminOversight.css";

const DAY = 24 * 60 * 60 * 1000;
const MAX_PHOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PHOTO_REQUIRED = ["wrong_item", "damaged"]; // must match the server

function deliveredAt(sub) {
  return sub.deliveredAt || sub.timeline?.find((t) => t.status === "delivered")?.at || null;
}

function ReportDialog({ orderId, subOrder, onClose, onDone }) {
  const notify = useNotify();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]); // File objects
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const fileRef = useRef(null);

  // Preview URLs, released when photos change or the dialog closes
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    setTimeout(() => boxRef.current?.querySelector("input")?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const photoRequired = PHOTO_REQUIRED.includes(reason);

  const addPhotos = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be chosen again
    if (!picked.length) return;
    const next = [...photos];
    for (const f of picked) {
      if (!OK_TYPES.includes(f.type)) return setErr("Photos must be PNG, JPG or WebP.");
      if (f.size > MAX_BYTES) return setErr("Each photo must be 5 MB or smaller.");
      if (next.length >= MAX_PHOTOS) return setErr(`You can add up to ${MAX_PHOTOS} photos.`);
      next.push(f);
    }
    setErr("");
    setPhotos(next);
  };

  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!reason) return setErr("Choose what went wrong.");
    if (message.trim().length < 10) return setErr("Please tell us a little more (at least 10 characters).");
    if (photoRequired && photos.length === 0) return setErr("Please add at least one photo as proof.");
    setErr("");
    setBusy(true);
    try {
      await reportProblem(orderId, { subOrderId: subOrder._id, reason, message: message.trim(), images: photos });
      notify.success("Thanks. We've sent your report to our team.");
      onDone();
    } catch (e) {
      setErr(apiMessage(e, "We couldn't send your report. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-rp-title" ref={boxRef}>
        <h2 id="lm-rp-title">Report a problem</h2>
        <p>Tell us what happened with this delivery. Our team will look into it and get back to you.</p>

        <div role="radiogroup" aria-label="What went wrong">
          {REPORT_REASONS.map((r) => (
            <label className="lm-ao-radio" key={r.value}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
              <div><strong>{r.label}</strong></div>
            </label>
          ))}
        </div>

        <div className="lm-d-field">
          <label htmlFor="lm-rp-msg">Details</label>
          <textarea id="lm-rp-msg" className="lm-input" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="lm-d-field">
          <label>Photos {photoRequired ? "(required)" : "(optional)"}</label>
          <div className="lm-ao-photos">
            {previews.map((src, i) => (
              <div className="lm-ao-photo" key={src}>
                <img src={src} alt={`Proof ${i + 1}`} />
                <button type="button" className="lm-ao-photo__x" onClick={() => removePhoto(i)} disabled={busy} aria-label={`Remove photo ${i + 1}`}>×</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" className="lm-ao-photo lm-ao-photo--add" onClick={() => fileRef.current?.click()} disabled={busy}>
                + Add
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addPhotos} />
          <small>Up to {MAX_PHOTOS} photos, PNG, JPG or WebP, 5 MB each.</small>
        </div>

        {err && <div className="lm-err" role="alert">{err}</div>}

        <div className="lm-modal__actions">
          <button className="lm-btn lm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="lm-btn" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send report"}</button>
        </div>
      </div>
    </div>
  );
}

// Buyer: shown under a sub-order on My orders.
//   <DeliveryConfirm orderId={order._id} subOrder={sub} onChanged={reload} />
export default function DeliveryConfirm({ orderId, subOrder, onChanged }) {
  const notify = useNotify();
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (subOrder.status !== "delivered") return null;

  const d = subOrder.dispute;
  if (d) {
    if (d.status === "open") {
      return <div className="lm-ao-confirm lm-ao-confirm--open">Problem reported. Our team is looking into it.</div>;
    }
    return (
      <div className="lm-ao-confirm">
        <div>
          Problem report: {DISPUTE_STATUS_LABEL[d.status] || d.status}
          {d.adminNote && <small>{d.adminNote}</small>}
        </div>
      </div>
    );
  }

  if (subOrder.receivedAt) {
    return <div className="lm-ao-confirm lm-ao-confirm--ok">You confirmed this arrived on {formatShort(subOrder.receivedAt)}.</div>;
  }

  const at = deliveredAt(subOrder);
  const deadline = at ? new Date(at).getTime() + CONFIRM_WINDOW_DAYS * DAY : null;
  if (deadline && Date.now() > deadline) return null; // window closed

  const confirm = async () => {
    setBusy(true);
    try {
      await confirmReceived(orderId, subOrder._id);
      notify.success("Thanks for confirming.");
      onChanged?.();
    } catch (e) {
      notify.error(apiMessage(e, "We couldn't save that. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="lm-ao-confirm">
        <div>
          Did everything arrive as expected?
          {deadline && <small>You can answer until {formatShort(new Date(deadline).toISOString())}.</small>}
        </div>
        <div className="lm-ao-confirm__btns">
          <button className="lm-btn lm-btn--sm" onClick={confirm} disabled={busy}>{busy ? "Saving…" : "All good"}</button>
          <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setReporting(true)} disabled={busy}>Report a problem</button>
        </div>
      </div>

      {reporting && (
        <ReportDialog
          orderId={orderId}
          subOrder={subOrder}
          onClose={() => setReporting(false)}
          onDone={() => {
            setReporting(false);
            onChanged?.();
          }}
        />
      )}
    </>
  );
}