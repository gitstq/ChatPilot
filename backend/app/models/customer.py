"""
客户模型

管理客户信息，包括联系方式、标签和备注。
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
    Text,
)

from app.models import Base


class Customer(Base):
    """
    客户模型。

    代表系统中的一个客户，存储基本信息和扩展数据。

    Attributes:
        id: 主键
        name: 客户名称
        email: 电子邮箱
        phone: 电话号码
        metadata: 扩展元数据 (JSON)
        notes: 备注信息
        tags: 标签列表 (JSON)
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "customers"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    name: str = Column(String(255), nullable=False)
    email: Optional[str] = Column(String(255), nullable=True, unique=True)
    phone: Optional[str] = Column(String(50), nullable=True)
    metadata_: dict[str, Any] = Column(JSON, default=dict)
    notes: Optional[str] = Column(Text, nullable=True)
    tags: list[str] = Column(JSON, default=list)
    created_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: datetime = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Customer(id={self.id}, name='{self.name}', email='{self.email}')>"
