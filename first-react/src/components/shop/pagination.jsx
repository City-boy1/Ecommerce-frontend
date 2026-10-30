// src/components/shop/Pagination.jsx
// Shows: Previous  1 … 4 5 6 … 20  Next
// It never owns the page number. It reports clicks with onChange(newPage).

// Which page numbers to show: first, last, and the current one with its neighbours.
// Gaps between them become "…".
function getPageItems(page, pages) {
  const wanted = [1, page - 1, page, page + 1, pages]
    .filter((n) => n >= 1 && n <= pages);
  const numbers = [...new Set(wanted)].sort((a, b) => a - b);

  const items = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) items.push(`gap-${n}`);
    items.push(n);
  });
  return items;
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null; // one page needs no navigation

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>

      {getPageItems(page, pages).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="pagination-gap" aria-hidden="true">
            …
          </span>
        )
      )}

      <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}