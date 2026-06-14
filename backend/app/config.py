"""
ChatPilot 后端配置管理模块

使用 pydantic-settings 管理应用配置，支持环境变量和 .env 文件。
"""

from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类，从环境变量和 .env 文件加载配置。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── 应用基础配置 ──────────────────────────────────────────────
    APP_NAME: str = "ChatPilot"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # ── 数据库配置 ────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///data/chatpilot.db"

    # ── 安全配置 ────────────────────────────────────────────────
    SECRET_KEY: str = "chatpilot-default-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24小时

    # ── AI 提供商配置 ────────────────────────────────────────────
    AI_PROVIDER: str = "openai"  # openai / claude / ollama / glm
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-3.5-turbo"
    AI_BASE_URL: Optional[str] = None
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 2048

    # ── 知识库匹配阈值 ───────────────────────────────────────────
    KNOWLEDGE_MATCH_THRESHOLD: float = 0.8

    # ── CORS 配置 ────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["*"]

    # ── WebSocket 配置 ──────────────────────────────────────────
    WS_HEARTBEAT_INTERVAL: int = 30  # 心跳间隔（秒）


# 全局配置单例
settings = Settings()
