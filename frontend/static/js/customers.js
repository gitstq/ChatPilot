/**
 * ChatPilot 客户管理模块
 * 客户列表、搜索、客户详情
 */

const Customers = (() => {
  'use strict';

  /** 客户列表 */
  let _customers = [];
  /** 当前选中客户ID */
  let _activeCustomerId = null;
  /** 搜索关键词 */
  let _searchKeyword = '';
  /** 当前详情标签页 */
  let _activeTab = 'info';

  /**
   * 初始化客户模块
   * @param {Object} query - URL查询参数
   */
  function init(query = {}) {
    if (query.id) {
      _activeCustomerId = query.id;
    }
  }

  /**
   * 渲染客户页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${Utils.i18n('customers')}</h1>
      </div>
      <div class="customers-layout" id="customersLayout">
        <div class="customers-list-panel">
          <div class="customers-list-header">
            <h3>${Utils.i18n('customers')}</h3>
            <div class="customers-search">
              <span class="search-icon">${Utils.icon('search', 16)}</span>
              <input type="text" id="customerSearchInput" placeholder="${Utils.getLang() === 'zh' ? '搜索客户...' : 'Search customers...'}" value="${_searchKeyword}" />
            </div>
          </div>
          <div class="customers-list" id="customersList">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="customer-detail-panel" id="customerDetailPanel">
          <div class="customer-detail-empty">
            ${Utils.icon('customers', 64)}
            <p>${Utils.getLang() === 'zh' ? '选择一个客户查看详情' : 'Select a customer to view details'}</p>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindEvents();

    // 加载客户列表
    await loadCustomers();

    // 如果有选中的客户，打开详情
    if (_activeCustomerId) {
      openCustomer(_activeCustomerId);
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    const searchInput = Utils.$('#customerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        _searchKeyword = e.target.value.trim();
        loadCustomers();
      }, 300));
    }
  }

  /**
   * 加载客户列表
   */
  async function loadCustomers() {
    const listEl = Utils.$('#customersList');
    if (!listEl) return;

    try {
      _customers = await API.getCustomers({ search: _searchKeyword });

      if (!_customers.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            ${Utils.icon('customers', 48)}
            <p>${Utils.i18n('no_customers')}</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = _customers.map(customer => renderCustomerItem(customer)).join('');

      // 绑定点击事件
      Utils.$$('.customer-item', listEl).forEach(item => {
        item.addEventListener('click', () => {
          openCustomer(item.dataset.id);
        });
      });
    } catch (err) {
      console.error('加载客户列表失败:', err);
    }
  }

  /**
   * 渲染客户列表项
   * @param {Object} customer - 客户数据
   * @returns {string} HTML字符串
   */
  function renderCustomerItem(customer) {
    return `
      <div class="customer-item ${customer.id === _activeCustomerId ? 'active' : ''}" data-id="${customer.id}">
        <div class="avatar" style="background: ${Utils.avatarColor(customer.name)}">
          ${Utils.getInitials(customer.name)}
        </div>
        <div class="customer-info">
          <div class="customer-name">${Utils.escapeHtml(customer.name)}</div>
          <div class="customer-email">${Utils.escapeHtml(customer.email)}</div>
        </div>
        <div class="customer-meta">
          ${customer.tags && customer.tags.length ? `
            <span class="badge badge-primary">${customer.tags[0]}</span>
          ` : ''}
          <div class="customer-last-active">${Utils.formatTime(customer.lastActive)}</div>
        </div>
      </div>
    `;
  }

  /**
   * 打开客户详情
   * @param {string} customerId - 客户ID
   */
  async function openCustomer(customerId) {
    _activeCustomerId = customerId;
    _activeTab = 'info';

    // 更新列表激活状态
    Utils.$$('.customer-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === customerId);
    });

    const panel = Utils.$('#customerDetailPanel');
    if (!panel) return;

    try {
      const customer = await API.getCustomer(customerId);
      if (!customer) return;

      panel.innerHTML = `
        <div class="customer-detail-header">
          <div class="customer-detail-avatar" style="background: ${Utils.avatarColor(customer.name)}">
            ${Utils.getInitials(customer.name)}
          </div>
          <div>
            <div class="customer-detail-name">${Utils.escapeHtml(customer.name)}</div>
            <div class="customer-detail-email">${Utils.escapeHtml(customer.email)}</div>
            <div class="customer-detail-tags">
              ${(customer.tags || []).map(tag => `<span class="badge badge-primary">${Utils.escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="customer-detail-tabs" id="customerTabs">
          <button class="customer-tab active" data-tab="info">${Utils.i18n('basic_info')}</button>
          <button class="customer-tab" data-tab="conversations">${Utils.i18n('conversation_history')}</button>
          <button class="customer-tab" data-tab="tickets">${Utils.i18n('ticket_history')}</button>
        </div>
        <div class="customer-detail-content" id="customerDetailContent">
          ${renderBasicInfo(customer)}
        </div>
      `;

      // 绑定标签页事件
      Utils.$$('#customerTabs .customer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          Utils.$$('#customerTabs .customer-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          _activeTab = tab.dataset.tab;
          renderTabContent(customer);
        });
      });
    } catch (err) {
      console.error('加载客户详情失败:', err);
    }
  }

  /**
   * 渲染标签页内容
   * @param {Object} customer - 客户数据
   */
  function renderTabContent(customer) {
    const content = Utils.$('#customerDetailContent');
    if (!content) return;

    switch (_activeTab) {
      case 'info':
        content.innerHTML = renderBasicInfo(customer);
        break;
      case 'conversations':
        content.innerHTML = renderConversationHistory(customer);
        break;
      case 'tickets':
        content.innerHTML = renderTicketHistory(customer);
        break;
    }
  }

  /**
   * 渲染基本信息
   * @param {Object} customer - 客户数据
   * @returns {string} HTML字符串
   */
  function renderBasicInfo(customer) {
    return `
      <div class="customer-basic-info">
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('name')}</span>
          <span class="info-field-value">${Utils.escapeHtml(customer.name)}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('email')}</span>
          <span class="info-field-value">${Utils.escapeHtml(customer.email)}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('phone')}</span>
          <span class="info-field-value">${customer.phone || '-'}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('company')}</span>
          <span class="info-field-value">${customer.company || '-'}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('last_active')}</span>
          <span class="info-field-value">${Utils.formatTime(customer.lastActive)}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('total_conversations')}</span>
          <span class="info-field-value">${customer.conversations || 0}</span>
        </div>
        <div class="info-field">
          <span class="info-field-label">${Utils.i18n('total_tickets')}</span>
          <span class="info-field-value">${customer.tickets || 0}</span>
        </div>
      </div>
    `;
  }

  /**
   * 渲染对话历史
   * @param {Object} customer - 客户数据
   * @returns {string} HTML字符串
   */
  function renderConversationHistory(customer) {
    return `
      <div class="customer-conversations-list">
        <div class="empty-state">
          <p>${Utils.getLang() === 'zh' ? '暂无对话记录' : 'No conversation history'}</p>
        </div>
      </div>
    `;
  }

  /**
   * 渲染工单历史
   * @param {Object} customer - 客户数据
   * @returns {string} HTML字符串
   */
  function renderTicketHistory(customer) {
    return `
      <div class="customer-tickets-list">
        <div class="empty-state">
          <p>${Utils.getLang() === 'zh' ? '暂无工单记录' : 'No ticket history'}</p>
        </div>
      </div>
    `;
  }

  return {
    init,
    render,
  };
})();
