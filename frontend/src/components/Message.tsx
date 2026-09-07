import type { ChatMessage } from "../types";

interface MessageProps extends ChatMessage {
  isStreaming: boolean;
}

export default function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === "user";
  return (
    <div className={`msg ${isUser ? "msg--user" : "msg--assistant"}`}>
      <div className="msg__rail">
        <span className="msg__dot" aria-hidden="true" />
      </div>
      <div className="msg__body">
        <div className="msg__label">{isUser ? "you" : "assistant"}</div>
        <div className="msg__text">
          {content}
          {isStreaming && <span className="cursor" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
