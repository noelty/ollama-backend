import type { Chat } from "../types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  maxVisible?: number;
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  maxVisible = 20,
}: SidebarProps) {
  const visible = [...chats]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, maxVisible);

  return (
    <aside className="sidebar">
      <button className="sidebar__new" onClick={onNewChat}>
        + New chat
      </button>

      <div className="sidebar__list">
        {visible.length === 0 && (
          <div className="sidebar__empty">No chats yet</div>
        )}
        {visible.map((chat) => (
          <div
            key={chat.id}
            className={`sidebar__item ${
              chat.id === activeChatId ? "sidebar__item--active" : ""
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <span className="sidebar__item-title">{chat.title || "New chat"}</span>
            <button
              className="sidebar__item-delete"
              aria-label="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}