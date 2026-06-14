"""
知识库匹配服务

提供基于关键词的简单知识库匹配功能，计算查询与知识库条目的匹配度。
"""

from __future__ import annotations

import logging
import re
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory
from app.models.knowledge import Knowledge

logger = logging.getLogger(__name__)


class KnowledgeMatcher:
    """
    知识库匹配器。

    使用关键词匹配算法，计算用户查询与知识库条目的匹配度。
    匹配度超过配置的阈值时返回知识库内容。

    Attributes:
        threshold: 匹配度阈值
    """

    def __init__(self, threshold: Optional[float] = None) -> None:
        """
        初始化知识库匹配器。

        Args:
            threshold: 匹配度阈值，默认从配置读取
        """
        self.threshold = threshold or settings.KNOWLEDGE_MATCH_THRESHOLD

    def _tokenize(self, text: str) -> set[str]:
        """
        对文本进行分词（简单实现：按空格和标点分割）。

        Args:
            text: 输入文本

        Returns:
            set[str]: 去重后的词集合
        """
        # 移除标点符号，转小写，按空格分割
        text = re.sub(r"[^\w\s\u4e00-\u9fff]", " ", text.lower())
        return {word for word in text.split() if len(word) > 0}

    def _calculate_similarity(self, query_tokens: set[str], text: str) -> float:
        """
        计算查询词集合与目标文本的相似度。

        使用 Jaccard 相似度的简化版本。

        Args:
            query_tokens: 查询词集合
            text: 目标文本

        Returns:
            float: 相似度分数 (0.0 ~ 1.0)
        """
        text_tokens = self._tokenize(text)
        if not query_tokens or not text_tokens:
            return 0.0

        intersection = query_tokens & text_tokens
        union = query_tokens | text_tokens

        if not union:
            return 0.0

        return len(intersection) / len(union)

    async def match(self, query: str) -> Optional[str]:
        """
        在知识库中匹配与查询最相关的条目。

        Args:
            query: 用户查询文本

        Returns:
            Optional[str]: 匹配到的知识库内容，未匹配返回 None
        """
        query_tokens = self._tokenize(query)

        if not query_tokens:
            return None

        try:
            async with async_session_factory() as session:
                # ── 查询所有启用的知识条目 ────────────────────────────
                stmt = select(Knowledge).where(Knowledge.enabled == True)  # noqa: E712
                result = await session.execute(stmt)
                knowledge_items = result.scalars().all()

                if not knowledge_items:
                    return None

                # ── 计算每条知识库条目的匹配度 ────────────────────────
                best_match: Optional[Knowledge] = None
                best_score: float = 0.0

                for item in knowledge_items:
                    # 综合标题和内容的匹配度
                    title_score = self._calculate_similarity(
                        query_tokens, item.title
                    )
                    content_score = self._calculate_similarity(
                        query_tokens, item.content
                    )
                    # 标题权重更高
                    combined_score = title_score * 0.6 + content_score * 0.4

                    if combined_score > best_score:
                        best_score = combined_score
                        best_match = item

                if best_match and best_score >= self.threshold:
                    logger.info(
                        f"知识库匹配成功: id={best_match.id}, "
                        f"score={best_score:.2f}, title={best_match.title}"
                    )
                    return best_match.content

                logger.debug(
                    f"知识库未匹配到高置信度结果，最高分: {best_score:.2f}"
                )
                return None

        except Exception as e:
            logger.error(f"知识库匹配查询失败: {e}")
            return None


# ── 全局知识库匹配器实例 ──────────────────────────────────────────
knowledge_matcher = KnowledgeMatcher()
