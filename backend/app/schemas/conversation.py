"""
对话 Schema

定义对话相关的请求/响应数据结构。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    """创建对话请求体。"""

    title: str = Field(default="新对话", description="对话标题")
    channel: str = Field(default="webwidget", description="来源渠道")
    customer_id: Optional[int] = Field(default=None, description="关联客户ID")
    priority: str = Field(default="medium", description="优先级")
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class ConversationUpdate(BaseModel):
    """更新对话请求体。"""

    title: Optional[str] = Field(default=None, description="对话标题")
    status: Optional[str] = Field(default=None, description="对话状态")
    assigned_to: Optional[str] = Field(default=None, description="分配的客服")
    priority: Optional[str] = Field(default=None, description="优先级")
    metadata_: Optional[dict[str, Any]] = Field(
        default=None, alias="metadata"
    )


class ConversationAssign(BaseModel):
    """分配对话请求体。"""

    assigned_to: str = Field(..., description="分配的客服人员")


class ConversationStatusUpdate(BaseModel):
    """更新对话状态请求体。"""

    status: str = Field(..., description="对话状态 (active/closed/pending)")


class ConversationResponse(BaseModel):
    """对话响应体。"""

    id: int
    title: str
    channel: str
    status: str
    customer_id: Optional[int] = None
    assigned_to: Optional[str] = None
    priority: str
    metadata_: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ConversationListResponse(BaseModel):
    """对话列表响应体（含分页信息）。"""

    items: list[ConversationResponse]
    total: int
    page: int
    page_size: int
