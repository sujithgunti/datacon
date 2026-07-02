import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmSpec {
  title: string;
  body: string;
  label: string;
  tone: "primary" | "danger";
}

interface PendingConfirm extends ConfirmSpec {
  resolve: (ok: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (spec: ConfirmSpec) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((spec: ConfirmSpec) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...spec, resolve });
    });
  }, []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal open={!!pending} onClose={() => close(false)} width={400} z={60}>
        {pending && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{pending.title}</div>
            <div style={{ fontSize: 13, color: "#71768a", marginBottom: 20, lineHeight: 1.5 }}>{pending.body}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button variant={pending.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
                {pending.label}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
