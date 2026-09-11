export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  /** undefined until fetched from the server; [] means the chat is truly empty. */
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/** Discriminated union over the SSE events the backend can emit. */
export type ChatStreamEvent =
  | { event: "token"; data: { text: string } }
  | { event: "done"; data: Record<string, never> }
  | { event: "error"; data: { message: string } };

export type ChatEventName = ChatStreamEvent["event"];