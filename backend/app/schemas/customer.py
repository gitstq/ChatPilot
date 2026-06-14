"""
客户 Schema

定义客户相关的请求/响应数据结构。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    """创建客户请求体。"""

    name: str = Field(..., description="客户名称")
    email: Optional[str] = Field(default=None, description="电子邮箱")
    phone: Optional[str] = Field(default=None, description="电话号码")
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")
    notes: Optional[str] = Field(default=None, description="备注")
    tags: list[str] = Field(default_factory=list, description="标签列表")


class CustomerUpdate(BaseModel):
    """更新客户请求体。"""

    name: Optional[str] = Field(default=None, description="客户名称")
    email: Optional[str] = Field(default=None, description="电子邮箱")
    phone: Optional[str] = Field(default=None, description="电话号码")
    metadata_: Optional[dict[str, Any]] = Field(
        default=None, alias="metadata"
    )
    notes: Optional[str] = Field(default=None, description="备注")
    tags: Optional[list[str]] = Field(default=None, description="标签列表")


class CustomerResponse(BaseModel):
    """客户响应体。"""

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    metadata_: dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class CustomerListResponse(BaseModel):
    """客户列表响应体（含分页信息）。"""

    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
