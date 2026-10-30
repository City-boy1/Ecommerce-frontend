// src/components/shop/SearchBar.jsx
// Controlled input: the page owns the text, this just shows it and reports changes.
export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="shop-search">
      <svg
        className="shop-search-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products"
        aria-label="Search products"
        autoComplete="off"
      />

      {value && (
        <button
          type="button"
          className="shop-search-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}