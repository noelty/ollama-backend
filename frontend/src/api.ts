import type { Chat, ChatMessage } from "./types";

export const CHATS_ENDPOINT = "/api/chats";

/** A chat as listed by GET /api/chats. Messages are fetched separately. */
interface ChatSummary {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/chats doesn't return timestamps yet. The epoch sorts these chats
// below any chat created in this session while keeping the server's order.
const MISSING_TIMESTAMP = new Date(0).toISOString();

function chatUrl(id: string): string {
  return `${CHATS_ENDPOINT}/${encodeURIComponent(id)}`;
}

export async function fetchChats(): Promise<Chat[]> {
  const res = await fetch(CHATS_ENDPOINT);
  if (!res.ok) throw new Error(`Couldn't load chats (${res.status})`);

  const summaries = (await res.json()) as ChatSummary[];
  return summaries.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt ?? MISSING_TIMESTAMP,
    updatedAt: c.updatedAt ?? MISSING_TIMESTAMP,
  }));
}

export async function fetchChatMessages(id: string): Promise<ChatMessage[]> {
  const res = await fetch(`${chatUrl(id)}/messages`);
  if (!res.ok) throw new Error(`Couldn't load messages (${res.status})`);
  return (await res.json()) as ChatMessage[];
}

/**
 * A chat that was never sent has no row in the database, so a 404 means the
 * chat is already gone and counts as success.
 */
export async function deleteChat(id: string): Promise<void> {
  const res = await fetch(chatUrl(id), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`Couldn't delete chat (${res.status})`);
}
