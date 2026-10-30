import { useEffect, useRef, useState } from "react";
import { useNotify } from "../../hooks/useNotify";
import { replyToDispute } from "../../services/disputeService";
import { REASON_LABEL } from "../../utils/disputeLabels";
import apiMessage from "../../utils/apiMessage";
import "../../css/adminOversight.css";

function ReplyDialog({ dispute, onClose, onDone }) {
  const notify = useNotify();
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    setTimeout(() => boxRef.current?.querySelector("textarea")?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    if (message.trim().length < 10) return setErr("Please write at least 10 characters.");
    setErr("");
    setBusy(true);
    try {
      await replyToDispute(dispute._id, message.trim());
      notify.success("Your reply was sent to our team.");
      onDone();
    } catch (e) {
      setErr(apiMessage(e, "We couldn't send your reply. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-sr-title" ref={boxRef}>
        <h2 id="lm-sr-title">Respond to this report</h2>
        <p>
          <strong>{REASON_LABEL[dispute.reason] || "Problem reported"}.</strong>
        </p>
        {dispute.message && <blockquote className="lm-ao-quote">{dispute.message}</blockquote>}
        <p>You can reply once. Tell us your side, for example proof of delivery. Our team reads it before deciding.</p>

        <div className="lm-d-field">
          <label htmlFor="lm-sr-msg">Your reply</label>
          <textarea id="lm-sr-msg" className="lm-input" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {err && <div className="lm-err" role="alert">{err}</div>}

        <div className="lm-modal__actions">
          <button className="lm-btn lm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="lm-btn" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send reply"}</button>
        </div>
      </div>
    </div>
  );
}

// Seller: tag and reply button on an incoming order.
//   <DisputeBadge dispute={o.dispute} onChanged={reload} />
// Renders nothing unless a dispute is open.
export default function DisputeBadge({ dispute, onChanged }) {
  const [replying, setReplying] = useState(false);
  if (!dispute || dispute.status !== "open") return null;

  const replied = !!dispute.sellerReply;
  return (
    <>
      <span className="lm-ao-badgerow">
        <span className="lm-ao-badge lm-ao-badge--open" title="The buyer reported a problem. An admin is reviewing it.">Dispute open</span>
        {replied ? (
          <small>You replied</small>
        ) : (
          dispute._id && (
            <button type="button" className="lm-ao-linkbtn" onClick={() => setReplying(true)}>Respond</button>
          )
        )}
      </span>
      {replying && (
        <ReplyDialog
          dispute={dispute}
          onClose={() => setReplying(false)}
          onDone={() => {
            setReplying(false);
            onChanged?.();
          }}
        />
      )}
    </>
  );
}