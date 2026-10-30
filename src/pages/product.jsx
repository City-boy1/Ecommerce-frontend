import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductDetail } from "../services/shopService";
import { useCart } from "../context/CartContext";
import StarRating from "../components/shop/StarRating";
import HeartButton from "../components/shop/heartButton";
import ProductCard from "../components/shop/ProductCard";
import ReviewForm from "../components/shop/ReviewForm";
import { formatPrice, getImageUrl, getMinPrice, getMaxPrice, hasPriceRange } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";

const unique = (arr) => [...new Set(arr.filter(Boolean))];

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading");
  const [imgIndex, setImgIndex] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setImgIndex(0);
    setAdded(false);
    getProductDetail(id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        const first = (d.product.variants || []).find((v) => v.stock > 0) || (d.product.variants || [])[0];
        setColor(first?.color || "");
        setSize(first?.size || "");
        setQty(1);
        setStatus("ready");
      })
      .catch((e) => !cancelled && setStatus(e?.response?.status === 404 ? "missing" : "error"));
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const product = detail?.product;
  const variants = product?.variants || [];
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);
  const sizesForColor = useMemo(
    () => variants.filter((v) => !color || v.color === color),
    [variants, color]
  );
  const variant = variants.find((v) => (v.color || "") === color && (v.size || "") === size);
  const maxQty = variant ? Math.max(0, variant.stock) : 0;

  // keep the chosen size valid when colour changes
  useEffect(() => {
    if (!variants.length) return;
    if (!sizesForColor.some((v) => (v.size || "") === size)) {
      const next = sizesForColor.find((v) => v.stock > 0) || sizesForColor[0];
      setSize(next?.size || "");
    }
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (qty > maxQty && maxQty > 0) setQty(maxQty);
  }, [maxQty, qty]);

  useEffect(() => {
  if (status === "ready" && window.location.hash === "#reviews") {
    document.getElementById("reviews")?.scrollIntoView();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="lm-page">
        <div className="lm-wrap">
          <div className="lm-pd">
            <div className="lm-skel" style={{ aspectRatio: "1/1" }} />
            <div style={{ display: "grid", gap: 14 }}>
              <div className="lm-skel" style={{ height: 36 }} />
              <div className="lm-skel" style={{ height: 28, width: "40%" }} />
              <div className="lm-skel" style={{ height: 120 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status !== "ready") {
    return (
      <div className="lm-page">
        <div className="lm-wrap">
          <div className="lm-empty">
            <h3>{status === "missing" ? "This product isn't available" : "Something went wrong"}</h3>
            <p>{status === "missing" ? "It may have been removed or is still under review." : "Please try again."}</p>
            <Link to="/shop" className="lm-btn">Back to shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const refreshDetail = () => getProductDetail(id).then(setDetail).catch(() => {});
  const { seller, store, reviews, moreFromStore, related } = detail;
  const images = product.images?.length ? product.images : [product.imgUrl];
  const storeName = store?.name || seller?.name || "Independent seller";
  const storeId = store?._id;
  const category = product.category?.name || (typeof product.category === "string" ? product.category : "");

  const handleAdd = () => {
    setError("");
    if (!variant || variant.stock < 1) {
      setError("Please choose an available option.");
      return;
    }
    try {
      addItem({ productId: product._id, color: variant.color || "", size: variant.size || "", quantity: qty });
      setAdded(true);
    } catch {
      setError("Could not add to cart. Please try again.");
    }
  };

  const price = variant ? formatPrice(variant.price) : (
    <>
      {hasPriceRange(product) && <small style={{ fontSize: 14, fontWeight: 500, color: "var(--inv-muted)", marginRight: 6 }}>From</small>}
      {formatPrice(getMinPrice(product))}
      {hasPriceRange(product) && <span style={{ color: "var(--inv-muted)", fontWeight: 500 }}> – {formatPrice(getMaxPrice(product))}</span>}
    </>
  );

  const stockBadge = !variant
    ? null
    : variant.stock < 1
    ? <span className="lm-badge lm-badge--out">Sold out</span>
    : variant.stock <= 5
    ? <span className="lm-badge lm-badge--warn">Only {variant.stock} left</span>
    : <span className="lm-badge lm-badge--ok">In stock</span>;

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <nav className="lm-crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Shop</Link>
          {category && (<><span>/</span><Link to={`/shop?category=${encodeURIComponent(product.category?.slug || category)}`}>{category}</Link></>)}
          <span>/</span>
          <span aria-current="page">{product.title}</span>
        </nav>

        <div className="lm-pd">
          <div className="lm-gallery">
            <div className="lm-gallery__main">
              <img src={getImageUrl(images[imgIndex])} alt={product.title} />
            </div>
            {images.length > 1 && (
              <div className="lm-thumbs">
                {images.map((src, i) => (
                  <button key={i} className="lm-thumb" aria-current={i === imgIndex} aria-label={`Show image ${i + 1}`} onClick={() => setImgIndex(i)}>
                    <img src={getImageUrl(src)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lm-pd__info">
            <div>
              {category && <span className="lm-card__cat">{category}</span>}
              <h1 className="lm-pd__title">{product.title}</h1>
              <div style={{ marginTop: 8 }}>
                {product.ratingCount ? <StarRating value={product.ratingAverage} count={product.ratingCount} /> : <span className="lm-sub">No reviews yet</span>}
              </div>
            </div>

            <div className="lm-pd__price">{price}</div>

            {colors.length > 0 && (
              <div className="lm-opt">
                <h3>Colour<b>{color}</b></h3>
                <div className="lm-chips">
                  {colors.map((c) => {
                    const anyStock = variants.some((v) => v.color === c && v.stock > 0);
                    return (
                      <button key={c} className="lm-chip" aria-pressed={c === color} disabled={!anyStock} onClick={() => setColor(c)}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizesForColor.some((v) => v.size) && (
              <div className="lm-opt">
                <h3>Size<b>{size}</b></h3>
                <div className="lm-chips">
                  {sizesForColor.map((v) => (
                    <button key={v._id || v.size} className="lm-chip" aria-pressed={(v.size || "") === size} disabled={v.stock < 1} onClick={() => setSize(v.size || "")}>
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>{stockBadge}</div>

            <div className="lm-buy">
              <div className="lm-qty" role="group" aria-label="Quantity">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
                <span aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">+</button>
              </div>
              <button className="lm-btn" onClick={handleAdd} disabled={!variant || variant.stock < 1}>
                {variant && variant.stock < 1 ? "Sold out" : "Add to cart"}
              </button>
              <HeartButton productId={product._id} className="lm-heart--inline" />
            </div>

            <div aria-live="polite">
              {error && <div className="lm-alert lm-alert--danger">{error}</div>}
              {added && (
                <div className="lm-alert lm-alert--ok" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span>Added to your cart.</span>
                  <Link to="/cart" style={{ fontWeight: 600, color: "inherit" }}>View cart & checkout →</Link>
                </div>
              )}
            </div>

            <div className="lm-seller">
              <div className="lm-seller__logo">
                {store?.logo ? <img src={getImageUrl(store.logo)} alt="" /> : storeName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="lm-seller__name">{storeName}</div>
                <div className="lm-seller__meta">
                  {[store?.address, seller?.name && `Seller: ${seller.name}`].filter(Boolean).join(" · ") || "Sold by an independent seller"}
                </div>
                {store?.ratingCount > 0 && <StarRating value={store.ratingAverage} count={store.ratingCount} />}
              </div>
              {storeId && <Link to={`/stores/${storeId}`}>Visit store</Link>}
            </div>

            <div className="lm-trust">
              <div>🔒 Secure checkout — prices and stock are verified by our server</div>
              <div>📦 Each seller ships their own items, tracked in My orders</div>
            </div>
          </div>
        </div>

        <section className="lm-section">
          <h2>Description</h2>
          <p className="lm-desc">{product.description || "The seller hasn't added a description yet."}</p>
        </section>

        <section className="lm-section" id="reviews">
          <h2>Reviews {product.ratingCount ? `(${product.ratingCount})` : ""}</h2>
          <ReviewForm productId={product._id} onChanged={refreshDetail} />
          {reviews.length === 0 ? (
            <p className="lm-sub">No reviews yet. Buyers can review after their order is delivered.</p>
          ) : (
            reviews.map((r) => (
              <article key={r._id} className="lm-review">
                <StarRating value={r.rating} count={1} showCount={false} />
                {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
                <span className="lm-review__who">
                  {r.buyer?.name || "Verified buyer"}
                  {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-GH", { dateStyle: "medium" })}` : ""}
                </span>
              </article>
            ))
          )}
        </section>

        {moreFromStore.length > 0 && (
          <section className="lm-section">
            <h2>More from {storeName}</h2>
            <div className="lm-grid">{moreFromStore.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          </section>
        )}

        {related.length > 0 && (
          <section className="lm-section">
            <h2>You may also like</h2>
            <div className="lm-grid">{related.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}