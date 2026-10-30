// Guest cart, kept in the browser until the shopper signs in.
// Shape: [{ productId, color, size, quantity, priceAtSelection? }]
const KEY = "cart";
const MAX_QTY = 99;

export const keyOf = (l) => `${l.productId}|${l.color || ""}|${l.size || ""}`;

export function readLocalCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];

    return arr
      .filter((l) => l && l.productId)
      .map((l) => {
        const line = {
          productId: String(l.productId),
          color: l.color || "",
          size: l.size || "",
          quantity: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(l.quantity ?? l.qty ?? 1)) || 1)),
        };
        if (l.priceAtSelection != null && Number.isFinite(Number(l.priceAtSelection))) {
          line.priceAtSelection = Number(l.priceAtSelection);
        }
        return line;
      });
  } catch {
    return [];
  }
}

export function writeLocalCart(lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage full or blocked: the cart still works for this visit */
  }
}

export function clearLocalCart() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
