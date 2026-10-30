import { useEffect, useState } from "react";
import { PageHeader, Tabs, EmptyState, RowSkeleton, ErrorState, ConfirmDialog } from "../../components/dashboard/ui";
import OpenOrdersDialog from "../../components/dashboard/OpenOrdersDialog";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useNotify } from "../../hooks/useNotify";
import { getSellers, suspendSeller, reinstateSeller } from "../../services/adminService";
import { formatShort } from "../../utils/dateHelpers";
import { HIGH_CANCEL_RATE } from "../../utils/disputeLabels";
import apiMessage from "../../utils/apiMessage";
import "../../css/tokens.css";
import "../../css/dashboardUi.css";
import "../../css/adminOversight.css";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function Sellers() {
  const notify = useNotify();
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reinstateTarget, setReinstateTarget] = useState(null);
  const [ordersTarget, setOrdersTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // Wait for the admin to stop typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, loading, error, reload, refresh } = useAdminFetch(
    () => getSellers({ status: status === "all" ? "" : status, search, page }),
    [status, search, page],
    { interval: 60000 }
  );

  const sellers = data?.sellers || [];
  const pages = data?.pages || 1;

  const doSuspend = async (reason) => {
    setBusy(true);
    try {
      await suspendSeller(suspendTarget.store._id, reason);
      notify.success(`${suspendTarget.store.name} was suspended.`);
      setSuspendTarget(null);
      reload();
    } catch (e) {
      notify.error(apiMessage(e, "We couldn't suspend this store."));
    } finally {
      setBusy(false);
    }
  };

  const doReinstate = async () => {
    setBusy(true);
    try {
      await reinstateSeller(reinstateTarget.store._id);
      notify.success(`${reinstateTarget.store.name} was reinstated.`);
      setReinstateTarget(null);
      reload();
    } catch (e) {
      notify.error(apiMessage(e, "We couldn't reinstate this store."));
    } finally {
      setBusy(false);
    }
  };

  const suspendOpen = suspendTarget?.openOrders || 0;

  return (
    <div>
      <PageHeader
        title="Sellers"
        subtitle="Watch for warning signs, suspend a store, or step in on open orders."
      />

      <div className="lm-ao-toolbar">
        <Tabs tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Filter sellers by status" />
        <input
          className="lm-input lm-ao-search"
          type="search"
          placeholder="Search store or owner"
          aria-label="Search sellers"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {loading && <RowSkeleton rows={5} height={56} />}
      {!loading && error && <ErrorState onRetry={reload} text="We couldn't load the sellers. Please try again." />}

      {!loading && !error && sellers.length === 0 && (
        <EmptyState
          title="No sellers found"
          text={search || status !== "all" ? "Try a different search or filter." : "Stores will appear here once buyers open them."}
        />
      )}

      {!loading && !error && sellers.length > 0 && (
        <>
          <div className="lm-ao-tablewrap">
            <table className="lm-ao-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Owner</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Rating</th>
                  <th>Open orders</th>
                  <th>Cancel rate</th>
                  <th>Overdue</th>
                  <th>Disputes</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => {
                  const suspended = s.store?.status === "suspended";
                  const cancelHigh = (s.cancelRate || 0) >= HIGH_CANCEL_RATE && (s.orders30d || 0) >= 4;
                  return (
                    <tr key={s._id || s.store?._id} className={suspended ? "is-suspended" : ""}>
                      <td>
                        <div className="lm-ao-store">
                          {s.store?.logo ? (
                            <img className="lm-ao-logo" src={s.store.logo} alt="" />
                          ) : (
                            <span className="lm-ao-logo" aria-hidden="true">{(s.store?.name || "?").charAt(0).toUpperCase()}</span>
                          )}
                          <div>
                            <strong>{s.store?.name || "Unnamed store"}</strong>
                            <span className="lm-ao-sub">{plural(s.orders30d || 0, "order", "orders")} in 30 days</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {s.owner?.name || "-"}
                        <span className="lm-ao-sub">{s.owner?.email}</span>
                      </td>
                      <td>{s.sellerSince ? formatShort(s.sellerSince) : "-"}</td>
                      <td>
                        <span className={`lm-ao-badge lm-ao-badge--${suspended ? "suspended" : "active"}`}>
                          {suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td>{s.approvedProducts ?? 0}</td>
                      <td>{s.ratingCount > 0 ? `${Number(s.ratingAverage).toFixed(1)} (${s.ratingCount})` : "No reviews"}</td>
                      <td>{s.openOrders ?? 0}</td>
                      <td className={cancelHigh ? "is-warn" : ""}>{pct(s.cancelRate)}</td>
                      <td className={s.overdueOrders > 0 ? "is-danger" : ""}>{s.overdueOrders ?? 0}</td>
                      <td className={s.openDisputes > 0 ? "is-warn" : ""}>{s.openDisputes ?? 0}</td>
                      <td>
                        <div className="lm-ao-actions">
                          {(s.openOrders || 0) > 0 && (
                            <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setOrdersTarget(s.store)}>
                              Orders
                            </button>
                          )}
                          {suspended ? (
                            <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setReinstateTarget(s)}>
                              Reinstate
                            </button>
                          ) : (
                            <button className="lm-btn lm-btn--ghost lm-btn--sm lm-ao-btn-danger" onClick={() => setSuspendTarget(s)}>
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="lm-ao-pager">
              <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>Page {page} of {pages}</span>
              <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!suspendTarget}
        title={`Suspend ${suspendTarget?.store?.name || "this store"}?`}
        message={
          suspendOpen > 0
            ? `This seller has ${plural(suspendOpen, "order", "orders")} in progress. They carry on, and the seller can still fulfil them. You can cancel them separately from the Orders button. The store and its products disappear from buyers straight away, and the seller will see your reason.`
            : "The store and its products disappear from buyers straight away, and the seller will see your reason. This seller has no orders in progress."
        }
        confirmLabel="Suspend store"
        cancelLabel="Keep active"
        danger
        askReason
        busy={busy}
        onConfirm={doSuspend}
        onClose={() => !busy && setSuspendTarget(null)}
      />

      <ConfirmDialog
        open={!!reinstateTarget}
        title={`Reinstate ${reinstateTarget?.store?.name || "this store"}?`}
        message="The store and its approved products will be visible to buyers again, and the seller will be told."
        confirmLabel="Reinstate store"
        cancelLabel="Not now"
        busy={busy}
        onConfirm={doReinstate}
        onClose={() => !busy && setReinstateTarget(null)}
      />

      {ordersTarget && (
        <OpenOrdersDialog
          store={ordersTarget}
          onClose={() => setOrdersTarget(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}