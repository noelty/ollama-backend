import type { ChatEventName } from "./types";

/**
 * Reads a fetch Response body as Server-Sent Events and invokes
 * onEvent(eventName, data) for each event chunk received.
 */
export async function readSSE(
  response: Response,
  onEvent: (event: ChatEventName, data: unknown) => void
): Promise<void> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? ""; // last piece may be incomplete, keep for next read

    for (const chunk of chunks) {
      let eventName: ChatEventName = "token";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) {
          eventName = line.slice(7).trim() as ChatEventName;
        } else if (line.startsWith("data: ")) {
          data += line.slice(6);
        }
      }
      if (data) {
        try {
          onEvent(eventName, JSON.parse(data));
        } catch {
          // ignore malformed chunk
        }
      }
    }
  }
}
