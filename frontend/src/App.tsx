import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Message from "./components/Message";
import Sidebar from "./components/Sidebar";
import { readSSE } from "./sse";
import type { Chat, ChatMessage } from "./types";

const ENDPOINT = "/api/chat";
const STORAGE_KEY = "chats";

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
}

function titleFrom(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed;
}

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadChats()[0]?.id ?? null
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  function newChat(): void {
    const chat: Chat = { id: makeId(), title: "", messages: [], updatedAt: Date.now() };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setInput("");
    setError(null);
  }

  function deleteChat(id: string): void {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeChatId) {
      setActiveChatId((prev) => {
        const remaining = chats.filter((c) => c.id !== id);
        return remaining[0]?.id ?? null;
      });
    }
  }

  function updateChatMessages(id: string, next: ChatMessage[], title?: string): void {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: next, title: title ?? c.title, updatedAt: Date.now() }
          : c
      )
    );
  }

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    let chatId = activeChatId;
    let baseMessages = messages;

    if (!chatId) {
      const chat: Chat = { id: makeId(), title: "", messages: [], updatedAt: Date.now() };
      setChats((prev) => [chat, ...prev]);
      chatId = chat.id;
      setActiveChatId(chatId);
      baseMessages = [];
    }

    setError(null);
    const nextMessages: ChatMessage[] = [...baseMessages, { role: "user", content: trimmed }];
    const title = baseMessages.length === 0 ? titleFrom(trimmed) : undefined;
    updateChatMessages(chatId, [...nextMessages, { role: "assistant", content: "" }], title);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({conversation_id: chatId, prompt: trimmed }),
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
          updateChatMessages(chatId!, [...nextMessages, { role: "assistant", content: assembled }]);
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
    <div className="app app--with-sidebar">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={deleteChat}
      />

      <div className="app__main-col">
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
    </div>
  );
}