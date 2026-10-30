import { useState } from "react";
import { ConfirmDialog, ErrorState, RowSkeleton } from "./ui";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useNotify } from "../../hooks/useNotify";
import { cancelSubOrder, getSellerOpenOrders } from "../../services/adminService";
import { formatPrice } from "../../utils/productHelpers";
import { formatShort } from "../../utils/dateHelpers";
import { STATUS_LABEL } from "../../utils/orderStatus";
import apiMessage from "../../utils/apiMessage";

// Admin: lists a seller's open sub-orders and lets the admin cancel them one by one (Part 3 §6.2).
// Cancelling is never automatic on suspend. Each cancel needs a reason.
export default function OpenOrdersDialog({ store, onClose, onChanged }) {
  const notify = useNotify();
  const { data, loading, error, reload } = useAdminFetch(() => getSellerOpenOrders(store._id), [store._id]);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const orders = data?.orders || [];

  const cancel = async (reason) => {
    if (!target) return;
    setBusy(true);
    try {
      await cancelSubOrder(target._id, reason);
      notify.success(`Order ${target.orderNumber} was cancelled.`);
      setTarget(null);
      await reload();
      onChanged?.();
    } catch (e) {
      notify.error(apiMessage(e, "We couldn't cancel that order."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="lm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="lm-modal lm-ao-modal--wide" role="dialog" aria-modal="true" aria-labelledby="lm-oo-title">
          <h2 id="lm-oo-title">Open orders · {store.name}</h2>
          <p>
            Cancelling restores stock, refunds the buyer (simulated for now) and notifies both sides. Orders already
            delivered can't be cancelled.
          </p>

          {loading && <RowSkeleton rows={3} height={56} />}
          {!loading && error && <ErrorState onRetry={reload} />}
          {!loading && !error && orders.length === 0 && <p>No open orders. Nothing left to cancel.</p>}

          {!loading &&
            !error &&
            orders.map((o) => (
              <div className="lm-ao-orderrow" key={o._id}>
                <div>
                  <strong>{o.orderNumber}</strong> · {STATUS_LABEL[o.status] || o.status}
                  <p>
                    {o.buyer?.name || "Buyer"} · {formatShort(o.createdAt)} · {formatPrice(o.subtotal)}
                  </p>
                </div>
                <button className="lm-btn lm-btn--ghost lm-btn--sm lm-ao-btn-danger" onClick={() => setTarget(o)}>
                  Cancel order
                </button>
              </div>
            ))}

          <div className="lm-modal__actions">
            <button className="lm-btn lm-btn--ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!target}
        title={`Cancel order ${target?.orderNumber || ""}?`}
        message="The buyer and seller will both see this reason."
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        danger
        askReason
        busy={busy}
        onConfirm={cancel}
        onClose={() => !busy && setTarget(null)}
      />
    </>
  );
}