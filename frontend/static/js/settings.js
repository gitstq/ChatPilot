/**
 * ChatPilot 设置页面模块
 * AI配置、Widget配置、个人信息
 */

const Settings = (() => {
  'use strict';

  /** 当前设置标签页 */
  let _activeTab = 'general';
  /** 设置数据 */
  let _settings = null;

  /** 可选主题色 */
  const _colorOptions = [
    '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
    '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  ];

  /**
   * 初始化设置模块
   * @param {Object} query - URL查询参数
   */
  function init(query = {}) {
    if (query.tab) {
      _activeTab = query.tab;
    }
  }

  /**
   * 渲染设置页面
   * @param {Element} container - 容器元素
   */
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${Utils.i18n('settings')}</h1>
      </div>
      <div class="settings-layout" id="settingsLayout">
        <div class="settings-nav">
          <div class="settings-nav-list">
            <button class="settings-nav-item ${_activeTab === 'general' ? 'active' : ''}" data-tab="general">
              ${Utils.icon('settings', 18)} ${Utils.i18n('general')}
            </button>
            <button class="settings-nav-item ${_activeTab === 'ai' ? 'active' : ''}" data-tab="ai">
              ${Utils.icon('bot', 18)} ${Utils.i18n('ai_config')}
            </button>
            <button class="settings-nav-item ${_activeTab === 'widget' ? 'active' : ''}" data-tab="widget">
              ${Utils.icon('chat', 18)} ${Utils.i18n('widget_config')}
            </button>
            <button class="settings-nav-item ${_activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
              ${Utils.icon('customers', 18)} ${Utils.i18n('profile')}
            </button>
          </div>
        </div>
        <div class="settings-content" id="settingsContent">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // 绑定导航事件
    Utils.$$('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        _activeTab = item.dataset.tab;
        Utils.$$('.settings-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        renderTabContent();
      });
    });

    // 加载设置数据
    await loadSettings();
  }

  /**
   * 加载设置数据
   */
  async function loadSettings() {
    try {
      _settings = await API.getSettings();
      renderTabContent();
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  }

  /**
   * 渲染标签页内容
   */
  function renderTabContent() {
    const content = Utils.$('#settingsContent');
    if (!content || !_settings) return;

    switch (_activeTab) {
      case 'general':
        content.innerHTML = renderGeneralSettings();
        bindGeneralEvents();
        break;
      case 'ai':
        content.innerHTML = renderAISettings();
        bindAIEvents();
        break;
      case 'widget':
        content.innerHTML = renderWidgetSettings();
        bindWidgetEvents();
        break;
      case 'profile':
        content.innerHTML = renderProfileSettings();
        bindProfileEvents();
        break;
    }
  }

  // ==================== 通用设置 ====================

  function renderGeneralSettings() {
    return `
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.i18n('language')}</h3>
            <p class="settings-section-desc">${Utils.getLang() === 'zh' ? '设置界面显示语言' : 'Set interface language'}</p>
          </div>
        </div>
        <div class="settings-section-body">
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('language')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '选择系统显示语言' : 'Select display language'}</div>
            </div>
            <div class="settings-row-control">
              <div class="lang-switch">
                <button class="lang-switch-btn ${Utils.getLang() === 'zh' ? 'active' : ''}" data-lang="zh">中文</button>
                <button class="lang-switch-btn ${Utils.getLang() === 'en' ? 'active' : ''}" data-lang="en">English</button>
              </div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.getLang() === 'zh' ? '桌面通知' : 'Desktop Notifications'}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '接收新消息桌面通知' : 'Receive desktop notifications for new messages'}</div>
            </div>
            <div class="settings-row-control">
              <div class="toggle-switch active" id="notificationToggle"></div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.getLang() === 'zh' ? '声音提醒' : 'Sound Alerts'}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '新消息时播放提示音' : 'Play sound on new messages'}</div>
            </div>
            <div class="settings-row-control">
              <div class="toggle-switch active" id="soundToggle"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.i18n('api_keys')}</h3>
            <p class="settings-section-desc">${Utils.getLang() === 'zh' ? '管理API访问密钥' : 'Manage API access keys'}</p>
          </div>
          <button class="btn btn-sm btn-outline">${Utils.icon('plus', 14)} ${Utils.i18n('add')}</button>
        </div>
        <div class="settings-section-body">
          <div class="api-key-item">
            <span class="api-key-value">cp_live_****************************a1b2c3</span>
            <div class="api-key-actions">
              <button class="btn btn-sm btn-ghost" onclick="Utils.copyToClipboard('cp_live_sk_a1b2c3d4e5f6g7h8i9j0').then(() => Utils.showToast('${Utils.i18n('copied')}', 'success'))">
                ${Utils.icon('copy', 14)} ${Utils.i18n('copy')}
              </button>
              <button class="btn btn-sm btn-ghost" style="color:var(--danger);">
                ${Utils.icon('trash', 14)}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindGeneralEvents() {
    // 语言切换
    Utils.$$('.settings-row .lang-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.setLang(btn.dataset.lang);
        Utils.showToast(Utils.i18n('success'), 'success');
        // 延迟刷新以显示效果
        setTimeout(() => location.reload(), 500);
      });
    });

    // 开关切换
    Utils.$$('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
      });
    });
  }

  // ==================== AI 设置 ====================

  function renderAISettings() {
    const ai = _settings.ai || {};
    return `
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.i18n('ai_config')}</h3>
            <p class="settings-section-desc">${Utils.getLang() === 'zh' ? '配置AI智能回复参数' : 'Configure AI auto-reply parameters'}</p>
          </div>
        </div>
        <div class="settings-section-body">
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.getLang() === 'zh' ? '启用AI回复' : 'Enable AI Reply'}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '开启后AI将自动生成回复建议' : 'AI will generate reply suggestions when enabled'}</div>
            </div>
            <div class="settings-row-control">
              <div class="toggle-switch ${ai.enabled ? 'active' : ''}" id="aiEnabledToggle"></div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('ai_model')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '选择AI模型' : 'Select AI model'}</div>
            </div>
            <div class="settings-row-control">
              <select class="form-select" id="aiModelSelect" style="width:200px;">
                <option value="gpt-3.5-turbo" ${ai.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                <option value="gpt-4" ${ai.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                <option value="gpt-4-turbo" ${ai.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
              </select>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('ai_api_key')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? 'OpenAI API密钥' : 'OpenAI API key'}</div>
            </div>
            <div class="settings-row-control">
              <input type="password" class="form-input" id="aiApiKeyInput" value="${Utils.escapeHtml(ai.apiKey || '')}" placeholder="sk-..." style="width:200px;" />
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('ai_temperature')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '控制回复的创造性 (0-1)' : 'Control creativity of replies (0-1)'}</div>
            </div>
            <div class="settings-row-control">
              <input type="range" id="aiTempRange" min="0" max="1" step="0.1" value="${ai.temperature || 0.7}" style="width:120px;" />
              <span id="aiTempValue" style="margin-left:8px;font-size:var(--text-sm);font-weight:600;">${ai.temperature || 0.7}</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('ai_max_tokens')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '最大回复长度' : 'Maximum reply length'}</div>
            </div>
            <div class="settings-row-control">
              <input type="number" class="form-input" id="aiMaxTokens" value="${ai.maxTokens || 2048}" style="width:120px;" />
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-bar">
        <button class="btn btn-outline">${Utils.i18n('cancel')}</button>
        <button class="btn btn-primary" id="saveAISettings">${Utils.i18n('save')}</button>
      </div>
    `;
  }

  function bindAIEvents() {
    // 温度滑块
    Utils.$('#aiTempRange')?.addEventListener('input', (e) => {
      Utils.$('#aiTempValue').textContent = e.target.value;
    });

    // AI开关
    Utils.$('#aiEnabledToggle')?.addEventListener('click', function () {
      this.classList.toggle('active');
    });

    // 保存
    Utils.$('#saveAISettings')?.addEventListener('click', async () => {
      try {
        await API.updateSettings({
          ai: {
            enabled: Utils.$('#aiEnabledToggle')?.classList.contains('active'),
            model: Utils.$('#aiModelSelect')?.value,
            apiKey: Utils.$('#aiApiKeyInput')?.value,
            temperature: parseFloat(Utils.$('#aiTempRange')?.value),
            maxTokens: parseInt(Utils.$('#aiMaxTokens')?.value),
          },
        });
        Utils.showToast(Utils.i18n('success'), 'success');
      } catch (err) {
        Utils.showToast(Utils.i18n('error'), 'error');
      }
    });
  }

  // ==================== Widget 设置 ====================

  function renderWidgetSettings() {
    const widget = _settings.widget || {};
    return `
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.i18n('widget_config')}</h3>
            <p class="settings-section-desc">${Utils.getLang() === 'zh' ? '自定义嵌入式聊天Widget' : 'Customize embedded chat widget'}</p>
          </div>
        </div>
        <div class="settings-section-body">
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.getLang() === 'zh' ? '启用Widget' : 'Enable Widget'}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '在网站上显示聊天Widget' : 'Show chat widget on website'}</div>
            </div>
            <div class="settings-row-control">
              <div class="toggle-switch ${widget.enabled ? 'active' : ''}" id="widgetEnabledToggle"></div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('widget_color')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? 'Widget主题颜色' : 'Widget theme color'}</div>
            </div>
            <div class="settings-row-control">
              <div class="color-picker-group" id="colorPicker">
                ${_colorOptions.map(color => `
                  <div class="color-swatch ${widget.color === color ? 'selected' : ''}" style="background:${color};" data-color="${color}"></div>
                `).join('')}
                <input type="color" class="color-input" id="customColorInput" value="${widget.color || '#4F46E5'}" />
              </div>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('widget_position')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? 'Widget显示位置' : 'Widget display position'}</div>
            </div>
            <div class="settings-row-control">
              <select class="form-select" id="widgetPositionSelect" style="width:160px;">
                <option value="right" ${widget.position === 'right' ? 'selected' : ''}>${Utils.i18n('right')}</option>
                <option value="left" ${widget.position === 'left' ? 'selected' : ''}>${Utils.i18n('left')}</option>
              </select>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.i18n('widget_welcome')}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? 'Widget欢迎消息' : 'Widget welcome message'}</div>
            </div>
            <div class="settings-row-control">
              <input type="text" class="form-input" id="widgetWelcomeInput" value="${Utils.escapeHtml(widget.welcomeMessage || '')}" style="width:280px;" />
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">${Utils.getLang() === 'zh' ? 'Widget标题' : 'Widget Title'}</div>
              <div class="settings-row-desc">${Utils.getLang() === 'zh' ? '聊天窗口标题' : 'Chat window title'}</div>
            </div>
            <div class="settings-row-control">
              <input type="text" class="form-input" id="widgetTitleInput" value="${Utils.escapeHtml(widget.title || '')}" style="width:200px;" />
            </div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-header">
          <h3 class="settings-section-title">${Utils.getLang() === 'zh' ? '预览' : 'Preview'}</h3>
        </div>
        <div class="settings-section-body">
          <div class="widget-preview" id="widgetPreview">
            <div class="widget-preview-chat" id="widgetPreviewChat">
              <div class="widget-preview-header" id="widgetPreviewHeader" style="background:${widget.color || '#4F46E5'};">
                <span style="font-weight:600;font-size:14px;">${Utils.escapeHtml(widget.title || Utils.i18n('customer_service'))}</span>
              </div>
              <div class="widget-preview-body">
                <p style="font-size:13px;color:var(--gray-500);">${Utils.escapeHtml(widget.welcomeMessage || Utils.i18n('welcome_message'))}</p>
              </div>
              <div class="widget-preview-input">
                <input type="text" placeholder="${Utils.i18n('type_message')}" disabled />
              </div>
            </div>
          </div>
          <div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--gray-50);border-radius:var(--radius-md);font-size:var(--text-xs);">
            <strong>${Utils.getLang() === 'zh' ? '嵌入代码：' : 'Embed Code:'}</strong>
            <code style="display:block;margin-top:var(--space-2);padding:var(--space-2);background:var(--gray-800);color:#10B981;border-radius:var(--radius-sm);font-family:var(--font-mono);word-break:break-all;">
              &lt;script src="widget-embed.js" data-color="${widget.color || '#4F46E5'}" data-position="${widget.position || 'right'}"&gt;&lt;/script&gt;
            </code>
          </div>
        </div>
      </div>
      <div class="settings-save-bar">
        <button class="btn btn-outline">${Utils.i18n('cancel')}</button>
        <button class="btn btn-primary" id="saveWidgetSettings">${Utils.i18n('save')}</button>
      </div>
    `;
  }

  function bindWidgetEvents() {
    // 颜色选择
    Utils.$$('#colorPicker .color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        Utils.$$('#colorPicker .color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const color = swatch.dataset.color;
        Utils.$('#customColorInput').value = color;
        updateWidgetPreview(color);
      });
    });

    // 自定义颜色
    Utils.$('#customColorInput')?.addEventListener('input', (e) => {
      Utils.$$('#colorPicker .color-swatch').forEach(s => s.classList.remove('selected'));
      updateWidgetPreview(e.target.value);
    });

    // 位置切换
    Utils.$('#widgetPositionSelect')?.addEventListener('change', () => {
      // 预览位置不变，仅更新配置
    });

    // Widget开关
    Utils.$('#widgetEnabledToggle')?.addEventListener('click', function () {
      this.classList.toggle('active');
    });

    // 保存
    Utils.$('#saveWidgetSettings')?.addEventListener('click', async () => {
      try {
        const selectedColor = Utils.$('#colorPicker .color-swatch.selected')?.dataset.color
          || Utils.$('#customColorInput')?.value;

        await API.updateSettings({
          widget: {
            enabled: Utils.$('#widgetEnabledToggle')?.classList.contains('active'),
            color: selectedColor,
            position: Utils.$('#widgetPositionSelect')?.value,
            welcomeMessage: Utils.$('#widgetWelcomeInput')?.value,
            title: Utils.$('#widgetTitleInput')?.value,
          },
        });
        Utils.showToast(Utils.i18n('success'), 'success');
      } catch (err) {
        Utils.showToast(Utils.i18n('error'), 'error');
      }
    });
  }

  /**
   * 更新Widget预览颜色
   * @param {string} color - 颜色值
   */
  function updateWidgetPreview(color) {
    const header = Utils.$('#widgetPreviewHeader');
    if (header) {
      header.style.background = color;
    }
  }

  // ==================== 个人信息设置 ====================

  function renderProfileSettings() {
    const profile = _settings.profile || {};
    return `
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.i18n('profile')}</h3>
            <p class="settings-section-desc">${Utils.getLang() === 'zh' ? '管理您的个人信息' : 'Manage your personal information'}</p>
          </div>
        </div>
        <div class="settings-section-body">
          <div class="profile-section">
            <div class="profile-avatar-edit">
              <div class="avatar" style="background:#4F46E5;">
                ${Utils.getInitials(profile.name || 'A')}
              </div>
              <div class="profile-avatar-edit-btn">
                ${Utils.icon('edit', 12)}
              </div>
            </div>
            <div class="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">${Utils.i18n('name')}</label>
                  <input type="text" class="form-input" id="profileName" value="${Utils.escapeHtml(profile.name || '')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">${Utils.i18n('email')}</label>
                  <input type="email" class="form-input" id="profileEmail" value="${Utils.escapeHtml(profile.email || '')}" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">${Utils.i18n('phone')}</label>
                  <input type="tel" class="form-input" id="profilePhone" value="${Utils.escapeHtml(profile.phone || '')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">${Utils.i18n('company')}</label>
                  <input type="text" class="form-input" id="profileCompany" value="${Utils.escapeHtml(profile.company || '')}" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3 class="settings-section-title">${Utils.getLang() === 'zh' ? '修改密码' : 'Change Password'}</h3>
          </div>
        </div>
        <div class="settings-section-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${Utils.getLang() === 'zh' ? '当前密码' : 'Current Password'}</label>
              <input type="password" class="form-input" id="currentPassword" placeholder="********" />
            </div>
            <div class="form-group">
              <label class="form-label">${Utils.getLang() === 'zh' ? '新密码' : 'New Password'}</label>
              <input type="password" class="form-input" id="newPassword" placeholder="********" />
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-bar">
        <button class="btn btn-outline">${Utils.i18n('cancel')}</button>
        <button class="btn btn-primary" id="saveProfileSettings">${Utils.i18n('save')}</button>
      </div>
    `;
  }

  function bindProfileEvents() {
    Utils.$('#saveProfileSettings')?.addEventListener('click', async () => {
      try {
        await API.updateSettings({
          profile: {
            name: Utils.$('#profileName')?.value,
            email: Utils.$('#profileEmail')?.value,
            phone: Utils.$('#profilePhone')?.value,
            company: Utils.$('#profileCompany')?.value,
          },
        });
        Utils.showToast(Utils.i18n('success'), 'success');
      } catch (err) {
        Utils.showToast(Utils.i18n('error'), 'error');
      }
    });
  }

  return {
    init,
    render,
  };
})();
