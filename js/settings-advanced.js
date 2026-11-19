/* Settings enhancements: connection profiles, custom headers and live test. */
(function () {
  const $ = id => document.getElementById(id);
  const { S, save } = window.XW || {};
  const PROFILE_KEY = 'xw_aiProfiles';
  const readProfiles = () => {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.name === 'string') : [];
    } catch { return []; }
  };
  const writeProfiles = profiles => localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  const currentConfig = () => ({
    url: $('set-api-url')?.value.trim() || '',
    model: $('set-api-model')?.value.trim() || '',
    key: $('set-api-key')?.value.trim() || '',
    headers: parseHeaders($('set-api-headers')?.value || '{}')
  });
  function parseHeaders(raw) {
    let parsed;
    try { parsed = JSON.parse(raw || '{}'); } catch { throw new Error('请求头必须是有效的 JSON 格式'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('请求头需要填写 JSON 对象');
    const result = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (!key.trim() || typeof value !== 'string') throw new Error('请求头的名称和值都必须是文本');
      if (/^(host|origin|content-length|cookie|connection|referer|user-agent|sec-|access-control-)/i.test(key)) return;
      result[key] = value;
    });
    return result;
  }
  function persistConfig(config) {
    S.aiUrl = config.url || 'https://api.openai.com/v1/chat/completions';
    S.aiModel = config.model || 'gpt-4o-mini';
    S.aiKey = config.key;
    ['aiUrl','aiModel','aiKey'].forEach(save);
    localStorage.setItem('xw_aiHeaders', JSON.stringify(config.headers || {}));
    $('set-api-state').textContent = S.aiKey ? '连接信息已保存 · API Key 已配置' : '连接信息已保存 · 尚未配置 API Key';
  }
  function headersFor(config) {
    const headers = {'Content-Type':'application/json'};
    if (config.key) headers.Authorization = 'Bearer ' + config.key;
    Object.entries(config.headers || {}).forEach(([key,value]) => { headers[key] = value; });
    return headers;
  }
  function fillProfileSelect() {
    const select = $('set-api-profile');
    if (!select) return;
    const profiles = readProfiles();
    const selected = select.value;
    select.innerHTML = '<option value="">选择已保存的连接配置</option>' + profiles.map((p,i) =>
      '<option value="' + i + '">' + String(p.name).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])) + '</option>'
    ).join('');
    if (selected !== '' && profiles[Number(selected)]) select.value = selected;
  }
  function enhance() {
    const card = document.querySelector('#settings-api .settings-card');
    if (!card || $('set-api-headers')) return;
    const panel = document.createElement('div');
    panel.className = 'settings-advanced';
    panel.innerHTML = `
      <div class="settings-advanced-heading"><span>连接管理</span><small>CONNECTION PROFILES</small></div>
      <label class="settings-field"><span>已保存的连接配置</span><select id="set-api-profile" class="settings-profile-select"><option value="">选择已保存的连接配置</option></select></label>
      <div class="settings-profile-actions">
        <input id="set-api-profile-name" type="text" maxlength="32" placeholder="给这组配置起个名字">
        <button class="settings-btn" id="set-api-profile-save" type="button">保存为配置</button>
        <button class="settings-btn" id="set-api-profile-delete" type="button">删除所选</button>
      </div>
      <label class="settings-field settings-header-field"><span>自定义请求头（JSON）</span>
        <textarea id="set-api-headers" rows="4" spellcheck="false" placeholder='{"X-Custom-Header":"value"}'></textarea>
      </label>
      <p class="settings-note">可添加服务商要求的自定义请求头。请使用 JSON 格式；浏览器禁止设置的安全请求头会自动忽略。</p>
      <div class="settings-actions">
        <button class="settings-btn primary" id="set-api-test" type="button">测试连接</button>
        <span class="settings-test-state" id="set-api-test-state" role="status"></span>
      </div>`;
    card.appendChild(panel);
    try {
      const headers = JSON.parse(localStorage.getItem('xw_aiHeaders') || '{}');
      $('set-api-headers').value = JSON.stringify(headers, null, 2);
    } catch { $('set-api-headers').value = '{}'; }
    fillProfileSelect();

    $('set-api-save').onclick = () => {
      try {
        const config = currentConfig();
        if (config.url) {
          const parsed = new URL(config.url);
          if (!['http:','https:'].includes(parsed.protocol)) throw new Error('接口地址必须使用 HTTP 或 HTTPS');
        }
        persistConfig(config);
        $('set-api-headers').value = JSON.stringify(config.headers, null, 2);
        if (window.UI?.toast) UI.toast('AI 连接设置已保存');
      } catch (error) { if (window.UI?.toast) UI.toast(error.message); else alert(error.message); }
    };
    $('set-api-profile-save').onclick = () => {
      const name = $('set-api-profile-name').value.trim();
      if (!name) { UI.toast('先给这组连接配置起个名字'); return; }
      try {
        const config = currentConfig();
        const profiles = readProfiles();
        const existing = profiles.findIndex(p => p.name === name);
        const item = {name, ...config, updatedAt:Date.now()};
        if (existing >= 0) profiles[existing] = item; else profiles.push(item);
        writeProfiles(profiles);
        fillProfileSelect();
        $('set-api-profile').value = String(profiles.findIndex(p => p.name === name));
        UI.toast(existing >= 0 ? '连接配置已更新' : '连接配置已保存');
      } catch (error) { UI.toast(error.message); }
    };
    $('set-api-profile').onchange = () => {
      const index = Number($('set-api-profile').value);
      const profile = readProfiles()[index];
      if (!profile) return;
      $('set-api-url').value = profile.url || '';
      $('set-api-model').value = profile.model || '';
      $('set-api-key').value = profile.key || '';
      $('set-api-headers').value = JSON.stringify(profile.headers || {}, null, 2);
      persistConfig(profile);
      UI.toast('已切换连接配置');
    };
    $('set-api-profile-delete').onclick = () => {
      const select = $('set-api-profile');
      if (select.value === '') { UI.toast('请先选择要删除的配置'); return; }
      const index = Number(select.value), profiles = readProfiles();
      if (!profiles[index]) return;
      UI.confirmDialog({title:'删除连接配置？',text:'只会删除这条已保存的配置，不会清除当前正在使用的连接。',okText:'删除',onOk:()=>{
        profiles.splice(index,1); writeProfiles(profiles); fillProfileSelect(); UI.toast('连接配置已删除');
      }});
    };
    $('set-api-test').onclick = async () => {
      const state = $('set-api-test-state');
      let config;
      try {
        config = currentConfig();
        if (!config.url) throw new Error('请先填写接口地址');
        const parsed = new URL(config.url);
        if (!['http:','https:'].includes(parsed.protocol)) throw new Error('接口地址必须使用 HTTP 或 HTTPS');
      } catch (error) { state.textContent = error.message; return; }
      state.textContent = '正在测试…';
      $('set-api-test').disabled = true;
      try {
        const response = await fetch(config.url, {
          method:'POST',
          headers:headersFor(config),
          body:JSON.stringify({model:config.model || 'gpt-4o-mini',messages:[{role:'user',content:'Reply with OK.'}],stream:false,max_tokens:8})
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error?.message || body.message || ('HTTP ' + response.status));
        }
        state.textContent = '连接成功 · HTTP ' + response.status;
      } catch (error) {
        state.textContent = error.name === 'TypeError' ? '连接失败：网络或跨域限制，检查接口地址与服务端 CORS 设置' : '连接失败：' + error.message;
      } finally { $('set-api-test').disabled = false; }
    };
  }
  const originalBuild = window.Settings?.build;
  if (typeof originalBuild === 'function') {
    window.Settings.build = function () {
      originalBuild();
      enhance();
    };
  }
})();