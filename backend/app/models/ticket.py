"""
工单模型

管理客服工单的生命周期，包括工单状态、优先级和解决方案。
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models import Base


class Ticket(Base):
    """
    工单模型。

    代表一个需要跟进处理的客服工单，可关联到具体对话。

    Attributes:
        id: 主键
        conversation_id: 关联对话ID
        title: 工单标题
        description: 工单描述
        status: 工单状态 (open / in_progress / resolved / closed)
        priority: 优先级 (low / medium / high)
        assigned_to: 分配的客服人员
        resolution: 解决方案
        created_by: 创建人
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "tickets"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Optional[int] = Column(
        Integer, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    status: str = Column(String(50), nullable=False, default="open")
    priority: str = Column(String(50), nullable=False, default="medium")
    assigned_to: Optional[str] = Column(String(255), nullable=True)
    resolution: Optional[str] = Column(Text, nullable=True)
    created_by: Optional[str] = Column(String(255), nullable=True)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──────────────────────────────────────────────────────
    conversation = relationship(
        "Conversation",
        back_populates="tickets",
    )

    def __repr__(self) -> str:
        return (
            f"<Ticket(id={self.id}, title='{self.title}', status='{self.status}')>"
        )
