"""
消息 Schema

定义消息相关的请求/响应数据结构。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """创建消息请求体。"""

    conversation_id: int = Field(..., description="关联对话ID")
    content: str = Field(..., description="消息内容")
    sender_type: str = Field(default="customer", description="发送者类型")
    sender_name: str | None = Field(default=None, description="发送者名称")
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class MessageBatchCreate(BaseModel):
    """批量创建消息请求体。"""

    messages: list[MessageCreate] = Field(..., description="消息列表")


class MessageResponse(BaseModel):
    """消息响应体。"""

    id: int
    conversation_id: int
    content: str
    sender_type: str
    sender_name: str | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}
