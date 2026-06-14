"""
知识库 Schema

定义知识库相关的请求/响应数据结构。
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class KnowledgeCreate(BaseModel):
    """创建知识条目请求体。"""

    title: str = Field(..., description="知识标题")
    content: str = Field(..., description="知识内容")
    category: Optional[str] = Field(default=None, description="分类")
    tags: list[str] = Field(default_factory=list, description="标签列表")
    enabled: bool = Field(default=True, description="是否启用")


class KnowledgeUpdate(BaseModel):
    """更新知识条目请求体。"""

    title: Optional[str] = Field(default=None, description="知识标题")
    content: Optional[str] = Field(default=None, description="知识内容")
    category: Optional[str] = Field(default=None, description="分类")
    tags: Optional[list[str]] = Field(default=None, description="标签列表")
    enabled: Optional[bool] = Field(default=None, description="是否启用")


class KnowledgeResponse(BaseModel):
    """知识条目响应体。"""

    id: int
    title: str
    content: str
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeListResponse(BaseModel):
    """知识库列表响应体（含分页信息）。"""

    items: list[KnowledgeResponse]
    total: int
    page: int
    page_size: int
