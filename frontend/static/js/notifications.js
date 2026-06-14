/**
 * ChatPilot 通知管理模块
 * 浏览器通知、应用内通知
 */

const Notifications = (() => {
  'use strict';

  /** 通知列表 */
  let _notifications = [];
  /** 是否已请求通知权限 */
  let _permissionGranted = false;
  /** 通知面板是否显示 */
  let _panelVisible = false;

  /**
   * 初始化通知模块
   */
  function init() {
    // 请求通知权限
    requestPermission();

    // 监听WebSocket消息事件
    WebSocketClient.on('connected', () => {
      addNotification({
        type: 'success',
        title: Utils.getLang() === 'zh' ? '已连接' : 'Connected',
        message: Utils.getLang() === 'zh' ? '实时通信已建立' : 'Real-time connection established',
      });
    });

    WebSocketClient.on('disconnected', () => {
      addNotification({
        type: 'warning',
        title: Utils.getLang() === 'zh' ? '连接断开' : 'Disconnected',
        message: Utils.getLang() === 'zh' ? '正在尝试重新连接...' : 'Attempting to reconnect...',
      });
    });
  }

  /**
   * 请求浏览器通知权限
   */
  function requestPermission() {
    if (!('Notification' in window)) {
      console.log('[Notifications] 浏览器不支持通知API');
      return;
    }

    if (Notification.permission === 'granted') {
      _permissionGranted = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        _permissionGranted = permission === 'granted';
      });
    }
  }

  /**
   * 发送浏览器通知
   * @param {Object} options - 通知选项
   * @param {string} options.title - 通知标题
   * @param {string} options.body - 通知内容
   * @param {string} options.icon - 图标URL
   * @param {Object} options.data - 附加数据
   */
  function notify(options) {
    // 检查是否需要静默（页面可见时不发送浏览器通知）
    if (document.hasFocus()) {
      // 页面可见时只显示应用内通知
      addNotification({
        type: 'info',
        title: options.title,
        message: options.body,
      });
      return;
    }

    // 页面不可见时发送浏览器通知
    if (_permissionGranted && 'Notification' in window) {
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/static/img/logo.svg',
          badge: '/static/img/logo.svg',
          data: options.data || {},
          tag: options.tag || 'chatpilot-notification',
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          // 如果有对话ID，跳转到对话页面
          if (options.data?.conversationId) {
            Router.navigate('/conversations', { id: options.data.conversationId });
          }
          notification.close();
        };

        // 5秒后自动关闭
        setTimeout(() => notification.close(), 5000);
      } catch (err) {
        console.error('[Notifications] 发送浏览器通知失败:', err);
      }
    }

    // 同时添加应用内通知
    addNotification({
      type: 'info',
      title: options.title,
      message: options.body,
    });
  }

  /**
   * 添加应用内通知
   * @param {Object} notification - 通知数据
   */
  function addNotification(notification) {
    const item = {
      id: Utils.generateId(),
      ...notification,
      time: new Date().toISOString(),
      read: false,
    };

    _notifications.unshift(item);

    // 限制通知数量
    if (_notifications.length > 50) {
      _notifications = _notifications.slice(0, 50);
    }

    updateBadge();
  }

  /**
   * 更新通知角标
   */
  function updateBadge() {
    const unreadCount = _notifications.filter(n => !n.read).length;
    const badge = Utils.$('#notifBadge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  /**
   * 显示通知面板
   */
  function showPanel() {
    if (_panelVisible) {
      hidePanel();
      return;
    }

    _panelVisible = true;

    // 移除已有面板
    Utils.$('.notification-panel')?.remove();

    const panel = Utils.createElement('div', {
      className: 'notification-panel',
      style: {
        position: 'fixed',
        top: 'calc(var(--header-height) + 8px)',
        right: '16px',
        width: '360px',
        maxHeight: '480px',
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--gray-200)',
        zIndex: '200',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
      },
    });

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) var(--space-5);border-bottom:1px solid var(--gray-200);">
        <h3 style="font-size:var(--text-base);font-weight:600;">${Utils.i18n('notifications')}</h3>
        <div style="display:flex;gap:var(--space-2);">
          <button class="btn btn-ghost btn-sm" id="markAllReadBtn">${Utils.getLang() === 'zh' ? '全部已读' : 'Mark all read'}</button>
          <button class="btn btn-ghost btn-sm" id="clearNotifsBtn">${Utils.getLang() === 'zh' ? '清空' : 'Clear'}</button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;" id="notifList">
        ${_notifications.length ? _notifications.map(n => renderNotificationItem(n)).join('') : `
          <div class="empty-state" style="padding:var(--space-8);">
            <p style="font-size:var(--text-sm);color:var(--gray-400);">${Utils.getLang() === 'zh' ? '暂无通知' : 'No notifications'}</p>
          </div>
        `}
      </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    Utils.$('#markAllReadBtn')?.addEventListener('click', () => {
      _notifications.forEach(n => n.read = true);
      updateBadge();
      showPanel(); // 刷新面板
    });

    Utils.$('#clearNotifsBtn')?.addEventListener('click', () => {
      _notifications = [];
      updateBadge();
      hidePanel();
    });

    // 点击外部关闭
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!panel.contains(e.target) && !e.target.closest('#notificationBtn')) {
          hidePanel();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);
  }

  /**
   * 隐藏通知面板
   */
  function hidePanel() {
    _panelVisible = false;
    const panel = Utils.$('.notification-panel');
    if (panel) {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-8px)';
      panel.style.transition = 'all 0.2s ease';
      setTimeout(() => panel.remove(), 200);
    }
  }

  /**
   * 渲染通知项
   * @param {Object} notification - 通知数据
   * @returns {string} HTML字符串
   */
  function renderNotificationItem(notification) {
    const typeColors = {
      info: 'var(--info)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--danger)',
    };

    return `
      <div style="display:flex;gap:var(--space-3);padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--gray-100);background:${notification.read ? 'transparent' : 'var(--gray-50)'};cursor:pointer;transition:background 0.15s;" 
           onmouseenter="this.style.background='var(--gray-100)'" 
           onmouseleave="this.style.background='${notification.read ? 'transparent' : 'var(--gray-50)'}'">
        <div style="width:8px;height:8px;border-radius:50%;background:${typeColors[notification.type] || 'var(--gray-400)'};margin-top:6px;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:var(--text-sm);font-weight:500;color:var(--gray-800);">${Utils.escapeHtml(notification.title)}</div>
          <div style="font-size:var(--text-xs);color:var(--gray-500);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(notification.message)}</div>
          <div style="font-size:var(--text-xs);color:var(--gray-400);margin-top:4px;">${Utils.formatTime(notification.time)}</div>
        </div>
      </div>
    `;
  }

  /**
   * 获取通知数量
   * @returns {number}
   */
  function getUnreadCount() {
    return _notifications.filter(n => !n.read).length;
  }

  return {
    init,
    requestPermission,
    notify,
    addNotification,
    showPanel,
    hidePanel,
    getUnreadCount,
  };
})();
