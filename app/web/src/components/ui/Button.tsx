import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  borderRadius: 10,
  padding: "9px 16px",
  transition: "filter .12s, background .12s, border-color .12s",
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--ac-grad)",
    color: "#fff",
    boxShadow: "0 8px 20px -8px rgba(109,77,255,.55)",
  },
  danger: {
    background: "linear-gradient(135deg,#e2603f,#c0392b)",
    color: "#fff",
  },
  secondary: {
    background: "#fff",
    color: "#3a3f52",
    border: "1px solid #e2e4ee",
  },
  ghost: {
    background: "transparent",
    color: "#71768a",
  },
};

export function Button({ variant = "secondary", style, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
      }}
    />
  );
}
