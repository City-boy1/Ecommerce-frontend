import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useNotify } from "../../hooks/useNotify";
import { getMyOrders } from "../../services/dashboardService";
import { cancelOrder } from "../../services/orderActions";
import { PageHeader, Tabs, StatusBadge, OrderTimeline, EmptyState, RowSkeleton, ErrorState } from "../../components/dashboard/ui";
import CancelDialog from "../../components/dashboard/CancelDialog";
import { BUYER_REASONS } from "../../utils/cancelReasons";
import { deriveOrderStatus, isLiveOrder } from "../../utils/orderStatus";
import { formatDate } from "../../utils/dateHelpers";
import { formatPrice, getImageUrl } from "../../utils/productHelpers";
import DeliveryConfirm from "../../components/dashboard/DeliveryConfirm";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

const TAB_MATCH = {
  all: () => true,
  active: (s) => isLiveOrder(s),
  completed: (s) => s === "completed",
  cancelled: (s) => s === "cancelled",
};

export default function MyOrders() {
  const notify = useNotify();
  const { data, loading, error, reload } = useFetch(getMyOrders, [], { interval: 45000 });
  const [tab, setTab] = useState("all");
  const [toggled, setToggled] = useState({});
  const [target, setTarget] = useState(null); // { order, sub }
  const [busy, setBusy] = useState(false);

  // Notification links open this page with ?order=<id>
  const [params] = useSearchParams();
  const focusId = params.get("order");
  const [highlight, setHighlight] = useState("");
  const handled = useRef("");

  useEffect(() => {
    if (!focusId || !data || handled.current === focusId) return;
    if (!data.some((o) => o._id === focusId)) return;
    handled.current = focusId;
    setTab("all");
    setToggled((t) => ({ ...t, [focusId]: true }));
    setHighlight(focusId);
    const scroll = setTimeout(() => {
      document.getElementById(`order-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    const fade = setTimeout(() => setHighlight(""), 4000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(fade);
    };
  }, [focusId, data]);

  const orders = useMemo(
    () => (data || []).map((o) => ({ ...o, derived: deriveOrderStatus(o.subOrders) })),
    [data]
  );

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(TAB_MATCH).map(([k, fn]) => [k, orders.filter((o) => fn(o.derived)).length])),
    [orders]
  );
  const shown = orders.filter((o) => TAB_MATCH[tab](o.derived));

  // placed    -> cancelled straight away
  // confirmed -> a request is sent to the seller (the server decides which)
  const confirmCancel = async ({ reasonCode, note }) => {
    const { order, sub } = target;
    setBusy(true);
    try {
      const res = await cancelOrder(order._id, sub._id, { reasonCode, note });
      notify.success(
        res.requested
          ? "Request sent. The seller has 24 hours to answer, or it is approved automatically."
          : "Order cancelled. Your items go back into stock."
      );
      setTarget(null);
      reload();
    } catch (e) {
      notify.error(e?.response?.data?.message || "We couldn't cancel this order. It may already be on its way.");
    } finally {
      setBusy(false);
    }
  };

  const isRequest = target?.sub?.status === "confirmed";

  return (
    <div className="lm-d">
      <PageHeader title="My orders" subtitle="Track every parcel. Each seller ships separately." />

      <Tabs
        label="Order status"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "active", label: "In progress", count: counts.active },
          { value: "completed", label: "Delivered", count: counts.completed },
          { value: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
      />

      {loading && <RowSkeleton rows={3} height={160} />}
      {!loading && error && !data && <ErrorState onRetry={reload} />}

      {!loading && data && shown.length === 0 && (
        <EmptyState
          title={tab === "all" ? "No orders yet" : "Nothing here"}
          text={tab === "all" ? "When you place an order it will show up here with live tracking." : "No orders match this filter."}
          action={tab === "all" ? <Link to="/shop" className="lm-btn">Start shopping</Link> : null}
        />
      )}

      <div className="lm-d-orders">
        {shown.map((o) => {
          const open = toggled[o._id] ?? isLiveOrder(o.derived);
          return (
            <article key={o._id} id={`order-${o._id}`} className={`lm-d-card ${highlight === o._id ? "lm-focus" : ""}`}>
              <div className="lm-order__head">
                <div>
                  <div className="lm-order__no">{o.orderNumber}</div>
                  <div className="lm-order__meta">{formatDate(o.createdAt)} · {o.subOrders?.length || 0} {o.subOrders?.length === 1 ? "seller" : "sellers"}</div>
                </div>
                <div className="lm-order__right">
                  <strong>{formatPrice(o.grandTotal)}</strong>
                  <StatusBadge status={o.derived} />
                  <Link className="lm-linkbtn" to={`/orders/${o._id}`}>Full details</Link>
                  <button className="lm-linkbtn" onClick={() => setToggled((t) => ({ ...t, [o._id]: !open }))} aria-expanded={open}>
                    {open ? "Hide details" : "Show details"}
                  </button>
                </div>
              </div>

              {open && (o.subOrders || []).map((so) => (
                <div key={so._id} className="lm-sub">
                  <div className="lm-sub__top">
                    <span className="lm-sub__store">{so.store?.name || "Seller"}</span>
                    <StatusBadge status={so.status} />
                  </div>
                  <OrderTimeline status={so.status} timeline={so.timeline} />
                  <div className="lm-items">
                    {(so.items || []).map((it, i) => (
                      <div key={i} className="lm-item">
                        <img src={getImageUrl(it.image)} alt="" />
                        <div>{it.title}<small>{[it.color, it.size].filter(Boolean).join(" · ")} · Qty {it.quantity}</small></div>
                        <strong>{formatPrice(it.lineTotal ?? it.unitPrice * it.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="lm-sub__actions">
                    {so.status === "placed" && (
                      <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setTarget({ order: o, sub: so })}>Cancel this order</button>
                    )}
                    {so.status === "confirmed" && !so.cancelRequest && (
                      <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setTarget({ order: o, sub: so })}>Request cancellation</button>
                    )}
                    {so.status === "confirmed" && so.cancelRequest?.status === "pending" && (
                      <span className="lm-order__meta">
                        Cancellation requested. The seller has until {formatDate(so.cancelRequest.autoApproveAt)} to answer.
                      </span>
                    )}
                    {so.status === "confirmed" && so.cancelRequest?.status === "refused" && (
                      <span className="lm-order__meta">The seller refused your request: {so.cancelRequest.respondNote}</span>
                    )}
                    {so.status === "delivered" && (so.items || []).map((it) => (
                      <Link key={it.product} to={`/products/${it.product}#reviews`} className="lm-btn lm-btn--ghost lm-btn--sm">
                        {(so.items || []).length > 1 ? `Review: ${it.title}` : "Review your purchase"}
                      </Link>
                    ))}
                    {so.status === "shipped" && <span className="lm-order__meta">On its way. The seller will mark it delivered.</span>}
                  </div>
                  <DeliveryConfirm orderId={o._id} subOrder={so} onChanged={reload} />
                </div>
              ))}
            </article>
          );
        })}
      </div>

      <CancelDialog
        open={!!target}
        title={isRequest ? "Request cancellation?" : "Cancel this order?"}
        message={
          isRequest
            ? `${target?.sub?.store?.name || "The seller"} has already confirmed this order, so they have 24 hours to answer. If they don't, it is cancelled automatically.`
            : `This cancels the items from ${target?.sub?.store?.name || "this seller"} only. You can't undo it.`
        }
        reasons={BUYER_REASONS}
        confirmLabel={isRequest ? "Send request" : "Yes, cancel it"}
        busy={busy}
        onConfirm={confirmCancel}
        onClose={() => !busy && setTarget(null)}
      />
    </div>
  );
}