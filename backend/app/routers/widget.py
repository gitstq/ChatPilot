"""
Widget 配置路由

提供聊天 Widget 的配置获取和样式更新接口。
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/widget", tags=["Widget配置"])

# ── 默认 Widget 配置 ─────────────────────────────────────────────
_widget_config: dict[str, Any] = {
    "primary_color": "#4F46E5",
    "position": "bottom-right",
    "welcome_message": "您好！有什么可以帮助您的吗？",
    "placeholder": "请输入您的问题...",
    "title": "在线客服",
    "avatar_url": None,
    "theme": "light",
    "show_timestamp": True,
    "auto_open": False,
    "allowed_domains": [],
}


@router.get("/config", summary="获取Widget配置")
async def get_widget_config() -> dict[str, Any]:
    """
    获取当前 Widget 配置。

    Returns:
        dict: Widget 配置信息
    """
    return _widget_config


@router.put("/config", summary="更新Widget样式配置")
async def update_widget_config(config: dict[str, Any]) -> dict[str, Any]:
    """
    更新 Widget 样式配置。

    支持更新的字段包括：primary_color, position, welcome_message,
    placeholder, title, avatar_url, theme, show_timestamp, auto_open。

    Args:
        config: 新的配置数据

    Returns:
        dict: 更新后的 Widget 配置
    """
    allowed_fields = {
        "primary_color",
        "position",
        "welcome_message",
        "placeholder",
        "title",
        "avatar_url",
        "theme",
        "show_timestamp",
        "auto_open",
        "allowed_domains",
    }

    for key, value in config.items():
        if key in allowed_fields:
            _widget_config[key] = value

    logger.info("Widget 配置已更新")
    return _widget_config
