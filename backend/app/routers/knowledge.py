"""
知识库路由

提供知识库的 CRUD 操作接口，支持搜索和分页。
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.knowledge import Knowledge
from app.schemas.knowledge import (
    KnowledgeCreate,
    KnowledgeListResponse,
    KnowledgeResponse,
    KnowledgeUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["知识库管理"])


@router.get("", response_model=KnowledgeListResponse, summary="获取知识库列表")
async def list_knowledge(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="按分类过滤"),
    enabled: Optional[bool] = Query(None, description="按启用状态过滤"),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeListResponse:
    """
    获取知识库列表，支持分页和过滤。

    Args:
        page: 页码
        page_size: 每页数量
        category: 分类过滤
        enabled: 启用状态过滤
        db: 数据库会话

    Returns:
        KnowledgeListResponse: 分页知识库列表
    """
    query = select(Knowledge)
    count_query = select(func.count()).select_from(Knowledge)

    if category:
        query = query.where(Knowledge.category == category)
        count_query = count_query.where(Knowledge.category == category)
    if enabled is not None:
        query = query.where(Knowledge.enabled == enabled)
        count_query = count_query.where(Knowledge.enabled == enabled)

    query = query.order_by(Knowledge.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return KnowledgeListResponse(
        items=[KnowledgeResponse.model_validate(k) for k in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/search", response_model=list[KnowledgeResponse], summary="搜索知识库")
async def search_knowledge(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50, description="返回数量"),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeResponse]:
    """
    按标题或内容搜索知识库条目。

    Args:
        q: 搜索关键词
        limit: 返回数量
        db: 数据库会话

    Returns:
        list[KnowledgeResponse]: 匹配的知识条目列表
    """
    search_pattern = f"%{q}%"
    query = select(Knowledge).where(
        or_(
            Knowledge.title.ilike(search_pattern),
            Knowledge.content.ilike(search_pattern),
        )
    ).where(Knowledge.enabled == True).limit(limit)  # noqa: E712

    result = await db.execute(query)
    items = result.scalars().all()

    return [KnowledgeResponse.model_validate(k) for k in items]


@router.get("/{knowledge_id}", response_model=KnowledgeResponse, summary="获取知识条目详情")
async def get_knowledge(
    knowledge_id: int,
    db: AsyncSession = Depends(get_db),
) -> KnowledgeResponse:
    """
    根据ID获取知识条目详情。

    Args:
        knowledge_id: 知识条目ID
        db: 数据库会话

    Returns:
        KnowledgeResponse: 知识条目详情

    Raises:
        HTTPException: 知识条目不存在时返回404
    """
    query = select(Knowledge).where(Knowledge.id == knowledge_id)
    result = await db.execute(query)
    knowledge = result.scalar_one_or_none()

    if not knowledge:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    return KnowledgeResponse.model_validate(knowledge)


@router.post(
    "",
    response_model=KnowledgeResponse,
    status_code=201,
    summary="创建知识条目",
)
async def create_knowledge(
    data: KnowledgeCreate,
    db: AsyncSession = Depends(get_db),
) -> KnowledgeResponse:
    """
    创建新的知识条目。

    Args:
        data: 知识条目数据
        db: 数据库会话

    Returns:
        KnowledgeResponse: 创建的知识条目
    """
    knowledge = Knowledge(
        title=data.title,
        content=data.content,
        category=data.category,
        tags=data.tags,
        enabled=data.enabled,
    )
    db.add(knowledge)
    await db.flush()
    await db.refresh(knowledge)

    logger.info(f"创建知识条目: id={knowledge.id}, title={knowledge.title}")
    return KnowledgeResponse.model_validate(knowledge)


@router.put("/{knowledge_id}", response_model=KnowledgeResponse, summary="更新知识条目")
async def update_knowledge(
    knowledge_id: int,
    data: KnowledgeUpdate,
    db: AsyncSession = Depends(get_db),
) -> KnowledgeResponse:
    """
    更新知识条目。

    Args:
        knowledge_id: 知识条目ID
        data: 更新数据
        db: 数据库会话

    Returns:
        KnowledgeResponse: 更新后的知识条目

    Raises:
        HTTPException: 知识条目不存在时返回404
    """
    query = select(Knowledge).where(Knowledge.id == knowledge_id)
    result = await db.execute(query)
    knowledge = result.scalar_one_or_none()

    if not knowledge:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(knowledge, key, value)

    await db.flush()
    await db.refresh(knowledge)

    logger.info(f"更新知识条目: id={knowledge_id}")
    return KnowledgeResponse.model_validate(knowledge)


@router.delete(
    "/{knowledge_id}",
    status_code=204,
    summary="删除知识条目",
)
async def delete_knowledge(
    knowledge_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    删除知识条目。

    Args:
        knowledge_id: 知识条目ID
        db: 数据库会话

    Raises:
        HTTPException: 知识条目不存在时返回404
    """
    query = select(Knowledge).where(Knowledge.id == knowledge_id)
    result = await db.execute(query)
    knowledge = result.scalar_one_or_none()

    if not knowledge:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    await db.delete(knowledge)

    logger.info(f"删除知识条目: id={knowledge_id}")
