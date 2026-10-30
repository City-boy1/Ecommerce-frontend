import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import HeartButton from "./heartButton";
import {
  formatPrice,
  getImageUrl,
  getMinPrice,
  hasPriceRange,
  isInStock,
  isLowStock,
} from "../../utils/productHelpers";

export default function ProductCard({ product }) {
  const id = product._id || product.id;
  const out = !isInStock(product);
  const storeName = product.store?.name || product.createdBy?.storeName || "";
  const category = product.category?.name || (typeof product.category === "string" ? product.category : "");

  return (
    <div className="lm-card-wrap">
    <Link to={`/products/${id}`} className="lm-card">
      <div className="lm-card__media">
        <img src={getImageUrl(product.imgUrl)} alt={product.title} loading="lazy" />
        {(out || isLowStock(product)) && (
          <div className="lm-badges">
            {out ? (
              <span className="lm-badge lm-badge--out">Sold out</span>
            ) : (
              <span className="lm-badge lm-badge--warn">Low stock</span>
            )}
          </div>
        )}
      </div>
      <div className="lm-card__body">
        {category && <span className="lm-card__cat">{category}</span>}
        <span className="lm-card__title">{product.title}</span>
        <StarRating value={product.ratingAverage} count={product.ratingCount} />
        {storeName && <span className="lm-card__store">by {storeName}</span>}
        <span className="lm-price">
          {hasPriceRange(product) && <small>From</small>}
          {formatPrice(getMinPrice(product))}
        </span>
      </div>
    </Link>
    <HeartButton productId={id} />
    </div>
  );
}