// src/components/shop/ActiveFilters.jsx
// A row of small tags showing what is currently applied, each removable.
// If nothing is applied, it draws nothing.
import { formatPrice } from "../../utils/productHelpers";

export default function ActiveFilters({
  search,
  filters,
  categories,
  onChange,
  onClearSearch,
  onClearAll,
}) {
  // Build a plain list of { key, label, remove }, then draw it.
  const chips = [];

  if (search) {
    chips.push({ key: "search", label: `Search: ${search}`, remove: onClearSearch });
  }

  if (filters.category) {
    const match = categories.find((c) => c._id === filters.category);
    chips.push({
      key: "category",
      label: match ? match.name : "Category",
      remove: () => onChange({ category: "" }),
    });
  }

  if (filters.minRating) {
    chips.push({
      key: "rating",
      label: `${filters.minRating} stars & up`,
      remove: () => onChange({ minRating: 0 }),
    });
  }

  const { minPrice, maxPrice } = filters;
  if (minPrice !== "" || maxPrice !== "") {
    let label;
    if (minPrice !== "" && maxPrice !== "") {
      label = `${formatPrice(minPrice)} to ${formatPrice(maxPrice)}`;
    } else if (minPrice !== "") {
      label = `${formatPrice(minPrice)} and up`;
    } else {
      label = `Up to ${formatPrice(maxPrice)}`;
    }
    chips.push({
      key: "price",
      label,
      remove: () => onChange({ minPrice: "", maxPrice: "" }),
    });
  }

  if (filters.inStock) {
    chips.push({ key: "stock", label: "In stock", remove: () => onChange({ inStock: false }) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="active-filters">
      {chips.map((chip) => (
        <span key={chip.key} className="filter-chip">
          {chip.label}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`Remove filter: ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}

      <button type="button" className="active-filters-clear" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}