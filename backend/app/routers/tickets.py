"""
工单路由

提供工单的 CRUD 操作接口，支持分页、过滤和状态管理。
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ticket import Ticket
from app.schemas.ticket import (
    TicketAssign,
    TicketCreate,
    TicketListResponse,
    TicketResponse,
    TicketStatusUpdate,
    TicketUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["工单管理"])


@router.get("", response_model=TicketListResponse, summary="获取工单列表")
async def list_tickets(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    priority: Optional[str] = Query(None, description="按优先级过滤"),
    assigned_to: Optional[str] = Query(None, description="按分配人过滤"),
    db: AsyncSession = Depends(get_db),
) -> TicketListResponse:
    """
    获取工单列表，支持分页和多条件过滤。

    Args:
        page: 页码
        page_size: 每页数量
        status: 状态过滤
        priority: 优先级过滤
        assigned_to: 分配人过滤
        db: 数据库会话

    Returns:
        TicketListResponse: 分页工单列表
    """
    query = select(Ticket)
    count_query = select(func.count()).select_from(Ticket)

    if status:
        query = query.where(Ticket.status == status)
        count_query = count_query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
        count_query = count_query.where(Ticket.priority == priority)
    if assigned_to:
        query = query.where(Ticket.assigned_to == assigned_to)
        count_query = count_query.where(Ticket.assigned_to == assigned_to)

    query = query.order_by(Ticket.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    tickets = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return TicketListResponse(
        items=[TicketResponse.model_validate(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{ticket_id}", response_model=TicketResponse, summary="获取工单详情")
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """
    根据ID获取工单详情。

    Args:
        ticket_id: 工单ID
        db: 数据库会话

    Returns:
        TicketResponse: 工单详情

    Raises:
        HTTPException: 工单不存在时返回404
    """
    query = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    return TicketResponse.model_validate(ticket)


@router.post("", response_model=TicketResponse, status_code=201, summary="创建工单")
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """
    创建新工单。

    Args:
        data: 工单数据
        db: 数据库会话

    Returns:
        TicketResponse: 创建的工单
    """
    ticket = Ticket(
        conversation_id=data.conversation_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        assigned_to=data.assigned_to,
        created_by=data.created_by,
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)

    logger.info(f"创建工单: id={ticket.id}, title={ticket.title}")

    # ── 发送 WebSocket 通知 ──────────────────────────────────────
    try:
        from app.services.notification import notification_manager

        await notification_manager.broadcast_ticket_update(
            ticket_id=ticket.id,
            action="created",
            title=ticket.title,
        )
    except Exception as e:
        logger.warning(f"广播工单通知失败: {e}")

    return TicketResponse.model_validate(ticket)


@router.put("/{ticket_id}", response_model=TicketResponse, summary="更新工单")
async def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """
    更新工单信息。

    Args:
        ticket_id: 工单ID
        data: 更新数据
        db: 数据库会话

    Returns:
        TicketResponse: 更新后的工单

    Raises:
        HTTPException: 工单不存在时返回404
    """
    query = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)

    await db.flush()
    await db.refresh(ticket)

    logger.info(f"更新工单: id={ticket.id}")
    return TicketResponse.model_validate(ticket)


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse,
    summary="更新工单状态",
)
async def update_ticket_status(
    ticket_id: int,
    data: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """
    更新工单状态。

    Args:
        ticket_id: 工单ID
        data: 状态更新数据
        db: 数据库会话

    Returns:
        TicketResponse: 更新后的工单

    Raises:
        HTTPException: 工单不存在时返回404
    """
    query = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    ticket.status = data.status
    await db.flush()
    await db.refresh(ticket)

    logger.info(f"更新工单状态: id={ticket_id}, status={data.status}")

    # ── 发送 WebSocket 通知 ──────────────────────────────────────
    try:
        from app.services.notification import notification_manager

        await notification_manager.broadcast_ticket_update(
            ticket_id=ticket.id,
            action="status_changed",
            title=ticket.title,
            status=data.status,
        )
    except Exception as e:
        logger.warning(f"广播工单通知失败: {e}")

    return TicketResponse.model_validate(ticket)


@router.post(
    "/{ticket_id}/assign",
    response_model=TicketResponse,
    summary="分配工单",
)
async def assign_ticket(
    ticket_id: int,
    data: TicketAssign,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """
    将工单分配给指定客服人员。

    Args:
        ticket_id: 工单ID
        data: 分配数据
        db: 数据库会话

    Returns:
        TicketResponse: 更新后的工单

    Raises:
        HTTPException: 工单不存在时返回404
    """
    query = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    ticket.assigned_to = data.assigned_to
    await db.flush()
    await db.refresh(ticket)

    logger.info(f"分配工单: id={ticket_id}, assigned_to={data.assigned_to}")
    return TicketResponse.model_validate(ticket)
