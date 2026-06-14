"""
对话模型

管理客服对话的生命周期，包括对话状态、渠道来源和分配信息。
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


class Conversation(Base):
    """
    对话模型。

    代表一个客户与客服系统之间的对话会话，支持多渠道来源。

    Attributes:
        id: 主键
        title: 对话标题
        channel: 来源渠道 (webwidget / email / api)
        status: 对话状态 (active / closed / pending)
        customer_id: 关联客户ID
        assigned_to: 分配的客服人员
        priority: 优先级 (low / medium / high)
        metadata: 扩展元数据 (JSON)
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "conversations"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    title: str = Column(String(255), nullable=False, default="新对话")
    channel: str = Column(String(50), nullable=False, default="webwidget")
    status: str = Column(String(50), nullable=False, default="active")
    customer_id: Optional[int] = Column(
        Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    assigned_to: Optional[str] = Column(String(255), nullable=True)
    priority: str = Column(String(50), nullable=False, default="medium")
    metadata_: dict[str, Any] = Column(JSON, default=dict)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──────────────────────────────────────────────────────
    messages = relationship(
        "Message",
        back_populates="conversation",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    tickets = relationship(
        "Ticket",
        back_populates="conversation",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, title='{self.title}', status='{self.status}')>"
