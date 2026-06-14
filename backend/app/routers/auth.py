"""
认证路由

提供简单的 Token 认证机制，包括登录和 Token 验证。
"""

from __future__ import annotations

import bcrypt
import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["认证"])

# ── 安全工具 ──────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)


def _hash_password(password: str) -> str:
    """对密码进行 bcrypt 哈希。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    """验证密码是否匹配哈希值。"""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ── 模拟用户存储（生产环境应使用数据库） ──────────────────────────
# 默认管理员账号: admin / admin123
_users_db: dict[str, dict[str, Any]] = {
    "admin": {
        "username": "admin",
        "hashed_password": _hash_password("admin123"),
        "role": "admin",
    },
    "agent": {
        "username": "agent",
        "hashed_password": _hash_password("agent123"),
        "role": "agent",
    },
}


class LoginRequest(BaseModel):
    """登录请求体。"""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token 响应体。"""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    """用户信息响应体。"""

    username: str
    role: str


def create_access_token(data: dict[str, Any]) -> str:
    """
    创建 JWT 访问令牌。

    Args:
        data: 令牌载荷数据

    Returns:
        str: 编码后的 JWT 令牌
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def verify_token(token: str) -> dict[str, Any]:
    """
    验证 JWT 令牌并返回载荷。

    Args:
        token: JWT 令牌

    Returns:
        dict: 令牌载荷

    Raises:
        HTTPException: 令牌无效或过期时返回401
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证凭据",
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"令牌验证失败: {e}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> UserInfo:
    """
    获取当前认证用户的依赖注入函数。

    Args:
        credentials: HTTP Bearer 凭据

    Returns:
        UserInfo: 当前用户信息

    Raises:
        HTTPException: 未认证或认证失败时返回401
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证令牌",
        )

    payload = verify_token(credentials.credentials)
    username = payload.get("sub")
    user = _users_db.get(username)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    return UserInfo(username=user["username"], role=user["role"])


@router.post("/login", response_model=TokenResponse, summary="用户登录")
async def login(data: LoginRequest) -> TokenResponse:
    """
    用户登录，验证用户名和密码后返回 JWT 令牌。

    Args:
        data: 登录请求体

    Returns:
        TokenResponse: 访问令牌

    Raises:
        HTTPException: 用户名或密码错误时返回401
    """
    user = _users_db.get(data.username)
    if not user or not _verify_password(data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )

    logger.info(f"用户登录成功: {data.username}")
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/verify", response_model=UserInfo, summary="验证Token")
async def verify_token_endpoint(
    current_user: UserInfo = Depends(get_current_user),
) -> UserInfo:
    """
    验证当前 Token 是否有效，返回用户信息。

    Args:
        current_user: 当前认证用户

    Returns:
        UserInfo: 用户信息
    """
    return current_user


@router.get("/me", response_model=UserInfo, summary="获取当前用户信息")
async def get_me(
    current_user: UserInfo = Depends(get_current_user),
) -> UserInfo:
    """
    获取当前认证用户的详细信息。

    Args:
        current_user: 当前认证用户

    Returns:
        UserInfo: 用户信息
    """
    return current_user
