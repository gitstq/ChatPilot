"""
ChatPilot 数据库模型包

导出所有 ORM 模型和 Base 声明基类。
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """所有 ORM 模型的声明基类。"""
    pass


from app.models.conversation import Conversation  # noqa: E402, F401
from app.models.message import Message  # noqa: E402, F401
from app.models.ticket import Ticket  # noqa: E402, F401
from app.models.customer import Customer  # noqa: E402, F401
from app.models.knowledge import Knowledge  # noqa: E402, F401
from app.models.analytics import AnalyticsEvent  # noqa: E402, F401

__all__ = [
    "Base",
    "Conversation",
    "Message",
    "Ticket",
    "Customer",
    "Knowledge",
    "AnalyticsEvent",
]
