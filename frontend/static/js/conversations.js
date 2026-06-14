/**
 * ChatPilot 对话管理模块
 * 对话列表、搜索过滤、对话详情
 */

const Conversations = (() => {
  'use strict';

  /** 当前对话列表 */
  let _conversations = [];
  /** 当前选中的对话ID */
  let _activeConversationId = null;
  /** 当前过滤状态 */
  let _currentFilter = 'all';
  /** 搜索关键词 */
  let _searchKeyword = '';

  /**
   * 初始化对话模块
   * @param {Object} query - URL查询参数
   */
  function init(query = {}) {
    if (query.id) {
      _activeConversationId = query.id;
    }
  }

  /**
   * 渲染对话页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${Utils.i18n('conversations')}</h1>
      </div>
      <div class="conversations-layout" id="conversationsLayout">
        <div class="conversations-list-panel">
          <div class="conversations-list-header">
            <h3>${Utils.i18n('conversations')}</h3>
            <div class="conversations-search">
              <span class="search-icon">${Utils.icon('search', 16)}</span>
              <input type="text" id="convSearchInput" placeholder="${Utils.getLang() === 'zh' ? '搜索对话...' : 'Search conversations...'}" value="${_searchKeyword}" />
            </div>
          </div>
          <div class="conversation-filters" id="convFilters">
            <button class="conversation-filter-btn active" data-filter="all">${Utils.i18n('all')}</button>
            <button class="conversation-filter-btn" data-filter="open">${Utils.i18n('open')}</button>
            <button class="conversation-filter-btn" data-filter="pending">${Utils.i18n('pending')}</button>
            <button class="conversation-filter-btn" data-filter="closed">${Utils.i18n('closed')}</button>
          </div>
          <div class="conversations-list" id="conversationsList">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="chat-panel" id="chatPanel">
          <div class="chat-empty">
            ${Utils.icon('chat', 64)}
            <p>${Utils.getLang() === 'zh' ? '选择一个对话开始聊天' : 'Select a conversation to start chatting'}</p>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindEvents();

    // 加载对话列表
    await loadConversations();

    // 如果有选中的对话，打开它
    if (_activeConversationId) {
      openConversation(_activeConversationId);
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 搜索
    const searchInput = Utils.$('#convSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        _searchKeyword = e.target.value.trim();
        loadConversations();
      }, 300));
    }

    // 过滤按钮
    Utils.$$('#convFilters .conversation-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#convFilters .conversation-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentFilter = btn.dataset.filter;
        loadConversations();
      });
    });
  }

  /**
   * 加载对话列表
   */
  async function loadConversations() {
    const listEl = Utils.$('#conversationsList');
    if (!listEl) return;

    try {
      _conversations = await API.getConversations({
        status: _currentFilter,
        search: _searchKeyword,
      });

      if (!_conversations.length) {
        listEl.innerHTML = `
          <div class="conversations-empty">
            ${Utils.icon('chat', 48)}
            <p>${Utils.i18n('no_conversations')}</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = _conversations.map(conv => renderConversationItem(conv)).join('');

      // 绑定点击事件
      Utils.$$('.conversation-item', listEl).forEach(item => {
        item.addEventListener('click', () => {
          openConversation(item.dataset.id);
        });
      });
    } catch (err) {
      console.error('加载对话列表失败:', err);
      listEl.innerHTML = `<div class="conversations-empty"><p>${Utils.i18n('error')}</p></div>`;
    }
  }

  /**
   * 渲染单个对话项
   * @param {Object} conv - 对话数据
   * @returns {string} HTML字符串
   */
  function renderConversationItem(conv) {
    const isActive = conv.id === _activeConversationId;
    const statusColors = {
      open: 'badge-success',
      pending: 'badge-warning',
      closed: 'badge-gray',
    };

    return `
      <div class="conversation-item ${isActive ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}" data-id="${conv.id}">
        <div class="conversation-avatar">
          <div class="avatar" style="background: ${Utils.avatarColor(conv.customer.name)}">
            ${Utils.getInitials(conv.customer.name)}
          </div>
          <span class="avatar-status ${conv.status === 'open' ? 'online' : 'offline'}"></span>
        </div>
        <div class="conversation-info">
          <div class="conversation-name">
            ${Utils.escapeHtml(conv.customer.name)}
            ${conv.assignee ? `<span class="assignee">- ${conv.assignee}</span>` : ''}
          </div>
          <div class="conversation-preview">${Utils.escapeHtml(conv.lastMessage)}</div>
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">${Utils.formatTime(conv.lastMessageTime)}</span>
          ${conv.unread > 0 ? `<span class="conversation-unread-badge">${conv.unread}</span>` : ''}
          <span class="badge ${statusColors[conv.status] || 'badge-gray'}">${Utils.i18n(conv.status)}</span>
        </div>
      </div>
    `;
  }

  /**
   * 打开对话
   * @param {string} conversationId - 对话ID
   */
  async function openConversation(conversationId) {
    _activeConversationId = conversationId;

    // 更新列表激活状态
    Utils.$$('.conversation-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === conversationId);
      // 清除未读
      if (item.dataset.id === conversationId) {
        item.classList.remove('unread');
        const badge = item.querySelector('.conversation-unread-badge');
        if (badge) badge.remove();
      }
    });

    // 移动端显示聊天面板
    Utils.$('#conversationsLayout')?.classList.add('chat-open');

    // 渲染聊天面板
    await Chat.render(conversationId);
  }

  return {
    init,
    render,
    openConversation,
  };
})();
