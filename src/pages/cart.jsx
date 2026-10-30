import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveCart } from "../services/orderService";
import { formatPrice, getImageUrl, getMinPrice, hasPriceRange } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/checkout.css";

const lineKey = (l) => `${l.productId}|${l.color || ""}|${l.size || ""}`;

function StoreLogo({ store }) {
  const name = store?.name || "Seller";
  return (
    <span className="lm-storebar__logo">
      {store?.logo ? <img src={getImageUrl(store.logo)} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { lines, addItem, setQuantity, removeLine } = useCart();
  const [data, setData] = useState({ groups: [], suggestions: [], subtotal: 0 });
  const [status, setStatus] = useState("loading");

  // Re-resolve whenever the cart contents change: server gives live price and stock.
  const signature = useMemo(() => (lines || []).map((l) => `${lineKey(l)}x${l.quantity}`).join(","), [lines]);

  useEffect(() => {
    if (!lines || lines.length === 0) {
      setData({ groups: [], suggestions: [], subtotal: 0 });
      setStatus("ready");
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
  }, [signature]);

  const allLines = data.groups.flatMap((g) => g.lines || []);
  const buyable = allLines.filter((l) => !l.unavailable);
  const subtotal = buyable.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const itemCount = buyable.reduce((s, l) => s + l.quantity, 0);
  const hasProblems = allLines.some((l) => l.unavailable);

  if (status === "loading") {
    return (
      <div className="lm-page"><div className="lm-wrap">
        <div className="lm-two">
          <div className="lm-skel" style={{ height: 320 }} />
          <div className="lm-skel" style={{ height: 240 }} />
        </div>
      </div></div>
    );
  }

  if (status === "error") {
    return (
      <div className="lm-page"><div className="lm-wrap">
        <div className="lm-empty">
          <h3>We couldn't load your cart</h3>
          <p>Your items are safe. Please try again.</p>
          <button className="lm-btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div></div>
    );
  }

  if (!lines || lines.length === 0) {
    return (
      <div className="lm-page"><div className="lm-wrap">
        <div className="lm-empty">
          <h3>Your cart is empty</h3>
          <p>Browse the shop and add something you like.</p>
          <Link to="/shop" className="lm-btn">Start shopping</Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <div className="lm-steps"><b>1 Cart</b><i /><span>2 Checkout</span><i /><span>3 Confirmation</span></div>
        <h1 className="lm-h1" style={{ marginBottom: 20 }}>Your cart <span className="lm-count">({itemCount} {itemCount === 1 ? "item" : "items"})</span></h1>

        <div className="lm-two">
          <div className="lm-stack">
            {hasProblems && (
              <div className="lm-alert lm-alert--warn">Some items are unavailable and won't be included in your order. Remove them to continue.</div>
            )}

            {data.groups.map((g, gi) => {
              const storeTotal = (g.lines || []).filter((l) => !l.unavailable).reduce((s, l) => s + l.unitPrice * l.quantity, 0);
              return (
                <section key={g.store?._id || gi} className="lm-panel">
                  <div className="lm-panel__head lm-storebar">
                    <StoreLogo store={g.store} />
                    <h2>{g.store?.name || g.seller?.name || "Independent seller"}</h2>
                    <span className="lm-storebar__sub">Subtotal {formatPrice(storeTotal)}</span>
                  </div>
                  {(g.lines || []).map((l) => {
                    const ref = { productId: l.productId, color: l.color || "", size: l.size || "" };
                    const changed = l.priceAtSelection != null && l.priceAtSelection !== l.unitPrice;
                    return (
                      <div key={lineKey(l)} className={`lm-line ${l.unavailable ? "is-unavailable" : ""}`}>
                        <img className="lm-line__img" src={getImageUrl(l.image)} alt="" />
                        <div>
                          <Link className="lm-line__title" to={`/products/${l.productId}`}>{l.title}</Link>
                          <div className="lm-line__meta">{[l.color, l.size].filter(Boolean).join(" · ") || "Standard"}</div>
                          {l.unavailable && <div style={{ marginTop: 8 }}><span className="lm-badge lm-badge--danger">{l.reason || "Unavailable"}</span></div>}
                          {changed && !l.unavailable && (
                            <div style={{ marginTop: 8 }}>
                              <span className="lm-badge lm-badge--warn">Price changed from {formatPrice(l.priceAtSelection)} to {formatPrice(l.unitPrice)}</span>
                            </div>
                          )}
                          {l.adjusted && !l.unavailable && (
                            <div style={{ marginTop: 8 }}><span className="lm-badge lm-badge--warn">Quantity reduced to available stock</span></div>
                          )}
                          <div className="lm-line__actions">
                            {!l.unavailable && (
                              <div className="lm-qty" role="group" aria-label={`Quantity for ${l.title}`}>
                                <button onClick={() => setQuantity(ref, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="Decrease quantity">−</button>
                                <span>{l.quantity}</span>
                                <button onClick={() => setQuantity(ref, l.quantity + 1)} disabled={l.quantity >= l.stock} aria-label="Increase quantity">+</button>
                              </div>
                            )}
                            <button className="lm-link" onClick={() => removeLine(ref)}>Remove</button>
                          </div>
                        </div>
                        <div className="lm-line__total">
                          {l.unavailable ? "—" : formatPrice(l.unitPrice * l.quantity)}
                          {!l.unavailable && l.quantity > 1 && <small>{formatPrice(l.unitPrice)} each</small>}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {data.suggestions.length > 0 && (
              <section>
                <h2 style={{ fontSize: 18, margin: "12px 0 14px" }}>You might also like</h2>
                <div className="lm-rail">
                  {data.suggestions.map((p) => {
                    const single = (p.variants || []).length === 1;
                    const v = p.variants?.[0];
                    return (
                      <div key={p._id} className="lm-mini">
                        <Link to={`/products/${p._id}`}><img src={getImageUrl(p.imgUrl)} alt="" loading="lazy" /></Link>
                        <div className="lm-mini__body">
                          <Link className="lm-mini__title" to={`/products/${p._id}`}>{p.title}</Link>
                          {p.store?.name && <span className="lm-mini__store">{p.store.name}</span>}
                          <span className="lm-price" style={{ fontSize: 14 }}>
                            {hasPriceRange(p) && <small>From</small>}{formatPrice(getMinPrice(p))}
                          </span>
                          {single ? (
                            <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => addItem({ productId: p._id, color: v.color || "", size: v.size || "", quantity: 1 })}>
                              Add to cart
                            </button>
                          ) : (
                            <Link className="lm-btn lm-btn--ghost lm-btn--sm" to={`/products/${p._id}`}>Choose options</Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="lm-panel lm-summary" aria-label="Order summary">
            <div className="lm-panel__head"><h2>Order summary</h2></div>
            <div className="lm-panel__body">
              <div className="lm-sum-row"><span>Items ({itemCount})</span><span>{formatPrice(subtotal)}</span></div>
              {data.groups.length > 1 && (
                <div className="lm-alert lm-alert--info" style={{ margin: "10px 0", fontSize: 13 }}>
                  Your items come from {data.groups.length} sellers and will ship separately.
                </div>
              )}
              <div className="lm-sum-row"><span>Delivery</span><span>Confirmed at checkout</span></div>
              <div className="lm-sum-total"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <button className="lm-btn lm-btn--block" style={{ marginTop: 18 }} disabled={hasProblems || buyable.length === 0} onClick={() => navigate("/checkout")}>
                Proceed to checkout
              </button>
              <Link to="/shop" className="lm-btn lm-btn--ghost lm-btn--block" style={{ marginTop: 10 }}>Continue shopping</Link>
              <p className="lm-secure">🔒 You'll sign in or create an account at checkout</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}