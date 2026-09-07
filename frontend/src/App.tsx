import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Message from "./components/Message";
import { readSSE } from "./sse";
import type { ChatMessage } from "./types";

const ENDPOINT = "/api/chat";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      let assembled = "";
      await readSSE(res, (event, data) => {
        if (event === "token") {
          const { text } = data as { text: string };
          assembled += text;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: assembled };
            return copy;
          });
        } else if (event === "error") {
          const { message } = data as { message: string };
          setError(message || "Something went wrong.");
        }
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Couldn't reach the server.");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop(): void {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__mark">⌁</span>
        <span className="app__title">chat</span>
      </header>

      <main className="app__main" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>Ask something to start the conversation.</p>
          </div>
        )}
        <div className="thread">
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              content={m.content}
              isStreaming={isStreaming && i === messages.length - 1 && m.role === "assistant"}
            />
          ))}
        </div>
        {error && <div className="error-banner">{error}</div>}
      </main>

      <footer className="app__footer">
        <div className="composer">
          <textarea
            ref={textareaRef}
            className="composer__input"
            placeholder="Message the assistant…"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {isStreaming ? (
            <button className="composer__btn composer__btn--stop" onClick={stop}>
              Stop
            </button>
          ) : (
            <button className="composer__btn" onClick={() => void send()} disabled={!input.trim()}>
              Send
            </button>
          )}
        </div>
        <div className="composer__hint">Enter to send · Shift + Enter for a new line</div>
      </footer>
    </div>
  );
}
