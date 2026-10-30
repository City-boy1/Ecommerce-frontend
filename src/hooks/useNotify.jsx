import { useToast } from "../context/ToastContext";

export function useNotify() {
  const toast = useToast();

  return {
    success: (m) => toast.success(m),
    error: (m) => toast.error(m),
    info: (m) => toast.info(m),
    warning: (m) => toast.warning(m),
  };
}