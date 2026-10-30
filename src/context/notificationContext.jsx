import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/dashboardService";

const NotificationContext = createContext(null);
const POLL_MS = 30000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const uid = user?._id || user?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!uid) {
      setItems([]);
      return;
    }
    try {
      setItems(await getNotifications());
    } catch {
      /* keep what we have; try again on the next poll */
    }
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // live-ish: poll, and refresh when the tab comes back
  useEffect(() => {
    if (!uid) return undefined;
    const t = setInterval(load, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [uid, load]);

  const markRead = useCallback(async (id) => {
    setItems((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      load();
    }
  }, [load]);

  const markAllRead = useCallback(async () => {
    setItems((p) => p.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }, [load]);

  const value = useMemo(
    () => ({ items, loading, unread: items.filter((n) => !n.read).length, reload: load, markRead, markAllRead }),
    [items, loading, load, markRead, markAllRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}