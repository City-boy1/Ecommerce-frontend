
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (type, message, duration = 4500) => {
      const id = ++nextId.current;

      setToasts((current) => [
        ...current,
        { id, type, message, duration },
      ]);

      return id;
    },
    []
  );

  const success = useCallback(
    (message, duration) => showToast("success", message, duration),
    [showToast]
  );

  const error = useCallback(
    (message, duration) => showToast("error", message, duration),
    [showToast]
  );

  const warning = useCallback(
    (message, duration) => showToast("warning", message, duration),
    [showToast]
  );

  const info = useCallback(
    (message, duration) => showToast("info", message, duration),
    [showToast]
  );

  const value = {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts: () => setToasts([]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }

  return context;
}