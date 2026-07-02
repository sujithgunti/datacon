import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useTablePreview } from "../../api/connectors";

export function TablePreviewModal({ id, onClose, onAsk }: { id: string | null; onClose: () => void; onAsk: (question: string) => void }) {
  const { data } = useTablePreview(id);
  return (
    <Modal open={!!id} onClose={onClose} width={760}>
      {data && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ font: "600 12px 'IBM Plex Mono',monospace", fontWeight: 700 }}>{data.name}</div>
              <div style={{ fontSize: 11.5, color: "#9499ad" }}>
                {data.connectorName} · {data.columns.length} cols · {data.rowCount.toLocaleString()} rows
              </div>
            </div>
            <button onClick={onClose} style={{ fontSize: 16, color: "#9499ad" }}>
              ✕
            </button>
          </div>
          <div style={{ overflowX: "auto", marginTop: 14, border: "1px solid #e9eaf2", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f7f8fc" }}>
                  {data.columns.map((c) => (
                    <th key={c} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, whiteSpace: "nowrap", position: "sticky", top: 0, background: "#f7f8fc" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sampleRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f0f1f6" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#9499ad" }}>
              Showing {data.sampleRows.length} of {data.rowCount.toLocaleString()} rows · read-only preview
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={() => onAsk(`Give me a summary of the ${data.name} table`)}>
                Ask about this table ✦
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
