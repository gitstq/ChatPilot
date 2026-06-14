#!/bin/bash
set -e
echo "🚀 ChatPilot - 轻量级开源智能客服支持平台"
echo "=========================================="
# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3.10+ 未安装"
    exit 1
fi
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate
# 安装依赖
pip install -r backend/requirements.txt
# 复制环境配置
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
fi
# 创建数据目录
mkdir -p data
echo "✅ 安装完成！"
echo ""
echo "启动方式："
echo "  source venv/bin/activate && make dev"
echo ""
echo "默认账号：admin / admin123"
echo "访问地址：http://localhost:8000"
