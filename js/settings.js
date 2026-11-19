/* settings.js · Global settings */
(function () {
  const D = document, $ = D.getElementById.bind(D);
  const { S, save } = XW;
  let built = false;
  let openSectionHandler = null;

  function storageStats() {
    let bytes = 0, entries = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xw_')) {
        const value = localStorage.getItem(key) || '';
        bytes += (key.length + value.length) * 2;
        entries++;
      }
    }
    const kb = bytes / 1024;
    return { entries, label: kb >= 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB' };
  }

  function build() {
    const root = $('pg-settings');
    if (!root) return;
    root.innerHTML = `
      <main class="settings-page">
        <header class="settings-head">
          <div class="settings-kicker">XIAOWO / PREFERENCES</div>
          <div class="settings-title-row"><h1>设置</h1><span>SETTINGS</span></div>
          <p>让小窝按照你喜欢的方式运行。</p>
        </header>

        <nav class="settings-jump" aria-label="设置分类">
          <button type="button" class="is-active" data-settings-target="settings-appearance">外观</button>
          <button type="button" data-settings-target="settings-profile">档案</button>
          <button type="button" data-settings-target="settings-api">AI 连接</button>
          <button type="button" data-settings-target="settings-prompt">提示词</button>
          <button type="button" data-settings-target="settings-data">数据</button>
        </nav>

        <div class="settings-viewport" id="settings-viewport">
          <div class="settings-track" id="settings-track">
        <section class="settings-section settings-panel" id="settings-appearance" data-settings-page="0">
          <div class="settings-section-head"><span>01</span><div><b>外观与显示</b><small>APPEARANCE</small></div></div>
          <div class="settings-card">
            <div class="settings-row">
              <div><b>深色模式</b><small>在浅色与深色外观之间切换</small></div>
              <button class="switch ${S.theme === 'dark' ? 'on' : ''}" id="set-theme" type="button" aria-label="切换深色模式"></button>
            </div>
            <div class="settings-row">
              <div><b>当前字体</b><small>小窝默认字体组合</small></div><span class="settings-value">Noto Serif · Cormorant</span>
            </div>
          </div>
        </section>

        <section class="settings-section settings-panel" id="settings-profile" data-settings-page="1">
          <div class="settings-section-head"><span>02</span><div><b>双人档案</b><small>OUR PROFILE</small></div></div>
          <div class="settings-card">
            <label class="settings-field"><span>你的称呼</span><input id="set-her-name" maxlength="24" value=""></label>
            <label class="settings-field"><span>对方称呼</span><input id="set-his-name" maxlength="24" value=""></label>
            <label class="settings-field"><span>相识日期</span><input id="set-love-date" type="date" value=""></label>
            <div class="settings-actions"><button class="settings-btn primary" id="set-profile-save" type="button">保存档案</button></div>
          </div>
        </section>

        <section class="settings-section settings-panel" id="settings-api" data-settings-page="2">
          <div class="settings-section-head"><span>03</span><div><b>AI 连接</b><small>GLOBAL API</small></div></div>
          <div class="settings-card">
            <label class="settings-field"><span>接口地址</span><input id="set-api-url" type="url" placeholder="https://api.openai.com/v1/chat/completions" autocomplete="url"></label>
            <label class="settings-field"><span>模型名称</span><input id="set-api-model" type="text" placeholder="gpt-4o-mini" autocomplete="off"></label>
            <label class="settings-field"><span>API Key</span><input id="set-api-key" type="password" placeholder="粘贴 API Key" autocomplete="new-password"></label>
            <div class="settings-api-state" id="set-api-state"></div>
            <div class="settings-actions"><button class="settings-btn primary" id="set-api-save" type="button">保存连接</button><button class="settings-btn" id="set-api-open-chat" type="button">返回聊天</button></div>
            <p class="settings-note">连接信息保存在当前设备浏览器中。请仅填写可信服务商提供的地址与密钥。</p>
          </div>
        </section>

        <section class="settings-section settings-panel" id="settings-prompt" data-settings-page="3">
          <div class="settings-section-head"><span>04</span><div><b>全局提示词</b><small>COMPANION INSTRUCTIONS</small></div></div>
          <div class="settings-card">
            <p class="settings-note">这里的内容会附加到聊天系统提示词中，作为宋祁在小窝里的长期行为与表达约定。</p>
            <textarea id="set-global-prompt" rows="7" placeholder="写下希望长期生效的相处约定、表达偏好或角色要求……"></textarea>
            <div class="settings-actions"><button class="settings-btn primary" id="set-prompt-save" type="button">保存提示词</button></div>
          </div>
        </section>

        <section class="settings-section settings-panel" id="settings-data" data-settings-page="4">
          <div class="settings-section-head"><span>05</span><div><b>数据管理</b><small>LOCAL DATA</small></div></div>
          <div class="settings-card">
            <div class="settings-row"><div><b>本地数据占用</b><small id="set-storage-detail">正在统计</small></div><span class="settings-value" id="set-storage-size">—</span></div>
            <div class="settings-actions"><button class="settings-btn primary" id="set-export" type="button">导出完整备份</button><button class="settings-btn" id="set-import" type="button">导入备份</button></div>
            <p class="settings-note">备份包含当前浏览器中以 xw_ 开头的小窝本地数据。导入会覆盖备份中同名的数据项，建议先导出一份当前备份。</p>
          </div>
        </section>

          </div>
        </div>
        <footer class="settings-footer">XIAOWO · PRIVATE SPACE<br><span>所有更改仅作用于当前设备</span></footer>
      </main>`;
    $('set-her-name').value = S.herName || '';
    $('set-his-name').value = S.hisName || '';
    $('set-love-date').value = S.loveDate || '';
    $('set-api-url').value = S.aiUrl || '';
    $('set-api-model').value = S.aiModel || '';
    $('set-api-key').value = S.aiKey || '';
    $('set-global-prompt').value = S.globalPrompt || '';
    $('set-api-state').textContent = S.aiKey ? 'API Key 已配置' : '尚未配置 API Key';
    const stats = storageStats();
    $('set-storage-size').textContent = stats.label;
    $('set-storage-detail').textContent = stats.entries + ' 个本地数据项';
    bind();
    built = true;
  }

  function bind() {
    const jump = D.querySelector('.settings-jump');
    const viewport = $('settings-viewport');
    const pages = Array.from(D.querySelectorAll('.settings-panel'));
    const navButtons = jump ? Array.from(jump.querySelectorAll('[data-settings-target]')) : [];
    let activePage = 0;
    const showPage = (index, smooth = true) => {
      activePage = Math.max(0, Math.min(pages.length - 1, index));
      if (viewport) viewport.scrollTo({ left: activePage * viewport.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
      navButtons.forEach((button, i) => {
        button.classList.toggle('is-active', i === activePage);
        button.setAttribute('aria-current', i === activePage ? 'page' : 'false');
      });
      navButtons[activePage]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
    };
    openSectionHandler = id => {
      const index = pages.findIndex(page => page.id === id);
      if (index >= 0) showPage(index, false);
    };
    navButtons.forEach((button, index) => { button.onclick = () => showPage(index); });
    if (viewport) {
      let settle;
      viewport.addEventListener('scroll', () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
          if (index !== activePage) showPage(index, false);
        }, 70);
      }, { passive: true });
      window.addEventListener('resize', () => showPage(activePage, false));
    }
    $('set-theme').onclick = () => {
      S.theme = S.theme === 'dark' ? 'light' : 'dark';
      save('theme');
      D.documentElement.classList.toggle('dark', S.theme === 'dark');
      $('set-theme').classList.toggle('on', S.theme === 'dark');
      $('sd-switch')?.classList.toggle('on', S.theme === 'dark');
    };
    $('set-profile-save').onclick = () => {
      const date = $('set-love-date').value;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) { UI.toast('日期格式不正确'); return; }
      S.herName = $('set-her-name').value.trim() || '她';
      S.hisName = $('set-his-name').value.trim() || '他';
      S.loveDate = date || S.loveDate;
      ['herName','hisName','loveDate'].forEach(save);
      const dayCount = $('sd-day-count');
      if (dayCount) {
        const start = new Date((S.loveDate || '2025-01-01') + 'T00:00:00');
        const now = new Date(); now.setHours(0,0,0,0);
        dayCount.textContent = 'TOGETHER · DAY ' + Math.max(1, Math.floor((now - start) / 86400000) + 1);
      }
      const names = $('sd-names'); if (names) names.textContent = S.hisName + ' & ' + S.herName;
      UI.toast('双人档案已保存');
    };
    $('set-api-save').onclick = () => {
      S.aiUrl = $('set-api-url').value.trim() || 'https://api.openai.com/v1/chat/completions';
      S.aiModel = $('set-api-model').value.trim() || 'gpt-4o-mini';
      S.aiKey = $('set-api-key').value.trim();
      ['aiUrl','aiModel','aiKey'].forEach(save);
      $('set-api-state').textContent = S.aiKey ? 'API Key 已配置' : '接口已保存，尚未配置 API Key';
      UI.toast('AI 连接设置已保存');
    };
    $('set-api-open-chat').onclick = () => window.go?.('chat');
    $('set-prompt-save').onclick = () => {
      S.globalPrompt = $('set-global-prompt').value.trim();
      save('globalPrompt');
      UI.toast('全局提示词已保存');
    };
    $('set-export').onclick = exportBackup;
    $('set-import').onclick = importBackup;
  }

  function exportBackup() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xw_')) data[key] = localStorage.getItem(key);
    }
    const backup = { app: 'XIAOWO', version: 1, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = D.createElement('a');
    a.href = url; a.download = 'xiaowo-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click(); URL.revokeObjectURL(url); UI.toast('备份文件已生成');
  }

  function importBackup() {
    const input = D.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files && input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
          const entries = Object.entries(data).filter(([key, value]) => key.startsWith('xw_') && typeof value === 'string');
          if (!entries.length) throw new Error('未找到小窝备份数据');
          UI.confirmDialog({ title: '导入本地备份', text: '将覆盖备份中同名的数据项。建议确认已导出当前数据。', okText: '确认导入', onOk: () => {
            entries.forEach(([key, value]) => localStorage.setItem(key, value));
            UI.toast('备份已导入，正在重新载入');
            setTimeout(() => location.reload(), 500);
          }});
        } catch (error) { UI.toast(error.message || '备份文件无法读取'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  window.Settings = { build, openSection(id) { openSectionHandler?.(id); } };
})();