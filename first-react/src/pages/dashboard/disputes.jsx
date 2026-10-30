import { useEffect, useRef, useState } from "react";
import { PageHeader, Tabs, EmptyState, RowSkeleton, ErrorState } from "../../components/dashboard/ui";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useNotify } from "../../hooks/useNotify";
import { getDisputes, resolveDispute } from "../../services/adminService";
import { formatShort } from "../../utils/dateHelpers";
import { formatPrice, getImageUrl } from "../../utils/productHelpers";
import { DISPUTE_STATUS_LABEL, DISPUTE_TABS, REASON_LABEL } from "../../utils/disputeLabels";
import apiMessage from "../../utils/apiMessage";
import "../../css/tokens.css";
import "../../css/dashboardUi.css";
import "../../css/adminOversight.css";

// The three ways an admin can close a dispute (Part 3 §6.4).
const OUTCOMES = [
  { value: "resolved_refund", title: "Refund the buyer", text: "The buyer is right. Payment is marked refunded (simulated for now)." },
  { value: "resolved_no_action", title: "No action", text: "The seller did nothing wrong, or the claim can't be supported." },
  { value: "closed", title: "Close without a decision", text: "Duplicate, withdrawn or handled elsewhere." },
];

function ResolveDialog({ dispute, onClose, onDone }) {
  const notify = useNotify();
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    setTimeout(() => boxRef.current?.querySelector("input")?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    if (!status) return setErr("Choose an outcome.");
    if (note.trim().length < 3) return setErr("Add a short note. Both sides will see it.");
    setErr("");
    setBusy(true);
    try {
      await resolveDispute(dispute._id, { status, adminNote: note.trim() });
      notify.success("Dispute resolved. Both sides were notified.");
      onDone();
    } catch (e) {
      setErr(apiMessage(e, "We couldn't save that decision."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-rd-title" ref={boxRef}>
        <h2 id="lm-rd-title">Resolve dispute</h2>
        <p>
          {dispute.order?.orderNumber || "Order"} · {dispute.store?.name || "Store"}
        </p>

        <div role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map((o) => (
            <label className="lm-ao-radio" key={o.value}>
              <input type="radio" name="outcome" value={o.value} checked={status === o.value} onChange={() => setStatus(o.value)} />
              <div>
                <strong>{o.title}</strong>
                <span>{o.text}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="lm-d-field">
          <label htmlFor="lm-rd-note">Note to the buyer and seller</label>
          <textarea id="lm-rd-note" className="lm-input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {err && <div className="lm-err" role="alert">{err}</div>}

        <div className="lm-modal__actions">
          <button className="lm-btn lm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="lm-btn" onClick={submit} disabled={busy}>{busy ? "Working…" : "Save decision"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Disputes() {
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);

  const { data, loading, error, reload } = useAdminFetch(
    () => getDisputes({ status: status === "all" ? "" : status, page }),
    [status, page],
    { interval: 60000 }
  );

  const disputes = data?.disputes || [];
  const pages = data?.pages || 1;

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Problems buyers reported on delivered orders." />

      <div className="lm-ao-toolbar">
        <Tabs tabs={DISPUTE_TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Filter disputes by status" />
      </div>

      {loading && <RowSkeleton rows={3} height={130} />}
      {!loading && error && <ErrorState onRetry={reload} text="We couldn't load the disputes. Please try again." />}

      {!loading && !error && disputes.length === 0 && (
        <EmptyState
          title={status === "open" ? "No open disputes" : "Nothing here"}
          text={status === "open" ? "When a buyer reports a problem, it will show up here." : "No disputes match this filter."}
        />
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="lm-ao-dlist">
          {disputes.map((d) => (
            <article className="lm-ao-dcard" key={d._id}>
              <div className="lm-ao-dhead">
                <h3>{d.order?.orderNumber || "Order"} · {d.store?.name || "Store"}</h3>
                <div className="lm-ao-dbadges">
                  <span className="lm-ao-badge">{REASON_LABEL[d.reason] || d.reason}</span>
                  <span className={`lm-ao-badge lm-ao-badge--${d.status}`}>{DISPUTE_STATUS_LABEL[d.status] || d.status}</span>
                </div>
              </div>
              <p className="lm-ao-dmeta">
                Reported by {d.buyer?.name || "buyer"} on {formatShort(d.createdAt)}
                {d.subOrder?.subtotal != null ? ` · ${formatPrice(d.subOrder.subtotal)}` : ""}
              </p>

              {d.message && <blockquote className="lm-ao-quote">{d.message}</blockquote>}

              {d.sellerReply?.message ? (
                <>
                  <span className="lm-ao-quotelabel">
                    Seller's side{d.sellerReply.repliedAt ? ` · ${formatShort(d.sellerReply.repliedAt)}` : ""}
                  </span>
                  <blockquote className="lm-ao-quote lm-ao-quote--seller">{d.sellerReply.message}</blockquote>
                </>
              ) : (
                d.status === "open" && <p className="lm-ao-note">The seller hasn't replied yet.</p>
              )}

              {d.images?.length > 0 && (
                <div className="lm-ao-imgs">
                  {d.images.map((src, i) => (
                    <a key={i} href={getImageUrl(src)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(src)} alt={`Evidence ${i + 1}`} />
                    </a>
                  ))}
                </div>
              )}

              {d.status !== "open" && d.adminNote && (
                <p className="lm-ao-note">
                  <strong>Decision:</strong> {d.adminNote}
                  {d.resolvedAt ? ` (${formatShort(d.resolvedAt)})` : ""}
                </p>
              )}

              {d.status === "open" && (
                <div className="lm-ao-dfoot">
                  <button className="lm-btn lm-btn--sm" onClick={() => setTarget(d)}>Resolve</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {pages > 1 && !loading && !error && (
        <div className="lm-ao-pager">
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {target && (
        <ResolveDialog
          dispute={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            reload();
          }}
        />
      )}
    </div>
  );
}