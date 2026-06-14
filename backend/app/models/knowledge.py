"""
知识库模型

管理FAQ知识条目，用于AI智能回复匹配。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
)

from app.models import Base


class Knowledge(Base):
    """
    知识库模型。

    代表一条FAQ知识条目，用于AI回复时的知识匹配。

    Attributes:
        id: 主键
        title: 知识标题
        content: 知识内容（回答）
        category: 分类
        tags: 标签列表 (JSON)
        enabled: 是否启用
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "knowledge"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    title: str = Column(String(255), nullable=False)
    content: str = Column(Text, nullable=False)
    category: Optional[str] = Column(String(100), nullable=True)
    tags: list[str] = Column(JSON, default=list)
    enabled: bool = Column(Boolean, nullable=False, default=True)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Knowledge(id={self.id}, title='{self.title}', enabled={self.enabled})>"
