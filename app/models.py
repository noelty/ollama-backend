import enum

from sqlalchemy import Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Role(enum.Enum):
    USER = "User"
    AI = "AI Assistant"

class Conversation(Base):
    __tablename__ = "conversations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime)
    messages: Mapped[list["Message"]] = relationship()

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[Role] = mapped_column(Enum(Role))
    content: Mapped[Text] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(DateTime)
    conv_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"))