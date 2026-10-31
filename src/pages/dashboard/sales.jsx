import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useNotify } from "../../hooks/useNotify";
import { getSellerOrders, updateSellerOrderStatus } from "../../services/dashboardService";
import { PageHeader, Tabs, StatusBadge, OrderTimeline, EmptyState, RowSkeleton, ErrorState, ConfirmDialog } from "../../components/dashboard/ui";
import { nextStatus, canCancel, SELLER_ACTION_LABEL, STATUS_LABEL } from "../../utils/orderStatus";
import { formatDate, timeAgo } from "../../utils/dateHelpers";
import { formatPrice, getImageUrl } from "../../utils/productHelpers";
import DisputeBadge from "../../components/dashboard/DisputeBadge";
import { cancelAsSeller, respondToCancelRequest } from "../../services/orderActions";
import CancelDialog from "../../components/dashboard/CancelDialog";
import { SELLER_REASONS } from "../../utils/cancelReasons";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

const TABS = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const TAB_NAME = { placed: "New", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export default function Sales() {
  const notify = useNotify();
  // polled so new orders appear without a refresh
  const { data, setData, loading, error, reload } = useFetch(getSellerOrders, [], { interval: 30000 });
  const [tab, setTab] = useState("placed");
  const [pending, setPending] = useState({});
  const [declining, setDeclining] = useState(null);

    const [refusing, setRefusing] = useState(null);

  const sellerCancel = async ({ reasonCode, note }) => {
    const order = declining;
    if (!order || pending[order._id]) return;
    setPending((p) => ({ ...p, [order._id]: true }));
    try {
      await cancelAsSeller(order._id, { reasonCode, note });
      notify.success("Order cancelled. Stock was returned.");
      setDeclining(null);
      reload();
    } catch (e) {
      notify.error(e?.response?.data?.message || "We couldn't cancel that order. Please try again.");
    } finally {
      setPending((p) => ({ ...p, [order._id]: false }));
    }
  };

  const answerRequest = async (order, action, note) => {
    if (pending[order._id]) return;
    setPending((p) => ({ ...p, [order._id]: true }));
    try {
      await respondToCancelRequest(order._id, { action, note });
      notify.success(action === "approve" ? "Order cancelled. Stock was returned." : "Request refused. The buyer was told why.");
      setRefusing(null);
      reload();
    } catch (e) {
      notify.error(e?.response?.data?.message || "We couldn't answer that request. Please try again.");
    } finally {
      setPending((p) => ({ ...p, [order._id]: false }));
    }
  };

  const [params] = useSearchParams();
const focusId = params.get("sub");
const [highlight, setHighlight] = useState("");
const handled = useRef("");

useEffect(() => {
  if (!focusId || !data || handled.current === focusId) return;
  const target = data.find((o) => o._id === focusId);
  if (!target) return;
  handled.current = focusId;
  setTab(target.status); // open the tab this order is actually in
  setHighlight(focusId);
  const scroll = setTimeout(() => {
    document.getElementById(`order-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 150);
  const fade = setTimeout(() => setHighlight(""), 4000);
  return () => { clearTimeout(scroll); clearTimeout(fade); };
}, [focusId, data]);

  const orders = data || [];
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, orders.filter((o) => o.status === t).length])), [orders]);
  const shown = orders.filter((o) => o.status === tab);

  const move = async (order, status, note) => {
    if (pending[order._id]) return;
    const prev = data;
    setPending((p) => ({ ...p, [order._id]: true }));
    setData(prev.map((o) => (o._id !== order._id ? o : {
      ...o,
      status,
      timeline: [...(o.timeline || []), { status, at: new Date().toISOString(), note }],
    })));
    try {
      await updateSellerOrderStatus(order._id, status, note);
      notify.success(status === "cancelled" ? "Order declined. Stock was returned." : `${order.orderNumber} marked as ${STATUS_LABEL[status].toLowerCase()}.`);
      if (status !== "cancelled") setTab(status); // follow the order to its new tab
      reload();
    } catch (e) {
      setData(prev);
      notify.error(e?.response?.data?.message || "We couldn't update that order. Please try again.");
    } finally {
      setPending((p) => ({ ...p, [order._id]: false }));
      setDeclining(null);
    }
  };

  return (
    <div className="lm-d">
      <PageHeader title="Incoming orders" subtitle="Move each order forward as you prepare it. Buyers are notified at every step." />

      <Tabs label="Order status" value={tab} onChange={setTab} tabs={TABS.map((t) => ({ value: t, label: TAB_NAME[t], count: counts[t] }))} />

      {loading && <RowSkeleton rows={3} height={180} />}
      {!loading && error && !data && <ErrorState onRetry={reload} />}

      {!loading && data && shown.length === 0 && (
        <EmptyState
          title={tab === "placed" ? "No new orders" : `No ${TAB_NAME[tab].toLowerCase()} orders`}
          text={tab === "placed" ? "New orders appear here automatically." : "Orders will show up here as they move along."}
        />
      )}

      <div className="lm-d-orders">
        {shown.map((o) => {
          const next = nextStatus(o.status);
          const addr = o.address || {};
          return (
            <article key={o._id} id={`order-${o._id}`} className={`lm-d-card ${highlight === o._id ? "lm-focus" : ""}`}>
              <div className="lm-order__head">
                <div>
                  <div className="lm-order__no">{o.orderNumber}</div>
                  <div className="lm-order__meta">{formatDate(o.createdAt)} · {timeAgo(o.createdAt)}</div>
                </div>
                <div className="lm-order__right">
                  <strong>{formatPrice(o.subtotal)}</strong>
                  <DisputeBadge dispute={o.dispute} onChanged={reload} />
                  <StatusBadge status={o.status} />
                </div>
              </div>

              <div className="lm-sub">
                <OrderTimeline status={o.status} timeline={o.timeline} />
                <div className="lm-items">
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="lm-item">
                      <img src={getImageUrl(it.image)} alt="" />
                      <div>{it.title}<small>{[it.color, it.size].filter(Boolean).join(" · ")} · Qty {it.quantity}</small></div>
                      <strong>{formatPrice(it.lineTotal ?? it.unitPrice * it.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="lm-buyer">
                  <strong>{o.buyer?.name || addr.fullName || "Buyer"}</strong>
                  {o.phone && <> · <a href={`tel:${o.phone}`}>{o.phone}</a></>}
                  <br />
                  {[addr.line1, addr.city, addr.region].filter(Boolean).join(", ")}
                  {addr.notes && <><br /><em>Note: {addr.notes}</em></>}
                </div>
                                {o.cancelRequest?.status === "pending" && (
                  <div className="lm-ao-confirm lm-ao-confirm--open">
                    <div>
                      The buyer asked to cancel: {o.cancelRequest.reason}
                      <small>Answer by {formatDate(o.cancelRequest.autoApproveAt)}, or it is approved automatically.</small>
                    </div>
                    <div className="lm-ao-confirm__btns">
                      <button className="lm-btn lm-btn--sm" disabled={!!pending[o._id]} onClick={() => answerRequest(o, "approve")}>Approve</button>
                      <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={!!pending[o._id]} onClick={() => setRefusing(o)}>Refuse</button>
                    </div>
                  </div>
                )}
                {(next || canCancel(o.status)) && (
                  <div className="lm-sub__actions">
                    {next && o.cancelRequest?.status !== "pending" && (
                      <button className="lm-btn lm-btn--sm" disabled={!!pending[o._id]} onClick={() => move(o, next)}>
                        {pending[o._id] ? "Updating…" : SELLER_ACTION_LABEL[next]}
                      </button>
                    )}
                    {canCancel(o.status) && (
                      <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={!!pending[o._id]} onClick={() => setDeclining(o)}>
                        {o.status === "placed" ? "Decline order" : "Cancel order"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

            <CancelDialog
        open={!!declining}
        title={declining?.status === "confirmed" ? "Cancel this confirmed order?" : "Decline this order?"}
        message="The buyer is told and the items return to your stock."
        warning={declining?.status === "confirmed" ? "You already confirmed this order, so cancelling it counts against your cancel rate." : ""}
        reasons={SELLER_REASONS}
        confirmLabel={declining?.status === "confirmed" ? "Cancel order" : "Decline order"}
        busy={declining ? !!pending[declining._id] : false}
        onConfirm={sellerCancel}
        onClose={() => setDeclining(null)}
      />

      <ConfirmDialog
        open={!!refusing}
        title="Refuse this cancellation request?"
        message="Tell the buyer why you can't cancel. The order stays confirmed and you need to ship it."
        confirmLabel="Refuse request"
        cancelLabel="Back"
        danger
        askReason
        busy={refusing ? !!pending[refusing._id] : false}
        onConfirm={(note) => answerRequest(refusing, "refuse", note)}
        onClose={() => setRefusing(null)}
      />
    </div>
  );
}