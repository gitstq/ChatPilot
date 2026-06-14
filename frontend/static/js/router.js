/**
 * ChatPilot 简易SPA路由模块
 * 基于Hash路由实现
 */

const Router = (() => {
  'use strict';

  /** 路由表 */
  const _routes = new Map();

  /** 当前路由路径 */
  let _currentPath = '';

  /** 路由变化前的回调 */
  let _beforeEach = null;

  /** 路由变化后的回调 */
  let _afterEach = null;

  /**
   * 注册路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 路由处理函数
   */
  function register(path, handler) {
    _routes.set(path, handler);
  }

  /**
   * 注册前置守卫
   * @param {Function} callback - 守卫回调 (to, from) => boolean
   */
  function beforeEach(callback) {
    _beforeEach = callback;
  }

  /**
   * 注册后置钩子
   * @param {Function} callback - 钩子回调 (to, from)
   */
  function afterEach(callback) {
    _afterEach = callback;
  }

  /**
   * 解析当前Hash路径
   * @returns {string} 路由路径
   */
  function parsePath() {
    const hash = window.location.hash.slice(1) || '/';
    // 去除查询参数
    return hash.split('?')[0];
  }

  /**
   * 解析查询参数
   * @returns {Object} 参数对象
   */
  function parseQuery() {
    const hash = window.location.hash.slice(1) || '';
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
    return params;
  }

  /**
   * 导航到指定路由
   * @param {string} path - 目标路径
   * @param {Object} query - 查询参数
   */
  function navigate(path, query = {}) {
    let url = `#${path}`;
    const queryStr = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryStr) url += `?${queryStr}`;
    window.location.hash = url;
  }

  /**
   * 处理路由变化
   */
  async function handleRouteChange() {
    const path = parsePath();
    const query = parseQuery();

    if (path === _currentPath) return;

    const from = _currentPath;
    const to = path;

    // 执行前置守卫
    if (_beforeEach) {
      const allow = await _beforeEach(to, from);
      if (allow === false) return;
    }

    // 查找匹配的路由
    let handler = _routes.get(path);

    // 支持通配符路由
    if (!handler) {
      for (const [routePath, routeHandler] of _routes) {
        if (matchRoute(routePath, path)) {
          handler = routeHandler;
          break;
        }
      }
    }

    // 未匹配到路由，使用默认路由
    if (!handler) {
      handler = _routes.get('/') || (() => {});
      if (path !== '/') {
        navigate('/');
        return;
      }
    }

    // 执行路由处理
    try {
      await handler({ path, query, params: extractParams(path) });
    } catch (err) {
      console.error('路由处理错误:', err);
    }

    _currentPath = path;

    // 执行后置钩子
    if (_afterEach) {
      _afterEach(to, from);
    }
  }

  /**
   * 简单路由匹配（支持 :param 通配符）
   * @param {string} routePath - 路由模板
   * @param {string} actualPath - 实际路径
   * @returns {boolean}
   */
  function matchRoute(routePath, actualPath) {
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    if (routeParts.length !== actualParts.length) return false;
    return routeParts.every((part, i) => {
      if (part.startsWith(':')) return true;
      return part === actualParts[i];
    });
  }

  /**
   * 提取路由参数
   * @param {string} actualPath - 实际路径
   * @returns {Object} 参数对象
   */
  function extractParams(actualPath) {
    const params = {};
    for (const [routePath] of _routes) {
      if (matchRoute(routePath, actualPath)) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');
        routeParts.forEach((part, i) => {
          if (part.startsWith(':')) {
            params[part.slice(1)] = actualParts[i];
          }
        });
        break;
      }
    }
    return params;
  }

  /**
   * 获取当前路径
   * @returns {string}
   */
  function getCurrentPath() {
    return _currentPath;
  }

  /**
   * 初始化路由监听
   */
  function init() {
    window.addEventListener('hashchange', handleRouteChange);
    // 首次加载时处理路由
    handleRouteChange();
  }

  /**
   * 返回上一页
   */
  function back() {
    window.history.back();
  }

  // ==================== 导出 ====================

  return {
    register,
    beforeEach,
    afterEach,
    navigate,
    parsePath,
    parseQuery,
    getCurrentPath,
    init,
    back,
  };
})();
