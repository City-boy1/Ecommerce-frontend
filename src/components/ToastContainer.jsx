
import { useEffect } from "react";
import { useToast } from "../context/ToastContext";

const toastIcons = {
  success: "✓",
  error: "!",
  warning: "⚠",
  info: "i",
};

function ToastItem({ item, onClose }) {
  useEffect(() => {
    if (item.duration === 0) return;

    const timer = setTimeout(() => {
      onClose(item.id);
    }, item.duration);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, onClose]);

  return (
    <div
      className={`toast toast-${item.type}`}
      role={item.type === "error" ? "alert" : "status"}
      aria-live={item.type === "error" ? "assertive" : "polite"}
    >
      <span className="toast-icon" aria-hidden="true">
        {toastIcons[item.type] || "i"}
      </span>

      <span className="toast-message">{item.message}</span>

      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => onClose(item.id)}
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((item) => (
        <ToastItem
        className ="toast-item"
          key={item.id}
          item={item}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}