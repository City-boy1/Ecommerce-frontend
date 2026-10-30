import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../services/orderService";
import { formatPrice, getImageUrl } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/checkout.css";

const STATUS_LABEL = { placed: "Order placed", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const STATUS_CLASS = { delivered: "lm-badge--ok", cancelled: "lm-badge--danger", placed: "lm-badge--warn" };

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    getOrder(id)
      .then((o) => !cancelled && (setOrder(o), setStatus("ready")))
      .catch(() => !cancelled && setStatus("error"));
    return () => { cancelled = true; };
  }, [id]);

  if (status === "loading") return <div className="lm-page"><div className="lm-wrap"><div className="lm-confirm"><div className="lm-skel" style={{ height: 360 }} /></div></div></div>;
  if (status === "error") {
    return (
      <div className="lm-page"><div className="lm-wrap"><div className="lm-empty">
        <h3>We couldn't find that order</h3>
        <p>Check My orders to see all your purchases.</p>
        <Link to="/dashboard/orders" className="lm-btn">My orders</Link>
      </div></div></div>
    );
  }

  const subOrders = order.subOrders || [];
  const addr = order.address || {};
  const pay = order.payment || {};

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <div className="lm-confirm">
          <div className="lm-confirm__hero">
            <div className="lm-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <h1 className="lm-h1">Thank you for your order</h1>
            <p className="lm-sub">We've sent the details to each seller. You'll be notified as your items move.</p>
            <span className="lm-confirm__no">{order.orderNumber}</span>
          </div>

          <div className="lm-stack">
            {subOrders.map((so) => (
              <section key={so._id} className="lm-panel">
                <div className="lm-panel__head lm-storebar">
                  <span className="lm-storebar__logo">
                    {so.store?.logo ? <img src={getImageUrl(so.store.logo)} alt="" /> : (so.store?.name || "S").slice(0, 1).toUpperCase()}
                  </span>
                  <h2>Shipped by {so.store?.name || "seller"}</h2>
                  <span className={`lm-badge ${STATUS_CLASS[so.status] || ""}`} style={{ marginLeft: "auto" }}>{STATUS_LABEL[so.status] || so.status}</span>
                </div>
                <div className="lm-panel__body">
                  {so.items.map((it, i) => (
                    <div key={i} className="lm-mini-item">
                      <img src={getImageUrl(it.image)} alt="" />
                      <div>{it.title}<small>{[it.color, it.size].filter(Boolean).join(" · ")} · Qty {it.quantity}</small></div>
                      <strong>{formatPrice(it.lineTotal ?? it.unitPrice * it.quantity)}</strong>
                    </div>
                  ))}
                  <div className="lm-sum-row" style={{ marginTop: 8 }}><span>Seller subtotal</span><span>{formatPrice(so.subtotal)}</span></div>
                </div>
              </section>
            ))}

            <div className="lm-form-2">
              <section className="lm-panel"><div className="lm-panel__head"><h2>Delivering to</h2></div>
                <div className="lm-panel__body" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <strong>{addr.fullName}</strong><br />{addr.line1}<br />{[addr.city, addr.region].filter(Boolean).join(", ")}<br />{order.phone}
                </div>
              </section>
              <section className="lm-panel"><div className="lm-panel__head"><h2>Payment</h2></div>
                <div className="lm-panel__body">
                  <div className="lm-sum-row"><span>Items</span><span>{formatPrice(order.itemsTotal)}</span></div>
                  <div className="lm-sum-row"><span>Delivery</span><span>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"}</span></div>
                  <div className="lm-sum-total"><span>Total</span><span>{formatPrice(order.grandTotal)}</span></div>
                  <p className="lm-secure" style={{ textAlign: "left" }}>
                    {(pay.method || "").replace("_", " ")} · {pay.status}{pay.provider === "simulated" ? " · test mode, no real money charged" : ""}
                  </p>
                </div>
              </section>
            </div>
          </div>

          <div className="lm-actions">
            <Link to="/dashboard/orders" className="lm-btn">Track my order</Link>
            <Link to="/shop" className="lm-btn lm-btn--ghost">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
