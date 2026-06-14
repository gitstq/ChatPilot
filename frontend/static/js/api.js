/**
 * ChatPilot API 客户端模块
 * 封装所有后端API请求
 */

const API = (() => {
  'use strict';

  /** API 基础地址（可配置） */
  let _baseUrl = localStorage.getItem('chatpilot_api_base') || '/api/v1';

  /** 请求超时时间 */
  const TIMEOUT = 15000;

  /**
   * 设置API基础地址
   * @param {string} url - 基础URL
   */
  function setBaseUrl(url) {
    _baseUrl = url;
    localStorage.setItem('chatpilot_api_base', url);
  }

  /**
   * 获取API基础地址
   * @returns {string}
   */
  function getBaseUrl() {
    return _baseUrl;
  }

  /**
   * 通用请求方法
   * @param {string} path - API路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async function request(path, options = {}) {
    const url = `${_baseUrl}${path}`;
    const {
      method = 'GET',
      data = null,
      headers = {},
      timeout = TIMEOUT,
    } = options;

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // 添加认证Token
    const token = localStorage.getItem('chatpilot_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 添加请求体
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    // 超时控制
    const controller = new AbortController();
    config.signal = controller.signal;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, config);
      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      // 204 No Content
      if (response.status === 204) return null;

      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw err;
    }
  }

  // ==================== 模拟数据 ====================
  // 在没有后端时提供模拟数据，方便前端开发和演示

  /** 模拟对话数据 */
  const mockConversations = [
    {
      id: 'conv-001',
      customer: { id: 'cust-001', name: '张三', email: 'zhangsan@example.com', avatar: null },
      lastMessage: '你好，我想咨询一下产品的价格',
      lastMessageTime: new Date(Date.now() - 300000).toISOString(),
      unread: 2,
      status: 'open',
      channel: 'widget',
      assignee: null,
    },
    {
      id: 'conv-002',
      customer: { id: 'cust-002', name: '李四', email: 'lisi@example.com', avatar: null },
      lastMessage: '订单什么时候发货？',
      lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
      unread: 0,
      status: 'open',
      channel: 'web',
      assignee: '客服A',
    },
    {
      id: 'conv-003',
      customer: { id: 'cust-003', name: '王五', email: 'wangwu@example.com', avatar: null },
      lastMessage: '好的，谢谢你的帮助',
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      unread: 0,
      status: 'closed',
      channel: 'widget',
      assignee: '客服B',
    },
    {
      id: 'conv-004',
      customer: { id: 'cust-004', name: 'Alice Wang', email: 'alice@example.com', avatar: null },
      lastMessage: 'Can I get a refund for this order?',
      lastMessageTime: new Date(Date.now() - 600000).toISOString(),
      unread: 1,
      status: 'open',
      channel: 'email',
      assignee: null,
    },
    {
      id: 'conv-005',
      customer: { id: 'cust-005', name: '赵六', email: 'zhaoliu@example.com', avatar: null },
      lastMessage: '请问你们有企业版吗？',
      lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
      unread: 0,
      status: 'pending',
      channel: 'widget',
      assignee: null,
    },
  ];

  /** 模拟消息数据 */
  const mockMessages = {
    'conv-001': [
      { id: 'msg-001', type: 'incoming', sender: '张三', content: '你好，我想咨询一下产品的价格', time: new Date(Date.now() - 600000).toISOString() },
      { id: 'msg-002', type: 'outgoing', sender: 'AI助手', content: '您好！感谢您的咨询。请问您想了解哪款产品的价格呢？我们有基础版、专业版和企业版三种方案。', time: new Date(Date.now() - 540000).toISOString() },
      { id: 'msg-003', type: 'incoming', sender: '张三', content: '专业版的价格是多少？有什么功能？', time: new Date(Date.now() - 300000).toISOString() },
    ],
    'conv-002': [
      { id: 'msg-004', type: 'incoming', sender: '李四', content: '我前天下的订单，什么时候发货？', time: new Date(Date.now() - 3600000).toISOString() },
      { id: 'msg-005', type: 'outgoing', sender: '客服A', content: '您好，我帮您查一下订单状态。请问您的订单号是多少？', time: new Date(Date.now() - 3200000).toISOString() },
      { id: 'msg-006', type: 'incoming', sender: '李四', content: '订单什么时候发货？', time: new Date(Date.now() - 1800000).toISOString() },
    ],
    'conv-004': [
      { id: 'msg-007', type: 'incoming', sender: 'Alice Wang', content: 'Can I get a refund for this order?', time: new Date(Date.now() - 900000).toISOString() },
      { id: 'msg-008', type: 'outgoing', sender: 'AI助手', content: 'Of course! I\'d be happy to help with your refund request. Could you please provide your order number?', time: new Date(Date.now() - 600000).toISOString() },
    ],
  };

  /** 模拟工单数据 */
  const mockTickets = [
    { id: 'TK-001', title: '无法登录系统', status: 'open', priority: 'high', customer: '张三', assignee: '客服A', createdAt: new Date(Date.now() - 86400000).toISOString(), description: '用户反馈使用账号密码登录时提示"密码错误"，但确认密码正确。' },
    { id: 'TK-002', title: '数据导出功能异常', status: 'pending', priority: 'medium', customer: '李四', assignee: null, createdAt: new Date(Date.now() - 172800000).toISOString(), description: '导出Excel文件时，部分数据列缺失。' },
    { id: 'TK-003', title: '退款申请 - 订单#12345', status: 'resolved', priority: 'urgent', customer: 'Alice Wang', assignee: '客服B', createdAt: new Date(Date.now() - 259200000).toISOString(), description: '客户要求对订单#12345进行全额退款。' },
    { id: 'TK-004', title: '建议增加批量操作功能', status: 'closed', priority: 'low', customer: '王五', assignee: '客服A', createdAt: new Date(Date.now() - 604800000).toISOString(), description: '希望能在客户列表中批量添加标签。' },
    { id: 'TK-005', title: '移动端页面显示异常', status: 'open', priority: 'medium', customer: '赵六', assignee: null, createdAt: new Date(Date.now() - 43200000).toISOString(), description: '在iPhone上查看工单详情时，布局错乱。' },
  ];

  /** 模拟客户数据 */
  const mockCustomers = [
    { id: 'cust-001', name: '张三', email: 'zhangsan@example.com', phone: '138****1234', company: 'ABC科技', lastActive: new Date(Date.now() - 300000).toISOString(), tags: ['VIP', '活跃'], conversations: 12, tickets: 3 },
    { id: 'cust-002', name: '李四', email: 'lisi@example.com', phone: '139****5678', company: 'XYZ网络', lastActive: new Date(Date.now() - 1800000).toISOString(), tags: ['活跃'], conversations: 8, tickets: 1 },
    { id: 'cust-003', name: '王五', email: 'wangwu@example.com', phone: '137****9012', company: '', lastActive: new Date(Date.now() - 7200000).toISOString(), tags: ['新用户'], conversations: 2, tickets: 1 },
    { id: 'cust-004', name: 'Alice Wang', email: 'alice@example.com', phone: '', company: 'Global Inc.', lastActive: new Date(Date.now() - 600000).toISOString(), tags: ['VIP', '海外'], conversations: 15, tickets: 5 },
    { id: 'cust-005', name: '赵六', email: 'zhaoliu@example.com', phone: '136****3456', company: '创业公司', lastActive: new Date(Date.now() - 86400000).toISOString(), tags: ['潜在客户'], conversations: 3, tickets: 0 },
  ];

  /** 模拟FAQ数据 */
  const mockFaqs = [
    { id: 'faq-001', question: '如何重置密码？', answer: '点击登录页面的"忘记密码"链接，输入注册邮箱，系统会发送重置链接到您的邮箱。点击链接即可设置新密码。', category: '账号相关', views: 256, updatedAt: new Date().toISOString() },
    { id: 'faq-002', question: '支持哪些支付方式？', answer: '我们支持支付宝、微信支付、银行卡转账和对公转账。企业客户还可以选择月结付款。', category: '支付相关', views: 189, updatedAt: new Date().toISOString() },
    { id: 'faq-003', question: '如何申请退款？', answer: '在订单详情页面点击"申请退款"按钮，选择退款原因并提交。我们会在1-3个工作日内审核处理。', category: '订单相关', views: 342, updatedAt: new Date().toISOString() },
    { id: 'faq-004', question: '产品如何定价？', answer: '我们提供基础版（免费）、专业版（¥99/月）和企业版（¥299/月）三种方案。具体功能对比请查看定价页面。', category: '产品相关', views: 421, updatedAt: new Date().toISOString() },
    { id: 'faq-005', question: '如何联系人工客服？', answer: '您可以通过页面右下角的聊天窗口联系在线客服，也可以发送邮件到 support@chatpilot.com。工作时间：周一至周五 9:00-18:00。', category: '服务相关', views: 178, updatedAt: new Date().toISOString() },
    { id: 'faq-006', question: '数据安全如何保障？', answer: '我们采用AES-256加密存储，所有数据传输使用HTTPS加密。服务器部署在阿里云，通过等保三级认证。定期进行安全审计。', category: '安全相关', views: 95, updatedAt: new Date().toISOString() },
  ];

  /** 模拟统计数据 */
  const mockStats = {
    todayConversations: 128,
    unreadMessages: 23,
    avgResponseTime: '1.2m',
    satisfaction: '96%',
    trendData: [
      { date: '06-08', conversations: 85, resolved: 78 },
      { date: '06-09', conversations: 92, resolved: 85 },
      { date: '06-10', conversations: 78, resolved: 72 },
      { date: '06-11', conversations: 105, resolved: 98 },
      { date: '06-12', conversations: 118, resolved: 110 },
      { date: '06-13', conversations: 132, resolved: 125 },
      { date: '06-14', conversations: 128, resolved: 118 },
    ],
  };

  // ==================== API 方法 ====================

  /** 是否使用模拟数据 */
  let _useMock = true;

  /**
   * 设置是否使用模拟数据
   * @param {boolean} useMock
   */
  function setUseMock(useMock) {
    _useMock = useMock;
  }

  // ---------- 仪表盘 ----------

  async function getDashboardStats() {
    if (_useMock) return mockStats;
    return request('/dashboard/stats');
  }

  // ---------- 对话 ----------

  async function getConversations(params = {}) {
    if (_useMock) {
      let result = [...mockConversations];
      if (params.status && params.status !== 'all') {
        result = result.filter(c => c.status === params.status);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        result = result.filter(c =>
          c.customer.name.toLowerCase().includes(s) ||
          c.lastMessage.toLowerCase().includes(s)
        );
      }
      return result;
    }
    return request('/conversations', { params });
  }

  async function getConversation(id) {
    if (_useMock) {
      return mockConversations.find(c => c.id === id) || null;
    }
    return request(`/conversations/${id}`);
  }

  async function getMessages(conversationId) {
    if (_useMock) {
      return mockMessages[conversationId] || [];
    }
    return request(`/conversations/${conversationId}/messages`);
  }

  async function sendMessage(conversationId, content) {
    if (_useMock) {
      const msg = {
        id: Utils.generateId(),
        type: 'outgoing',
        sender: '我',
        content,
        time: new Date().toISOString(),
      };
      if (!mockMessages[conversationId]) mockMessages[conversationId] = [];
      mockMessages[conversationId].push(msg);
      return msg;
    }
    return request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      data: { content },
    });
  }

  async function getAISuggestion(conversationId) {
    if (_useMock) {
      // 模拟AI建议
      const suggestions = [
        '根据对话内容，建议您向客户推荐我们的专业版方案，目前有优惠活动。',
        '客户似乎对价格比较敏感，建议提供试用机会或折扣信息。',
        '建议先确认客户的具体需求，再给出针对性的方案推荐。',
      ];
      return {
        suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
        quickReplies: ['查看优惠方案', '申请免费试用', '联系销售团队'],
      };
    }
    return request(`/conversations/${conversationId}/ai-suggest`);
  }

  // ---------- 工单 ----------

  async function getTickets(params = {}) {
    if (_useMock) {
      let result = [...mockTickets];
      if (params.status && params.status !== 'all') {
        result = result.filter(t => t.status === params.status);
      }
      return result;
    }
    return request('/tickets', { params });
  }

  async function getTicket(id) {
    if (_useMock) {
      return mockTickets.find(t => t.id === id) || null;
    }
    return request(`/tickets/${id}`);
  }

  async function createTicket(data) {
    if (_useMock) {
      const ticket = {
        id: `TK-${String(mockTickets.length + 1).padStart(3, '0')}`,
        ...data,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      mockTickets.unshift(ticket);
      return ticket;
    }
    return request('/tickets', { method: 'POST', data });
  }

  async function updateTicket(id, data) {
    if (_useMock) {
      const idx = mockTickets.findIndex(t => t.id === id);
      if (idx >= 0) Object.assign(mockTickets[idx], data);
      return mockTickets[idx];
    }
    return request(`/tickets/${id}`, { method: 'PUT', data });
  }

  // ---------- 客户 ----------

  async function getCustomers(params = {}) {
    if (_useMock) {
      let result = [...mockCustomers];
      if (params.search) {
        const s = params.search.toLowerCase();
        result = result.filter(c =>
          c.name.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.company.toLowerCase().includes(s)
        );
      }
      return result;
    }
    return request('/customers', { params });
  }

  async function getCustomer(id) {
    if (_useMock) {
      return mockCustomers.find(c => c.id === id) || null;
    }
    return request(`/customers/${id}`);
  }

  // ---------- 知识库 ----------

  async function getFaqs(params = {}) {
    if (_useMock) {
      let result = [...mockFaqs];
      if (params.category) {
        result = result.filter(f => f.category === params.category);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        result = result.filter(f =>
          f.question.toLowerCase().includes(s) ||
          f.answer.toLowerCase().includes(s)
        );
      }
      return result;
    }
    return request('/knowledge/faqs', { params });
  }

  async function getFaqCategories() {
    if (_useMock) {
      const categories = [...new Set(mockFaqs.map(f => f.category))];
      return categories.map(c => ({
        name: c,
        count: mockFaqs.filter(f => f.category === c).length,
      }));
    }
    return request('/knowledge/categories');
  }

  async function createFaq(data) {
    if (_useMock) {
      const faq = {
        id: `faq-${String(mockFaqs.length + 1).padStart(3, '0')}`,
        ...data,
        views: 0,
        updatedAt: new Date().toISOString(),
      };
      mockFaqs.unshift(faq);
      return faq;
    }
    return request('/knowledge/faqs', { method: 'POST', data });
  }

  async function updateFaq(id, data) {
    if (_useMock) {
      const idx = mockFaqs.findIndex(f => f.id === id);
      if (idx >= 0) Object.assign(mockFaqs[idx], data, { updatedAt: new Date().toISOString() });
      return mockFaqs[idx];
    }
    return request(`/knowledge/faqs/${id}`, { method: 'PUT', data });
  }

  async function deleteFaq(id) {
    if (_useMock) {
      const idx = mockFaqs.findIndex(f => f.id === id);
      if (idx >= 0) mockFaqs.splice(idx, 1);
      return { success: true };
    }
    return request(`/knowledge/faqs/${id}`, { method: 'DELETE' });
  }

  // ---------- 设置 ----------

  async function getSettings() {
    if (_useMock) {
      return Utils.storage.get('settings', {
        ai: {
          model: 'gpt-3.5-turbo',
          apiKey: '',
          temperature: 0.7,
          maxTokens: 2048,
          enabled: true,
        },
        widget: {
          color: '#4F46E5',
          position: 'right',
          welcomeMessage: '您好！有什么可以帮助您的吗？',
          title: '智能客服',
          enabled: true,
        },
        profile: {
          name: '管理员',
          email: 'admin@chatpilot.com',
          phone: '',
          company: 'ChatPilot',
        },
      });
    }
    return request('/settings');
  }

  async function updateSettings(data) {
    if (_useMock) {
      const settings = Utils.storage.get('settings', {});
      Object.assign(settings, data);
      Utils.storage.set('settings', settings);
      return settings;
    }
    return request('/settings', { method: 'PUT', data });
  }

  // ==================== 导出 ====================

  return {
    setBaseUrl,
    getBaseUrl,
    setUseMock,
    request,
    // 仪表盘
    getDashboardStats,
    // 对话
    getConversations,
    getConversation,
    getMessages,
    sendMessage,
    getAISuggestion,
    // 工单
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    // 客户
    getCustomers,
    getCustomer,
    // 知识库
    getFaqs,
    getFaqCategories,
    createFaq,
    updateFaq,
    deleteFaq,
    // 设置
    getSettings,
    updateSettings,
  };
})();
