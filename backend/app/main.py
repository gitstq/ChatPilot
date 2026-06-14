"""
ChatPilot - 轻量级开源智能客服支持平台

FastAPI 应用入口，负责 CORS 配置、路由注册、WebSocket 端点和启动时初始化。
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings

# ── 配置日志 ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    应用生命周期管理。

    启动时初始化数据库，关闭时释放资源。

    Args:
        app: FastAPI 应用实例

    Yields:
        None
    """
    # ── 启动阶段 ────────────────────────────────────────────────────
    logger.info(f"正在启动 {settings.APP_NAME} v{settings.APP_VERSION}...")

    from app.database import init_db

    await init_db()
    logger.info("数据库初始化完成")

    yield

    # ── 关闭阶段 ──────────────────────────────────────────────────
    from app.database import close_db

    await close_db()
    logger.info(f"{settings.APP_NAME} 已停止")


# ── 创建 FastAPI 应用 ──────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="轻量级开源智能客服支持平台 API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS 中间件配置 ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 全局异常处理 ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    全局异常处理器，捕获未处理的异常并返回友好的错误信息。

    Args:
        request: 请求对象
        exc: 异常对象

    Returns:
        JSONResponse: 错误响应
    """
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误，请稍后再试"},
    )


# ── 注册 API 路由 ─────────────────────────────────────────────────
from app.routers import (  # noqa: E402
    analytics,
    auth,
    conversations,
    customers,
    knowledge,
    messages,
    tickets,
    widget,
)

api_prefix = settings.API_PREFIX
app.include_router(auth.router, prefix=api_prefix)
app.include_router(conversations.router, prefix=api_prefix)
app.include_router(messages.router, prefix=api_prefix)
app.include_router(tickets.router, prefix=api_prefix)
app.include_router(customers.router, prefix=api_prefix)
app.include_router(knowledge.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(widget.router, prefix=api_prefix)

# ── 注册 WebSocket 路由 ──────────────────────────────────────────
from app.websocket.handler import router as ws_router  # noqa: E402

app.include_router(ws_router)


# ── 挂载静态文件和模板 ──────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/ 的上级目录
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# 挂载静态文件目录（CSS、JS、图片等）
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# 简易模板渲染函数（不依赖 Jinja2，直接读取 HTML 文件）
def _render_html(template_name: str) -> str:
    """读取模板文件并返回 HTML 内容。"""
    template_path = TEMPLATES_DIR / template_name
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")
    return f"<h1>Template {template_name} not found</h1>"


# ── 页面路由 ──────────────────────────────────────────────────
@app.get("/", tags=["页面"], response_class=HTMLResponse)
async def index() -> HTMLResponse:
    """
    返回管理后台首页。

    Returns:
        HTMLResponse: index.html 页面内容
    """
    return HTMLResponse(content=_render_html("index.html"))


@app.get("/widget", tags=["页面"], response_class=HTMLResponse)
async def widget_page() -> HTMLResponse:
    """
    返回嵌入式聊天组件页面。

    Returns:
        HTMLResponse: widget.html 页面内容
    """
    return HTMLResponse(content=_render_html("widget.html"))


# ── 健康检查端点 ──────────────────────────────────────────────
@app.get("/health", tags=["健康检查"])
async def health_check() -> dict[str, str]:
    """
    详细健康检查端点。

    Returns:
        dict: 健康状态信息
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }
