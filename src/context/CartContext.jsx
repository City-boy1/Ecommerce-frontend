import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { axiosPrivate } from "../api/axios";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { readLocalCart, writeLocalCart, clearLocalCart, keyOf } from "../utils/localCart";

const CartContext = createContext(null);
const MAX_QTY = 99;

const toKey = (k) => (typeof k === "string" ? k : keyOf(k));

// Guests: the cart lives in localStorage.
// Signed in: the cart lives in the database.
// The moment a guest signs in or signs up, the local cart is merged into the
// database cart and the local copy is cleared.
export function CartProvider({ children }) {
  const { user, authLoading } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const userId = user?._id || user?.id || null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [lines, setLines] = useState(() => readLocalCart());
  const [ready, setReady] = useState(false);

  const linesRef = useRef(lines);
  const syncedFor = useRef(null); // user id whose cart is already loaded
  const queue = useRef(Promise.resolve()); // keeps saves in order

  const setBoth = useCallback((next) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  // Every change goes through here.
  const commit = useCallback(
    (next) => {
      setBoth(next);

      if (userIdRef.current) {
        queue.current = queue.current
          .then(() => axiosPrivate.put("/cart", { items: next }))
          .catch(() => {
            toastRef.current?.error?.("We couldn't save your cart. Check your connection.");
          });
      } else {
        writeLocalCart(next);
      }
    },
    [setBoth]
  );

  // Load or sync when the signed-in user changes.
  useEffect(() => {
    if (authLoading) return;

    // Guest, or just signed out.
    if (!userId) {
      if (syncedFor.current) {
        syncedFor.current = null;
        setBoth([]); // local copy was cleared at sign-in, so a signed-out visitor starts empty
      } else {
        setBoth(readLocalCart());
      }
      setReady(true);
      return;
    }

    if (syncedFor.current === userId) return;
    syncedFor.current = userId;

    (async () => {
      const local = readLocalCart();
      try {
        let response;
        if (local.length) {
          clearLocalCart(); // cleared first so a double run can never merge twice
          response = await axiosPrivate.post("/cart/merge", { items: local });
        } else {
          response = await axiosPrivate.get("/cart");
        }

        if (userIdRef.current === userId) setBoth(response.data?.items || []);
      } catch {
        if (local.length) {
          writeLocalCart(local); // keep the guest cart safe if syncing failed
          if (userIdRef.current === userId) setBoth(local);
        }
        toastRef.current?.error?.("We couldn't load your saved cart.");
      } finally {
        if (userIdRef.current === userId) setReady(true);
      }
    })();
  }, [userId, authLoading, setBoth]);

  // Keep several tabs in step while browsing as a guest.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "cart" && !userIdRef.current) setBoth(readLocalCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setBoth]);

  /* ---------- actions ---------- */

  const addItem = useCallback(
    ({ productId, color = "", size = "", quantity = 1, priceAtSelection }) => {
      if (!productId) return;
      const qty = Math.max(1, Math.floor(Number(quantity)) || 1);
      const line = { productId: String(productId), color, size };
      const key = keyOf(line);

      const current = linesRef.current;
      const exists = current.some((l) => keyOf(l) === key);

      const next = exists
        ? current.map((l) =>
            keyOf(l) === key ? { ...l, quantity: Math.min(l.quantity + qty, MAX_QTY) } : l
          )
        : [
            ...current,
            {
              ...line,
              quantity: Math.min(qty, MAX_QTY),
              ...(priceAtSelection != null ? { priceAtSelection: Number(priceAtSelection) } : {}),
            },
          ];

      commit(next);
      toastRef.current?.success?.("Added to your cart.");
    },
    [commit]
  );

 const setQuantity = useCallback(
  (lineRef, quantity) => {
    const key = toKey(lineRef);
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty)) return;
    const next =
      qty < 1
        ? linesRef.current.filter((l) => keyOf(l) !== key)
        : linesRef.current.map((l) =>
            keyOf(l) === key ? { ...l, quantity: Math.min(qty, MAX_QTY) } : l
          );
    commit(next);
      },
      [commit]
    );

    const removeLine = useCallback(
      (lineRef) => {
        const key = toKey(lineRef);
        commit(linesRef.current.filter((l) => keyOf(l) !== key));
      },
      [commit]
    );

  const clearCart = useCallback(() => commit([]), [commit]);

  // The server removed deleted products and capped quantities at stock.
  const applyServerFixes = useCallback(
    ({ remove = [], quantities = {} }) => {
      const drop = new Set(remove);
      const next = linesRef.current
        .filter((l) => !drop.has(keyOf(l)))
        .map((l) => (quantities[keyOf(l)] ? { ...l, quantity: quantities[keyOf(l)] } : l));

      if (next.length !== linesRef.current.length || next.some((l, i) => l !== linesRef.current[i])) {
        commit(next);
      }
    },
    [commit]
  );

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({ lines, count, ready, addItem, setQuantity, removeLine, clearCart, applyServerFixes }),
    [lines, count, ready, addItem, setQuantity, removeLine, clearCart, applyServerFixes]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
