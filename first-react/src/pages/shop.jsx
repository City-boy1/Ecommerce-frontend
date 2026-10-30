import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../services/shopService";
import ProductCard from "../components/shop/ProductCard";
import "../css/tokens.css";
import "../css/shop.css";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const key = params.toString();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [status, setStatus] = useState("loading");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(params.get("page")) || 1;

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null || v === false) next.delete(k);
      else next.set(k, v === true ? "1" : v);
    });
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getProducts({
      search: params.get("search"),
      category: params.get("category"),
      sort: params.get("sort"),
      minRating: params.get("minRating"),
      minPrice: params.get("minPrice"),
      maxPrice: params.get("maxPrice"),
      inStock: params.get("inStock") === "1" ? true : "",
      page,
      limit: 12,
    })
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
  }, [key]);

  // `search` comes from the navbar; there's no search box here, so show it as a removable chip.
  const searchTerm = params.get("search");
  const hasFilters = ["search", "category", "minRating", "minPrice", "maxPrice", "inStock"].some((k) => params.get(k));
  const clearAll = () => setParams(new URLSearchParams());

  return (
    <div className="lm-page">
      <div className="lm-wrap">
        <div className="lm-shop-head">
          <div>
            <h1 className="lm-h1">Shop</h1>
            <p className="lm-sub">Products from independent sellers across Ghana</p>
          </div>
          <button className="lm-btn lm-btn--ghost lm-filter-toggle" onClick={() => setFiltersOpen((o) => !o)}>
            {filtersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>

        <div className="lm-shop">
          <aside className={`lm-filters ${filtersOpen ? "is-open" : ""}`} aria-label="Filters">
            <div>
              <h3>Category</h3>
              <select className="lm-select" value={params.get("category") || ""} onChange={(e) => update({ category: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id || c.slug} value={c.slug || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h3>Price (GH₵)</h3>
              <div className="lm-row">
                <input className="lm-input" type="number" min="0" placeholder="Min" defaultValue={params.get("minPrice") || ""} onBlur={(e) => update({ minPrice: e.target.value })} />
                <input className="lm-input" type="number" min="0" placeholder="Max" defaultValue={params.get("maxPrice") || ""} onBlur={(e) => update({ maxPrice: e.target.value })} />
              </div>
            </div>
            <div>
              <h3>Rating</h3>
              <select className="lm-select" value={params.get("minRating") || ""} onChange={(e) => update({ minRating: e.target.value })}>
                <option value="">Any rating</option>
                <option value="4">4 stars and up</option>
                <option value="3">3 stars and up</option>
              </select>
            </div>
            <label className="lm-check">
              <input type="checkbox" checked={params.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked })} />
              In stock only
            </label>
            {hasFilters && (
              <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={clearAll}>
                Clear all filters
              </button>
            )}
          </aside>

          <section>
            <div className="lm-toolbar">
              <div className="lm-toolbar__left">
                <span className="lm-count">
                  {status === "ready" ? `${data.total} ${data.total === 1 ? "product" : "products"}` : "Loading…"}
                </span>
                {searchTerm && (
                  <span className="lm-search-chip">
                    Results for “{searchTerm}”
                    <button type="button" aria-label="Clear search" onClick={() => update({ search: "" })}>✕</button>
                  </span>
                )}
              </div>
              <select className="lm-select" style={{ width: "auto" }} value={params.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort products">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {status === "loading" && (
              <div className="lm-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="lm-skel" style={{ aspectRatio: "3/4" }} />
                ))}
              </div>
            )}

            {status === "error" && (
              <div className="lm-empty">
                <h3>We couldn't load products</h3>
                <p>Check your connection and try again.</p>
                <button className="lm-btn" onClick={() => setParams(new URLSearchParams(params))}>Retry</button>
              </div>
            )}

            {status === "ready" && data.products.length === 0 && (
              <div className="lm-empty">
                <h3>No products match</h3>
                <p>Try removing some filters.</p>
                {hasFilters && <button className="lm-btn" onClick={clearAll}>Clear filters</button>}
              </div>
            )}

            {status === "ready" && data.products.length > 0 && (
              <>
                <div className="lm-grid">
                  {data.products.map((p) => (
                    <ProductCard key={p._id || p.id} product={p} />
                  ))}
                </div>
                {data.pages > 1 && (
                  <nav className="lm-pager" aria-label="Pagination">
                    <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                      Previous
                    </button>
                    <span>
                      Page {page} of {data.pages}
                    </span>
                    <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}