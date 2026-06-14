"""
ChatPilot 数据库连接与初始化模块

使用 SQLAlchemy 异步引擎，默认 SQLite + aiosqlite。
提供数据库会话管理和表初始化功能。
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.config import settings

logger = logging.getLogger(__name__)

# ── 创建异步引擎 ──────────────────────────────────────────────────
# SQLite 需要特殊配置：check_same_thread=False, StaticPool
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)

# ── 创建会话工厂 ──────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    获取数据库会话的依赖注入函数。

    用作 FastAPI 路由的 Depends 参数，自动管理会话生命周期。

    Yields:
        AsyncSession: 数据库异步会话
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    初始化数据库，创建所有表。

    在应用启动时调用，确保所有模型对应的表都已创建。
    """
    from app.models import Base  # noqa: 延迟导入避免循环依赖

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表初始化完成")


async def close_db() -> None:
    """
    关闭数据库引擎连接。

    在应用关闭时调用，释放所有数据库资源。
    """
    await engine.dispose()
    logger.info("数据库连接已关闭")
