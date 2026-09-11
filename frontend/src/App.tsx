import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Message from "./components/Message";
import Sidebar from "./components/Sidebar";
import { readSSE } from "./sse";
import * as api from "./api";
import type { Chat, ChatMessage } from "./types";
import { ulid } from "ulidx";

function makeId(): string {
  return ulid()
}

function titleFrom(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed;
}

function createChat(): Chat {
  const timestamp = new Date().toISOString();
  return { id: makeId(), title: "", messages: [], createdAt: timestamp, updatedAt: timestamp };
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  // Id of the chat currently receiving a streamed reply (null when idle).
  const [streamingChatId, setStreamingChatId] = useState<string | null>(null);
  const isStreaming = streamingChatId !== null;
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];
  // Chats from GET /api/chats arrive without messages; they're fetched on open.
  const isLoadingMessages = activeChat !== null && activeChat.messages === undefined;

  useEffect(() => {
    api
      .fetchChats()
      .then((loaded) => {
        // Keep chats created locally before the list arrived.
        setChats((prev) => {
          const known = new Set(prev.map((c) => c.id));
          return [...prev, ...loaded.filter((c) => !known.has(c.id))];
        });
        setActiveChatId((prev) => prev ?? loaded[0]?.id ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!activeChatId || !isLoadingMessages) return;
    const id = activeChatId;
    api
      .fetchChatMessages(id)
      .then((fetched) =>
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, messages: fetched } : c)))
      )
      .catch((err: Error) => setError(err.message));
  }, [activeChatId, isLoadingMessages]);

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
    setInput("");
    setError(null);

    // Reuse an existing empty chat instead of piling up blank ones.
    const existingEmptyChat = chats.find((c) => c.messages?.length === 0);
    if (existingEmptyChat) {
      setActiveChatId(existingEmptyChat.id);
      return;
    }

    const chat = createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }

  function deleteChat(id: string): void {
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    if (id === streamingChatId) stop();

    // Optimistic: remove it right away and put it back if the server refuses.
    const remaining = chats.filter((c) => c.id !== id);
    setChats(remaining);
    if (id === activeChatId) {
      setActiveChatId(remaining[0]?.id ?? null);
    }
    api.deleteChat(id).catch((err: Error) => {
      setChats((prev) => [chat, ...prev]);
      setError(err.message);
    });
  }

  function updateChatMessages(id: string, next: ChatMessage[], title?: string): void {
    const timestamp = new Date().toISOString();

    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: next, title: title ?? c.title, updatedAt: timestamp }
          : c
      )
    );
  }

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || isLoadingMessages) return;

    // Use the open chat, or create one on the spot if none is selected.
    // The chat object is captured locally because state updates from
    // setChats/setActiveChatId are not visible until the next render.
    const chat: Chat = activeChat ?? createChat();
    if (!activeChat) {
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
    }
    const chatId = chat.id;
    const history = chat.messages ?? [];

    setError(null);
    const nextMessages: ChatMessage[] = [...history, { role: "user", content: trimmed }];
    const title = history.length === 0 ? titleFrom(trimmed) : undefined;
    updateChatMessages(chatId, [...nextMessages, { role: "assistant", content: "" }], title);
    setInput("");
    setStreamingChatId(chatId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Always send the chat metadata: the backend only uses it to create the
      // conversation row on the chat's first message.
      const res = await fetch(api.CHATS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: chatId,
          prompt: trimmed,
          chat: {
            id: chatId,
            title: title ?? chat.title,
            createdAt: chat.createdAt,
            updatedAt: new Date().toISOString(),
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      let assembled = "";
      let gotError = false;
      await readSSE(res, (event, data) => {
        if (event === "token") {
          const { text } = data as { text: string };
          assembled += text;
          updateChatMessages(chatId, [...nextMessages, { role: "assistant", content: assembled }]);
        } else if (event === "error") {
          const { message } = data as { message: string };
          gotError = true;
          setError(message || "Something went wrong.");
        }
      });

      // The stream closed without any text (e.g. the backend failed mid-stream).
      if (!assembled && !gotError && !controller.signal.aborted) {
        setError("No response received from the model.");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Couldn't reach the server.");
      }
    } finally {
      setStreamingChatId(null);
      abortRef.current = null;
    }
  }

  function stop(): void {
    abortRef.current?.abort();
    setStreamingChatId(null);
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
          {isLoadingMessages ? (
            <div className="empty">
              <p>Loading messages…</p>
            </div>
          ) : (
            messages.length === 0 && (
              <div className="empty">
                <p>Ask something to start the conversation.</p>
              </div>
            )
          )}
          <div className="thread">
            {messages.map((m, i) => (
              <Message
                key={i}
                role={m.role}
                content={m.content}
                isStreaming={
                  streamingChatId === activeChatId && i === messages.length - 1 && m.role === "assistant"
                }
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
              <button className="composer__btn" onClick={() => void send()} disabled={!input.trim() || isLoadingMessages}>
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