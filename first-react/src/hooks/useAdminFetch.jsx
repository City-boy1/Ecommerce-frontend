import { useCallback, useEffect, useRef, useState } from "react";

// Small fetch hook for the oversight pages.
// fetcher: () => Promise. Re-runs when `deps` change. Optional silent polling.
// Silent refreshes never show a spinner and never replace good data with an error.
export default function useAdminFetch(fetcher, deps = [], { interval = 0 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seq = useRef(0);

  const load = useCallback(async (silent) => {
    const id = ++seq.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetcherRef.current();
      if (id !== seq.current) return;
      setData(res);
      setError(null);
    } catch (e) {
      if (id !== seq.current || silent) return;
      setError(e);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!interval) return undefined;
    const t = setInterval(() => load(true), interval);
    return () => clearInterval(t);
  }, [interval, load]);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, reload, refresh };
}