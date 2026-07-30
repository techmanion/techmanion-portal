import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Icon } from "./components/atoms/Icon";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastValue>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2.5 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-surface-container-high px-4 py-3 shadow-panel ring-1 ring-outline-variant/30 ${
              toast.variant === "success" ? "text-on-surface" : "text-error"
            }`}
          >
            <Icon
              className={`shrink-0 text-[20px] ${toast.variant === "success" ? "text-primary" : "text-error"}`}
            >
              {toast.variant === "success" ? "check_circle" : "error"}
            </Icon>
            <span className="min-w-0 flex-1 text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
              className="grid size-6 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
            >
              <Icon className="text-[16px]">close</Icon>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
