import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: ReactNode;
  z?: number;
}

export function Modal({ open, onClose, width = 440, children, z = 44 }: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,29,41,.42)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: z,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dvfu"
        style={{
          width,
          maxWidth: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 30px 70px -20px rgba(26,29,41,.5)",
          padding: 22,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
      <button onClick={onClose} style={{ fontSize: 16, color: "#9499ad" }}>
        ✕
      </button>
    </div>
  );
}
