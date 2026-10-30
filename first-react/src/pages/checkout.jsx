import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { resolveCart, placeOrder } from "../services/orderService";
import { formatPrice, getImageUrl } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/checkout.css";

const REGIONS = [
  "Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Western North", "Volta", "Oti",
  "Northern", "Savannah", "North East", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
];
const NETWORKS = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money"];
const PHONE_RE = /^(\+233|0)\d{9}$/;

function FieldBox({ errors, name, label, hint, children }) {
  return (
    <div className={`lm-field ${errors[name] ? "has-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {errors[name] ? <div className="lm-err" role="alert">{errors[name]}</div> : hint ? <div className="lm-hint">{hint}</div> : null}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { lines, clearCart } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()
  );

  // Prefilled from the buyer's saved profile (name, phone, address, delivery instructions).
  const [form, setForm] = useState(() => {
    const saved = user?.address && typeof user.address === "object" ? user.address : {};
    return {
      fullName: user?.name || "",
      phone: user?.phone || "",
      region: REGIONS.includes(saved.region) ? saved.region : "Greater Accra",
      city: saved.city || "",
      address: [saved.addressLine, saved.apartment].filter(Boolean).join(", "),
      notes: user?.deliveryInstructions || "",
      method: "mobile_money",
      network: NETWORKS[0],
      momoNumber: user?.phone || "",
    };
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!lines || lines.length === 0) {
      setStatus("empty");
      return;
    }
    let cancelled = false;
    resolveCart(lines)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <div className="lm-page"><div className="lm-wrap"><div className="lm-two"><div className="lm-skel" style={{ height: 420 }} /><div className="lm-skel" style={{ height: 300 }} /></div></div></div>;
  }
  if (status === "empty" || status === "error") {
    return (
      <div className="lm-page"><div className="lm-wrap">
        <div className="lm-empty">
          <h3>{status === "empty" ? "Your cart is empty" : "We couldn't load checkout"}</h3>
          <p>{status === "empty" ? "Add something before checking out." : "Please go back to your cart and try again."}</p>
          <Link to={status === "empty" ? "/shop" : "/cart"} className="lm-btn">{status === "empty" ? "Go to shop" : "Back to cart"}</Link>
        </div>
      </div></div>
    );
  }

  const groups = data.groups.map((g) => ({ ...g, lines: (g.lines || []).filter((l) => !l.unavailable) })).filter((g) => g.lines.length);
  const subtotal = groups.reduce((s, g) => s + g.lines.reduce((t, l) => t + l.unitPrice * l.quantity, 0), 0);
  const delivery = typeof data.deliveryFee === "number" ? data.deliveryFee : null;
  const total = subtotal + (delivery || 0);

  const validate = () => {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a valid Ghana number, e.g. 024 123 4567";
    if (!form.city.trim()) e.city = "Enter your town or city";
    if (form.address.trim().length < 5) e.address = "Enter a delivery address";
    if (form.method === "mobile_money" && !PHONE_RE.test(form.momoNumber.replace(/\s/g, ""))) e.momoNumber = "Enter the Mobile Money number to pay with";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) {
      document.querySelector(".has-error input, .has-error select")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const order = await placeOrder({
        idempotencyKey: idempotencyKey.current,
        address: { fullName: form.fullName.trim(), region: form.region, city: form.city.trim(), line1: form.address.trim(), notes: form.notes.trim() },
        phone: form.phone.replace(/\s/g, ""),
        payment: { method: form.method, network: form.method === "mobile_money" ? form.network : undefined, momoNumber: form.method === "mobile_money" ? form.momoNumber.replace(/\s/g, "") : undefined },
      });
      clearCart();
      navigate(`/orders/${order._id || order.id}/confirmation`, { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || "We couldn't place your order. You have not been charged. Please try again.");
      setSubmitting(false);
    }
  };


  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <div className="lm-steps"><Link to="/cart" style={{ color: "inherit" }}>1 Cart</Link><i /><b>2 Checkout</b><i /><span>3 Confirmation</span></div>
        <h1 className="lm-h1" style={{ marginBottom: 20 }}>Checkout</h1>

        <form className="lm-two" onSubmit={submit} noValidate>
          <div className="lm-stack">
            <section className="lm-panel">
              <div className="lm-panel__head"><h2>Delivery details</h2></div>
              <div className="lm-panel__body lm-form">
                <div className="lm-form-2">
                  <FieldBox errors={errors} name="fullName" label="Full name">
                    <input id="fullName" className="lm-input" value={form.fullName} onChange={set("fullName")} autoComplete="name" />
                  </FieldBox>
                  <FieldBox errors={errors} name="phone" label="Phone number" hint="The rider will call this number">
                    <input id="phone" className="lm-input" value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="024 123 4567" />
                  </FieldBox>
                </div>
                <div className="lm-form-2">
                  <FieldBox errors={errors} name="region" label="Region">
                    <select id="region" className="lm-select" value={form.region} onChange={set("region")}>
                      {REGIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox errors={errors} name="city" label="Town / city">
                    <input id="city" className="lm-input" value={form.city} onChange={set("city")} autoComplete="address-level2" />
                  </FieldBox>
                </div>
                <FieldBox errors={errors} name="address" label="Address" hint="Street, house number or GhanaPost GPS code">
                  <input id="address" className="lm-input" value={form.address} onChange={set("address")} autoComplete="street-address" />
                </FieldBox>
                <FieldBox errors={errors} name="notes" label="Delivery notes (optional)">
                  <input id="notes" className="lm-input" value={form.notes} onChange={set("notes")} placeholder="Landmark, gate colour, best time to call" />
                </FieldBox>
              </div>
            </section>

            <section className="lm-panel">
              <div className="lm-panel__head"><h2>Payment</h2></div>
              <div className="lm-panel__body lm-form">
                <div className="lm-alert lm-alert--info">Test mode: no real money is charged while we set things up.</div>
                <div className="lm-pay" role="radiogroup" aria-label="Payment method">
                  <label>
                    <input type="radio" name="method" checked={form.method === "mobile_money"} onChange={() => setForm((f) => ({ ...f, method: "mobile_money" }))} />
                    <span>Mobile Money<small>MTN, Telecel or AirtelTigo</small></span>
                  </label>
                  <label>
                    <input type="radio" name="method" checked={form.method === "card"} onChange={() => setForm((f) => ({ ...f, method: "card" }))} />
                    <span>Card<small>Visa or Mastercard</small></span>
                  </label>
                </div>
                {form.method === "mobile_money" && (
                  <div className="lm-form-2">
                    <FieldBox errors={errors} name="network" label="Network">
                      <select id="network" className="lm-select" value={form.network} onChange={set("network")}>
                        {NETWORKS.map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </FieldBox>
                    <FieldBox errors={errors} name="momoNumber" label="Mobile Money number">
                      <input id="momoNumber" className="lm-input" value={form.momoNumber} onChange={set("momoNumber")} inputMode="tel" placeholder="024 123 4567" />
                    </FieldBox>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lm-panel lm-summary" aria-label="Order summary">
            <div className="lm-panel__head"><h2>Order summary</h2></div>
            <div className="lm-panel__body">
              {groups.map((g, gi) => (
                <div key={g.store?._id || gi}>
                  <div className="lm-group-title">{g.store?.name || "Independent seller"}</div>
                  {g.lines.map((l) => (
                    <div key={`${l.productId}|${l.color}|${l.size}`} className="lm-mini-item">
                      <img src={getImageUrl(l.image)} alt="" />
                      <div>{l.title}<small>{[l.color, l.size].filter(Boolean).join(" · ")} · Qty {l.quantity}</small></div>
                      <strong>{formatPrice(l.unitPrice * l.quantity)}</strong>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div className="lm-sum-row"><span>Items</span><span>{formatPrice(subtotal)}</span></div>
                <div className="lm-sum-row"><span>Delivery</span><span>{delivery == null ? "Confirmed on order" : delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
                <div className="lm-sum-total"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              {groups.length > 1 && <div className="lm-alert lm-alert--info" style={{ marginTop: 14, fontSize: 13 }}>Ships separately from {groups.length} sellers.</div>}
              {serverError && <div className="lm-alert lm-alert--danger" role="alert" style={{ marginTop: 14 }}>{serverError}</div>}
              <button type="submit" className="lm-btn lm-btn--block" style={{ marginTop: 18 }} disabled={submitting}>
                {submitting ? "Placing order…" : `Pay ${formatPrice(total)}`}
              </button>
              <p className="lm-secure">🔒 Prices and stock are checked again when you pay</p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}