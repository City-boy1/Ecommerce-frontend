import { Link, useParams } from "react-router-dom";
import { getStore } from "../services/dashboardService";
import { useFetch } from "../hooks/useFetch";
import ProductCard from "../components/shop/ProductCard";
import StarRating from "../components/shop/StarRating";
import { getImageUrl } from "../utils/productHelpers";
import "../css/tokens.css";
import "../css/shop.css";
import "../css/dashboardUi.css";

export default function StorePublic() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(() => getStore(id), [id], { refetchOnFocus: false });

  if (loading) {
    return (
      <div className="lm-page"><div className="lm-wrap">
        <div className="lm-skel" style={{ height: 140, marginBottom: 24 }} />
        <div className="lm-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="lm-skel" style={{ aspectRatio: "3/4" }} />)}</div>
      </div></div>
    );
  }

  if (error || !data?.store) {
    return (
      <div className="lm-page"><div className="lm-wrap"><div className="lm-empty">
        <h3>This store isn't available</h3>
        <p>It may have been hidden by the seller or doesn't exist.</p>
        <Link to="/shop" className="lm-btn">Back to shop</Link>
      </div></div></div>
    );
  }

  const { store, products = [], ratingAverage, ratingCount } = data;

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <nav className="lm-crumbs" aria-label="Breadcrumb"><Link to="/shop">Shop</Link><span>/</span><span aria-current="page">{store.name}</span></nav>

        <header className="lm-store-hero">
          <span className="lm-logo">{store.logo ? <img src={getImageUrl(store.logo)} alt="" /> : store.name.slice(0, 1).toUpperCase()}</span>
          <div style={{ display: "grid", gap: 6 }}>
            <h1 className="lm-h1">{store.name}</h1>
            {store.address && <span className="lm-sub">{store.address}</span>}
            {ratingCount > 0 && <StarRating value={ratingAverage} count={ratingCount} />}
            {store.description && <p className="lm-desc" style={{ margin: "6px 0 0", maxWidth: 640 }}>{store.description}</p>}
          </div>
        </header>

        <h2 style={{ fontSize: 20, margin: "0 0 16px" }}>{products.length} {products.length === 1 ? "product" : "products"}</h2>
        {products.length === 0 ? (
          <div className="lm-empty"><h3>No products yet</h3><p>This store hasn't listed anything that's ready to buy.</p></div>
        ) : (
          <div className="lm-grid">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        )}
      </div>
    </div>
  );
}