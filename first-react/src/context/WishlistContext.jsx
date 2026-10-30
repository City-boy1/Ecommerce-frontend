import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Wishlist = a list of product ids kept in the browser (works for guests and signed-in users).
// Later, server sync can be added here without touching any page.
const KEY = "wishlist";

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable: list lives for this visit only */
    }
  }, [ids]);

  // keep several open tabs in step
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setIds(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback((id) => ids.includes(String(id)), [ids]);
  const toggle = useCallback((id) => {
    const s = String(id);
    setIds((p) => (p.includes(s) ? p.filter((x) => x !== s) : [s, ...p]));
  }, []);
  const remove = useCallback((id) => setIds((p) => p.filter((x) => x !== String(id))), []);
  const retain = useCallback((keep) => {
    const set = new Set(keep.map(String));
    setIds((p) => p.filter((x) => set.has(x)));
  }, []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, count: ids.length, has, toggle, remove, retain, clear }),
    [ids, has, toggle, remove, retain, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}