// src/components/shop/FilterPanel.jsx
// The filter column. It owns no filter values: it shows what the page gives it,
// and calls onChange({ something: newValue }) when the shopper picks something.
import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const RATING_VALUES = [0, 4, 3]; // 0 means "all ratings"
const VISIBLE_CATEGORIES = 8;

/* ---------- Price: type two numbers, then press Apply ---------- */
// Typing is kept in "drafts" so we don't hit the server on every keystroke.
function PriceFilter({ minPrice, maxPrice, onChange }) {
  const [minDraft, setMinDraft] = useState(minPrice);
  const [maxDraft, setMaxDraft] = useState(maxPrice);

  // When the applied price changes from outside (a chip removed, "Clear all"),
  // update the boxes to match.
  useEffect(() => {
    setMinDraft(minPrice);
    setMaxDraft(maxPrice);
  }, [minPrice, maxPrice]);

  const clean = (v) => (v === "" || Number.isNaN(Number(v)) || Number(v) < 0 ? "" : String(v));

  const apply = (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    let min = clean(minDraft);
    let max = clean(maxDraft);

    // Typed them the wrong way round? Swap them.
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      [min, max] = [max, min];
    }
    onChange({ minPrice: min, maxPrice: max });
  };

  return (
    <form className="price-form" onSubmit={apply}>
      <div className="price-fields">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Min"
          aria-label="Minimum price"
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
        />
        <span aria-hidden="true">to</span>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Max"
          aria-label="Maximum price"
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
        />
      </div>
      <button type="submit" className="shop-btn shop-btn-light">
        Apply price
      </button>
    </form>
  );
}

/* ---------- The whole panel ---------- */
export default function FilterPanel({ categories, filters, onChange }) {
  const [showAll, setShowAll] = useState(false);

  const visibleCategories = showAll ? categories : categories.slice(0, VISIBLE_CATEGORIES);

  return (
    <div className="filter-panel">
      {/* Category */}
      <section className="filter-group" aria-labelledby="filter-category">
        <h3 id="filter-category" className="filter-title">
          Category
        </h3>

        <ul className="filter-list">
          <li>
            <button
              type="button"
              className={`filter-option ${filters.category === "" ? "is-selected" : ""}`}
              aria-pressed={filters.category === ""}
              onClick={() => onChange({ category: "" })}
            >
              All products
            </button>
          </li>

          {visibleCategories.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                className={`filter-option ${filters.category === c._id ? "is-selected" : ""}`}
                aria-pressed={filters.category === c._id}
                onClick={() => onChange({ category: c._id })}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>

        {categories.length > VISIBLE_CATEGORIES && (
          <button
            type="button"
            className="filter-more"
            onClick={() => setShowAll((previous) => !previous)}
          >
            {showAll ? "Show fewer" : `Show all ${categories.length}`}
          </button>
        )}
      </section>

      {/* Rating */}
      <section className="filter-group" aria-labelledby="filter-rating">
        <h3 id="filter-rating" className="filter-title">
          Rating
        </h3>

        <ul className="filter-list">
          {RATING_VALUES.map((value) => (
            <li key={value}>
              <button
                type="button"
                className={`filter-option ${filters.minRating === value ? "is-selected" : ""}`}
                aria-pressed={filters.minRating === value}
                aria-label={value === 0 ? "All ratings" : `${value} stars and up`}
                onClick={() => onChange({ minRating: value })}
              >
                {value === 0 ? (
                  "All ratings"
                ) : (
                  <>
                    <StarRating value={value} showCount={false} decorative />
                    <span>& up</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Price */}
      <section className="filter-group" aria-labelledby="filter-price">
        <h3 id="filter-price" className="filter-title">
          Price
        </h3>
        <PriceFilter
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={onChange}
        />
      </section>

      {/* Availability */}
      <section className="filter-group" aria-labelledby="filter-availability">
        <h3 id="filter-availability" className="filter-title">
          Availability
        </h3>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
          />
          <span>In stock only</span>
        </label>
      </section>
    </div>
  );
}