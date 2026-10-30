// The one set of product helpers. Currency: Ghana cedi.
const CURRENCY = "GHS";
const LOCALE = "en-GH";
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><rect width='600' height='600' fill='#f1f1f1'/><g fill='none' stroke='#c9c9c9' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'><rect x='190' y='210' width='220' height='180' rx='16'/><circle cx='255' cy='270' r='20'/><path d='M200 380l70-70 50 50 40-40 50 50'/></g></svg>`
  );

export const formatPrice = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

export const getImageUrl = (path) => {
  if (!path) return PLACEHOLDER;
  if (typeof path !== "string") {
    path = path?.imgUrl || path?.image || path?.url || "";
  }
  if (typeof path !== "string") path = "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};

const prices = (p) => (p?.variants || []).map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));

export const getMinPrice = (p) => {
  const list = prices(p);
  return list.length ? Math.min(...list) : 0;
};

export const getMaxPrice = (p) => {
  const list = prices(p);
  return list.length ? Math.max(...list) : 0;
};

export const hasPriceRange = (p) => getMinPrice(p) !== getMaxPrice(p);

export const getTotalStock = (p) =>
  (p?.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

export const isInStock = (p) => getTotalStock(p) > 0;

export const isLowStock = (p, limit = 5) => {
  const total = getTotalStock(p);
  return total > 0 && total <= limit;
};