/**
 * ChatPilot 工单管理模块
 * 工单列表、过滤、详情、回复
 */

const Tickets = (() => {
  'use strict';

  /** 工单列表 */
  let _tickets = [];
  /** 当前选中工单ID */
  let _activeTicketId = null;
  /** 当前过滤状态 */
  let _currentFilter = 'all';

  /**
   * 初始化工单模块
   * @param {Object} query - URL查询参数
   */
  function init(query = {}) {
    if (query.id) {
      _activeTicketId = query.id;
    }
  }

  /**
   * 渲染工单页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h1 class="page-title">${Utils.i18n('tickets')}</h1>
          </div>
          <button class="btn btn-primary" id="newTicketBtn">
            ${Utils.icon('plus', 16)} ${Utils.i18n('new_ticket')}
          </button>
        </div>
      </div>
      <div class="tickets-layout" id="ticketsLayout">
        <div class="tickets-list-panel">
          <div class="tickets-list-header">
            <h3>${Utils.i18n('tickets')}</h3>
            <div class="ticket-filters" id="ticketFilters">
              <button class="ticket-filter-btn active" data-filter="all">${Utils.i18n('all')}</button>
              <button class="ticket-filter-btn" data-filter="open">${Utils.i18n('open')}</button>
              <button class="ticket-filter-btn" data-filter="pending">${Utils.i18n('pending')}</button>
              <button class="ticket-filter-btn" data-filter="resolved">${Utils.i18n('resolved')}</button>
              <button class="ticket-filter-btn" data-filter="closed">${Utils.i18n('closed')}</button>
            </div>
          </div>
          <div class="tickets-list" id="ticketsList">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="ticket-detail-panel" id="ticketDetailPanel">
          <div class="ticket-detail-empty">
            ${Utils.icon('ticket', 64)}
            <p>${Utils.getLang() === 'zh' ? '选择一个工单查看详情' : 'Select a ticket to view details'}</p>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindEvents();

    // 加载工单列表
    await loadTickets();

    // 如果有选中的工单，打开它
    if (_activeTicketId) {
      openTicket(_activeTicketId);
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 过滤按钮
    Utils.$$('#ticketFilters .ticket-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#ticketFilters .ticket-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentFilter = btn.dataset.filter;
        loadTickets();
      });
    });

    // 新建工单按钮
    Utils.$('#newTicketBtn')?.addEventListener('click', showCreateModal);
  }

  /**
   * 加载工单列表
   */
  async function loadTickets() {
    const listEl = Utils.$('#ticketsList');
    if (!listEl) return;

    try {
      _tickets = await API.getTickets({ status: _currentFilter });

      if (!_tickets.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            ${Utils.icon('ticket', 48)}
            <p>${Utils.i18n('no_tickets')}</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = _tickets.map(ticket => renderTicketItem(ticket)).join('');

      // 绑定点击事件
      Utils.$$('.ticket-item', listEl).forEach(item => {
        item.addEventListener('click', () => {
          openTicket(item.dataset.id);
        });
      });
    } catch (err) {
      console.error('加载工单列表失败:', err);
    }
  }

  /**
   * 渲染工单列表项
   * @param {Object} ticket - 工单数据
   * @returns {string} HTML字符串
   */
  function renderTicketItem(ticket) {
    const statusBadge = {
      open: 'badge-primary',
      pending: 'badge-warning',
      resolved: 'badge-success',
      closed: 'badge-gray',
    };

    return `
      <div class="ticket-item ${ticket.id === _activeTicketId ? 'active' : ''}" data-id="${ticket.id}">
        <div class="ticket-item-header">
          <span class="ticket-id">${ticket.id}</span>
          <span class="badge ${statusBadge[ticket.status] || 'badge-gray'}">${Utils.i18n(ticket.status)}</span>
        </div>
        <div class="ticket-title">${Utils.escapeHtml(ticket.title)}</div>
        <div class="ticket-item-meta">
          <span class="ticket-priority">
            <span class="ticket-priority-dot ${ticket.priority}"></span>
            ${Utils.i18n(ticket.priority)}
          </span>
          <span>${Utils.escapeHtml(ticket.customer)}</span>
          <span>${Utils.formatTime(ticket.createdAt)}</span>
        </div>
      </div>
    `;
  }

  /**
   * 打开工单详情
   * @param {string} ticketId - 工单ID
   */
  async function openTicket(ticketId) {
    _activeTicketId = ticketId;

    // 更新列表激活状态
    Utils.$$('.ticket-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === ticketId);
    });

    const panel = Utils.$('#ticketDetailPanel');
    if (!panel) return;

    try {
      const ticket = await API.getTicket(ticketId);
      if (!ticket) return;

      panel.innerHTML = `
        <div class="ticket-detail-header">
          <div>
            <div class="ticket-detail-title">
              <span style="color:var(--primary);margin-right:8px;">${ticket.id}</span>
              ${Utils.escapeHtml(ticket.title)}
            </div>
            <div class="ticket-detail-meta">
              <span class="badge badge-${ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : ticket.priority === 'medium' ? 'info' : 'gray'}">
                ${Utils.i18n(ticket.priority)}
              </span>
              <span class="badge badge-${ticket.status === 'open' ? 'primary' : ticket.status === 'pending' ? 'warning' : ticket.status === 'resolved' ? 'success' : 'gray'}">
                ${Utils.i18n(ticket.status)}
              </span>
              <span>${Utils.formatTime(ticket.createdAt)}</span>
            </div>
          </div>
          <div class="ticket-detail-actions">
            ${ticket.status !== 'closed' ? `
              <button class="btn btn-sm btn-outline" onclick="Tickets.changeStatus('${ticket.id}', '${ticket.status === 'resolved' ? 'open' : 'resolved'}')">
                ${ticket.status === 'resolved' ? Utils.i18n('reopen_ticket') : Utils.getLang() === 'zh' ? '标记解决' : 'Mark Resolved'}
              </button>
              <button class="btn btn-sm btn-outline btn-danger" onclick="Tickets.changeStatus('${ticket.id}', 'closed')">
                ${Utils.i18n('close_ticket')}
              </button>
            ` : `
              <button class="btn btn-sm btn-outline" onclick="Tickets.changeStatus('${ticket.id}', 'open')">
                ${Utils.i18n('reopen_ticket')}
              </button>
            `}
          </div>
        </div>
        <div class="ticket-info-grid">
          <div class="ticket-info-item">
            <span class="ticket-info-label">${Utils.i18n('customer')}</span>
            <span class="ticket-info-value">${Utils.escapeHtml(ticket.customer)}</span>
          </div>
          <div class="ticket-info-item">
            <span class="ticket-info-label">${Utils.i18n('assignee')}</span>
            <span class="ticket-info-value">${ticket.assignee || (Utils.getLang() === 'zh' ? '未分配' : 'Unassigned')}</span>
          </div>
          <div class="ticket-info-item">
            <span class="ticket-info-label">${Utils.i18n('created_at')}</span>
            <span class="ticket-info-value">${Utils.formatTime(ticket.createdAt)}</span>
          </div>
        </div>
        <div class="ticket-description">
          <h4>${Utils.getLang() === 'zh' ? '问题描述' : 'Description'}</h4>
          <p>${Utils.escapeHtml(ticket.description)}</p>
        </div>
        <div class="ticket-replies">
          <h4 style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-3);">${Utils.getLang() === 'zh' ? '回复记录' : 'Replies'}</h4>
          <div class="ticket-reply">
            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(ticket.customer)}">
              ${Utils.getInitials(ticket.customer)}
            </div>
            <div class="ticket-reply-content">
              <div class="ticket-reply-author">${Utils.escapeHtml(ticket.customer)}</div>
              <div class="ticket-reply-text">${Utils.escapeHtml(ticket.description)}</div>
              <div class="ticket-reply-time">${Utils.formatTime(ticket.createdAt)}</div>
            </div>
          </div>
        </div>
        <div class="ticket-reply-input">
          <textarea id="ticketReplyInput" placeholder="${Utils.i18n('reply')}..." rows="2"></textarea>
          <button class="btn btn-primary" id="ticketReplyBtn">${Utils.i18n('send')}</button>
        </div>
      `;

      // 绑定回复事件
      Utils.$('#ticketReplyBtn')?.addEventListener('click', async () => {
        const input = Utils.$('#ticketReplyInput');
        if (!input || !input.value.trim()) return;

        const content = input.value.trim();
        input.value = '';

        // 添加回复到界面
        const repliesContainer = Utils.$('.ticket-replies');
        if (repliesContainer) {
          const replyHtml = `
            <div class="ticket-reply fade-in">
              <div class="avatar avatar-sm" style="background:#4F46E5">${Utils.getInitials('Me')}</div>
              <div class="ticket-reply-content">
                <div class="ticket-reply-author">${Utils.getLang() === 'zh' ? '我' : 'Me'}</div>
                <div class="ticket-reply-text">${Utils.escapeHtml(content)}</div>
                <div class="ticket-reply-time">${Utils.formatTime(new Date())}</div>
              </div>
            </div>
          `;
          repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
          repliesContainer.scrollTop = repliesContainer.scrollHeight;
        }

        Utils.showToast(Utils.i18n('success'), 'success');
      });
    } catch (err) {
      console.error('加载工单详情失败:', err);
    }
  }

  /**
   * 修改工单状态
   * @param {string} ticketId - 工单ID
   * @param {string} status - 新状态
   */
  async function changeStatus(ticketId, status) {
    try {
      await API.updateTicket(ticketId, { status });
      Utils.showToast(Utils.i18n('success'), 'success');
      await loadTickets();
      if (_activeTicketId === ticketId) {
        openTicket(ticketId);
      }
    } catch (err) {
      console.error('修改工单状态失败:', err);
      Utils.showToast(Utils.i18n('error'), 'error');
    }
  }

  /**
   * 显示创建工单模态框
   */
  function showCreateModal() {
    // 移除已有模态框
    Utils.$('.modal-overlay')?.remove();

    const overlay = Utils.createElement('div', { className: 'modal-overlay active' });
    const modal = Utils.createElement('div', { className: 'modal' });
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${Utils.i18n('new_ticket')}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">${Utils.getLang() === 'zh' ? '工单标题' : 'Title'}</label>
          <input type="text" class="form-input" id="newTicketTitle" placeholder="${Utils.getLang() === 'zh' ? '请输入工单标题' : 'Enter ticket title'}" />
        </div>
        <div class="form-group">
          <label class="form-label">${Utils.getLang() === 'zh' ? '问题描述' : 'Description'}</label>
          <textarea class="form-input" id="newTicketDesc" placeholder="${Utils.getLang() === 'zh' ? '请详细描述问题' : 'Describe the issue'}" rows="4"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="form-group">
            <label class="form-label">${Utils.i18n('priority')}</label>
            <select class="form-select" id="newTicketPriority">
              <option value="low">${Utils.i18n('low')}</option>
              <option value="medium" selected>${Utils.i18n('medium')}</option>
              <option value="high">${Utils.i18n('high')}</option>
              <option value="urgent">${Utils.i18n('urgent')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${Utils.i18n('customer')}</label>
            <input type="text" class="form-input" id="newTicketCustomer" placeholder="${Utils.getLang() === 'zh' ? '客户名称' : 'Customer name'}" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">${Utils.i18n('cancel')}</button>
        <button class="btn btn-primary" id="createTicketSubmit">${Utils.i18n('create')}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 提交创建
    Utils.$('#createTicketSubmit')?.addEventListener('click', async () => {
      const title = Utils.$('#newTicketTitle')?.value.trim();
      const desc = Utils.$('#newTicketDesc')?.value.trim();
      const priority = Utils.$('#newTicketPriority')?.value;
      const customer = Utils.$('#newTicketCustomer')?.value.trim();

      if (!title) {
        Utils.showToast(Utils.getLang() === 'zh' ? '请输入工单标题' : 'Please enter a title', 'warning');
        return;
      }

      try {
        await API.createTicket({
          title,
          description: desc,
          priority,
          customer: customer || Utils.getLang() === 'zh' ? '未知客户' : 'Unknown',
        });
        overlay.remove();
        Utils.showToast(Utils.i18n('success'), 'success');
        await loadTickets();
      } catch (err) {
        console.error('创建工单失败:', err);
        Utils.showToast(Utils.i18n('error'), 'error');
      }
    });
  }

  return {
    init,
    render,
    openTicket,
    changeStatus,
  };
})();
