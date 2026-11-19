/* Chat 补丁层 ────────────────────────────────────────────
   1) 世界书命中预览：chat.js 的 updateWorldbookPreview() 一直在找
      #chat-worldbook-preview，但 build() 从来没建过这个盒子，函数每次空转。
      这里把盒子补上，并让它跟着勾选与对话变化重新计算。
   2) 自定义请求头：chat.js 发请求时会读 localStorage 的 xw_aiHeaders，
      但界面上没有任何地方能写它。这里补一个输入框。
   不改 chat.js 本体，页面重建后自动重新挂载。
   ──────────────────────────────────────────────────────── */
(function () {
  const D = document;
  const $ = id => D.getElementById(id);
  const HEADERS_KEY = 'xw_aiHeaders';
  const BLOCKED = /^(host|origin|content-length|cookie|connection|referer|user-agent|sec-|access-control-)/i;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const notify = msg => { try { window.UI?.toast?.(msg); } catch {} };

  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }

  /* 与 chat.js 读同一份本地数据：当前窗口 → 该窗口的消息 */
  function activeWindow() {
    const wins = readJSON('xw_chatWindows');
    const list = Array.isArray(wins) ? wins.filter(w => w && w.id) : [];
    if (!list.length) return null;
    const id = localStorage.getItem('xw_chatCurrentWindowId') || '';
    return list.find(w => w.id === id && !w.archived) || list.find(w => !w.archived) || list[0];
  }
  function windowMessages(win) {
    if (!win) return [];
    if (win.legacyKey) {
      const bag = readJSON('xw_chatMsgsByChannel') || {};
      return Array.isArray(bag[win.legacyKey]) ? bag[win.legacyKey] : [];
    }
    return Array.isArray(win.messages) ? win.messages : [];
  }
  function windowHistory(win) {
    return windowMessages(win)
      .filter(m => m && !m._typing)
      .map(m => ({ role: m.who === 'ta' ? 'assistant' : 'user', content: String(m.text || '') }))
      .filter(m => m.content);
  }

  /* ── 1. 世界书命中预览 ── */
  function renderPreview() {
    const host = $('chat-worldbook-preview');
    if (!host) return;
    const win = activeWindow();
    const ids = Array.isArray(win?.worldbookIds) ? win.worldbookIds : [];
    if (!ids.length) { host.innerHTML = '<small>尚未为这个聊天窗口选择世界书。</small>'; return; }
    if (typeof window.Worldbook?.buildInjection !== 'function') {
      host.innerHTML = '<small>世界书模块还没加载。</small>';
      return;
    }
    let matched = [];
    try { matched = (window.Worldbook.buildInjection(windowHistory(win), ids) || {}).matched || []; }
    catch { matched = []; }
    const head = '<div class="chat-worldbook-preview-head">当前触发 <b>' + matched.length + '</b> 条</div>';
    const body = matched.length
      ? '<div class="chat-worldbook-preview-list">' + matched.map(x =>
          '<span>' + esc(x.book) + ' · ' + esc(x.title) + '<small>' + esc(x.reason || '已触发') + '</small></span>'
        ).join('') + '</div>'
      : '<small>暂时没有条目命中。继续聊天后会自动检查。</small>';
    host.innerHTML = head + body;
  }

  function ensurePreview() {
    const options = $('chat-worldbook-options');
    if (!options) return;
    if (!$('chat-worldbook-preview')) {
      const box = D.createElement('div');
      box.id = 'chat-worldbook-preview';
      box.className = 'chat-worldbook-preview';
      options.insertAdjacentElement('afterend', box);
    }
    renderPreview();
    watchWorldbook();
    watchMessages();
  }
  function watchWorldbook() {
    const options = $('chat-worldbook-options');
    if (!options || options.__plusObs) return;
    const obs = new MutationObserver(() => renderPreview());
    obs.observe(options, { childList: true, subtree: true });
    options.__plusObs = obs;
  }
  function watchMessages() {
    const body = $('c-body');
    if (!body || body.__plusObs) return;
    let timer = null;
    const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(renderPreview, 220); });
    obs.observe(body, { childList: true, subtree: true });
    body.__plusObs = obs;
  }

  /* ── 2. 自定义请求头 ── */
  function readHeaders() {
    const value = readJSON(HEADERS_KEY);
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
  }
  function ensureHeadersField() {
    const anchor = $('chat-ai-status')?.closest('.chat-ai-actions');
    if (!anchor || $('chat-ai-headers')) return;
    const wrap = D.createElement('div');
    wrap.className = 'chat-plus-headers';
    wrap.innerHTML =
      '<label class="chat-ai-field"><span>自定义请求头（JSON，可选）</span>' +
      '<textarea id="chat-ai-headers" rows="3" spellcheck="false" placeholder=\'{"X-Title":"Xiaowo","X-Client":"3DHOME"}\'></textarea></label>' +
      '<div class="chat-ai-actions"><button type="button" id="chat-ai-headers-save">保存请求头</button><small id="chat-ai-headers-status"></small></div>';
    anchor.insertAdjacentElement('afterend', wrap);
    bindHeaders();
  }
  function bindHeaders() {
    const btn = $('chat-ai-headers-save');
    if (!btn || btn.__plusBound) return;
    btn.__plusBound = true;
    const area = $('chat-ai-headers');
    const status = $('chat-ai-headers-status');
    const saved = readHeaders();
    if (area) area.value = Object.keys(saved).length ? JSON.stringify(saved, null, 2) : '';
    if (status) status.textContent = Object.keys(saved).length ? '已保存 ' + Object.keys(saved).length + ' 项' : '未设置';
    btn.onclick = () => {
      const raw = (area?.value || '').trim();
      if (!raw) {
        localStorage.removeItem(HEADERS_KEY);
        if (status) status.textContent = '已清空';
        notify('自定义请求头已清空');
        return;
      }
      let value;
      try { value = JSON.parse(raw); }
      catch { if (status) status.textContent = 'JSON 格式不对'; notify('请求头不是合法的 JSON'); return; }
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        if (status) status.textContent = '需要一个 JSON 对象';
        notify('请求头要写成 {"名字":"值"} 的形式');
        return;
      }
      const clean = {};
      let blocked = 0;
      Object.keys(value).forEach(key => {
        const val = value[key];
        if (!key || typeof val !== 'string' || BLOCKED.test(key)) { blocked += 1; return; }
        clean[key] = val;
      });
      localStorage.setItem(HEADERS_KEY, JSON.stringify(clean));
      const count = Object.keys(clean).length;
      if (status) status.textContent = '已保存 ' + count + ' 项' + (blocked ? '（忽略 ' + blocked + ' 项受限头）' : '');
      notify(count ? '自定义请求头已保存' : '没有可用的请求头');
    };
  }

  /* ── 挂到 Chat.build 之后 ── */
  function afterBuild() {
    try { ensurePreview(); } catch (e) { console.warn('[ChatPlus] preview', e); }
    try { ensureHeadersField(); } catch (e) { console.warn('[ChatPlus] headers', e); }
  }
  function patchBuild() {
    const Chat = window.Chat;
    if (!Chat || typeof Chat.build !== 'function') return false;
    if (Chat.__plusPatched) return true;
    const original = Chat.build;
    Chat.build = function () {
      const result = original.apply(this, arguments);
      afterBuild();
      return result;
    };
    Chat.__plusPatched = true;
    return true;
  }

  /* 勾选世界书后重算：chat.js 的监听先把值存盘，这里延后一拍读最新内容 */
  D.addEventListener('change', e => {
    if (e.target?.closest?.('#chat-worldbook-options')) setTimeout(renderPreview, 0);
  }, true);

  let tries = 0;
  const boot = () => {
    if (!patchBuild()) {
      if (++tries < 60) { setTimeout(boot, 100); return; }
      return;
    }
    if ($('pg-chat')?.children.length) afterBuild();
  };
  boot();

  window.ChatPlus = { renderPreview, refresh: afterBuild };
})();
