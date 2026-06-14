"""
消息路由

提供消息的查询和创建接口，支持批量创建。
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import (
    MessageBatchCreate,
    MessageCreate,
    MessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["消息管理"])


@router.get("", response_model=list[MessageResponse], summary="获取消息列表")
async def list_messages(
    conversation_id: Optional[int] = Query(None, description="按对话ID过滤"),
    sender_type: Optional[str] = Query(None, description="按发送者类型过滤"),
    limit: int = Query(50, ge=1, le=200, description="返回数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    """
    获取消息列表，支持按对话和发送者类型过滤。

    Args:
        conversation_id: 对话ID过滤
        sender_type: 发送者类型过滤
        limit: 返回数量
        offset: 偏移量
        db: 数据库会话

    Returns:
        list[MessageResponse]: 消息列表
    """
    query = select(Message)

    if conversation_id:
        query = query.where(Message.conversation_id == conversation_id)
    if sender_type:
        query = query.where(Message.sender_type == sender_type)

    query = query.order_by(Message.created_at.asc()).offset(offset).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [MessageResponse.model_validate(m) for m in messages]


@router.post("", response_model=MessageResponse, status_code=201, summary="创建消息")
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    创建新消息。

    Args:
        data: 消息数据
        db: 数据库会话

    Returns:
        MessageResponse: 创建的消息

    Raises:
        HTTPException: 关联对话不存在时返回404
    """
    # ── 验证对话存在 ──────────────────────────────────────────────
    conv_query = select(Conversation).where(
        Conversation.id == data.conversation_id
    )
    conv_result = await db.execute(conv_query)
    conversation = conv_result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="关联的对话不存在")

    message = Message(
        conversation_id=data.conversation_id,
        content=data.content,
        sender_type=data.sender_type,
        sender_name=data.sender_name,
        metadata_=data.metadata_,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    logger.info(
        f"创建消息: id={message.id}, conversation_id={message.conversation_id}"
    )

    # ── 发送 WebSocket 通知 ──────────────────────────────────────
    try:
        from app.services.notification import notification_manager

        await notification_manager.broadcast_new_message(
            conversation_id=data.conversation_id,
            message_id=message.id,
            content=data.content,
            sender_type=data.sender_type,
            sender_name=data.sender_name,
        )
    except Exception as e:
        logger.warning(f"广播消息通知失败: {e}")

    return MessageResponse.model_validate(message)


@router.post(
    "/batch",
    response_model=list[MessageResponse],
    status_code=201,
    summary="批量创建消息",
)
async def batch_create_messages(
    data: MessageBatchCreate,
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    """
    批量创建消息。

    Args:
        data: 批量消息数据
        db: 数据库会话

    Returns:
        list[MessageResponse]: 创建的消息列表

    Raises:
        HTTPException: 关联对话不存在时返回404
    """
    # ── 验证所有对话存在 ──────────────────────────────────────────
    conv_ids = {msg.conversation_id for msg in data.messages}
    for conv_id in conv_ids:
        conv_query = select(Conversation).where(Conversation.id == conv_id)
        conv_result = await db.execute(conv_query)
        if not conv_result.scalar_one_or_none():
            raise HTTPException(
                status_code=404,
                detail=f"对话 id={conv_id} 不存在",
            )

    messages = []
    for msg_data in data.messages:
        message = Message(
            conversation_id=msg_data.conversation_id,
            content=msg_data.content,
            sender_type=msg_data.sender_type,
            sender_name=msg_data.sender_name,
            metadata_=msg_data.metadata_,
        )
        db.add(message)
        messages.append(message)

    await db.flush()
    for msg in messages:
        await db.refresh(msg)

    logger.info(f"批量创建消息: count={len(messages)}")
    return [MessageResponse.model_validate(m) for m in messages]
