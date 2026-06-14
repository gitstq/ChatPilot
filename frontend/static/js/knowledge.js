/**
 * ChatPilot 知识库管理模块
 * FAQ分类、列表、添加/编辑/删除
 */

const Knowledge = (() => {
  'use strict';

  /** FAQ列表 */
  let _faqs = [];
  /** 分类列表 */
  let _categories = [];
  /** 当前选中分类 */
  let _activeCategory = '';
  /** 搜索关键词 */
  let _searchKeyword = '';
  /** 当前展开的FAQ ID */
  let _expandedFaqId = null;
  /** 编辑中的FAQ */
  let _editingFaqId = null;

  /**
   * 初始化知识库模块
   */
  function init() {
    // 无需特殊初始化
  }

  /**
   * 渲染知识库页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h1 class="page-title">${Utils.i18n('knowledge')}</h1>
          </div>
          <button class="btn btn-primary" id="addFaqBtn">
            ${Utils.icon('plus', 16)} ${Utils.i18n('add_faq')}
          </button>
        </div>
      </div>
      <div class="knowledge-layout" id="knowledgeLayout">
        <div class="knowledge-sidebar">
          <div class="knowledge-sidebar-header">
            <h3>${Utils.i18n('faq_categories')}</h3>
          </div>
          <div class="knowledge-categories" id="knowledgeCategories">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="knowledge-main">
          <div class="knowledge-main-header">
            <h3>${Utils.getLang() === 'zh' ? '常见问题' : 'FAQ'}</h3>
            <div class="knowledge-search">
              <span class="search-icon">${Utils.icon('search', 16)}</span>
              <input type="text" id="faqSearchInput" placeholder="${Utils.getLang() === 'zh' ? '搜索FAQ...' : 'Search FAQ...'}" value="${_searchKeyword}" />
            </div>
          </div>
          <div class="knowledge-stats" id="knowledgeStats"></div>
          <div class="knowledge-list" id="knowledgeList">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindEvents();

    // 加载数据
    await loadCategories();
    await loadFaqs();
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 搜索
    Utils.$('#faqSearchInput')?.addEventListener('input', Utils.debounce((e) => {
      _searchKeyword = e.target.value.trim();
      loadFaqs();
    }, 300));

    // 添加FAQ
    Utils.$('#addFaqBtn')?.addEventListener('click', () => showFaqEditor());
  }

  /**
   * 加载分类
   */
  async function loadCategories() {
    const container = Utils.$('#knowledgeCategories');
    if (!container) return;

    try {
      _categories = await API.getFaqCategories();

      container.innerHTML = `
        <div class="knowledge-category-item ${!_activeCategory ? 'active' : ''}" data-category="">
          ${Utils.icon('knowledge', 16)}
          ${Utils.i18n('all')}
          <span class="knowledge-category-count">${_categories.reduce((sum, c) => sum + c.count, 0)}</span>
        </div>
        ${_categories.map(cat => `
          <div class="knowledge-category-item ${_activeCategory === cat.name ? 'active' : ''}" data-category="${cat.name}">
            ${Utils.icon('knowledge', 16)}
            ${Utils.escapeHtml(cat.name)}
            <span class="knowledge-category-count">${cat.count}</span>
          </div>
        `).join('')}
      `;

      // 绑定分类点击
      Utils.$$('.knowledge-category-item', container).forEach(item => {
        item.addEventListener('click', () => {
          _activeCategory = item.dataset.category;
          Utils.$$('.knowledge-category-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          loadFaqs();
        });
      });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  }

  /**
   * 加载FAQ列表
   */
  async function loadFaqs() {
    const listEl = Utils.$('#knowledgeList');
    const statsEl = Utils.$('#knowledgeStats');
    if (!listEl) return;

    try {
      _faqs = await API.getFaqs({
        category: _activeCategory || undefined,
        search: _searchKeyword || undefined,
      });

      // 统计信息
      if (statsEl) {
        const totalViews = _faqs.reduce((sum, f) => sum + (f.views || 0), 0);
        statsEl.innerHTML = `
          <div class="knowledge-stat-item">
            ${Utils.getLang() === 'zh' ? '总计' : 'Total'}: <span class="knowledge-stat-value">${_faqs.length}</span>
          </div>
          <div class="knowledge-stat-item">
            ${Utils.getLang() === 'zh' ? '总浏览量' : 'Total Views'}: <span class="knowledge-stat-value">${totalViews}</span>
          </div>
        `;
      }

      if (!_faqs.length) {
        listEl.innerHTML = `
          <div class="knowledge-empty">
            ${Utils.icon('knowledge', 48)}
            <p>${Utils.getLang() === 'zh' ? '暂无FAQ' : 'No FAQ found'}</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = _faqs.map(faq => renderFaqItem(faq)).join('');

      // 绑定FAQ点击展开/收起
      Utils.$$('.faq-item', listEl).forEach(item => {
        item.addEventListener('click', (e) => {
          // 如果点击的是操作按钮，不展开
          if (e.target.closest('.faq-actions')) return;

          const faqId = item.dataset.id;
          if (_expandedFaqId === faqId) {
            _expandedFaqId = null;
            item.classList.remove('active');
          } else {
            // 收起之前展开的
            Utils.$$('.faq-item.active').forEach(i => i.classList.remove('active'));
            _expandedFaqId = faqId;
            item.classList.add('active');
          }
        });
      });

      // 绑定编辑/删除按钮
      Utils.$$('.faq-edit-btn', listEl).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          showFaqEditor(btn.dataset.id);
        });
      });

      Utils.$$('.faq-delete-btn', listEl).forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(Utils.getLang() === 'zh' ? '确定删除此FAQ吗？' : 'Are you sure to delete this FAQ?')) {
            try {
              await API.deleteFaq(btn.dataset.id);
              Utils.showToast(Utils.i18n('success'), 'success');
              await loadFaqs();
              await loadCategories();
            } catch (err) {
              Utils.showToast(Utils.i18n('error'), 'error');
            }
          }
        });
      });
    } catch (err) {
      console.error('加载FAQ失败:', err);
    }
  }

  /**
   * 渲染FAQ项
   * @param {Object} faq - FAQ数据
   * @returns {string} HTML字符串
   */
  function renderFaqItem(faq) {
    return `
      <div class="faq-item ${_expandedFaqId === faq.id ? 'active' : ''}" data-id="${faq.id}">
        <div class="faq-question">
          <span class="faq-question-text">${Utils.escapeHtml(faq.question)}</span>
          <div class="faq-question-meta">
            <span class="badge badge-gray">${Utils.escapeHtml(faq.category)}</span>
            <span class="faq-expand-icon">${Utils.icon('chevronDown', 20)}</span>
          </div>
        </div>
        <div class="faq-answer">
          <p>${Utils.escapeHtml(faq.answer)}</p>
          <div class="faq-actions">
            <button class="btn btn-sm btn-outline faq-edit-btn" data-id="${faq.id}">
              ${Utils.icon('edit', 14)} ${Utils.i18n('edit')}
            </button>
            <button class="btn btn-sm btn-outline btn-danger faq-delete-btn" data-id="${faq.id}">
              ${Utils.icon('trash', 14)} ${Utils.i18n('delete')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 显示FAQ编辑器
   * @param {string} faqId - FAQ ID（编辑模式）或 null（新建模式）
   */
  async function showFaqEditor(faqId = null) {
    _editingFaqId = faqId;
    let faqData = { question: '', answer: '', category: '' };

    if (faqId) {
      const faq = _faqs.find(f => f.id === faqId);
      if (faq) faqData = { ...faq };
    }

    // 移除已有模态框
    Utils.$('.modal-overlay')?.remove();

    const overlay = Utils.createElement('div', { className: 'modal-overlay active' });
    const modal = Utils.createElement('div', { className: 'modal', style: { maxWidth: '640px' } });
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${faqId ? Utils.i18n('edit_faq') : Utils.i18n('add_faq')}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">${Utils.i18n('faq_question')}</label>
          <input type="text" class="form-input" id="faqEditorQuestion" value="${Utils.escapeHtml(faqData.question)}" placeholder="${Utils.getLang() === 'zh' ? '请输入问题' : 'Enter question'}" />
        </div>
        <div class="form-group">
          <label class="form-label">${Utils.i18n('faq_answer')}</label>
          <textarea class="form-input" id="faqEditorAnswer" rows="5" placeholder="${Utils.getLang() === 'zh' ? '请输入答案' : 'Enter answer'}">${Utils.escapeHtml(faqData.answer)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${Utils.i18n('faq_category')}</label>
          <select class="form-select" id="faqEditorCategory">
            <option value="">${Utils.getLang() === 'zh' ? '选择分类' : 'Select category'}</option>
            ${_categories.map(cat => `
              <option value="${cat.name}" ${faqData.category === cat.name ? 'selected' : ''}>${cat.name}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">${Utils.i18n('cancel')}</button>
        <button class="btn btn-primary" id="faqEditorSubmit">${Utils.i18n('save')}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 提交保存
    Utils.$('#faqEditorSubmit')?.addEventListener('click', async () => {
      const question = Utils.$('#faqEditorQuestion')?.value.trim();
      const answer = Utils.$('#faqEditorAnswer')?.value.trim();
      const category = Utils.$('#faqEditorCategory')?.value;

      if (!question || !answer) {
        Utils.showToast(Utils.getLang() === 'zh' ? '请填写问题和答案' : 'Please fill in question and answer', 'warning');
        return;
      }

      try {
        if (faqId) {
          await API.updateFaq(faqId, { question, answer, category });
        } else {
          await API.createFaq({ question, answer, category });
        }
        overlay.remove();
        Utils.showToast(Utils.i18n('success'), 'success');
        await loadFaqs();
        await loadCategories();
      } catch (err) {
        console.error('保存FAQ失败:', err);
        Utils.showToast(Utils.i18n('error'), 'error');
      }
    });
  }

  return {
    init,
    render,
  };
})();
