import { useEffect, useRef, useState } from "react";
import { CHAT_SUGGESTIONS, INTENT_META, type ChatIntent } from "@datacon/shared-types";
import { useChatMessages, useFeedback, streamChat } from "../../api/chat";
import { useToast } from "../../components/ui/ToastContext";
import { AgentVisualization } from "./AgentVisualization";
import type { ChatMessage, ChatPayload } from "../../lib/types";

let localIdSeq = 1;

export function ChatPage() {
  const { data: history } = useChatMessages();
  const feedback = useFeedback();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadedHistory = useRef(false);
  const sentPending = useRef(false);

  useEffect(() => {
    if (!history || loadedHistory.current) return;
    setMessages(history);
    loadedHistory.current = true;

    if (sentPending.current) return;
    sentPending.current = true;
    const pending = sessionStorage.getItem("datacon:pendingQuestion");
    if (pending) {
      sessionStorage.removeItem("datacon:pendingQuestion");
      send(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setDraft("");

    const userMsg: ChatMessage = { id: `local-${localIdSeq++}`, role: "user", intent: null, text: trimmed, payload: null, vote: 0 };
    const agentId = `local-${localIdSeq++}`;
    const agentMsg: ChatMessage = { id: agentId, role: "agent", intent: null, text: "", payload: null, vote: 0, streaming: true };
    setMessages((prev) => [...prev, userMsg, agentMsg]);

    await streamChat(trimmed, {
      onIntent: (intent) => {
        setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, intent: intent as ChatIntent } : m)));
      },
      onToken: (chunk) => {
        setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, text: m.text + chunk } : m)));
      },
      onDone: (final) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === agentId ? { ...m, intent: final.intent as ChatIntent, text: final.text, payload: final.payload as ChatPayload, streaming: false } : m)),
        );
        setSending(false);
      },
      onError: (message) => {
        addToast({ icon: "⚠️", accent: "#e2603f", title: "Chat failed", desc: message });
        setMessages((prev) => prev.filter((m) => m.id !== agentId));
        setSending(false);
      },
    });
  };

  const vote = (id: string, dir: -1 | 1) => {
    const current = messages.find((m) => m.id === id);
    if (!current) return;
    const nextVote = current.vote === dir ? 0 : dir;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, vote: nextVote } : m)));
    if (!id.startsWith("local-")) feedback.mutate({ id, vote: nextVote });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "18px 28px", borderBottom: "1px solid #e9eaf2", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Multi-agent chat</div>
          <div style={{ fontSize: 11.5, color: "#9499ad" }}>Plain-English questions, routed automatically</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(Object.keys(INTENT_META) as ChatIntent[]).map((k) => (
            <span key={k} style={{ font: "600 10px 'IBM Plex Mono',monospace", padding: "4px 9px", borderRadius: 7, color: INTENT_META[k].color, background: INTENT_META[k].bg, textTransform: "capitalize" }}>
              {k}
            </span>
          ))}
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg,#f7f8fc,var(--ac-bg))", padding: "24px 0" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--ac-logo)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, margin: "0 auto 16px" }}>✦</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>Ask Datacon anything</div>
              <div style={{ fontSize: 13, color: "#9499ad", marginBottom: 24 }}>Try one of these — each routes to a different agent.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s.intent}
                    onClick={() => send(s.question)}
                    style={{ background: "#fff", border: "1px solid #e9eaf2", borderRadius: 14, padding: 14 }}
                  >
                    <div style={{ font: "700 9.5px 'IBM Plex Mono',monospace", color: INTENT_META[s.intent].color, marginBottom: 6, textTransform: "uppercase" }}>{s.intent}</div>
                    <div style={{ fontSize: 13, color: "#1a1d29" }}>{s.question}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ maxWidth: "74%", background: "var(--ac-grad)", color: "#fff", padding: "10px 14px", borderRadius: "15px 15px 5px 15px", fontSize: 13.5 }}>{m.text}</div>
              </div>
            ) : (
              <div key={m.id} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--ac-logo)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>Datacon</span>
                  {m.intent && (
                    <span style={{ font: "600 9.5px 'IBM Plex Mono',monospace", color: INTENT_META[m.intent].color, background: INTENT_META[m.intent].bg, padding: "2px 8px", borderRadius: 20 }}>
                      {INTENT_META[m.intent].label}
                    </span>
                  )}
                </div>
                <div style={{ background: "#fff", border: "1px solid #e9eaf2", borderRadius: "4px 15px 15px 15px", padding: 14 }}>
                  {m.text ? (
                    <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                      {m.text}
                      {m.streaming && <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--ac)", marginLeft: 2, animation: "dvblink .9s infinite", verticalAlign: "middle" }} />}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#c3c7d6", animation: `dvbounce 1.1s ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  )}
                  {!m.streaming && <AgentVisualization message={m} />}
                  {!m.streaming && m.text && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f3f4f9" }}>
                      <button
                        onClick={() => vote(m.id, 1)}
                        style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 7, color: m.vote === 1 ? "#0f8a5c" : "#9499ad", background: m.vote === 1 ? "#e6f7ef" : "transparent" }}
                      >
                        ▲ Helpful
                      </button>
                      <button
                        onClick={() => vote(m.id, -1)}
                        style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 7, color: m.vote === -1 ? "#c0392b" : "#9499ad", background: m.vote === -1 ? "#fdeee9" : "transparent" }}
                      >
                        ▼
                      </button>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#b0b4c6" }}>
                        {m.vote === 1 ? "Thanks — feeds insight accuracy" : m.vote === -1 ? "Noted — we'll improve routing" : "Was this helpful?"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e9eaf2", background: "#fff", padding: "14px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e4ee", borderRadius: 14, padding: "6px 6px 6px 16px" }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about revenue, churn, anomalies, forecasts…"
              style={{ flex: 1, border: "none", fontSize: 13.5, outline: "none" }}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              style={{ background: "var(--ac-grad)", color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 10, opacity: sending || !draft.trim() ? 0.6 : 1 }}
            >
              Ask ✦
            </button>
          </form>
          <div style={{ textAlign: "center", font: "500 10px 'IBM Plex Mono',monospace", color: "#b0b4c6", marginTop: 8 }}>
            Answers stream token-by-token · first token in &lt;1s
          </div>
        </div>
      </div>
    </div>
  );
}
