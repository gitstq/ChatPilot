"""
统计模型

记录系统事件用于统计分析，如对话创建、消息发送、工单状态变更等。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    JSON,
    String,
)

from app.models import Base


class AnalyticsEvent(Base):
    """
    统计事件模型。

    记录系统中的关键事件，用于后续的统计分析。

    Attributes:
        id: 主键
        event_type: 事件类型 (conversation_created / message_sent / ticket_resolved 等)
        resource_type: 资源类型 (conversation / message / ticket)
        resource_id: 资源ID
        data: 事件附加数据 (JSON)
        created_at: 事件发生时间
    """

    __tablename__ = "analytics_events"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    event_type: str = Column(String(100), nullable=False, index=True)
    resource_type: Optional[str] = Column(String(50), nullable=True)
    resource_id: Optional[int] = Column(Integer, nullable=True)
    data: dict[str, Any] = Column(JSON, default=dict)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, index=True
    )

    def __repr__(self) -> str:
        return (
            f"<AnalyticsEvent(id={self.id}, event_type='{self.event_type}', "
            f"resource_id={self.resource_id})>"
        )
