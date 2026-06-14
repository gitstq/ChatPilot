<div align="center">

<img src="logo.svg" alt="ChatPilot Logo" width="120" height="120"/>

# 🤖 ChatPilot

**Lightweight Open-Source AI-Powered Customer Support Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-core-features) · [Quick Start](#-quick-start) · [Usage Guide](#-detailed-usage-guide) · [Deployment](#-packaging--deployment-guide) · [Contributing](#-contributing)

</div>

---

## 🎉 Introduction

ChatPilot is a lightweight open-source AI-powered customer support platform designed for small and medium businesses and individual developers. Embed a smart chat widget on any website with a single line of code, featuring AI auto-reply, ticket management, customer management, knowledge base, and a complete set of customer support capabilities.

### Why ChatPilot?

- 🪶 **Ultra Lightweight** -- Pure Python backend + zero-framework frontend, runs in a single process
- 🤖 **AI-Native** -- Built-in multi-model AI intelligent reply engine, supporting GLM-5.1/OpenAI/Claude/Ollama
- 🔌 **One-Line Embed** -- A single `<script>` tag adds a customer support chat widget to any website
- 📊 **Real-Time Insights** -- WebSocket real-time message push + statistics dashboard
- 🔒 **Privacy First** -- Supports fully private deployment, data remains under your control
- 🐳 **Docker Ready** -- Containerized deployment with a single command

---

## ✨ Core Features

### 💬 Multi-Channel Chat
- Website embedded chat widget (one-line code embedding)
- Real-time message push (WebSocket)
- Message search and history
- Typing indicator

### 🤖 AI Intelligent Reply
- Multi-model support: GLM-5.1 / OpenAI GPT / Claude / Ollama local models
- Knowledge base FAQ priority matching (direct return when similarity > 0.8)
- LLM intelligent reply generation (automatic fallback when FAQ is unmatched)
- Streaming response support

### 🎫 Ticket System
- Ticket creation and management
- Status flow: Pending → In Progress → Resolved → Closed
- Priority marking: Low / Medium / High
- Agent assignment and tracking

### 👥 Customer Management
- Customer information management (name, email, phone, notes, tags)
- Conversation history association
- Ticket record association
- Smart search

### 📚 Knowledge Base
- FAQ entry management (categories, tags)
- AI automatic matching and answering
- Enable/disable control

### 📊 Statistics
- Today's conversations / unread messages / average response time / satisfaction rate
- Conversation trend charts
- Real-time dashboard

### 🌐 Multi-Language
- Chinese / English bilingual interface
- Extensible multi-language architecture

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Minimum Version |
|------------|----------------|
| Python | 3.10+ |
| pip | Latest |
| SQLite3 | System built-in |

### One-Click Installation

```bash
# Clone the repository
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# One-click install and start
chmod +x setup.sh
./setup.sh
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Copy configuration file
cp backend/.env.example backend/.env

# Create data directory
mkdir -p data

# Start the service
python backend/run.py
```

### Docker Deployment

```bash
# Clone the repository
git clone https://github.com/gitstq/ChatPilot.git
cd ChatPilot

# Docker Compose one-click start
docker-compose up -d
```

### Access the Application

After starting, visit: **http://localhost:8000**

Default credentials: `admin` / `admin123`

---

## 📖 Detailed Usage Guide

### Admin Dashboard

1. Log in to the admin dashboard at `http://localhost:8000`
2. Switch between modules using the left navigation bar:
   - **Dashboard** -- View statistics and recent conversations
   - **Conversations** -- Manage customer conversations and reply to messages
   - **Tickets** -- Create and track tickets
   - **Customers** -- Manage customer information
   - **Knowledge Base** -- Manage FAQ entries
   - **Settings** -- Configure AI models, widget styles, etc.

### Embedding the Chat Widget

Add the following code to any website's HTML:

```html
<script src="http://your-domain:8000/static/widget-embed.js"
        data-color="#4F46E5"
        data-position="right"
        data-welcome="Hello! How can we help you?"
        data-title="Live Support">
</script>
```

**Widget Configuration Parameters**:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `data-color` | Theme color | `#4F46E5` |
| `data-position` | Position (left/right) | `right` |
| `data-welcome` | Welcome message | `Hi! How can we help?` |
| `data-title` | Chat window title | `ChatPilot` |

### AI Intelligent Reply Configuration

Edit the `backend/.env` file:

```env
# AI provider selection: openai / claude / ollama / glm
AI_PROVIDER=ollama

# API Key (not required for local Ollama deployment)
AI_API_KEY=your-api-key

# Model name
AI_MODEL=qwen2.5:7b

# API base URL (optional)
AI_BASE_URL=http://localhost:11434
```

### Knowledge Base Management

1. Go to **Settings → Knowledge Base** page
2. Add FAQ entries (title + content + category + tags)
3. AI replies will prioritize matching FAQs in the knowledge base
4. When the matching similarity threshold is > 0.8, the FAQ answer is returned directly

---

## 💡 Design Philosophy & Roadmap

### Architecture Design

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Chat Widget │────▶│  FastAPI     │────▶│  SQLite DB  │
│  (Frontend)  │◀────│  Backend     │◀────│  (Storage)  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │  AI Engine   │
                    │  (Multi-Model)│
                    └──────────────┘
```

### Technology Choices

| Technology | Reason |
|------------|--------|
| FastAPI | High-performance async framework with auto-generated API docs |
| SQLite | Zero-configuration embedded database, ideal for lightweight deployment |
| Vanilla JS | Zero framework dependencies, ultra lightweight, easy to customize |
| WebSocket | Real-time bidirectional communication, low-latency message push |

### Roadmap

- [x] v1.0.0 -- Core customer support features (conversations, tickets, customers, knowledge base)
- [ ] v1.1.0 -- Email channel integration, automatic ticket creation from emails
- [ ] v1.2.0 -- Multi-agent support, conversation routing and assignment
- [ ] v2.0.0 -- Plugin system, open API platform, Webhooks

---

## 📦 Packaging & Deployment Guide

### Docker Deployment (Recommended)

```bash
docker-compose up -d
```

### Manual Deployment

```bash
# Install
pip install -r backend/requirements.txt

# Start (production environment)
python backend/run.py --host 0.0.0.0 --port 8000
```

### Nginx Reverse Proxy (Production)

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

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///data/chatpilot.db` |
| `SECRET_KEY` | JWT secret key | `change-me-in-production` |
| `AI_PROVIDER` | AI provider | `ollama` |
| `AI_API_KEY` | AI API key | empty |
| `AI_MODEL` | AI model name | `qwen2.5:7b` |
| `AI_BASE_URL` | AI API base URL | empty |

---

## 🤝 Contributing

We welcome contributions of all forms! Please read the [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by [ChatPilot Team](https://github.com/gitstq/ChatPilot)**

⭐ If you find this project helpful, please give it a Star!

</div>
