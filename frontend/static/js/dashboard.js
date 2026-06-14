/**
 * ChatPilot 仪表盘模块
 * 统计数据展示、趋势图、最近对话
 */

const Dashboard = (() => {
  'use strict';

  /** 统计数据 */
  let _stats = null;

  /**
   * 渲染仪表盘页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${Utils.i18n('dashboard')}</h1>
        <p class="page-subtitle">${Utils.getLang() === 'zh' ? '工作概览与数据统计' : 'Overview and Statistics'}</p>
      </div>
      <div id="statsGrid" class="stats-grid">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
      <div class="dashboard-grid">
        <div class="card full-width">
          <div class="card-header">
            <h3 class="card-title">${Utils.i18n('conversation_trend')}</h3>
            <div class="trend-chart-legend">
              <span class="legend-item">
                <span class="legend-dot primary"></span>
                ${Utils.getLang() === 'zh' ? '对话数' : 'Conversations'}
              </span>
              <span class="legend-item">
                <span class="legend-dot success"></span>
                ${Utils.getLang() === 'zh' ? '已解决' : 'Resolved'}
              </span>
            </div>
          </div>
          <div class="trend-chart-container">
            <canvas id="trendChart" class="trend-chart-canvas"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${Utils.i18n('recent_conversations')}</h3>
            <a href="#/conversations" class="btn btn-ghost btn-sm">${Utils.i18n('view_all')}</a>
          </div>
          <div class="card-body" id="recentConversations">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${Utils.getLang() === 'zh' ? '快速操作' : 'Quick Actions'}</h3>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              <button class="quick-action-btn" onclick="Router.navigate('/conversations')">
                <span class="quick-action-icon">${Utils.icon('chat', 20)}</span>
                <span class="quick-action-label">${Utils.i18n('new_conversation')}</span>
              </button>
              <button class="quick-action-btn" onclick="Router.navigate('/tickets')">
                <span class="quick-action-icon">${Utils.icon('ticket', 20)}</span>
                <span class="quick-action-label">${Utils.i18n('new_ticket')}</span>
              </button>
              <button class="quick-action-btn" onclick="Router.navigate('/knowledge')">
                <span class="quick-action-icon">${Utils.icon('knowledge', 20)}</span>
                <span class="quick-action-label">${Utils.i18n('add_faq')}</span>
              </button>
              <button class="quick-action-btn" onclick="Router.navigate('/settings')">
                <span class="quick-action-icon">${Utils.icon('settings', 20)}</span>
                <span class="quick-action-label">${Utils.i18n('settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    await loadStats();
  }

  /**
   * 加载统计数据
   */
  async function loadStats() {
    try {
      _stats = await API.getDashboardStats();
      renderStats(_stats);
      renderTrendChart(_stats.trendData);
      renderRecentConversations();
    } catch (err) {
      console.error('加载统计数据失败:', err);
      Utils.showToast(Utils.i18n('error'), 'error');
    }
  }

  /**
   * 渲染统计卡片
   * @param {Object} stats - 统计数据
   */
  function renderStats(stats) {
    const grid = Utils.$('#statsGrid');
    if (!grid) return;

    const cards = [
      {
        label: Utils.i18n('today_conversations'),
        value: stats.todayConversations,
        icon: 'chat',
        color: 'primary',
        change: '+12%',
        up: true,
      },
      {
        label: Utils.i18n('unread_messages'),
        value: stats.unreadMessages,
        icon: 'bell',
        color: 'danger',
        change: '-5%',
        up: false,
      },
      {
        label: Utils.i18n('avg_response_time'),
        value: stats.avgResponseTime,
        icon: 'zap',
        color: 'warning',
        change: '-18%',
        up: false,
      },
      {
        label: Utils.i18n('satisfaction'),
        value: stats.satisfaction,
        icon: 'star',
        color: 'success',
        change: '+2%',
        up: true,
      },
    ];

    grid.innerHTML = cards.map(card => `
      <div class="stat-card">
        <div class="stat-icon ${card.color}">
          ${Utils.icon(card.icon, 20)}
        </div>
        <div class="stat-value">${card.value}</div>
        <div class="stat-label">${card.label}</div>
        <div class="stat-change ${card.up ? 'up' : 'down'}">
          ${card.up ? '&#9650;' : '&#9660;'} ${card.change}
          <span>${Utils.getLang() === 'zh' ? '较昨日' : 'vs yesterday'}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染趋势图（Canvas）
   * @param {Array} data - 趋势数据
   */
  function renderTrendChart(data) {
    const canvas = Utils.$('#trendChart');
    if (!canvas || !data || !data.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // 计算最大值
    const allValues = data.flatMap(d => [d.conversations, d.resolved]);
    const maxVal = Math.max(...allValues) * 1.15;

    // 绘制网格线
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y轴标签
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    // X轴标签
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.date, x, height - 10);
    });

    // 绘制曲线函数
    function drawLine(values, color, fillColor) {
      if (values.length < 2) return;

      const points = values.map((v, i) => ({
        x: padding.left + (chartW / (values.length - 1)) * i,
        y: padding.top + chartH - (v / maxVal) * chartH,
      }));

      // 填充区域
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // 线条
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // 数据点
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 绘制对话数曲线
    drawLine(data.map(d => d.conversations), '#4F46E5', 'rgba(79, 70, 229, 0.08)');

    // 绘制已解决曲线
    drawLine(data.map(d => d.resolved), '#10B981', 'rgba(16, 185, 129, 0.08)');
  }

  /**
   * 渲染最近对话列表
   */
  async function renderRecentConversations() {
    const container = Utils.$('#recentConversations');
    if (!container) return;

    try {
      const conversations = await API.getConversations();
      if (!conversations.length) {
        container.innerHTML = `
          <div class="empty-state">
            <p>${Utils.i18n('no_conversations')}</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `<div class="recent-conversations">
        ${conversations.slice(0, 5).map(conv => `
          <div class="recent-conversation-item" onclick="Router.navigate('/conversations', {id: '${conv.id}'})">
            <div class="avatar" style="background: ${Utils.avatarColor(conv.customer.name)}">
              ${Utils.getInitials(conv.customer.name)}
            </div>
            <div class="recent-conv-info">
              <div class="recent-conv-name">${Utils.escapeHtml(conv.customer.name)}</div>
              <div class="recent-conv-message">${Utils.escapeHtml(conv.lastMessage)}</div>
            </div>
            <div class="recent-conv-meta">
              <div class="recent-conv-time">${Utils.formatTime(conv.lastMessageTime)}</div>
              ${conv.unread > 0 ? `<span class="badge badge-primary">${conv.unread}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
    } catch (err) {
      console.error('加载最近对话失败:', err);
    }
  }

  return { render };
})();
