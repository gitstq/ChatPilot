#!/usr/bin/env python3
"""
ChatPilot 启动脚本

支持通过命令行参数配置服务启动选项。

用法:
    python run.py                    # 默认启动
    python run.py --host 0.0.0.0     # 指定主机
    python run.py --port 8000       # 指定端口
    python run.py --reload          # 开发模式（热重载）
"""

from __future__ import annotations

import argparse
import sys


def parse_args() -> argparse.Namespace:
    """
    解析命令行参数。

    Returns:
        argparse.Namespace: 解析后的参数
    """
    parser = argparse.ArgumentParser(
        description="ChatPilot - 轻量级开源智能客服支持平台",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="服务监听地址 (默认: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="服务监听端口 (默认: 8000)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="启用热重载（开发模式）",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="工作进程数 (默认: 1)",
    )
    return parser.parse_args()


def main() -> None:
    """
    启动 ChatPilot 服务。
    """
    args = parse_args()

    import uvicorn

    print(f"正在启动 ChatPilot 服务...")
    print(f"  地址: http://{args.host}:{args.port}")
    print(f"  文档: http://{args.host}:{args.port}/docs")
    if args.reload:
        print(f"  模式: 开发模式（热重载已启用）")

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level="info",
    )


if __name__ == "__main__":
    main()
