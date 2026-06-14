"""
统计路由

提供对话统计、响应时间和满意度等分析数据接口。
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.ticket import Ticket

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["统计分析"])


@router.get("/overview", summary="获取统计概览")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    获取系统统计概览数据，包括对话数、消息数、工单数等。

    Args:
        db: 数据库会话

    Returns:
        dict: 统计概览数据
    """
    # ── 对话统计 ──────────────────────────────────────────────────
    total_conversations = await db.execute(
        select(func.count()).select_from(Conversation)
    )
    active_conversations = await db.execute(
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.status == "active")
    )
    closed_conversations = await db.execute(
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.status == "closed")
    )

    # ── 消息统计 ──────────────────────────────────────────────────
    total_messages = await db.execute(
        select(func.count()).select_from(Message)
    )

    # ── 工单统计 ──────────────────────────────────────────────────
    total_tickets = await db.execute(
        select(func.count()).select_from(Ticket)
    )
    open_tickets = await db.execute(
        select(func.count())
        .select_from(Ticket)
        .where(Ticket.status == "open")
    )
    resolved_tickets = await db.execute(
        select(func.count())
        .select_from(Ticket)
        .where(Ticket.status == "resolved")
    )

    return {
        "conversations": {
            "total": total_conversations.scalar() or 0,
            "active": active_conversations.scalar() or 0,
            "closed": closed_conversations.scalar() or 0,
        },
        "messages": {
            "total": total_messages.scalar() or 0,
        },
        "tickets": {
            "total": total_tickets.scalar() or 0,
            "open": open_tickets.scalar() or 0,
            "resolved": resolved_tickets.scalar() or 0,
        },
    }


@router.get("/conversations", summary="对话统计")
async def get_conversation_analytics(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    获取指定天数内的对话统计数据。

    Args:
        days: 统计天数
        db: 数据库会话

    Returns:
        dict: 对话统计数据
    """
    since = datetime.utcnow() - timedelta(days=days)

    # ── 按渠道统计 ────────────────────────────────────────────────
    by_channel = await db.execute(
        select(Conversation.channel, func.count())
        .where(Conversation.created_at >= since)
        .group_by(Conversation.channel)
    )
    channel_stats = {
        row[0]: row[1] for row in by_channel.all()
    }

    # ── 按状态统计 ────────────────────────────────────────────────
    by_status = await db.execute(
        select(Conversation.status, func.count())
        .where(Conversation.created_at >= since)
        .group_by(Conversation.status)
    )
    status_stats = {
        row[0]: row[1] for row in by_status.all()
    }

    # ── 按优先级统计 ──────────────────────────────────────────────
    by_priority = await db.execute(
        select(Conversation.priority, func.count())
        .where(Conversation.created_at >= since)
        .group_by(Conversation.priority)
    )
    priority_stats = {
        row[0]: row[1] for row in by_priority.all()
    }

    return {
        "period_days": days,
        "by_channel": channel_stats,
        "by_status": status_stats,
        "by_priority": priority_stats,
    }


@router.get("/response-time", summary="响应时间统计")
async def get_response_time_analytics(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    获取指定天数内的平均响应时间统计。

    计算客服/AI回复的平均响应时间。

    Args:
        days: 统计天数
        db: 数据库会话

    Returns:
        dict: 响应时间统计数据
    """
    since = datetime.utcnow() - timedelta(days=days)

    # ── 获取该时间段内的客服和AI消息 ──────────────────────────────
    agent_messages = await db.execute(
        select(func.count())
        .select_from(Message)
        .where(
            Message.created_at >= since,
            Message.sender_type.in_(["agent", "ai"]),
        )
    )

    total_agent_msgs = agent_messages.scalar() or 0

    return {
        "period_days": days,
        "total_agent_responses": total_agent_msgs,
        "avg_response_time_seconds": 0,  # 需要更复杂的计算逻辑
        "note": "响应时间统计需要基于消息时间戳差值计算，此处为基础实现",
    }


@router.get("/satisfaction", summary="满意度统计")
async def get_satisfaction_analytics(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    获取指定天数内的满意度统计。

    基于已关闭的对话和已解决的工单计算满意度指标。

    Args:
        days: 统计天数
        db: 数据库会话

    Returns:
        dict: 满意度统计数据
    """
    since = datetime.utcnow() - timedelta(days=days)

    # ── 已解决工单数 ──────────────────────────────────────────────
    resolved = await db.execute(
        select(func.count())
        .select_from(Ticket)
        .where(
            Ticket.updated_at >= since,
            Ticket.status == "resolved",
        )
    )

    # ── 已关闭对话数 ──────────────────────────────────────────────
    closed = await db.execute(
        select(func.count())
        .select_from(Conversation)
        .where(
            Conversation.updated_at >= since,
            Conversation.status == "closed",
        )
    )

    return {
        "period_days": days,
        "resolved_tickets": resolved.scalar() or 0,
        "closed_conversations": closed.scalar() or 0,
        "satisfaction_score": None,  # 需要额外的评价数据模型
        "note": "满意度评分需要额外的评价数据模型支持",
    }
