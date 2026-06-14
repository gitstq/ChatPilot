<div align="center">

<img src="logo.svg" alt="ChatPilot Logo" width="120" height="120"/>

# 🤖 ChatPilot

**轻量级开源智能客服支持平台**
Lightweight Open-Source AI-Powered Customer Support Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

[功能特性](#-核心特性) · [快速开始](#-快速开始) · [使用指南](#-详细使用指南) · [部署指南](#-打包与部署指南) · [贡献指南](#-贡献指南)

</div>

---

## 🎉 项目介绍

ChatPilot 是一款轻量级开源智能客服支持平台，专为中小企业和个人开发者设计。一行代码即可在任意网站嵌入智能聊天窗口，支持 AI 自动回复、工单管理、客户管理、知识库等完整客服功能。

### 为什么选择 ChatPilot？

- 🪶 **极致轻量** -- 纯 Python 后端 + 零框架前端，单进程即可运行
- 🤖 **AI 原生** -- 内置多模型 AI 智能回复引擎，支持 GLM-5.1/OpenAI/Claude/Ollama
- 🔌 **一行嵌入** -- 一个 `<script>` 标签即可在任意网站添加客服聊天窗口
- 📊 **实时洞察** -- WebSocket 实时消息推送 + 数据统计仪表盘
- 🔒 **隐私优先** -- 支持完全私有化部署，数据自主可控
- 🐳 **Docker 就绪** -- 一条命令完成容器化部署

---

## ✨ 核心特性

### 💬 多渠道聊天
- 网站嵌入式聊天 Widget（一行代码嵌入）
- 实时消息推送（WebSocket）
- 消息搜索与历史记录
- 正在输入指示器

### 🤖 AI 智能回复
- 多模型支持：GLM-5.1 / OpenAI GPT / Claude / Ollama 本地模型
- 知识库 FAQ 优先匹配（相似度 > 0.8 直接返回）
- LLM 智能生成回复（FAQ 未匹配时自动降级）
- 流式响应支持

### 🎫 工单系统
- 工单创建与管理
- 状态流转：待处理 → 处理中 → 已解决 → 已关闭
- 优先级标记：低 / 中 / 高
- 客服分配与跟踪

### 👥 客户管理
- 客户信息管理（姓名、邮箱、电话、备注、标签）
- 对话历史关联
- 工单记录关联
- 智能搜索

### 📚 知识库
- FAQ 条目管理（分类、标签）
- AI 自动匹配回答
- 启用/禁用控制

### 📊 数据统计
- 今日对话数 / 未读消息 / 平均响应时间 / 满意度
- 对话趋势图
- 实时仪表盘

### 🌐 多语言
- 中文 / 英文双语界面
- 可扩展多语言架构

---

## 🚀 快速开始

### 环境要求

| 依赖 | 最低版本 |
|------|---------|
| Python | 3.10+ |
| pip | 最新版 |
| SQLite3 | 系统内置 |

### 一键安装

```bash
# 克隆仓库
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# 一键安装并启动
chmod +x setup.sh
./setup.sh
```

### 手动安装

```bash
# 克隆仓库
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r backend/requirements.txt

# 复制配置文件
cp backend/.env.example backend/.env

# 创建数据目录
mkdir -p data

# 启动服务
python backend/run.py
```

### Docker 部署

```bash
# 克隆仓库
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# Docker Compose 一键启动
docker-compose up -d
```

### 访问应用

启动后访问：**http://localhost:8000**

默认账号：`admin` / `admin123`

---

## 📖 详细使用指南

### 管理后台

1. 登录管理后台 `http://localhost:8000`
2. 左侧导航栏切换功能模块：
   - **仪表盘** -- 查看统计数据和最近对话
   - **对话** -- 管理客户对话，回复消息
   - **工单** -- 创建和跟踪工单
   - **客户** -- 管理客户信息
   - **知识库** -- 管理 FAQ 条目
   - **设置** -- 配置 AI 模型、Widget 样式等

### 嵌入聊天 Widget

在任意网站 HTML 中添加以下代码：

```html
<script src="http://your-domain:8000/static/widget-embed.js"
        data-color="#4F46E5"
        data-position="right"
        data-welcome="您好！有什么可以帮您？"
        data-title="在线客服">
</script>
```

**Widget 配置参数**：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `data-color` | 主题色 | `#4F46E5` |
| `data-position` | 位置（left/right） | `right` |
| `data-welcome` | 欢迎语 | `Hi! How can we help?` |
| `data-title` | 聊天窗口标题 | `ChatPilot` |

### AI 智能回复配置

编辑 `backend/.env` 文件：

```env
# AI 提供商选择：openai / claude / ollama / glm
AI_PROVIDER=ollama

# API Key（Ollama 本地部署无需填写）
AI_API_KEY=your-api-key

# 模型名称
AI_MODEL=qwen2.5:7b

# API 基础 URL（可选）
AI_BASE_URL=http://localhost:11434
```

### 知识库管理

1. 进入 **设置 → 知识库** 页面
2. 添加 FAQ 条目（标题 + 内容 + 分类 + 标签）
3. AI 回复时会优先匹配知识库中的 FAQ
4. 匹配相似度阈值 > 0.8 时直接返回 FAQ 答案

---

## 💡 设计思路与迭代规划

### 架构设计

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Chat Widget │────▶│  FastAPI     │────▶│  SQLite DB  │
│  (前端嵌入)  │◀────│  Backend     │◀────│  (数据存储)  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │  AI Engine   │
                    │  (多模型适配) │
                    └──────────────┘
```

### 技术选型理由

| 技术 | 选型理由 |
|------|---------|
| FastAPI | 高性能异步框架，自动生成 API 文档 |
| SQLite | 零配置嵌入式数据库，适合轻量部署 |
| Vanilla JS | 零框架依赖，极致轻量，易于定制 |
| WebSocket | 实时双向通信，低延迟消息推送 |

### 迭代规划

- [x] v1.0.0 -- 基础客服功能（对话、工单、客户、知识库）
- [ ] v1.1.0 -- 邮件渠道接入、邮件工单自动创建
- [ ] v1.2.0 -- 多客服坐席支持、对话路由分配
- [ ] v2.0.0 -- 插件系统、API 开放平台、Webhook

---

## 📦 打包与部署指南

### Docker 部署（推荐）

```bash
docker-compose up -d
```

### 手动部署

```bash
# 安装
pip install -r backend/requirements.txt

# 启动（生产环境）
python backend/run.py --host 0.0.0.0 --port 8000
```

### Nginx 反向代理（生产环境）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `sqlite:///data/chatpilot.db` |
| `SECRET_KEY` | JWT 密钥 | `change-me-in-production` |
| `AI_PROVIDER` | AI 提供商 | `ollama` |
| `AI_API_KEY` | AI API 密钥 | 空 |
| `AI_MODEL` | AI 模型名称 | `qwen2.5:7b` |
| `AI_BASE_URL` | AI API 地址 | 空 |

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详情。

### 快速贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT 协议](LICENSE) 开源。

---

<div align="center">

**Made with ❤️ by [ChatPilot Team](https://github.com/gitstq/ChatPilot)**

⭐ 如果这个项目对你有帮助，请给一个 Star！

</div>
