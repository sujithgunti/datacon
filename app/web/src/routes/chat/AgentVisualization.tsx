import type { ChatMessage } from "../../lib/types";

export function AgentVisualization({ message }: { message: ChatMessage }) {
  if (!message.payload) return null;

  if (message.intent === "diagnostic" && "citations" in message.payload) {
    const { citations, correlation } = message.payload;
    return (
      <div style={{ marginTop: 10 }}>
        {correlation && (
          <div style={{ display: "inline-block", background: "#e3f6f9", color: "#1d8e9c", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, marginBottom: 10 }}>
            {correlation}
          </div>
        )}
        <div style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: ".1em", color: "#9499ad", marginBottom: 8 }}>
          SOURCES · {citations.length} DOCUMENT CHUNK{citations.length === 1 ? "" : "S"}
        </div>
        {citations.map((c) => (
          <div key={c.id} style={{ borderLeft: "2px solid #2bb8c4", paddingLeft: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{c.documentTitle}</div>
            <div style={{ font: "500 10.5px 'IBM Plex Mono',monospace", color: "#9499ad", margin: "2px 0" }}>
              chunk {c.chunkIndex} · {c.filename}
            </div>
            <div style={{ fontSize: 12, color: "#5a5f72", fontStyle: "italic" }}>"{c.snippet}"</div>
          </div>
        ))}
      </div>
    );
  }

  if (message.intent === "predictive" && "series" in message.payload) {
    const p = message.payload;
    const values = p.series.map((s) => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const w = 320;
    const h = 90;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    });
    return (
      <div style={{ background: "#f7faff", border: "1px solid #e6eefc", borderRadius: 12, padding: 14, marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: ".1em", color: "#3f6fd6" }}>FORECAST · {p.model.toUpperCase()}</span>
          <span style={{ font: "600 10px 'IBM Plex Mono',monospace", color: "#9499ad" }}>95% CI</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", marginBottom: 10 }}>
          <polyline points={points.join(" ")} fill="none" stroke="#6d4dff" strokeWidth={2} />
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, textAlign: "center" }}>
          <Stat label="PROJECTED" value={p.projected} />
          <Stat label="95% CI" value={`${p.ciLow}–${p.ciHigh}`} />
          <Stat label="GROWTH" value={p.growth} color="#0f8a5c" />
        </div>
      </div>
    );
  }

  if (message.intent === "prescriptive" && "actions" in message.payload) {
    return (
      <div style={{ border: "1px solid #e4f6ee", borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 82px 64px 82px", background: "#eef9f3", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#0f8a5c" }}>
          <span>RECOMMENDED ACTION</span>
          <span>IMPACT</span>
          <span>EFFORT</span>
          <span>OWNER</span>
        </div>
        {message.payload.actions.map((a, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 82px 64px 82px", padding: "9px 12px", fontSize: 12, borderTop: "1px solid #f0f1f6", alignItems: "center" }}>
            <span>{a.title}</span>
            <span style={{ color: "#0f8a5c", fontWeight: 700 }}>{a.impact}</span>
            <span style={{ color: a.effort === "Low" ? "#0f8a5c" : "#b9743a", fontWeight: 600 }}>{a.effort}</span>
            <span style={{ color: "#71768a" }}>{a.owner}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ font: "600 9px 'IBM Plex Mono',monospace", color: "#9499ad", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: color ?? "#1a1d29" }}>{value}</div>
    </div>
  );
}
