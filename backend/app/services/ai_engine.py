"""
AI 智能回复引擎

支持多提供商（OpenAI、Claude、Ollama、GLM-5.1），先匹配知识库 FAQ，
匹配度超过阈值直接返回，未匹配则调用 LLM 生成回复。
"""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── 系统提示词模板 ────────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """你是一个专业、友好的客服助手。请遵循以下规则：
1. 用简洁、清晰的语言回答客户问题
2. 如果不确定答案，请诚实告知并建议客户联系人工客服
3. 回答要专业但亲切，避免使用过于技术化的术语
4. 如果客户的问题与产品/服务无关，礼貌地引导回客服主题
5. 使用中文回复

当前对话上下文：
{context}
"""


class AIEngine:
    """
    AI 智能回复引擎。

    支持多种 AI 提供商，优先匹配知识库 FAQ，未匹配时调用 LLM。

    Attributes:
        provider: AI 提供商名称
        api_key: API 密钥
        model: 模型名称
        base_url: API 基础 URL
    """

    def __init__(self) -> None:
        """初始化 AI 引擎，从配置中加载提供商信息。"""
        self.provider: str = settings.AI_PROVIDER
        self.api_key: Optional[str] = settings.AI_API_KEY
        self.model: str = settings.AI_MODEL
        self.base_url: Optional[str] = settings.AI_BASE_URL
        self.temperature: float = settings.AI_TEMPERATURE
        self.max_tokens: int = settings.AI_MAX_TOKENS

    def _get_api_url(self) -> str:
        """
        根据提供商获取 API URL。

        Returns:
            str: API 端点 URL
        """
        if self.base_url:
            return self.base_url.rstrip("/")

        url_map = {
            "openai": "https://api.openai.com/v1",
            "claude": "https://api.anthropic.com/v1",
            "ollama": "http://localhost:11434",
            "glm": "https://open.bigmodel.cn/api/paas/v4",
        }
        return url_map.get(self.provider, "https://api.openai.com/v1")

    def _get_headers(self) -> dict[str, str]:
        """
        根据提供商获取请求头。

        Returns:
            dict[str, str]: HTTP 请求头
        """
        headers = {"Content-Type": "application/json"}

        if self.provider == "claude":
            headers["x-api-key"] = self.api_key or ""
            headers["anthropic-version"] = "2023-06-01"
        elif self.provider == "glm":
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            headers["Authorization"] = f"Bearer {self.api_key}"

        return headers

    def _build_messages(
        self,
        user_message: str,
        context: str = "",
    ) -> list[dict[str, str]]:
        """
        构建发送给 LLM 的消息列表。

        Args:
            user_message: 用户消息
            context: 对话上下文

        Returns:
            list[dict[str, str]]: 消息列表
        """
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        return messages

    # ── 非流式调用方法 ────────────────────────────────────────────

    async def _call_openai_sync(
        self,
        messages: list[dict[str, str]],
    ) -> str:
        """
        调用 OpenAI 兼容 API（非流式，包括 Ollama）。

        Args:
            messages: 消息列表

        Returns:
            str: 完整响应文本
        """
        base_url = self._get_api_url()
        url = f"{base_url}/chat/completions"
        headers = self._get_headers()

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _call_claude_sync(
        self,
        messages: list[dict[str, str]],
    ) -> str:
        """
        调用 Claude API（非流式）。

        Args:
            messages: 消息列表

        Returns:
            str: 完整响应文本
        """
        base_url = self._get_api_url()
        url = f"{base_url}/messages"
        headers = self._get_headers()

        # Claude 需要分离 system 和 messages
        system_content = ""
        claude_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "stream": False,
        }
        if system_content:
            payload["system"] = system_content
        if claude_messages:
            payload["messages"] = claude_messages

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]

    # ── 流式调用方法 ────────────────────────────────────────────────

    async def _call_openai_stream(
        self,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """
        调用 OpenAI 兼容 API（流式，包括 Ollama）。

        Args:
            messages: 消息列表

        Yields:
            str: 流式响应的文本片段
        """
        base_url = self._get_api_url()
        url = f"{base_url}/chat/completions"
        headers = self._get_headers()

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", url, json=payload, headers=headers
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get(
                                "delta", {}
                            )
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def _call_claude_stream(
        self,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """
        调用 Claude API（流式）。

        Args:
            messages: 消息列表

        Yields:
            str: 流式响应的文本片段
        """
        base_url = self._get_api_url()
        url = f"{base_url}/messages"
        headers = self._get_headers()

        # Claude 需要分离 system 和 messages
        system_content = ""
        claude_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "stream": True,
        }
        if system_content:
            payload["system"] = system_content
        if claude_messages:
            payload["messages"] = claude_messages

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", url, json=payload, headers=headers
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        try:
                            data = json.loads(data_str)
                            if data.get("type") == "content_block_delta":
                                text = data.get("delta", {}).get("text", "")
                                if text:
                                    yield text
                        except json.JSONDecodeError:
                            continue

    # ── 统一调用入口 ────────────────────────────────────────────────

    async def _call_llm_sync(self, messages: list[dict[str, str]]) -> str:
        """
        统一的非流式 LLM 调用入口。

        根据配置的提供商选择对应的调用方法。

        Args:
            messages: 消息列表

        Returns:
            str: 完整响应文本
        """
        if self.provider == "claude":
            return await self._call_claude_sync(messages)
        else:
            # openai、ollama、glm 都使用 OpenAI 兼容接口
            return await self._call_openai_sync(messages)

    async def _call_llm_stream(
        self,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """
        统一的流式 LLM 调用入口。

        根据配置的提供商选择对应的调用方法。

        Args:
            messages: 消息列表

        Yields:
            str: 流式响应的文本片段
        """
        if self.provider == "claude":
            async for chunk in self._call_claude_stream(messages):
                yield chunk
        else:
            async for chunk in self._call_openai_stream(messages):
                yield chunk

    # ── 公开接口 ────────────────────────────────────────────────────

    async def generate_reply(
        self,
        user_message: str,
        conversation_history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        """
        生成 AI 回复（非流式）。

        先尝试匹配知识库 FAQ，匹配度超过阈值直接返回，
        未匹配则调用 LLM 生成回复。

        Args:
            user_message: 用户消息
            conversation_history: 对话历史

        Returns:
            str: 完整回复文本
        """
        # ── 第一步：匹配知识库 ────────────────────────────────────
        knowledge_reply = await self._match_knowledge(user_message)
        if knowledge_reply:
            logger.info("知识库匹配成功，直接返回FAQ回复")
            return knowledge_reply

        # ── 第二步：调用 LLM ───────────────────────────────────────
        context = ""
        if conversation_history:
            context = "\n".join(
                f"{msg.get('sender_name', msg.get('role', ''))}: {msg.get('content', '')}"
                for msg in conversation_history[-10:]  # 最近10条消息
            )

        messages = self._build_messages(user_message, context)

        try:
            return await self._call_llm_sync(messages)
        except httpx.HTTPStatusError as e:
            logger.error(f"AI API 请求失败: {e.response.status_code}")
            return f"AI 服务暂时不可用 (HTTP {e.response.status_code})"
        except Exception as e:
            logger.error(f"AI 回复生成失败: {e}")
            return "AI 服务暂时不可用，请稍后再试或联系人工客服。"

    async def generate_reply_stream(
        self,
        user_message: str,
        conversation_history: Optional[list[dict[str, str]]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        生成 AI 回复（流式）。

        先尝试匹配知识库 FAQ，匹配度超过阈值直接返回，
        未匹配则调用 LLM 流式生成回复。

        Args:
            user_message: 用户消息
            conversation_history: 对话历史

        Yields:
            str: 流式响应的文本片段
        """
        # ── 第一步：匹配知识库 ────────────────────────────────────
        knowledge_reply = await self._match_knowledge(user_message)
        if knowledge_reply:
            logger.info("知识库匹配成功，直接返回FAQ回复")
            yield knowledge_reply
            return

        # ── 第二步：调用 LLM 流式生成 ──────────────────────────────
        context = ""
        if conversation_history:
            context = "\n".join(
                f"{msg.get('sender_name', msg.get('role', ''))}: {msg.get('content', '')}"
                for msg in conversation_history[-10:]  # 最近10条消息
            )

        messages = self._build_messages(user_message, context)

        try:
            async for chunk in self._call_llm_stream(messages):
                yield chunk
        except httpx.HTTPStatusError as e:
            logger.error(f"AI API 请求失败: {e.response.status_code}")
            yield f"AI 服务暂时不可用 (HTTP {e.response.status_code})"
        except Exception as e:
            logger.error(f"AI 回复生成失败: {e}")
            yield "AI 服务暂时不可用，请稍后再试或联系人工客服。"

    async def _match_knowledge(self, query: str) -> Optional[str]:
        """
        匹配知识库 FAQ。

        使用简单的关键词匹配算法，计算查询与知识库条目的匹配度。
        匹配度超过阈值时返回知识库内容。

        Args:
            query: 用户查询

        Returns:
            Optional[str]: 匹配到的知识库内容，未匹配返回 None
        """
        try:
            from app.services.knowledge_matcher import knowledge_matcher

            return await knowledge_matcher.match(query)
        except Exception as e:
            logger.warning(f"知识库匹配异常: {e}")
            return None


# ── 全局 AI 引擎实例 ──────────────────────────────────────────────
ai_engine = AIEngine()
