export default function StarRating({ value = 0, count = 0, showCount = true }) {
  if (!count) return null;
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  return (
    <span className="lm-stars" aria-label={`Rated ${Number(value).toFixed(1)} out of 5 from ${count} reviews`}>
      <span className="lm-stars__bar" aria-hidden="true">
        ★★★★★
        <span className="lm-stars__fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      {showCount && (
        <span>
          {Number(value).toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}