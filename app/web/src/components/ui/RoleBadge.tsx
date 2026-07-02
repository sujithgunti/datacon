export function RoleBadge({ name, color, bg }: { name: string; color?: string | null; bg?: string | null }) {
  return (
    <span
      style={{
        font: "600 10px 'IBM Plex Mono',monospace",
        padding: "3px 9px",
        borderRadius: 20,
        color: color ?? "#71768a",
        background: bg ?? "#f0f1f6",
        whiteSpace: "nowrap",
      }}
    >
      {name.toUpperCase()}
    </span>
  );
}
