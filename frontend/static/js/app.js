/**
 * ChatPilot 主应用模块
 * 初始化应用、管理全局状态、协调各模块
 */

const App = (() => {
  'use strict';

  /** 应用状态 */
  const _state = {
    currentView: 'dashboard',
    sidebarCollapsed: Utils.storage.get('sidebar_collapsed', false),
    user: {
      name: '管理员',
      email: 'admin@chatpilot.com',
      avatar: null,
    },
    notifications: [],
    unreadCount: 0,
  };

  /**
   * 初始化应用
   */
  async function init() {
    console.log('[ChatPilot] 应用初始化...');

    // 渲染顶部导航栏
    renderHeader();

    // 渲染侧边栏
    renderSidebar();

    // 注册路由
    registerRoutes();

    // 初始化路由
    Router.init();

    // 初始化快捷键
    initShortcuts();

    // 初始化通知
    Notifications.init();

    // 初始化WebSocket
    WebSocketClient.init();

    // 应用侧边栏折叠状态
    if (_state.sidebarCollapsed) {
      document.querySelector('.sidebar')?.classList.add('collapsed');
    }

    console.log('[ChatPilot] 应用初始化完成');
  }

  // ==================== 顶部导航栏 ====================

  function renderHeader() {
    const header = Utils.$('.top-header');
    if (!header) return;

    header.innerHTML = `
      <div class="header-left">
        <button class="header-btn mobile-menu-btn" id="mobileMenuBtn" title="菜单">
          ${Utils.icon('menu', 20)}
        </button>
        <div class="header-logo">
          <img src="static/img/logo.svg" alt="ChatPilot">
          <span>ChatPilot</span>
        </div>
        <div class="header-search">
          <span class="search-icon">${Utils.icon('search', 16)}</span>
          <input type="text" id="globalSearch" placeholder="${Utils.i18n('search')}" />
          <span class="search-shortcut">/</span>
        </div>
      </div>
      <div class="header-right">
        <div class="lang-switch">
          <button class="lang-switch-btn ${Utils.getLang() === 'zh' ? 'active' : ''}" data-lang="zh">中</button>
          <button class="lang-switch-btn ${Utils.getLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        </div>
        <button class="header-btn" id="notificationBtn" title="${Utils.i18n('notifications')}">
          ${Utils.icon('bell', 20)}
          <span class="badge" id="notifBadge" style="display:none;">0</span>
        </button>
        <div class="dropdown">
          <div class="header-avatar" id="userAvatar" title="${_state.user.name}">
            ${Utils.getInitials(_state.user.name)}
          </div>
          <div class="dropdown-menu" id="userDropdown">
            <a class="dropdown-item" href="#/settings">
              ${Utils.icon('settings', 16)} ${Utils.i18n('settings')}
            </a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="#" id="logoutBtn">
              ${Utils.icon('close', 16)} 退出登录
            </a>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindHeaderEvents();
  }

  function bindHeaderEvents() {
    // 全局搜索
    const searchInput = Utils.$('#globalSearch');
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.width = '400px';
      });
      searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.width = '';
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          Router.navigate('/conversations', { search: searchInput.value.trim() });
          searchInput.value = '';
          searchInput.blur();
        }
      });
    }

    // 语言切换
    Utils.$$('.lang-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        Utils.setLang(lang);
        // 刷新页面以应用新语言
        renderHeader();
        renderSidebar();
        Router.navigate(Router.getCurrentPath());
      });
    });

    // 通知按钮
    Utils.$('#notificationBtn')?.addEventListener('click', () => {
      Notifications.showPanel();
    });

    // 用户下拉菜单
    Utils.$('#userAvatar')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Utils.$('#userDropdown')?.classList.toggle('active');
    });

    // 点击外部关闭下拉
    document.addEventListener('click', () => {
      Utils.$$('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
    });

    // 移动端菜单
    Utils.$('#mobileMenuBtn')?.addEventListener('click', () => {
      Utils.$('.sidebar')?.classList.toggle('mobile-open');
    });
  }

  // ==================== 侧边栏 ====================

  function renderSidebar() {
    const sidebar = Utils.$('.sidebar');
    if (!sidebar) return;

    const navItems = [
      { id: 'dashboard', path: '/dashboard', icon: 'dashboard', label: Utils.i18n('dashboard'), badge: null },
      { id: 'conversations', path: '/conversations', icon: 'chat', label: Utils.i18n('conversations'), badge: 5 },
      { id: 'tickets', path: '/tickets', icon: 'ticket', label: Utils.i18n('tickets'), badge: 3 },
      { id: 'customers', path: '/customers', icon: 'customers', label: Utils.i18n('customers'), badge: null },
      { id: 'knowledge', path: '/knowledge', icon: 'knowledge', label: Utils.i18n('knowledge'), badge: null },
    ];

    const settingsItem = { id: 'settings', path: '/settings', icon: 'settings', label: Utils.i18n('settings'), badge: null };

    sidebar.innerHTML = `
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">工作台</div>
          ${navItems.map(item => `
            <a class="nav-item" href="#${item.path}" data-nav="${item.id}">
              <span class="nav-icon">${Utils.icon(item.icon, 20)}</span>
              <span class="nav-label">${item.label}</span>
              ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </a>
          `).join('')}
        </div>
        <div class="nav-section">
          <div class="nav-section-title">系统</div>
          <a class="nav-item" href="#${settingsItem.path}" data-nav="${settingsItem.id}">
            <span class="nav-icon">${Utils.icon(settingsItem.icon, 20)}</span>
            <span class="nav-label">${settingsItem.label}</span>
          </a>
        </div>
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-toggle" id="sidebarToggle" title="折叠/展开">
          ${_state.sidebarCollapsed ? Utils.icon('sidebarExpand', 20) : Utils.icon('sidebarCollapse', 20)}
        </button>
      </div>
    `;

    // 绑定侧边栏事件
    Utils.$('#sidebarToggle')?.addEventListener('click', toggleSidebar);

    // 导航项点击（移动端关闭菜单）
    Utils.$$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        Utils.$('.sidebar')?.classList.remove('mobile-open');
      });
    });
  }

  /**
   * 切换侧边栏折叠状态
   */
  function toggleSidebar() {
    _state.sidebarCollapsed = !_state.sidebarCollapsed;
    Utils.storage.set('sidebar_collapsed', _state.sidebarCollapsed);
    const sidebar = Utils.$('.sidebar');
    sidebar?.classList.toggle('collapsed');
    // 更新折叠图标
    const toggleBtn = Utils.$('#sidebarToggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = _state.sidebarCollapsed
        ? Utils.icon('sidebarExpand', 20)
        : Utils.icon('sidebarCollapse', 20);
    }
  }

  /**
   * 更新侧边栏激活状态
   * @param {string} viewId - 视图ID
   */
  function setActiveNav(viewId) {
    Utils.$$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.nav === viewId);
    });
  }

  // ==================== 路由注册 ====================

  function registerRoutes() {
    Router.register('/', () => Router.navigate('/dashboard'));
    Router.register('/dashboard', () => showView('dashboard'));
    Router.register('/conversations', (ctx) => {
      showView('conversations');
      Conversations.init(ctx.query);
    });
    Router.register('/tickets', (ctx) => {
      showView('tickets');
      Tickets.init(ctx.query);
    });
    Router.register('/customers', (ctx) => {
      showView('customers');
      Customers.init(ctx.query);
    });
    Router.register('/knowledge', () => {
      showView('knowledge');
      Knowledge.init();
    });
    Router.register('/settings', (ctx) => {
      showView('settings');
      Settings.init(ctx.query);
    });

    // 路由后置钩子：更新导航状态
    Router.afterEach((to) => {
      const viewMap = {
        '/dashboard': 'dashboard',
        '/conversations': 'conversations',
        '/tickets': 'tickets',
        '/customers': 'customers',
        '/knowledge': 'knowledge',
        '/settings': 'settings',
      };
      setActiveNav(viewMap[to] || 'dashboard');
    });
  }

  /**
   * 显示指定视图
   * @param {string} viewName - 视图名称
   */
  function showView(viewName) {
    _state.currentView = viewName;
    const mainContent = Utils.$('.main-content .content-wrapper');
    if (!mainContent) return;

    // 隐藏所有视图
    Utils.$$('.page-view', mainContent).forEach(v => v.classList.remove('active'));

    // 显示目标视图
    let viewEl = Utils.$(`#view-${viewName}`, mainContent);
    if (!viewEl) {
      viewEl = Utils.createElement('div', {
        id: `view-${viewName}`,
        className: 'page-view active fade-in',
      });
      mainContent.appendChild(viewEl);
    } else {
      viewEl.classList.add('active', 'fade-in');
    }

    // 根据视图名称调用对应的渲染方法
    switch (viewName) {
      case 'dashboard':
        Dashboard.render(viewEl);
        break;
      case 'conversations':
        Conversations.render(viewEl);
        break;
      case 'tickets':
        Tickets.render(viewEl);
        break;
      case 'customers':
        Customers.render(viewEl);
        break;
      case 'knowledge':
        Knowledge.render(viewEl);
        break;
      case 'settings':
        Settings.render(viewEl);
        break;
    }
  }

  // ==================== 快捷键 ====================

  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: 聚焦搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Utils.$('#globalSearch')?.focus();
      }

      // / 键：聚焦搜索（不在输入框中时）
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        Utils.$('#globalSearch')?.focus();
      }

      // Escape: 关闭模态框/下拉
      if (e.key === 'Escape') {
        Utils.$$('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        Utils.$$('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
      }

      // Ctrl/Cmd + 1-6: 快速切换页面
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const pages = ['/dashboard', '/conversations', '/tickets', '/customers', '/knowledge', '/settings'];
        const idx = parseInt(e.key) - 1;
        if (pages[idx]) Router.navigate(pages[idx]);
      }
    });
  }

  /**
   * 检查当前是否聚焦在输入框中
   * @returns {boolean}
   */
  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  // ==================== 导出 ====================

  return {
    init,
    showView,
    setActiveNav,
    toggleSidebar,
    state: _state,
  };
})();

// ==================== 应用启动 ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
