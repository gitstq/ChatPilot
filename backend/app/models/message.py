"""
消息模型

管理对话中的每条消息，支持客户、客服和AI三种发送者类型。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models import Base


class Message(Base):
    """
    消息模型。

    代表对话中的一条消息，支持多种发送者类型。

    Attributes:
        id: 主键
        conversation_id: 关联对话ID
        content: 消息内容
        sender_type: 发送者类型 (customer / agent / ai)
        sender_name: 发送者名称
        metadata: 扩展元数据 (JSON)
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "messages"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id: int = Column(
        Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    content: str = Column(Text, nullable=False)
    sender_type: str = Column(String(50), nullable=False, default="customer")
    sender_name: Optional[str] = Column(String(255), nullable=True)
    metadata_: dict[str, Any] = Column(JSON, default=dict)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──────────────────────────────────────────────────────
    conversation = relationship(
        "Conversation",
        back_populates="messages",
    )

    def __repr__(self) -> str:
        return (
            f"<Message(id={self.id}, sender_type='{self.sender_type}', "
            f"conversation_id={self.conversation_id})>"
        )
