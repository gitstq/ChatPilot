"""
工单 Schema

定义工单相关的请求/响应数据结构。
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TicketCreate(BaseModel):
    """创建工单请求体。"""

    conversation_id: Optional[int] = Field(default=None, description="关联对话ID")
    title: str = Field(..., description="工单标题")
    description: Optional[str] = Field(default=None, description="工单描述")
    priority: str = Field(default="medium", description="优先级")
    assigned_to: Optional[str] = Field(default=None, description="分配的客服")
    created_by: Optional[str] = Field(default=None, description="创建人")


class TicketUpdate(BaseModel):
    """更新工单请求体。"""

    title: Optional[str] = Field(default=None, description="工单标题")
    description: Optional[str] = Field(default=None, description="工单描述")
    status: Optional[str] = Field(default=None, description="工单状态")
    priority: Optional[str] = Field(default=None, description="优先级")
    assigned_to: Optional[str] = Field(default=None, description="分配的客服")
    resolution: Optional[str] = Field(default=None, description="解决方案")


class TicketAssign(BaseModel):
    """分配工单请求体。"""

    assigned_to: str = Field(..., description="分配的客服人员")


class TicketStatusUpdate(BaseModel):
    """更新工单状态请求体。"""

    status: str = Field(..., description="工单状态")


class TicketResponse(BaseModel):
    """工单响应体。"""

    id: int
    conversation_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketListResponse(BaseModel):
    """工单列表响应体（含分页信息）。"""

    items: list[TicketResponse]
    total: int
    page: int
    page_size: int
