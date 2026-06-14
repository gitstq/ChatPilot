/**
 * ChatPilot WebSocket 客户端模块
 * 实时消息通信
 */

const WebSocketClient = (() => {
  'use strict';

  /** WebSocket 实例 */
  let _ws = null;
  /** 连接状态 */
  let _connected = false;
  /** 重连次数 */
  let _reconnectCount = 0;
  /** 最大重连次数 */
  const MAX_RECONNECT = 5;
  /** 重连延迟基数(ms) */
  const RECONNECT_BASE = 2000;
  /** 重连定时器 */
  let _reconnectTimer = null;
  /** 消息回调 */
  const _handlers = new Map();

  /** WebSocket 服务器地址 */
  let _wsUrl = '';

  /**
   * 初始化WebSocket连接
   */
  function init() {
    // 从设置中获取WebSocket地址，或使用默认值
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    _wsUrl = `${protocol}//${window.location.host}/ws`;

    // 如果没有后端，不实际连接（演示模式）
    console.log('[WebSocket] 演示模式，未建立实际连接');
    _connected = false;

    // 注册内置事件处理
    on('message', handleMessage);
    on('typing', handleTyping);
    on('conversation_update', handleConversationUpdate);
  }

  /**
   * 建立WebSocket连接
   */
  function connect() {
    if (_ws && (_ws.readyState === WebSocket.CONNECTING || _ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      _ws = new WebSocket(_wsUrl);

      _ws.onopen = () => {
        console.log('[WebSocket] 连接成功');
        _connected = true;
        _reconnectCount = 0;
        emit('connected');
      };

      _ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type && _handlers.has(data.type)) {
            _handlers.get(data.type).forEach(handler => handler(data.payload));
          }
        } catch (err) {
          console.error('[WebSocket] 消息解析失败:', err);
        }
      };

      _ws.onclose = (event) => {
        console.log('[WebSocket] 连接关闭:', event.code, event.reason);
        _connected = false;
        emit('disconnected');

        // 自动重连
        if (_reconnectCount < MAX_RECONNECT) {
          const delay = RECONNECT_BASE * Math.pow(2, _reconnectCount);
          _reconnectCount++;
          console.log(`[WebSocket] ${delay / 1000}秒后尝试第${_reconnectCount}次重连...`);
          _reconnectTimer = setTimeout(connect, delay);
        }
      };

      _ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
      };
    } catch (err) {
      console.error('[WebSocket] 连接失败:', err);
    }
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
    }
    if (_ws) {
      _ws.close();
      _ws = null;
    }
    _connected = false;
  }

  /**
   * 发送消息
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息数据
   */
  function send(type, payload = {}) {
    if (!_connected || !_ws) {
      console.warn('[WebSocket] 未连接，无法发送消息');
      return false;
    }

    try {
      const message = JSON.stringify({ type, payload });
      _ws.send(message);
      return true;
    } catch (err) {
      console.error('[WebSocket] 发送失败:', err);
      return false;
    }
  }

  /**
   * 注册事件处理
   * @param {string} type - 事件类型
   * @param {Function} handler - 处理函数
   */
  function on(type, handler) {
    if (!_handlers.has(type)) {
      _handlers.set(type, new Set());
    }
    _handlers.get(type).add(handler);
  }

  /**
   * 移除事件处理
   * @param {string} type - 事件类型
   * @param {Function} handler - 处理函数
   */
  function off(type, handler) {
    if (_handlers.has(type)) {
      _handlers.get(type).delete(handler);
    }
  }

  /**
   * 触发事件
   * @param {string} type - 事件类型
   * @param {Object} data - 事件数据
   */
  function emit(type, data = {}) {
    if (_handlers.has(type)) {
      _handlers.get(type).forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[WebSocket] 事件处理错误 (${type}):`, err);
        }
      });
    }
  }

  /**
   * 获取连接状态
   * @returns {boolean}
   */
  function isConnected() {
    return _connected;
  }

  // ==================== 内置事件处理 ====================

  /**
   * 处理新消息
   * @param {Object} data - 消息数据
   */
  function handleMessage(data) {
    // 如果当前正在查看该对话，直接追加消息
    if (data.conversationId && Router.getCurrentPath() === '/conversations') {
      Chat.appendMessage({
        id: data.id,
        type: 'incoming',
        sender: data.senderName || Utils.getLang() === 'zh' ? '客户' : 'Customer',
        content: data.content,
        time: data.time || new Date().toISOString(),
      });
    }

    // 发送浏览器通知
    Notifications.notify({
      title: data.senderName || Utils.i18n('conversations'),
      body: data.content,
      icon: '/static/img/logo.svg',
    });
  }

  /**
   * 处理正在输入事件
   * @param {Object} data - 事件数据
   */
  function handleTyping(data) {
    if (data.conversationId && Router.getCurrentPath() === '/conversations') {
      Chat.showTypingIndicator();
      // 3秒后自动隐藏
      setTimeout(() => Chat.hideTypingIndicator(), 3000);
    }
  }

  /**
   * 处理对话更新事件
   * @param {Object} data - 事件数据
   */
  function handleConversationUpdate(data) {
    // 可以在这里更新对话列表的未读数等
    console.log('[WebSocket] 对话更新:', data);
  }

  // ==================== 导出 ====================

  return {
    init,
    connect,
    disconnect,
    send,
    on,
    off,
    emit,
    isConnected,
  };
})();
