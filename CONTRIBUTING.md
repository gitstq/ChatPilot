# Contributing to ChatPilot / 贡献指南

Thank you for your interest in contributing to ChatPilot! This document provides guidelines for contributing to the project.
感谢你对 ChatPilot 项目的关注！本文档提供了参与贡献的指南。

---

## Table of Contents / 目录

- [How to Contribute / 如何贡献](#how-to-contribute--如何贡献)
- [Code Standards / 代码规范](#code-standards--代码规范)
- [Pull Request Process / PR 流程](#pull-request-process--pr-流程)
- [Issue Guidelines / Issue 指南](#issue-guidelines--issue-指南)
- [Development Setup / 开发环境搭建](#development-setup--开发环境搭建)

---

## How to Contribute / 如何贡献

### Getting Started / 开始之前

1. **Fork** the repository to your GitHub account
   将仓库 Fork 到你的 GitHub 账户

2. **Clone** your forked repository locally
   将 Fork 的仓库克隆到本地
   ```bash
   git clone https://github.com/YOUR_USERNAME/chatpilot.git
   cd chatpilot
   ```

3. **Create a branch** for your changes
   为你的修改创建一个分支
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes** and commit with a clear message
   进行修改并提交清晰的 commit message
   ```bash
   git commit -m "feat: add user authentication feature"
   ```

5. **Push** to your fork and create a **Pull Request**
   推送到你的 Fork 并创建 Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Contribution Types / 贡献类型

- **Bug fixes** / Bug 修复
- **New features** / 新功能
- **Documentation improvements** / 文档改进
- **UI/UX enhancements** / 界面优化
- **Performance optimizations** / 性能优化
- **Test coverage** / 测试覆盖

---

## Code Standards / 代码规范

### Python (Backend / 后端)

- Follow **PEP 8** style guidelines
  遵循 PEP 8 代码风格规范
- Use **type hints** for all function signatures
  所有函数签名使用类型注解
- Write **docstrings** for all public functions and classes (Google style)
  为所有公开函数和类编写文档字符串（Google 风格）
- Maximum line length: **100 characters**
  最大行长度：100 个字符

```python
# Good / 好的示例
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
) -> ConversationResponse:
    """
    Retrieve a conversation by its ID.

    Args:
        conversation_id: The unique identifier of the conversation.
        current_user: The authenticated user making the request.

    Returns:
        ConversationResponse: The conversation details.

    Raises:
        HTTPException: If the conversation is not found.
    """
    ...
```

### JavaScript (Frontend / 前端)

- Use **ES6+** syntax
  使用 ES6+ 语法
- Use **const/let**, never **var**
  使用 const/let，不使用 var
- Use **async/await** for asynchronous operations
  异步操作使用 async/await
- Add **JSDoc** comments for public functions
  为公开函数添加 JSDoc 注释

```javascript
// Good / 好的示例
/**
 * Send a message to the current conversation.
 * @param {string} content - The message content.
 * @returns {Promise<Message>} The sent message object.
 */
async function sendMessage(content) {
    const response = await api.post('/messages', { content });
    return response.data;
}
```

### Commit Messages / 提交信息规范

Follow **Conventional Commits** format:
遵循 Conventional Commits 格式：

```
<type>(<scope>): <subject>

Types:
- feat:     New feature / 新功能
- fix:      Bug fix / Bug 修复
- docs:     Documentation / 文档
- style:    Formatting / 格式调整
- refactor: Code refactoring / 代码重构
- test:     Adding tests / 添加测试
- chore:    Maintenance / 维护任务
```

---

## Pull Request Process / PR 流程

### Before Submitting / 提交前

1. Ensure your code **passes all tests**
   确保代码通过所有测试
   ```bash
   make test
   ```

2. Ensure your code **follows style guidelines**
   确保代码符合风格规范
   ```bash
   # Python
   pip install flake8 black
   flake8 backend/
   black backend/

   # JavaScript (if applicable)
   npm run lint
   ```

3. **Update documentation** if you changed functionality
   如果修改了功能，请更新文档

4. Add **tests** for new features or bug fixes
   为新功能或 Bug 修复添加测试

### PR Description Template / PR 描述模板

When creating a Pull Request, please include:
创建 Pull Request 时，请包含：

```markdown
## Description / 描述
Brief description of what this PR does.
简要描述此 PR 的内容。

## Changes Made / 修改内容
- Change 1
- Change 2

## Testing / 测试
- [ ] Unit tests pass / 单元测试通过
- [ ] Manual testing completed / 手动测试完成

## Screenshots / 截图 (if applicable / 如适用)
Attach screenshots for UI changes.
附上 UI 变更的截图。

## Related Issues / 关联 Issue
Closes #<issue_number>
```

### Review Process / 审查流程

1. A maintainer will review your PR within **3 business days**
   维护者将在 3 个工作日内审查你的 PR
2. Address review comments and update your PR accordingly
   根据审查意见修改并更新 PR
3. Once approved, a maintainer will merge your PR
   审批通过后，维护者将合并你的 PR

---

## Issue Guidelines / Issue 指南

### Bug Report Template / Bug 报告模板

```markdown
## Bug Description / Bug 描述
Clear description of the bug.
清晰地描述 Bug。

## Steps to Reproduce / 复现步骤
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior / 期望行为
What you expected to happen.
你期望发生什么。

## Actual Behavior / 实际行为
What actually happened.
实际发生了什么。

## Environment / 环境
- OS: [e.g., Ubuntu 22.04]
- Python version: [e.g., 3.11]
- Browser: [e.g., Chrome 120]
- ChatPilot version: [e.g., 1.0.0]
```

### Feature Request Template / 功能请求模板

```markdown
## Feature Description / 功能描述
Clear description of the desired feature.
清晰地描述期望的功能。

## Motivation / 动机
Why is this feature needed?
为什么需要这个功能？

## Proposed Solution / 建议方案
Describe your proposed implementation.
描述你建议的实现方案。

## Additional Context / 附加信息
Any other context or screenshots.
任何其他上下文或截图。
```

---

## Development Setup / 开发环境搭建

### Prerequisites / 前置条件

- Python 3.10+
- Node.js 18+ (optional, for frontend development)
- Ollama (for AI features)

### Quick Start / 快速开始

```bash
# Clone the repository / 克隆仓库
git clone https://github.com/YOUR_USERNAME/chatpilot.git
cd chatpilot

# Run the setup script / 运行安装脚本
chmod +x setup.sh
./setup.sh

# Start development server / 启动开发服务器
source venv/bin/activate
make dev
```

### Project Structure / 项目结构

```
chatpilot/
├── backend/          # Python FastAPI backend / Python FastAPI 后端
│   ├── app/
│   │   ├── models/   # Database models / 数据库模型
│   │   ├── routers/  # API routes / API 路由
│   │   ├── schemas/  # Pydantic schemas / 数据验证模型
│   │   ├── services/ # Business logic / 业务逻辑
│   │   └── websocket/# WebSocket handler / WebSocket 处理
│   ├── run.py        # Application entry point / 应用入口
│   └── requirements.txt
├── frontend/         # Frontend assets / 前端资源
│   ├── static/       # CSS, JS, images / 样式、脚本、图片
│   └── templates/    # HTML templates / HTML 模板
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── setup.sh
```

---

## Questions? / 有问题？

If you have questions, feel free to open an Issue or reach out to the maintainers.
如有任何问题，欢迎提交 Issue 或联系维护者。

Thank you for contributing to ChatPilot!
感谢你为 ChatPilot 做出的贡献！
