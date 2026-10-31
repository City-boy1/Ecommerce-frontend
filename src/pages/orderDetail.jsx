import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { getOrder } from "../services/orderService";
import { PageHeader, StatusBadge, OrderTimeline, EmptyState, RowSkeleton, ErrorState } from "../components/dashboard/ui";
import DeliveryConfirm from "../components/dashboard/DeliveryConfirm";
import { deriveOrderStatus } from "../utils/orderStatus";
import { formatDate } from "../utils/dateHelpers";
import { formatPrice, getImageUrl } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/dashboardUi.css";
import "../css/orderDetail.css";

const METHOD_LABEL = { mobile_money: "Mobile Money", card: "Card" };
const PAYMENT_LABEL = { paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded" };

// getOrder may return { order } or the order itself, so accept both
const load = (id) => getOrder(id).then((d) => d?.order || d);

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, loading, error, reload } = useFetch(() => load(id), [id], { interval: 45000 });

  if (loading && !order) {
    return (
      <div className="lm-d lm-od">
        <RowSkeleton rows={3} height={140} />
      </div>
    );
  }

  if (error && !order) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="lm-d lm-od">
        {notFound ? (
          <EmptyState
            title="Order not found"
            text="This order doesn't exist, or it belongs to another account."
            action={<Link to="/dashboard/orders" className="lm-btn">Go to my orders</Link>}
          />
        ) : (
          <ErrorState onRetry={reload} />
        )}
      </div>
    );
  }

  if (!order) return null;

  const subs = order.subOrders || [];
  const status = order.status || deriveOrderStatus(subs);
  const addr = order.address || {};
  const pay = order.payment || {};

  return (
    <div className="lm-d lm-od">
      <p className="lm-od__back">
        <Link to="/dashboard/orders">← Back to my orders</Link>
      </p>

      <PageHeader title={`Order ${order.orderNumber}`} subtitle={`Placed on ${formatDate(order.createdAt)}`} />

      <section className="lm-d-card lm-od__summary">
        <div>
          <span className="lm-od__label">Status</span>
          <StatusBadge status={status} />
        </div>
        <div>
          <span className="lm-od__label">Total</span>
          <strong>{formatPrice(order.grandTotal)}</strong>
        </div>
        <div>
          <span className="lm-od__label">Sellers</span>
          <strong>{subs.length}</strong>
        </div>
      </section>

      {subs.map((so) => (
        <section key={so._id} className="lm-d-card lm-sub">
          <div className="lm-sub__top">
            <span className="lm-sub__store">{so.store?.name || "Seller"}</span>
            <StatusBadge status={so.status} />
          </div>

          <OrderTimeline status={so.status} timeline={so.timeline} />

          <div className="lm-items">
            {(so.items || []).map((it, i) => (
              <div key={i} className="lm-item">
                <img src={getImageUrl(it.image)} alt="" />
                <div>
                  {it.product ? <Link to={`/products/${it.product}`}>{it.title}</Link> : it.title}
                  <small>{[it.color, it.size].filter(Boolean).join(" · ")} · Qty {it.quantity}</small>
                </div>
                <strong>{formatPrice(it.lineTotal ?? it.unitPrice * it.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="lm-od__row">
            <span>Items from this seller</span>
            <strong>{formatPrice(so.subtotal)}</strong>
          </div>

          {so.status === "confirmed" && so.cancelRequest?.status === "pending" && (
            <p className="lm-order__meta">
              You asked to cancel this. The seller has until {formatDate(so.cancelRequest.autoApproveAt)} to answer.
            </p>
          )}
          {so.status === "confirmed" && so.cancelRequest?.status === "refused" && (
            <p className="lm-order__meta">The seller refused your cancellation request: {so.cancelRequest.respondNote}</p>
          )}
          {so.status === "cancelled" && so.timeline?.length > 0 && (
            <p className="lm-order__meta">
              Cancelled{so.timeline[so.timeline.length - 1]?.note ? `: ${so.timeline[so.timeline.length - 1].note}` : "."}
            </p>
          )}

          <div className="lm-sub__actions">
            {["placed", "confirmed"].includes(so.status) && (
              <Link to={`/dashboard/orders?order=${order._id}`} className="lm-btn lm-btn--ghost lm-btn--sm">
                Cancel or manage in my orders
              </Link>
            )}
            {so.status === "delivered" &&
              (so.items || []).filter((it) => it.product).map((it) => (
                <Link key={it.product} to={`/products/${it.product}#reviews`} className="lm-btn lm-btn--ghost lm-btn--sm">
                  {subs.length === 1 && (so.items || []).length === 1 ? "Review your purchase" : `Review: ${it.title}`}
                </Link>
              ))}
          </div>

          <DeliveryConfirm orderId={order._id} subOrder={so} onChanged={reload} />
        </section>
      ))}

      <div className="lm-od__grid">
        <section className="lm-d-card">
          <h3>Delivery</h3>
          <p>
            <strong>{addr.fullName}</strong>
            <br />
            {[addr.line1, addr.city, addr.region].filter(Boolean).join(", ")}
            {order.phone && (
              <>
                <br />
                {order.phone}
              </>
            )}
          </p>
          {addr.notes && <p className="lm-order__meta">Note: {addr.notes}</p>}
        </section>

        <section className="lm-d-card">
          <h3>Payment</h3>
          <div className="lm-od__row">
            <span>Method</span>
            <strong>
              {METHOD_LABEL[pay.method] || pay.method || "-"}
              {pay.network ? ` · ${pay.network}` : ""}
              {pay.momoLast4 ? ` ····${pay.momoLast4}` : ""}
            </strong>
          </div>
          <div className="lm-od__row">
            <span>Status</span>
            <strong>{PAYMENT_LABEL[pay.status] || pay.status || "-"}</strong>
          </div>
          {pay.paidAt && (
            <div className="lm-od__row">
              <span>Paid on</span>
              <strong>{formatDate(pay.paidAt)}</strong>
            </div>
          )}
          {pay.reference && (
            <div className="lm-od__row">
              <span>Reference</span>
              <strong>{pay.reference}</strong>
            </div>
          )}
          {pay.provider === "simulated" && <p className="lm-order__meta">Test mode: no real money was charged.</p>}

          <hr className="lm-od__hr" />
          <div className="lm-od__row">
            <span>Items</span>
            <strong>{formatPrice(order.itemsTotal)}</strong>
          </div>
          <div className="lm-od__row">
            <span>Delivery</span>
            <strong>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Confirmed on order"}</strong>
          </div>
          <div className="lm-od__row lm-od__row--total">
            <span>Total</span>
            <strong>{formatPrice(order.grandTotal)}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}