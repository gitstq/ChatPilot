"""
客户路由

提供客户的 CRUD 操作接口，支持搜索和分页。
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customers", tags=["客户管理"])


@router.get("", response_model=CustomerListResponse, summary="获取客户列表")
async def list_customers(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db),
) -> CustomerListResponse:
    """
    获取客户列表，支持分页。

    Args:
        page: 页码
        page_size: 每页数量
        db: 数据库会话

    Returns:
        CustomerListResponse: 分页客户列表
    """
    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)

    query = query.order_by(Customer.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    customers = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in customers],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/search", response_model=list[CustomerResponse], summary="搜索客户")
async def search_customers(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    db: AsyncSession = Depends(get_db),
) -> list[CustomerResponse]:
    """
    按名称、邮箱或电话搜索客户。

    Args:
        q: 搜索关键词
        limit: 返回数量
        db: 数据库会话

    Returns:
        list[CustomerResponse]: 匹配的客户列表
    """
    search_pattern = f"%{q}%"
    query = select(Customer).where(
        or_(
            Customer.name.ilike(search_pattern),
            Customer.email.ilike(search_pattern),
            Customer.phone.ilike(search_pattern),
        )
    ).limit(limit)

    result = await db.execute(query)
    customers = result.scalars().all()

    return [CustomerResponse.model_validate(c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerResponse, summary="获取客户详情")
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    """
    根据ID获取客户详情。

    Args:
        customer_id: 客户ID
        db: 数据库会话

    Returns:
        CustomerResponse: 客户详情

    Raises:
        HTTPException: 客户不存在时返回404
    """
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")

    return CustomerResponse.model_validate(customer)


@router.post("", response_model=CustomerResponse, status_code=201, summary="创建客户")
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    """
    创建新客户。

    Args:
        data: 客户数据
        db: 数据库会话

    Returns:
        CustomerResponse: 创建的客户
    """
    customer = Customer(
        name=data.name,
        email=data.email,
        phone=data.phone,
        metadata_=data.metadata_,
        notes=data.notes,
        tags=data.tags,
    )
    db.add(customer)
    await db.flush()
    await db.refresh(customer)

    logger.info(f"创建客户: id={customer.id}, name={customer.name}")
    return CustomerResponse.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerResponse, summary="更新客户")
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    """
    更新客户信息。

    Args:
        customer_id: 客户ID
        data: 更新数据
        db: 数据库会话

    Returns:
        CustomerResponse: 更新后的客户

    Raises:
        HTTPException: 客户不存在时返回404
    """
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "metadata_":
            setattr(customer, "metadata_", value)
        else:
            setattr(customer, key, value)

    await db.flush()
    await db.refresh(customer)

    logger.info(f"更新客户: id={customer.id}")
    return CustomerResponse.model_validate(customer)
