import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { ChatMessage } from "../lib/types";

export function useChatMessages() {
  return useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => (await api.get<ChatMessage[]>("/chat/messages")).data,
  });
}

export function useFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vote }: { id: string; vote: -1 | 0 | 1 }) => (await api.patch(`/chat/messages/${id}/feedback`, { vote })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] }),
  });
}

interface StreamHandlers {
  onIntent: (intent: string) => void;
  onToken: (text: string) => void;
  onDone: (final: { intent: string; text: string; payload: unknown }) => void;
  onError: (message: string) => void;
}

export async function streamChat(message: string, handlers: StreamHandlers): Promise<void> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    handlers.onError(data.message ?? "Couldn't reach the chat service.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const eventMatch = frame.match(/^event: (.+)$/m);
      const dataMatch = frame.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;
      const event = eventMatch[1];
      const data = JSON.parse(dataMatch[1]);
      if (event === "intent") handlers.onIntent(data.intent);
      else if (event === "token") handlers.onToken(data.text);
      else if (event === "done") handlers.onDone(data);
    }
  }
}
