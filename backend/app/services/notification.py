"""
通知服务

WebSocket 通知管理器，管理活跃连接并广播消息和工单通知。
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class NotificationManager:
    """
    WebSocket 通知管理器。

    管理所有活跃的 WebSocket 连接，支持广播消息通知和工单状态变更通知。

    Attributes:
        _connections: 活跃的 WebSocket 连接字典（按连接ID索引）
        _conversation_subscribers: 按对话ID订阅的连接集合
    """

    def __init__(self) -> None:
        """初始化通知管理器。"""
        self._connections: dict[str, WebSocket] = {}
        self._conversation_subscribers: dict[int, set[str]] = {}

    async def connect(self, websocket: WebSocket, connection_id: str) -> None:
        """
        接受新的 WebSocket 连接。

        Args:
            websocket: WebSocket 连接对象
            connection_id: 连接唯一标识
        """
        await websocket.accept()
        self._connections[connection_id] = websocket
        logger.info(f"WebSocket 连接建立: {connection_id}, 当前连接数: {len(self._connections)}")

    def disconnect(self, connection_id: str) -> None:
        """
        断开 WebSocket 连接。

        Args:
            connection_id: 连接唯一标识
        """
        self._connections.pop(connection_id, None)

        # ── 清理订阅关系 ──────────────────────────────────────────
        for conv_id in list(self._conversation_subscribers.keys()):
            self._conversation_subscribers[conv_id].discard(connection_id)
            if not self._conversation_subscribers[conv_id]:
                del self._conversation_subscribers[conv_id]

        logger.info(f"WebSocket 连接断开: {connection_id}, 当前连接数: {len(self._connections)}")

    def subscribe_conversation(
        self, connection_id: str, conversation_id: int
    ) -> None:
        """
        订阅指定对话的消息通知。

        Args:
            connection_id: 连接唯一标识
            conversation_id: 对话ID
        """
        if conversation_id not in self._conversation_subscribers:
            self._conversation_subscribers[conversation_id] = set()
        self._conversation_subscribers[conversation_id].add(connection_id)
        logger.debug(
            f"连接 {connection_id} 订阅对话 {conversation_id}"
        )

    async def broadcast_new_message(
        self,
        conversation_id: int,
        message_id: int,
        content: str,
        sender_type: str,
        sender_name: Optional[str] = None,
    ) -> None:
        """
        广播新消息通知给订阅了该对话的所有连接。

        Args:
            conversation_id: 对话ID
            message_id: 消息ID
            content: 消息内容
            sender_type: 发送者类型
            sender_name: 发送者名称
        """
        notification = {
            "type": "new_message",
            "data": {
                "conversation_id": conversation_id,
                "message_id": message_id,
                "content": content,
                "sender_type": sender_type,
                "sender_name": sender_name,
            },
        }

        subscribers = self._conversation_subscribers.get(conversation_id, set())
        disconnected = set()

        for conn_id in subscribers:
            ws = self._connections.get(conn_id)
            if ws:
                try:
                    await ws.send_json(notification)
                except Exception as e:
                    logger.warning(f"发送通知失败 ({conn_id}): {e}")
                    disconnected.add(conn_id)

        # ── 清理断开的连接 ──────────────────────────────────────────
        for conn_id in disconnected:
            self.disconnect(conn_id)

    async def broadcast_ticket_update(
        self,
        ticket_id: int,
        action: str,
        title: str,
        status: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> None:
        """
        广播工单状态变更通知给所有连接。

        Args:
            ticket_id: 工单ID
            action: 操作类型
            title: 工单标题
            status: 工单状态
            assigned_to: 分配人
        """
        notification: dict[str, Any] = {
            "type": "ticket_update",
            "data": {
                "ticket_id": ticket_id,
                "action": action,
                "title": title,
            },
        }

        if status:
            notification["data"]["status"] = status
        if assigned_to:
            notification["data"]["assigned_to"] = assigned_to

        disconnected = set()

        for conn_id, ws in self._connections.items():
            try:
                await ws.send_json(notification)
            except Exception as e:
                logger.warning(f"广播工单通知失败 ({conn_id}): {e}")
                disconnected.add(conn_id)

        for conn_id in disconnected:
            self.disconnect(conn_id)

    async def send_to_connection(
        self, connection_id: str, data: dict[str, Any]
    ) -> bool:
        """
        向指定连接发送数据。

        Args:
            connection_id: 连接唯一标识
            data: 要发送的数据

        Returns:
            bool: 发送是否成功
        """
        ws = self._connections.get(connection_id)
        if ws:
            try:
                await ws.send_json(data)
                return True
            except Exception as e:
                logger.warning(f"发送数据失败 ({connection_id}): {e}")
                self.disconnect(connection_id)
        return False

    @property
    def connection_count(self) -> int:
        """
        获取当前活跃连接数。

        Returns:
            int: 活跃连接数
        """
        return len(self._connections)


# ── 全局通知管理器实例 ────────────────────────────────────────────
notification_manager = NotificationManager()
