/**
 * ChatPilot 工具函数模块
 * 提供通用的辅助方法
 */

const Utils = (() => {
  'use strict';

  // ==================== 时间格式化 ====================

  /**
   * 格式化时间为友好显示
   * @param {string|Date} time - 时间
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(time) {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return i18n('just_now');
    if (minutes < 60) return i18n('minutes_ago', minutes);
    if (hours < 24) return i18n('hours_ago', hours);
    if (days < 7) return i18n('days_ago', days);

    return formatDate(date);
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @returns {string} 格式化日期字符串
   */
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 格式化聊天消息时间
   * @param {string|Date} time - 时间
   * @returns {string} 时:分 格式
   */
  function formatMessageTime(time) {
    const date = new Date(time);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // ==================== 多语言 ====================

  /** 多语言字典 */
  const _dict = {
    zh: {
      just_now: '刚刚',
      minutes_ago: (n) => `${n}分钟前`,
      hours_ago: (n) => `${n}小时前`,
      days_ago: (n) => `${n}天前`,
      dashboard: '仪表盘',
      conversations: '对话',
      tickets: '工单',
      customers: '客户',
      knowledge: '知识库',
      settings: '设置',
      search: '搜索...',
      notifications: '通知',
      today_conversations: '今日对话',
      unread_messages: '未读消息',
      avg_response_time: '平均响应时间',
      satisfaction: '满意度',
      recent_conversations: '最近对话',
      conversation_trend: '对话趋势',
      all: '全部',
      open: '进行中',
      closed: '已关闭',
      pending: '待处理',
      resolved: '已解决',
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低',
      send: '发送',
      type_message: '输入消息...',
      ai_suggest: 'AI 建议',
      no_conversations: '暂无对话',
      no_tickets: '暂无工单',
      no_customers: '暂无客户',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      create: '创建',
      confirm: '确认',
      success: '操作成功',
      error: '操作失败',
      loading: '加载中...',
      online: '在线',
      offline: '离线',
      typing: '正在输入...',
      welcome_message: '您好！有什么可以帮助您的吗？',
      quick_replies: ['查看常见问题', '联系人工客服', '查看订单状态'],
      faq_categories: '常见问题分类',
      add_faq: '添加FAQ',
      edit_faq: '编辑FAQ',
      faq_question: '问题',
      faq_answer: '答案',
      faq_category: '分类',
      ai_config: 'AI 配置',
      widget_config: 'Widget 配置',
      profile: '个人信息',
      api_keys: 'API 密钥',
      general: '通用',
      language: '语言',
      theme: '主题',
      widget_color: '主题色',
      widget_position: '位置',
      widget_welcome: '欢迎语',
      right: '右下角',
      left: '左下角',
      ai_model: 'AI 模型',
      ai_api_key: 'API 密钥',
      ai_temperature: '温度',
      ai_max_tokens: '最大令牌数',
      name: '姓名',
      email: '邮箱',
      phone: '电话',
      company: '公司',
      created_at: '创建时间',
      updated_at: '更新时间',
      status: '状态',
      priority: '优先级',
      assignee: '负责人',
      customer_info: '客户信息',
      conversation_history: '对话历史',
      ticket_history: '工单记录',
      basic_info: '基本信息',
      total_conversations: '总对话数',
      total_tickets: '总工单数',
      last_active: '最后活跃',
      copy: '复制',
      copied: '已复制',
      new_conversation: '新建对话',
      new_ticket: '新建工单',
      reply: '回复',
      close_ticket: '关闭工单',
      reopen_ticket: '重新打开',
      filter: '筛选',
      export: '导出',
      import: '导入',
      upload: '上传',
      download: '下载',
      view_all: '查看全部',
      powered_by: '由 ChatPilot 提供支持',
      customer_service: '智能客服',
    },
    en: {
      just_now: 'Just now',
      minutes_ago: (n) => `${n}m ago`,
      hours_ago: (n) => `${n}h ago`,
      days_ago: (n) => `${n}d ago`,
      dashboard: 'Dashboard',
      conversations: 'Conversations',
      tickets: 'Tickets',
      customers: 'Customers',
      knowledge: 'Knowledge Base',
      settings: 'Settings',
      search: 'Search...',
      notifications: 'Notifications',
      today_conversations: 'Today Conversations',
      unread_messages: 'Unread Messages',
      avg_response_time: 'Avg Response Time',
      satisfaction: 'Satisfaction',
      recent_conversations: 'Recent Conversations',
      conversation_trend: 'Conversation Trend',
      all: 'All',
      open: 'Open',
      closed: 'Closed',
      pending: 'Pending',
      resolved: 'Resolved',
      urgent: 'Urgent',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      send: 'Send',
      type_message: 'Type a message...',
      ai_suggest: 'AI Suggest',
      no_conversations: 'No conversations',
      no_tickets: 'No tickets',
      no_customers: 'No customers',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      create: 'Create',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      online: 'Online',
      offline: 'Offline',
      typing: 'Typing...',
      welcome_message: 'Hello! How can I help you?',
      quick_replies: ['View FAQ', 'Contact Agent', 'Check Order Status'],
      faq_categories: 'FAQ Categories',
      add_faq: 'Add FAQ',
      edit_faq: 'Edit FAQ',
      faq_question: 'Question',
      faq_answer: 'Answer',
      faq_category: 'Category',
      ai_config: 'AI Configuration',
      widget_config: 'Widget Configuration',
      profile: 'Profile',
      api_keys: 'API Keys',
      general: 'General',
      language: 'Language',
      theme: 'Theme',
      widget_color: 'Widget Color',
      widget_position: 'Position',
      widget_welcome: 'Welcome Message',
      right: 'Bottom Right',
      left: 'Bottom Left',
      ai_model: 'AI Model',
      ai_api_key: 'API Key',
      ai_temperature: 'Temperature',
      ai_max_tokens: 'Max Tokens',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      created_at: 'Created',
      updated_at: 'Updated',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      customer_info: 'Customer Info',
      conversation_history: 'Conversation History',
      ticket_history: 'Ticket History',
      basic_info: 'Basic Info',
      total_conversations: 'Total Conversations',
      total_tickets: 'Total Tickets',
      last_active: 'Last Active',
      copy: 'Copy',
      copied: 'Copied',
      new_conversation: 'New Conversation',
      new_ticket: 'New Ticket',
      reply: 'Reply',
      close_ticket: 'Close Ticket',
      reopen_ticket: 'Reopen',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      upload: 'Upload',
      download: 'Download',
      view_all: 'View All',
      powered_by: 'Powered by ChatPilot',
      customer_service: 'Customer Service',
    }
  };

  /** 当前语言 */
  let _lang = localStorage.getItem('chatpilot_lang') || 'zh';

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键
   * @param {...any} args - 参数
   * @returns {string} 翻译后的文本
   */
  function i18n(key, ...args) {
    const dict = _dict[_lang] || _dict.zh;
    const value = dict[key];
    if (typeof value === 'function') return value(...args);
    return value || key;
  }

  /**
   * 切换语言
   * @param {string} lang - 语言代码
   */
  function setLang(lang) {
    _lang = lang;
    localStorage.setItem('chatpilot_lang', lang);
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  function getLang() {
    return _lang;
  }

  // ==================== DOM 操作 ====================

  /**
   * 简写 querySelector
   * @param {string} selector - CSS选择器
   * @param {Element} parent - 父元素
   * @returns {Element|null}
   */
  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * 简写 querySelectorAll
   * @param {string} selector - CSS选择器
   * @param {Element} parent - 父元素
   * @returns {Element[]}
   */
  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  /**
   * 创建DOM元素
   * @param {string} tag - 标签名
   * @param {Object} attrs - 属性
   * @param {string|Element|Array} children - 子元素
   * @returns {Element}
   */
  function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key.startsWith('on')) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else {
        el.setAttribute(key, value);
      }
    });
    if (children) {
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else if (child instanceof Element) {
            el.appendChild(child);
          }
        });
      } else if (typeof children === 'string') {
        el.textContent = children;
      } else if (children instanceof Element) {
        el.appendChild(children);
      }
    }
    return el;
  }

  // ==================== 工具方法 ====================

  /**
   * 防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟毫秒数
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * 节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} interval - 间隔毫秒数
   * @returns {Function}
   */
  function throttle(fn, interval = 300) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= interval) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  /**
   * 生成唯一ID
   * @returns {string} UUID格式ID
   */
  function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  /**
   * 生成头像颜色
   * @param {string} name - 名称
   * @returns {string} 颜色值
   */
  function avatarColor(name) {
    const colors = [
      '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 获取名称首字母
   * @param {string} name - 名称
   * @returns {string} 首字母
   */
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    // 中文名取前两个字，英文名取前两个字母
    return name.slice(0, 2).toUpperCase();
  }

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   * @returns {Promise<boolean>}
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /**
   * HTML 转义
   * @param {string} str - 要转义的字符串
   * @returns {string} 转义后的字符串
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 简单模板引擎
   * @param {string} template - 模板字符串
   * @param {Object} data - 数据对象
   * @returns {string} 渲染后的HTML
   */
  function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? escapeHtml(String(data[key])) : match;
    });
  }

  /**
   * 本地存储操作
   */
  const storage = {
    get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(`chatpilot_${key}`);
        return value ? JSON.parse(value) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`chatpilot_${key}`, JSON.stringify(value));
      } catch (e) {
        console.warn('Storage set failed:', e);
      }
    },
    remove(key) {
      localStorage.removeItem(`chatpilot_${key}`);
    }
  };

  // ==================== SVG 图标 ====================

  /** 常用SVG图标集合 */
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    knowledge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    sidebarCollapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    sidebarExpand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
  };

  /**
   * 获取SVG图标HTML
   * @param {string} name - 图标名称
   * @param {number} size - 尺寸
   * @returns {string} SVG HTML字符串
   */
  function icon(name, size = 20) {
    const svg = icons[name] || '';
    return svg.replace('<svg', `<svg width="${size}" height="${size}"`);
  }

  // ==================== Toast 通知 ====================

  /**
   * 显示Toast通知
   * @param {string} message - 消息内容
   * @param {string} type - 类型: success/error/warning/info
   * @param {number} duration - 显示时长(ms)
   */
  function showToast(message, type = 'info', duration = 3000) {
    let container = $('.toast-container');
    if (!container) {
      container = createElement('div', { className: 'toast-container' });
      document.body.appendChild(container);
    }

    const iconsMap = {
      success: '&#10003;',
      error: '&#10007;',
      warning: '&#9888;',
      info: '&#8505;'
    };

    const toast = createElement('div', {
      className: `toast ${type}`,
      innerHTML: `
        <span class="toast-icon">${iconsMap[type] || ''}</span>
        <div class="toast-content">
          <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
      `
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==================== 导出 ====================

  return {
    formatTime,
    formatDate,
    formatMessageTime,
    i18n,
    setLang,
    getLang,
    $,
    $$,
    createElement,
    debounce,
    throttle,
    generateId,
    avatarColor,
    getInitials,
    copyToClipboard,
    formatFileSize,
    escapeHtml,
    renderTemplate,
    storage,
    icons,
    icon,
    showToast,
  };
})();
