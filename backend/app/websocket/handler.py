"""
WebSocket 连接处理器

管理 WebSocket 客户端连接、消息接收与广播、心跳检测。
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services.notification import notification_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket 主端点。

    处理客户端的连接、断开、消息接收和心跳检测。

    流程：
    1. 接受连接并分配唯一连接ID
    2. 启动心跳检测任务
    3. 循环接收客户端消息并处理
    4. 断开时清理资源

    Args:
        websocket: WebSocket 连接对象
    """
    # ── 分配唯一连接ID ────────────────────────────────────────────
    connection_id = str(uuid.uuid4())[:8]

    await notification_manager.connect(websocket, connection_id)

    # ── 启动心跳检测任务 ──────────────────────────────────────────
    heartbeat_task = asyncio.create_task(
        _heartbeat_monitor(websocket, connection_id)
    )

    try:
        await _handle_client_messages(websocket, connection_id)
    except WebSocketDisconnect:
        logger.info(f"客户端主动断开连接: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket 异常 ({connection_id}): {e}")
    finally:
        heartbeat_task.cancel()
        notification_manager.disconnect(connection_id)


async def _handle_client_messages(
    websocket: WebSocket, connection_id: str
) -> None:
    """
    处理客户端发送的消息。

    支持的消息类型：
    - subscribe: 订阅对话消息通知
    - unsubscribe: 取消订阅
    - ping: 心跳请求
    - message: 发送聊天消息

    Args:
        websocket: WebSocket 连接对象
        connection_id: 连接唯一标识

    Raises:
        WebSocketDisconnect: 客户端断开连接时抛出
    """
    while True:
        try:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data) if raw_data else {}

            msg_type = data.get("type", "")

            if msg_type == "subscribe":
                # ── 订阅对话通知 ────────────────────────────────────
                conversation_id = data.get("conversation_id")
                if conversation_id:
                    notification_manager.subscribe_conversation(
                        connection_id, conversation_id
                    )
                    await websocket.send_json({
                        "type": "subscribed",
                        "conversation_id": conversation_id,
                    })
                    logger.debug(
                        f"连接 {connection_id} 订阅对话 {conversation_id}"
                    )

            elif msg_type == "unsubscribe":
                # ── 取消订阅（简化处理，直接确认） ───────────────────
                conversation_id = data.get("conversation_id")
                await websocket.send_json({
                    "type": "unsubscribed",
                    "conversation_id": conversation_id,
                })

            elif msg_type == "ping":
                # ── 心跳响应 ────────────────────────────────────────
                await websocket.send_json({"type": "pong"})

            elif msg_type == "message":
                # ── 处理聊天消息 ────────────────────────────────────
                conversation_id = data.get("conversation_id")
                content = data.get("content", "")

                if conversation_id and content:
                    await _process_chat_message(
                        websocket,
                        connection_id,
                        conversation_id,
                        content,
                        data.get("sender_name", "客户"),
                    )

            else:
                # ── 未知消息类型 ────────────────────────────────────
                await websocket.send_json({
                    "type": "error",
                    "message": f"未知的消息类型: {msg_type}",
                })

        except json.JSONDecodeError:
            await websocket.send_json({
                "type": "error",
                "message": "无效的 JSON 格式",
            })


async def _process_chat_message(
    websocket: WebSocket,
    connection_id: str,
    conversation_id: int,
    content: str,
    sender_name: str,
) -> None:
    """
    处理聊天消息，保存到数据库并触发 AI 回复。

    Args:
        websocket: WebSocket 连接对象
        connection_id: 连接唯一标识
        conversation_id: 对话ID
        content: 消息内容
        sender_name: 发送者名称
    """
    from app.database import async_session_factory
    from app.models.message import Message

    # ── 保存消息到数据库 ────────────────────────────────────────────
    async with async_session_factory() as session:
        message = Message(
            conversation_id=conversation_id,
            content=content,
            sender_type="customer",
            sender_name=sender_name,
        )
        session.add(message)
        await session.commit()
        await session.refresh(message)

        message_id = message.id

    # ── 广播消息通知 ──────────────────────────────────────────────
    await notification_manager.broadcast_new_message(
        conversation_id=conversation_id,
        message_id=message_id,
        content=content,
        sender_type="customer",
        sender_name=sender_name,
    )

    # ── 触发 AI 回复 ──────────────────────────────────────────────
    try:
        from app.services.ai_engine import ai_engine

        reply = await ai_engine.generate_reply(content, stream=False)
        if reply:
            # 保存 AI 回复
            async with async_session_factory() as session:
                ai_message = Message(
                    conversation_id=conversation_id,
                    content=str(reply),
                    sender_type="ai",
                    sender_name="AI 助手",
                )
                session.add(ai_message)
                await session.commit()
                await session.refresh(ai_message)

                # 广播 AI 回复
                await notification_manager.broadcast_new_message(
                    conversation_id=conversation_id,
                    message_id=ai_message.id,
                    content=str(reply),
                    sender_type="ai",
                    sender_name="AI 助手",
                )

    except Exception as e:
        logger.error(f"AI 回复生成失败: {e}")


async def _heartbeat_monitor(
    websocket: WebSocket, connection_id: str
) -> None:
    """
    心跳检测任务。

    定期检查连接是否存活，超时未收到心跳则关闭连接。

    Args:
        websocket: WebSocket 连接对象
        connection_id: 连接唯一标识
    """
    interval = settings.WS_HEARTBEAT_INTERVAL
    try:
        while True:
            await asyncio.sleep(interval)
            try:
                await websocket.send_json({"type": "heartbeat"})
            except Exception:
                logger.info(
                    f"心跳发送失败，连接可能已断开: {connection_id}"
                )
                break
    except asyncio.CancelledError:
        pass
