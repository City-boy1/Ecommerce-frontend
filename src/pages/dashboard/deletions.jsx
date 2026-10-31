import { useState } from "react";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useNotify } from "../../hooks/useNotify";
import { getDeletionRequests, resolveDeletionRequest } from "../../services/adminService";
import { PageHeader, Tabs, EmptyState, RowSkeleton, ErrorState, ConfirmDialog } from "../../components/dashboard/ui";
import apiMessage from "../../utils/apiMessage";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";
import "../../css/adminOversight.css";

const STATUS_LABEL = { pending: "Waiting", approved: "Closed", declined: "Declined", cancelled: "Cancelled by user" };
const when = (d) => new Date(d).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });

export default function Deletions() {
  const notify = useNotify();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // { request, action }
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAdminFetch(
    () => getDeletionRequests({ status, page }),
    [status, page]
  );

  const requests = data?.requests || [];
  const pages = data?.pages || 1;

  const run = async (note) => {
    if (!target) return;
    setBusy(true);
    try {
      await resolveDeletionRequest(target.request._id, { action: target.action, adminNote: note || "" });
      notify.success(target.action === "approve" ? "Account closed." : "Request declined. The user was told why.");
      setTarget(null);
      await reload();
    } catch (e) {
      notify.error(apiMessage(e, "We couldn't update that request."));
    } finally {
      setBusy(false);
    }
  };

  const approving = target?.action === "approve";

  return (
    <div className="lm-d">
      <PageHeader title="Account deletions" subtitle="Users who asked to close their account. Accounts with open orders or reports can't be closed yet." />

      <Tabs
        label="Filter by status"
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        tabs={[
          { value: "pending", label: "Waiting" },
          { value: "approved", label: "Closed" },
          { value: "declined", label: "Declined" },
          { value: "", label: "All" },
        ]}
      />

      {loading && !data && <RowSkeleton rows={3} height={110} />}
      {!loading && error && !data && <ErrorState onRetry={reload} />}
      {!loading && data && requests.length === 0 && (
        <EmptyState title="Nothing here" text="Deletion requests will appear here when users send them." />
      )}

      <div className="lm-d-orders">
        {requests.map((r) => {
          const blocked = r.openOrders > 0 || r.openDisputes > 0;
          return (
            <article key={r._id} className="lm-d-card">
              <div className="lm-order__head">
                <div>
                  <div className="lm-order__no">{r.user.name} · {r.user.role}</div>
                  <div className="lm-order__meta">{r.user.email} · asked {when(r.createdAt)}</div>
                </div>
                <div className="lm-order__right"><strong>{STATUS_LABEL[r.status] || r.status}</strong></div>
              </div>

              <div className="lm-sub">
                <p>{r.reason ? `Reason: ${r.reason}` : "No reason given."}</p>
                {r.adminNote && <p className="lm-order__meta">Admin note: {r.adminNote}</p>}

                {r.status === "pending" && (
                  <>
                    {blocked && (
                      <p className="lm-order__meta">
                        Can't be closed yet: {r.openOrders} open order(s), {r.openDisputes} open problem report(s).
                      </p>
                    )}
                    <div className="lm-sub__actions">
                      <button className="lm-btn lm-btn--sm" disabled={blocked} onClick={() => setTarget({ request: r, action: "approve" })}>
                        Close account
                      </button>
                      <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setTarget({ request: r, action: "decline" })}>
                        Decline
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="lm-ao-pager">
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        title={approving ? `Close ${target?.request?.user?.name}'s account?` : "Decline this request?"}
        message={
          approving
            ? "This can't be undone. Their name, email, photo, phone and address are removed, they are signed out everywhere, and a seller's store is hidden. Order history is kept."
            : "The user keeps their account and is told your reason."
        }
        confirmLabel={approving ? "Close account" : "Decline request"}
        cancelLabel="Back"
        danger
        askReason={!approving}
        busy={busy}
        onConfirm={run}
        onClose={() => !busy && setTarget(null)}
      />
    </div>
  );
}