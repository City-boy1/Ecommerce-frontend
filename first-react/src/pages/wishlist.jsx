import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { resolveWishlist } from "../services/wishlistService";
import ProductCard from "../components/shop/ProductCard";
import { isInStock } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";

export default function Wishlist() {
  const { ids, has, retain, clear } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [missing, setMissing] = useState([]);
  const [added, setAdded] = useState({});
  const initialIds = useRef(ids);

  const load = () => {
    const wanted = initialIds.current;
    if (wanted.length === 0) {
      setProducts([]);
      setStatus("ready");
      return () => {};
    }
    let cancelled = false;
    setStatus("loading");
    resolveWishlist(wanted)
      .then((list) => {
        if (cancelled) return;
        const found = new Set(list.map((p) => String(p._id)));
        setProducts(list);
        setMissing(wanted.filter((id) => !found.has(id)));
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Items un-hearted on this page disappear straight away, without a refetch.
  const shown = products.filter((p) => has(p._id));

  const addToCart = (p) => {
    const v = p.variants[0];
    addItem({ productId: p._id, color: v.color || "", size: v.size || "", quantity: 1 });
    setAdded((a) => ({ ...a, [p._id]: true }));
  };

  const removeUnavailable = () => {
    retain(ids.filter((id) => !missing.includes(id)));
    setMissing([]);
  };

  const clearAll = () => {
    if (window.confirm("Remove everything from your wishlist?")) {
      clear();
      setMissing([]);
    }
  };

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <div className="lm-shop-head">
          <div>
            <h1 className="lm-h1">Wishlist</h1>
            <p className="lm-sub">
              {status === "ready" ? `${shown.length} saved ${shown.length === 1 ? "item" : "items"}` : "Items you've saved for later"}
            </p>
          </div>
          {shown.length > 0 && (
            <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={clearAll}>Clear wishlist</button>
          )}
        </div>

        {status === "loading" && (
          <div className="lm-grid">
            {Array.from({ length: Math.min(initialIds.current.length || 4, 8) }).map((_, i) => (
              <div key={i} className="lm-skel" style={{ aspectRatio: "3/4" }} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="lm-empty">
            <h3>We couldn't load your wishlist</h3>
            <p>Your saved items are safe. Please try again.</p>
            <button className="lm-btn" onClick={load}>Retry</button>
          </div>
        )}

        {status === "ready" && missing.length > 0 && (
          <div className="lm-alert lm-alert--warn" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span>{missing.length} saved {missing.length === 1 ? "item is" : "items are"} no longer available.</span>
            <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={removeUnavailable}>Remove {missing.length === 1 ? "it" : "them"}</button>
          </div>
        )}

        {status === "ready" && shown.length === 0 && (
          <div className="lm-empty">
            <h3>Your wishlist is empty</h3>
            <p>Tap the heart on any product to save it here for later.</p>
            <Link to="/shop" className="lm-btn">Browse the shop</Link>
          </div>
        )}

        {status === "ready" && shown.length > 0 && (
          <div className="lm-grid">
            {shown.map((p) => {
              const out = !isInStock(p);
              const single = (p.variants || []).length === 1;
              return (
                <div key={p._id} className="lm-wish-item">
                  <ProductCard product={p} />
                  {out ? (
                    <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled>Sold out</button>
                  ) : added[p._id] ? (
                    <Link to="/cart" className="lm-btn lm-btn--ghost lm-btn--sm">Added · View cart</Link>
                  ) : single ? (
                    <button className="lm-btn lm-btn--sm" onClick={() => addToCart(p)}>Add to cart</button>
                  ) : (
                    <Link to={`/products/${p._id}`} className="lm-btn lm-btn--sm">Choose options</Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}