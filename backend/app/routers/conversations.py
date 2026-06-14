"""
对话路由

提供对话的 CRUD 操作接口，支持分页、过滤和状态管理。
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import (
    ConversationAssign,
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
    ConversationStatusUpdate,
    ConversationUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["对话管理"])


@router.get("", response_model=ConversationListResponse, summary="获取对话列表")
async def list_conversations(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    channel: Optional[str] = Query(None, description="按渠道过滤"),
    priority: Optional[str] = Query(None, description="按优先级过滤"),
    assigned_to: Optional[str] = Query(None, description="按分配人过滤"),
    db: AsyncSession = Depends(get_db),
) -> ConversationListResponse:
    """
    获取对话列表，支持分页和多条件过滤。

    Args:
        page: 页码
        page_size: 每页数量
        status: 状态过滤
        channel: 渠道过滤
        priority: 优先级过滤
        assigned_to: 分配人过滤
        db: 数据库会话

    Returns:
        ConversationListResponse: 分页对话列表
    """
    query = select(Conversation)
    count_query = select(func.count()).select_from(Conversation)

    # ── 应用过滤条件 ──────────────────────────────────────────────
    if status:
        query = query.where(Conversation.status == status)
        count_query = count_query.where(Conversation.status == status)
    if channel:
        query = query.where(Conversation.channel == channel)
        count_query = count_query.where(Conversation.channel == channel)
    if priority:
        query = query.where(Conversation.priority == priority)
        count_query = count_query.where(Conversation.priority == priority)
    if assigned_to:
        query = query.where(Conversation.assigned_to == assigned_to)
        count_query = count_query.where(Conversation.assigned_to == assigned_to)

    # ── 排序和分页 ────────────────────────────────────────────────
    query = query.order_by(Conversation.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    conversations = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{conversation_id}", response_model=ConversationResponse, summary="获取对话详情")
async def get_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    根据ID获取对话详情。

    Args:
        conversation_id: 对话ID
        db: 数据库会话

    Returns:
        ConversationResponse: 对话详情

    Raises:
        HTTPException: 对话不存在时返回404
    """
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    return ConversationResponse.model_validate(conversation)


@router.post("", response_model=ConversationResponse, status_code=201, summary="创建对话")
async def create_conversation(
    data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    创建新的对话。

    Args:
        data: 创建对话数据
        db: 数据库会话

    Returns:
        ConversationResponse: 创建的对话
    """
    conversation = Conversation(
        title=data.title,
        channel=data.channel,
        customer_id=data.customer_id,
        priority=data.priority,
        metadata_=data.metadata_,
    )
    db.add(conversation)
    await db.flush()
    await db.refresh(conversation)

    logger.info(f"创建对话: id={conversation.id}, title={conversation.title}")
    return ConversationResponse.model_validate(conversation)


@router.put("/{conversation_id}", response_model=ConversationResponse, summary="更新对话")
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    更新对话信息。

    Args:
        conversation_id: 对话ID
        data: 更新数据
        db: 数据库会话

    Returns:
        ConversationResponse: 更新后的对话

    Raises:
        HTTPException: 对话不存在时返回404
    """
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    # ── 更新非空字段 ──────────────────────────────────────────────
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # 处理 alias 映射
        if key == "metadata_":
            setattr(conversation, "metadata_", value)
        else:
            setattr(conversation, key, value)

    await db.flush()
    await db.refresh(conversation)

    logger.info(f"更新对话: id={conversation.id}")
    return ConversationResponse.model_validate(conversation)


@router.patch(
    "/{conversation_id}/status",
    response_model=ConversationResponse,
    summary="更新对话状态",
)
async def update_conversation_status(
    conversation_id: int,
    data: ConversationStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    更新对话状态。

    Args:
        conversation_id: 对话ID
        data: 状态更新数据
        db: 数据库会话

    Returns:
        ConversationResponse: 更新后的对话

    Raises:
        HTTPException: 对话不存在时返回404
    """
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    conversation.status = data.status
    await db.flush()
    await db.refresh(conversation)

    logger.info(f"更新对话状态: id={conversation.id}, status={data.status}")
    return ConversationResponse.model_validate(conversation)


@router.post(
    "/{conversation_id}/assign",
    response_model=ConversationResponse,
    summary="分配对话",
)
async def assign_conversation(
    conversation_id: int,
    data: ConversationAssign,
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    将对话分配给指定客服人员。

    Args:
        conversation_id: 对话ID
        data: 分配数据
        db: 数据库会话

    Returns:
        ConversationResponse: 更新后的对话

    Raises:
        HTTPException: 对话不存在时返回404
    """
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    conversation.assigned_to = data.assigned_to
    await db.flush()
    await db.refresh(conversation)

    logger.info(
        f"分配对话: id={conversation_id}, assigned_to={data.assigned_to}"
    )
    return ConversationResponse.model_validate(conversation)
