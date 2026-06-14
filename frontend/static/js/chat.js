/**
 * ChatPilot 聊天功能模块
 * 消息展示、发送、AI建议
 */

const Chat = (() => {
  'use strict';

  /** 当前对话ID */
  let _conversationId = null;
  /** 消息列表 */
  let _messages = [];
  /** 是否正在输入 */
  let _isTyping = false;

  /**
   * 渲染聊天面板
   * @param {string} conversationId - 对话ID
   */
  async function render(conversationId) {
    _conversationId = conversationId;
    const panel = Utils.$('#chatPanel');
    if (!panel) return;

    // 获取对话信息
    const conversation = await API.getConversation(conversationId);
    const customerName = conversation?.customer?.name || Utils.getLang() === 'zh' ? '未知用户' : 'Unknown';

    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <button class="btn btn-ghost btn-icon btn-sm mobile-back-btn" onclick="Utils.$('#conversationsLayout').classList.remove('chat-open')">
            ${Utils.icon('arrowLeft', 16)}
          </button>
          <div class="avatar" style="background: ${Utils.avatarColor(customerName)}">
            ${Utils.getInitials(customerName)}
          </div>
          <div>
            <div class="chat-header-name">${Utils.escapeHtml(customerName)}</div>
            <div class="chat-header-status">
              <span class="online-indicator"></span>
              ${Utils.i18n('online')}
            </div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="btn btn-ghost btn-icon btn-sm" title="${Utils.i18n('customer_info')}">
            ${Utils.icon('customers', 16)}
          </button>
          <button class="btn btn-ghost btn-icon btn-sm" title="${Utils.getLang() === 'zh' ? '转接' : 'Transfer'}">
            ${Utils.icon('edit', 16)}
          </button>
          <button class="btn btn-ghost btn-icon btn-sm" title="${Utils.i18n('close')}">
            ${Utils.icon('close', 16)}
          </button>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
      <div class="chat-input-area">
        <div class="ai-suggest-bar">
          <button class="ai-suggest-bar-btn" id="aiSuggestBtn">
            ${Utils.icon('bot', 14)}
            ${Utils.i18n('ai_suggest')}
          </button>
        </div>
        <div class="chat-input-wrapper">
          <div class="chat-input-tools">
            <button class="chat-tool-btn" title="${Utils.getLang() === 'zh' ? '附件' : 'Attach'}">
              ${Utils.icon('paperclip', 18)}
            </button>
            <button class="chat-tool-btn" title="${Utils.getLang() === 'zh' ? '图片' : 'Image'}">
              ${Utils.icon('image', 18)}
            </button>
            <button class="chat-tool-btn" title="${Utils.getLang() === 'zh' ? '表情' : 'Emoji'}">
              ${Utils.icon('smile', 18)}
            </button>
          </div>
          <div class="chat-input-box">
            <textarea id="chatInput" placeholder="${Utils.i18n('type_message')}" rows="1"></textarea>
          </div>
          <button class="send-btn" id="chatSendBtn" disabled>
            ${Utils.icon('send', 18)}
          </button>
        </div>
      </div>
    `;

    // 绑定事件
    bindChatEvents();

    // 加载消息
    await loadMessages();
  }

  /**
   * 绑定聊天事件
   */
  function bindChatEvents() {
    const input = Utils.$('#chatInput');
    const sendBtn = Utils.$('#chatSendBtn');

    if (!input || !sendBtn) return;

    // 输入框自动调整高度
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = !input.value.trim();
    });

    // Enter发送（Shift+Enter换行）
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 发送按钮
    sendBtn.addEventListener('click', sendMessage);

    // AI建议按钮
    Utils.$('#aiSuggestBtn')?.addEventListener('click', requestAISuggestion);
  }

  /**
   * 加载消息列表
   */
  async function loadMessages() {
    const container = Utils.$('#chatMessages');
    if (!container) return;

    try {
      _messages = await API.getMessages(_conversationId);

      if (!_messages.length) {
        container.innerHTML = `
          <div class="chat-date-divider"><span>${Utils.formatDate(new Date())}</span></div>
          <div class="message-system">${Utils.i18n('welcome_message')}</div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="chat-date-divider"><span>${Utils.formatDate(new Date(_messages[0].time))}</span></div>
        ${_messages.map(msg => renderMessage(msg)).join('')}
      `;

      // 滚动到底部
      scrollToBottom();
    } catch (err) {
      console.error('加载消息失败:', err);
      container.innerHTML = `<div class="empty-state"><p>${Utils.i18n('error')}</p></div>`;
    }
  }

  /**
   * 渲染单条消息
   * @param {Object} msg - 消息数据
   * @returns {string} HTML字符串
   */
  function renderMessage(msg) {
    const isOutgoing = msg.type === 'outgoing';
    const avatarColor = isOutgoing ? '#4F46E5' : Utils.avatarColor(msg.sender || 'User');

    return `
      <div class="message ${isOutgoing ? 'outgoing' : 'incoming'}">
        <div class="message-avatar">
          <div class="avatar avatar-sm" style="background: ${avatarColor}">
            ${isOutgoing ? Utils.getInitials('Me') : Utils.getInitials(msg.sender || 'U')}
          </div>
        </div>
        <div class="message-content">
          ${!isOutgoing ? `<span class="message-sender">${Utils.escapeHtml(msg.sender || Utils.getLang() === 'zh' ? '客户' : 'Customer')}</span>` : ''}
          <div class="message-bubble">${Utils.escapeHtml(msg.content)}</div>
          <span class="message-time">${Utils.formatMessageTime(msg.time)}</span>
        </div>
      </div>
    `;
  }

  /**
   * 发送消息
   */
  async function sendMessage() {
    const input = Utils.$('#chatInput');
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';
    input.style.height = 'auto';
    Utils.$('#chatSendBtn').disabled = true;

    // 乐观更新：立即显示消息
    const tempMsg = {
      id: Utils.generateId(),
      type: 'outgoing',
      sender: '我',
      content,
      time: new Date().toISOString(),
    };

    appendMessage(tempMsg);

    try {
      await API.sendMessage(_conversationId, content);
    } catch (err) {
      console.error('发送消息失败:', err);
      Utils.showToast(Utils.i18n('error'), 'error');
    }
  }

  /**
   * 追加消息到聊天区域
   * @param {Object} msg - 消息数据
   */
  function appendMessage(msg) {
    const container = Utils.$('#chatMessages');
    if (!container) return;

    const msgHtml = renderMessage(msg);
    container.insertAdjacentHTML('beforeend', msgHtml);
    scrollToBottom();
  }

  /**
   * 请求AI建议
   */
  async function requestAISuggestion() {
    const btn = Utils.$('#aiSuggestBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `<div class="spinner spinner-sm"></div> ${Utils.i18n('loading')}`;

    try {
      const result = await API.getAISuggestion(_conversationId);

      // 在消息区域显示AI建议
      const container = Utils.$('#chatMessages');
      if (container && result.suggestion) {
        const suggestionHtml = `
          <div class="message-ai-suggestion">
            <div class="ai-suggestion-header">
              ${Utils.icon('bot', 14)}
              ${Utils.i18n('ai_suggest')}
            </div>
            <div class="ai-suggestion-text">${Utils.escapeHtml(result.suggestion)}</div>
            ${result.quickReplies ? `
              <div class="ai-suggestion-actions">
                ${result.quickReplies.map(reply => `
                  <button class="ai-suggestion-btn" onclick="Chat.useSuggestion('${Utils.escapeHtml(reply)}')">${Utils.escapeHtml(reply)}</button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
        container.insertAdjacentHTML('beforeend', suggestionHtml);
        scrollToBottom();
      }
    } catch (err) {
      console.error('获取AI建议失败:', err);
      Utils.showToast(Utils.getLang() === 'zh' ? '获取AI建议失败' : 'Failed to get AI suggestion', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${Utils.icon('bot', 14)} ${Utils.i18n('ai_suggest')}`;
    }
  }

  /**
   * 使用AI建议的快捷回复
   * @param {string} text - 回复文本
   */
  function useSuggestion(text) {
    const input = Utils.$('#chatInput');
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
  }

  /**
   * 滚动到底部
   */
  function scrollToBottom() {
    const container = Utils.$('#chatMessages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  /**
   * 显示正在输入指示器
   */
  function showTypingIndicator() {
    if (_isTyping) return;
    _isTyping = true;

    const container = Utils.$('#chatMessages');
    if (!container) return;

    const typingHtml = `
      <div class="typing-indicator" id="typingIndicator">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span>${Utils.i18n('typing')}</span>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();
  }

  /**
   * 隐藏正在输入指示器
   */
  function hideTypingIndicator() {
    _isTyping = false;
    Utils.$('#typingIndicator')?.remove();
  }

  return {
    render,
    sendMessage,
    appendMessage,
    useSuggestion,
    showTypingIndicator,
    hideTypingIndicator,
  };
})();
