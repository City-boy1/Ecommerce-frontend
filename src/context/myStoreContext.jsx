import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useFetch } from "../hooks/useFetch";
import { getMyStore } from "../services/dashboardService";

// The signed-in seller's own store, shared by the layout (alert + sidebar), the Store page and the Overview.
const MyStoreContext = createContext(null);

export const STORE_FIELDS = [
  { key: "name", label: "Store name" },
  { key: "logo", label: "Logo" },
  { key: "description", label: "Description" },
  { key: "address", label: "Address" },
];

export function storeCompleteness(store) {
  const missing = STORE_FIELDS.filter((f) => !(store && String(store[f.key] || "").trim()));
  const percent = Math.round(((STORE_FIELDS.length - missing.length) / STORE_FIELDS.length) * 100);
  return { missing, percent };
}

export function MyStoreProvider({ children }) {
  const { user } = useAuth();
  const isSeller = user?.role === "seller";
  const uid = user?._id || user?.id;

  const { data, setData, loading, error, reload } = useFetch(
    () => (isSeller ? getMyStore() : Promise.resolve(null)),
    [isSeller, uid],
    { refetchOnFocus: false }
  );

  const setStore = useCallback((s) => setData(s), [setData]);
  const { missing, percent } = useMemo(() => storeCompleteness(data), [data]);

  const value = useMemo(
    () => ({ store: data, loading: isSeller && loading, error, reload, setStore, missing, percent, isSeller }),
    [data, loading, error, reload, setStore, missing, percent, isSeller]
  );

  return <MyStoreContext.Provider value={value}>{children}</MyStoreContext.Provider>;
}

export function useMyStore() {
  const ctx = useContext(MyStoreContext);
  if (!ctx) throw new Error("useMyStore must be used inside <MyStoreProvider>");
  return ctx;
}