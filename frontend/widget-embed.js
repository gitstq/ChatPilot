/**
 * ChatPilot Widget 嵌入脚本
 * 一行代码嵌入聊天Widget到任意网站
 *
 * 使用方式：
 * <script src="widget-embed.js"
 *   data-color="#4F46E5"
 *   data-position="right"
 *   data-welcome="您好！有什么可以帮助您的吗？"
 *   data-title="智能客服"
 * ></script>
 *
 * 支持的 data 属性：
 *   data-color    - 主题色（默认 #4F46E5）
 *   data-position - 位置：right | left（默认 right）
 *   data-welcome  - 欢迎消息
 *   data-title    - Widget标题
 *   data-api      - API地址（默认 /api/v1）
 */

(function () {
  'use strict';

  // ==================== 读取配置 ====================

  const script = document.currentScript;
  const config = {
    color: (script && script.dataset.color) || '#4F46E5',
    position: (script && script.dataset.position) || 'right',
    welcome: (script && script.dataset.welcome) || '',
    title: (script && script.dataset.title) || '',
    api: (script && script.dataset.api) || '/api/v1',
  };

  // 根据脚本路径确定基础URL
  const scriptSrc = script ? script.src : '';
  const basePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

  // ==================== 加载样式 ====================

  // 如果页面尚未加载 widget.css，则动态注入
  if (!document.querySelector('link[href*="widget.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = basePath + 'static/css/widget.css';
    document.head.appendChild(link);
  }

  // ==================== 创建Widget DOM ====================

  /** Widget 容器 */
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'chatpilot-widget';
  widgetContainer.style.cssText = 'all:initial;';

  /** 未读消息数 */
  let unreadCount = 0;
  /** 是否打开 */
  let isOpen = false;
  /** 消息列表 */
  let messages = [];

  // ==================== 渲染Widget ====================

  function render() {
    const positionClass = config.position === 'left' ? 'position-left' : '';

    widgetContainer.innerHTML = `
      <!-- 浮动按钮 -->
      <button class="chatpilot-widget-btn ${positionClass}" id="cpWidgetBtn" style="--widget-color: ${config.color};" title="Chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chatpilot-widget-badge" id="cpWidgetBadge"></span>
      </button>

      <!-- 聊天窗口 -->
      <div class="chatpilot-widget-window ${positionClass}" id="cpWidgetWindow" style="--widget-color: ${config.color};">
        <!-- 头部 -->
        <div class="chatpilot-widget-header" style="background: ${config.color};">
          <div class="chatpilot-widget-header-info">
            <div class="chatpilot-widget-header-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="chatpilot-widget-header-text">
              <h4>${escapeHtml(config.title || '智能客服')}</h4>
              <p>${escapeHtml(config.welcome ? '' : '在线')}</p>
            </div>
          </div>
          <button class="chatpilot-widget-close" id="cpWidgetClose">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- 消息区域 -->
        <div class="chatpilot-widget-messages" id="cpWidgetMessages">
          <!-- 欢迎消息 -->
          <div class="chatpilot-welcome">
            <div class="chatpilot-welcome-avatar" style="background: ${config.color};">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="chatpilot-welcome-text">${escapeHtml(config.welcome || '您好！有什么可以帮助您的吗？')}</div>
          </div>
        </div>

        <!-- 快捷回复 -->
        <div class="chatpilot-quick-replies" id="cpQuickReplies">
          <button class="chatpilot-quick-reply" data-msg="查看常见问题">查看常见问题</button>
          <button class="chatpilot-quick-reply" data-msg="联系人工客服">联系人工客服</button>
          <button class="chatpilot-quick-reply" data-msg="查看订单状态">查看订单状态</button>
        </div>

        <!-- 正在输入指示器（默认隐藏） -->
        <div class="chatpilot-typing" id="cpTyping" style="display:none;">
          <div class="chatpilot-typing-dots">
            <span></span><span></span><span></span>
          </div>
          <span>正在输入...</span>
        </div>

        <!-- 输入区域 -->
        <div class="chatpilot-widget-input">
          <div class="chatpilot-input-wrapper">
            <input type="text" id="cpWidgetInput" placeholder="输入消息..." autocomplete="off" />
            <button class="chatpilot-send-btn" id="cpSendBtn" disabled>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 底部 -->
        <div class="chatpilot-widget-footer">
          <a href="https://github.com/chatpilot" target="_blank" rel="noopener">Powered by ChatPilot</a>
        </div>
      </div>
    `;

    document.body.appendChild(widgetContainer);
    bindEvents();
  }

  // ==================== 事件绑定 ====================

  function bindEvents() {
    // 打开/关闭Widget
    const btn = document.getElementById('cpWidgetBtn');
    const closeBtn = document.getElementById('cpWidgetClose');
    const win = document.getElementById('cpWidgetWindow');

    if (btn) {
      btn.addEventListener('click', toggleWidget);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWidget);
    }

    // 输入框
    const input = document.getElementById('cpWidgetInput');
    const sendBtn = document.getElementById('cpSendBtn');

    if (input) {
      input.addEventListener('input', () => {
        if (sendBtn) sendBtn.disabled = !input.value.trim();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          sendMessage(input.value.trim());
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const input = document.getElementById('cpWidgetInput');
        if (input && input.value.trim()) {
          sendMessage(input.value.trim());
        }
      });
    }

    // 快捷回复
    const quickReplies = document.querySelectorAll('.chatpilot-quick-reply');
    quickReplies.forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.dataset.msg;
        if (msg) sendMessage(msg);
      });
    });
  }

  // ==================== Widget 控制 ====================

  function toggleWidget() {
    isOpen ? closeWidget() : openWidget();
  }

  function openWidget() {
    isOpen = true;
    const win = document.getElementById('cpWidgetWindow');
    const btn = document.getElementById('cpWidgetBtn');
    if (win) win.classList.add('open');
    if (btn) btn.classList.add('open');

    // 清除未读
    unreadCount = 0;
    updateBadge();

    // 聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('cpWidgetInput');
      if (input) input.focus();
    }, 300);
  }

  function closeWidget() {
    isOpen = false;
    const win = document.getElementById('cpWidgetWindow');
    const btn = document.getElementById('cpWidgetBtn');
    if (win) win.classList.remove('open');
    if (btn) btn.classList.remove('open');
  }

  // ==================== 消息功能 ====================

  /**
   * 发送消息
   * @param {string} content - 消息内容
   */
  function sendMessage(content) {
    const input = document.getElementById('cpWidgetInput');
    if (input) {
      input.value = '';
      const sendBtn = document.getElementById('cpSendBtn');
      if (sendBtn) sendBtn.disabled = true;
    }

    // 添加用户消息
    appendMessage('user', content);

    // 隐藏快捷回复
    const quickReplies = document.getElementById('cpQuickReplies');
    if (quickReplies) quickReplies.style.display = 'none';

    // 模拟AI回复
    simulateBotReply(content);
  }

  /**
   * 添加消息到聊天区域
   * @param {string} type - 消息类型: user | bot
   * @param {string} content - 消息内容
   */
  function appendMessage(type, content) {
    const container = document.getElementById('cpWidgetMessages');
    if (!container) return;

    const time = new Date();
    const timeStr = String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0');

    const msgDiv = document.createElement('div');
    msgDiv.className = `chatpilot-msg ${type}`;
    msgDiv.innerHTML = `
      <div class="chatpilot-msg-bubble">${escapeHtml(content)}</div>
      <div class="chatpilot-msg-time">${timeStr}</div>
    `;

    container.appendChild(msgDiv);
    scrollToBottom();

    // 保存消息
    messages.push({ type, content, time: time.toISOString() });
  }

  /**
   * 模拟机器人回复
   * @param {string} userMessage - 用户消息
   */
  function simulateBotReply(userMessage) {
    // 显示正在输入
    const typing = document.getElementById('cpTyping');
    if (typing) typing.style.display = 'flex';
    scrollToBottom();

    // 模拟回复延迟
    const delay = 800 + Math.random() * 1200;

    setTimeout(() => {
      if (typing) typing.style.display = 'none';

      // 简单的模拟回复逻辑
      let reply = '';
      const msg = userMessage.toLowerCase();

      if (msg.includes('价格') || msg.includes('price') || msg.includes('pricing')) {
        reply = '我们提供三种方案：基础版（免费）、专业版（¥99/月）和企业版（¥299/月）。您想了解哪个方案的详细信息？';
      } else if (msg.includes('退款') || msg.includes('refund')) {
        reply = '关于退款，请在订单详情页面点击"申请退款"。我们会在1-3个工作日内处理。请问您的订单号是多少？';
      } else if (msg.includes('人工') || msg.includes('agent') || msg.includes('客服')) {
        reply = '正在为您转接人工客服，请稍候... 平均等待时间约2分钟。';
      } else if (msg.includes('订单') || msg.includes('order')) {
        reply = '请提供您的订单号，我来帮您查询订单状态。';
      } else if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
        reply = '您好！欢迎来到 ChatPilot 智能客服。请问有什么可以帮助您的？';
      } else if (msg.includes('常见问题') || msg.includes('faq')) {
        reply = '以下是常见问题：\n1. 如何重置密码？\n2. 支持哪些支付方式？\n3. 如何申请退款？\n\n请告诉我您想了解哪个问题。';
      } else {
        const replies = [
          '感谢您的咨询！我已记录您的问题，稍后会有客服为您详细解答。',
          '好的，我理解您的需求。让我为您查询相关信息，请稍等。',
          '收到您的消息。如果您需要更详细的帮助，可以点击"联系人工客服"按钮。',
        ];
        reply = replies[Math.floor(Math.random() * replies.length)];
      }

      appendMessage('bot', reply);
    }, delay);
  }

  /**
   * 滚动消息区域到底部
   */
  function scrollToBottom() {
    const container = document.getElementById('cpWidgetMessages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  /**
   * 更新未读角标
   */
  function updateBadge() {
    const badge = document.getElementById('cpWidgetBadge');
    if (badge) {
      badge.textContent = unreadCount > 0 ? unreadCount : '';
    }
  }

  // ==================== 工具函数 ====================

  /**
   * HTML转义
   * @param {string} str - 要转义的字符串
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 初始化 ====================

  // DOM加载完成后渲染Widget
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
