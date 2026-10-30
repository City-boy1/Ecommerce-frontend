import { useCallback, useEffect, useRef, useState } from "react";

// Loads data and keeps it fresh: optional polling interval and refetch when the tab regains focus.
export function useFetch(fetcher, deps = [], { interval = 0, refetchOnFocus = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const alive = useRef(true);

  const run = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await fetcherRef.current();
      if (alive.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    run(false);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!interval) return undefined;
    const t = setInterval(() => run(true), interval);
    return () => clearInterval(t);
  }, [interval, run]);

  useEffect(() => {
    if (!refetchOnFocus) return undefined;
    const onFocus = () => {
      if (document.visibilityState === "visible") run(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refetchOnFocus, run]);

  return { data, setData, loading, error, reload: () => run(true) };
}