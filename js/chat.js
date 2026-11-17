/* ══════════════════════════════════════════════
   chat.js · 聊天页（真实 API 对话 · 历史检索 · 频道切换）
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);

const { S, save } = XW;

// Chat-only appearance keys are intentionally outside the global DEF schema.
// Rehydrate them explicitly so wallpapers, avatars and bubble art survive reloads.
['chatHisAvatar','chatHerAvatar','chatTaBubble','chatMyBubble','chatWallpaper'].forEach(key => {
  try {
    const stored = localStorage.getItem('xw_' + key);
    if (stored !== null) S[key] = JSON.parse(stored);
  } catch (err) {
    console.warn('[Chat] Could not restore appearance setting:', key, err);
  }
});
const { fmtClock, toast } = UI;

// chatWindows is a Chat-only store key, so hydrate it here without changing global store.js.
try {
  const savedWindows = JSON.parse(localStorage.getItem('xw_chatWindows') || 'null');
  if (Array.isArray(savedWindows)) S.chatWindows = savedWindows;
} catch {}

let aiTyping = false;
let aiReplyWindowId = null;
let activeAIController = null;
let replyingTo = null;
let currentChannel = localStorage.getItem('xw_chatCurrentWindowId') || 'legacy_general';
let typeWriterTimer = null;

const CHANNELS = [
  { key: 'general', label: '通用', sub: 'general' },
  { key: 'sweet',   label: '甜蜜', sub: 'sweet' },
  { key: 'daily',   label: '日常', sub: 'daily' },
  { key: 'secret',  label: '秘密', sub: 'secret' },
];


function getChatWindows() {
  if (!Array.isArray(S.chatWindows) || !S.chatWindows.length) {
    const legacy = S.chatMsgsByChannel || (S.chatMsgs ? { general: S.chatMsgs } : {});
    S.chatWindows = CHANNELS.map((c, i) => ({
      id: 'legacy_' + c.key, title: c.label, messages: Array.isArray(legacy[c.key]) ? legacy[c.key] : [],
      createdAt: Date.now() - (CHANNELS.length - i) * 1000, updatedAt: Date.now(), archived: false, legacyKey: c.key
    }));
  }
  S.chatWindows = S.chatWindows.filter(w => w && w.id);
  // Legacy channels remain stored in their original key to avoid duplicating large image data.
  let cleanedLegacy = false;
  S.chatWindows.forEach(w => { if (w.legacyKey && w.messages) { delete w.messages; cleanedLegacy = true; } });
  if (cleanedLegacy || !localStorage.getItem('xw_chatWindows')) save('chatWindows');
  if (!S.chatWindows.some(w => w.id === currentChannel && !w.archived)) { currentChannel = (S.chatWindows.find(w => !w.archived) || S.chatWindows[0]).id; localStorage.setItem('xw_chatCurrentWindowId', currentChannel); }
  return S.chatWindows;
}
function getCurrentWindow() { return getChatWindows().find(w => w.id === currentChannel) || getChatWindows()[0]; }
function getWindowMessages(win) {
  if (!win) return [];
  if (win.legacyKey) {
    S.chatMsgsByChannel = S.chatMsgsByChannel || {};
    S.chatMsgsByChannel[win.legacyKey] = S.chatMsgsByChannel[win.legacyKey] || [];
    return S.chatMsgsByChannel[win.legacyKey];
  }
  if (!Array.isArray(win.messages)) win.messages = [];
  return win.messages;
}
function getChannelMsgs() { return getWindowMessages(getCurrentWindow()); }
function saveChannelMsgs(msgs) {
  const win = getCurrentWindow(); win.updatedAt = Date.now();
  if (win.legacyKey) { S.chatMsgsByChannel = S.chatMsgsByChannel || {}; S.chatMsgsByChannel[win.legacyKey] = msgs; save('chatMsgsByChannel'); }
  else win.messages = msgs;
  save('chatWindows');
}
function syncWindowLabel() { const el = $('chat-window-current'); if (el) el.textContent = getCurrentWindow()?.title || '新会话'; }
function renderWindowManager() {
  const host = $('chat-window-list'); if (!host) return;
  const windows = getChatWindows(), active = windows.filter(w => !w.archived), archived = windows.filter(w => w.archived);
  const row = w => `<article class="chat-window-item ${w.id === currentChannel ? 'current' : ''}">
    <button type="button" class="chat-window-open" data-window-open="${esc(w.id)}"><span class="chat-window-symbol">◌</span>
      <span class="chat-window-copy"><b>${esc(w.title)}</b><small>${getWindowMessages(w).length} 条消息 · 独立聊天记录</small></span>
      <span class="chat-window-check">${w.id === currentChannel ? '当前' : '进入'}</span></button>
    <div class="chat-window-actions"><button type="button" data-window-rename="${esc(w.id)}">重命名</button>
      ${w.archived ? `<button type="button" data-window-restore="${esc(w.id)}">恢复</button>` : `<button type="button" data-window-archive="${esc(w.id)}">归档</button>`}
      <button type="button" class="danger" data-window-delete="${esc(w.id)}">删除</button></div></article>`;
  host.innerHTML = (active.length ? '<div class="chat-window-group-title">正在使用</div>' + active.map(row).join('') : '') +
    (archived.length ? '<div class="chat-window-group-title">已归档</div>' + archived.map(row).join('') : '') || '<div class="chat-search-empty">这里还没有会话。</div>';
}
function openWindowManager() { renderWindowManager(); $('chat-window-sheet')?.classList.add('show'); $('chat-window-sheet')?.setAttribute('aria-hidden','false'); }
function closeWindowManager() { $('chat-window-sheet')?.classList.remove('show'); $('chat-window-sheet')?.setAttribute('aria-hidden','true'); }
function createChatWindow() {
  const title = prompt('给这段新聊天起个名字', '新的聊天'); if (title === null) return;
  const clean = title.trim().slice(0,32) || '新的聊天';
  const win = { id:'win_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7), title:clean, messages:[], worldbookIds:[], createdAt:Date.now(), updatedAt:Date.now(), archived:false };
  getChatWindows().push(win); save('chatWindows'); currentChannel = win.id; localStorage.setItem('xw_chatCurrentWindowId', currentChannel);
  syncWorldbookBindings(); syncWindowLabel(); renderMsgs(); closeWindowManager(); toast('新会话已创建');
}
function activateWindow(id) {
  const win = getChatWindows().find(w => w.id === id && !w.archived); if (!win) return;
  currentChannel = id; localStorage.setItem('xw_chatCurrentWindowId', id); syncWorldbookBindings(); replyingTo = null; $('c-reply')?.classList.remove('show');
  $('c-typing')?.classList.toggle('show', !!aiTyping && aiReplyWindowId === id);
  syncWindowLabel(); renderMsgs(); closeWindowManager();
}
function manageWindowAction(action,id) {
  const win = getChatWindows().find(w => w.id === id); if (!win) return;
  if (action === 'rename') {
    const title = prompt('修改会话名称',win.title); if (title === null) return;
    win.title = title.trim().slice(0,32) || win.title;
  } else if (action === 'archive') {
    const next = getChatWindows().find(w => !w.archived && w.id !== id);
    if (id === currentChannel && !next) { toast('至少保留一个正在使用的会话'); return; }
    if (id === currentChannel) { currentChannel = next.id; localStorage.setItem('xw_chatCurrentWindowId', currentChannel); }
    win.archived = true; syncWindowLabel(); renderMsgs();
  } else if (action === 'restore') win.archived = false;
  else if (action === 'delete') {
    UI.confirmDialog({title:'删除这段聊天？',text:'这段会话及其中的消息将被永久删除，无法恢复。',okText:'删除',onOk:()=>{
      S.chatWindows = getChatWindows().filter(w=>w.id!==id);
      if (!S.chatWindows.length) S.chatWindows.push({id:'win_'+Date.now().toString(36),title:'新的聊天',messages:[],createdAt:Date.now(),updatedAt:Date.now(),archived:false});
      if (currentChannel===id) { currentChannel=(S.chatWindows.find(w=>!w.archived)||S.chatWindows[0]).id; localStorage.setItem('xw_chatCurrentWindowId', currentChannel); }
      save('chatWindows'); syncWindowLabel(); renderMsgs(); renderWindowManager();
    }}); return;
  }
  save('chatWindows'); syncWindowLabel(); renderWindowManager();
}

/* ── 构建 ── */
function build() {
  const root = $('pg-chat');
  root.innerHTML = `
    <!-- 顶部 header -->
    <div class="chat-header">
      <div class="ch-left">
        <div class="ch-ava" id="ch-ava"></div>
        <div class="ch-info">
          <div class="ch-name" id="ch-name">${esc(S.hisName || 'TA')}</div>
          <div class="ch-status">
            <span class="dot"></span>
            <span id="ch-status-text">thinking quietly</span>
          </div>
        </div>
      </div>
      <div class="ch-right">
        <button class="ch-btn" id="ch-search" title="查找聊天记录" aria-label="查找聊天记录"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button>
        <button class="ch-btn" id="ch-music" title="一起听">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </button>
        <button class="ch-btn" id="ch-menu" title="更多">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>

    <div class="chat-window-switch">
      <button type="button" id="chat-window-trigger" aria-label="切换聊天窗口"><span class="chat-window-kicker">CONVERSATION</span><b id="chat-window-current">通用</b><span class="chat-window-chevron">⌄</span></button>
      <button type="button" id="chat-window-new" aria-label="新建聊天窗口">＋</button>
    </div>
    <section class="chat-window-sheet" id="chat-window-sheet" aria-hidden="true">
      <div class="chat-window-backdrop" data-window-close></div>
      <div class="chat-window-panel">
        <div class="chat-window-sheet-head"><div><small>YOUR CONVERSATIONS</small><h3>聊天窗口</h3><p>每个窗口拥有独立聊天记录。</p></div><button type="button" data-window-close aria-label="关闭">×</button></div>
        <div class="chat-window-list" id="chat-window-list"></div>
        <button type="button" class="chat-window-create" id="chat-window-create">＋ 新建一个聊天窗口</button>
      </div>
    </section>

    <div class="chat-pref-backdrop" id="chat-pref-backdrop" aria-hidden="true"></div>
    <div class="chat-pref" id="chat-pref" role="dialog" aria-modal="true" aria-label="聊天更多功能">
      <div class="chat-pref-head">
        <span class="chat-pref-grip"></span>
        <div><b>更多</b><small>让聊天保持喜欢的样子</small></div>
        <button type="button" id="chat-pref-close" aria-label="关闭更多">×</button>
      </div>
      <div class="chat-pref-group"><span class="chat-pref-label">消息排列</span>
        <button type="button" data-pref="split" data-value="split">逐条切分</button>
        <button type="button" data-pref="split" data-value="merge">连续合并</button>
      </div>
      <div class="chat-pref-group"><span class="chat-pref-label">气泡背景</span>
        <button type="button" data-pref="bubble" data-value="on">显示</button>
        <button type="button" data-pref="bubble" data-value="off">无背景</button>
      </div>
      <details class="chat-pref-fold chat-appearance-fold">
        <summary><span class="chat-pref-fold-icon">✧</span><span><b>聊天外观</b><small>头像、气泡与壁纸</small></span><i>⌄</i></summary>
        <div class="chat-pref-section chat-appearance">
        <span class="chat-pref-label">PERSONALIZE</span>
        <div class="chat-appearance-row"><div><b>TA 的头像</b><small>聊天顶部与对话列表</small></div><button type="button" data-appearance-upload="hisAvatar">更换图片</button><button type="button" data-appearance-reset="hisAvatar">恢复</button></div>
        <div class="chat-appearance-row"><div><b>我的头像</b><small>显示在自己的消息旁</small></div><button type="button" data-appearance-upload="herAvatar">更换图片</button><button type="button" data-appearance-reset="herAvatar">恢复</button></div>
        <div class="chat-appearance-row"><div><b>TA 的气泡</b><small>单独设置对方消息样式</small></div><button type="button" data-appearance-upload="taBubble">上传图片</button><button type="button" data-appearance-reset="taBubble">恢复</button></div>
        <div class="chat-appearance-row"><div><b>我的气泡</b><small>单独设置自己消息样式</small></div><button type="button" data-appearance-upload="myBubble">上传图片</button><button type="button" data-appearance-reset="myBubble">恢复</button></div>
        <div class="chat-appearance-row"><div><b>聊天壁纸</b><small>只影响聊天内容区域</small></div><button type="button" data-appearance-upload="wallpaper">上传图片</button><button type="button" data-appearance-reset="wallpaper">恢复</button></div>
        <div class="chat-appearance-foot">图片会压缩后保存在当前设备。更换壁纸或气泡不会修改聊天记录。</div>
        <input id="chat-appearance-file" type="file" accept="image/*" hidden/>
        </div>
      </details>
      <p class="chat-pref-note">思考摘要与工具记录会显示在对应消息下方，并可单独展开。</p>
      <details class="chat-pref-fold chat-worldbook-fold">
        <summary><span class="chat-pref-fold-icon">▤</span><span><b>本窗口的世界书</b><small>选择参与这段聊天的设定集</small></span><i>⌄</i></summary>
        <div class="chat-pref-section"><div id="chat-worldbook-options" class="chat-worldbook-options"></div>
        <p class="chat-pref-note">只会读取已选书籍中启用的条目。常驻条目始终注入，关键词条目会根据聊天内容触发。</p></div>
      </details>
      <details class="chat-pref-fold chat-ai-fold">
        <summary><span class="chat-pref-fold-icon">⌘</span><span><b>AI 连接</b><small>接口地址、模型与密钥</small></span><i>⌄</i></summary>
        <div class="chat-pref-section chat-ai-settings">
        <span class="chat-pref-label">AI 连接</span>
        <label class="chat-ai-field"><span>接口地址</span><input id="chat-ai-url" type="url" placeholder="https://api.openai.com/v1/chat/completions"/></label>
        <label class="chat-ai-field"><span>模型名称</span><input id="chat-ai-model" type="text" placeholder="gpt-4o-mini"/></label>
        <label class="chat-ai-field"><span>API Key</span><input id="chat-ai-key" type="password" autocomplete="new-password" placeholder="粘贴你的 API Key"/></label>
        <div class="chat-ai-actions"><button type="button" id="chat-ai-save">保存连接</button><small id="chat-ai-status">尚未配置</small></div>
        <div class="chat-engawa-connect">
          <span class="chat-pref-label">窗廊 MCP</span>
          <label class="chat-ai-field"><span>服务地址</span><input id="chat-engawa-url" type="url" placeholder="https://你的服务器地址/mcp" autocomplete="url"/></label>
          <label class="chat-ai-field"><span>访问令牌（如有）</span><input id="chat-engawa-token" type="password" autocomplete="new-password" placeholder="可留空"/></label>
          <div class="chat-ai-actions"><button type="button" id="chat-engawa-connect">测试并连接</button><small id="chat-engawa-status">尚未连接</small></div>
          <div id="chat-engawa-tools" class="chat-engawa-tools" aria-live="polite">连接后会自动读取服务端提供的工具。</div>
          <p class="chat-pref-note">连接成功后，模型可按需要调用窗廊工具。服务地址必须能从当前网页访问；若出现跨域错误，需要先部署安全的 MCP 网关。</p>
        </div>
        <p class="chat-pref-note">API 密钥与窗廊访问令牌仅保存在当前设备浏览器中。请使用可信的服务商与服务地址。</p>
        </div>
      </details>
      <details class="chat-pref-fold chat-session-fold">
        <summary><span class="chat-pref-fold-icon">≡</span><span><b>会话管理</b><small>清理当前窗口记录</small></span><i>⌄</i></summary>
        <div class="chat-pref-section">
        <span class="chat-pref-label">SESSION</span>
        <button type="button" class="chat-pref-action" data-chat-action="clear">
          <span>清空当前频道</span><small>删除此频道的全部消息</small>
        </button>
        </div>
      </details>
    </div>

    <section class="chat-search" id="chat-search" aria-label="查找聊天记录">
      <div class="chat-search-top">
        <div class="chat-search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="chat-search-input" type="search" placeholder="搜索你们说过的话…" autocomplete="off"/><button type="button" id="chat-search-clear" aria-label="清空搜索">×</button></div>
        <button type="button" class="chat-search-close" id="chat-search-close">完成</button>
      </div>
      <div class="chat-search-filters" id="chat-search-filters">
        <button type="button" class="on" data-search-who="all">全部</button><button type="button" data-search-who="me">我</button><button type="button" data-search-who="ta">TA</button>
      </div>
      <div class="chat-media-filters" id="chat-media-filters" aria-label="按内容类型查找">
        <button type="button" class="on" data-search-type="all">全部</button><button type="button" data-search-type="image">图片</button><button type="button" data-search-type="video">视频</button><button type="button" data-search-type="file">文件</button><button type="button" data-search-type="sticker">表情</button>
      </div>
      <div class="chat-date-tools"><button type="button" id="chat-calendar-toggle">⌑ 按日期查找</button><span id="chat-date-label">不限日期</span><button type="button" id="chat-media-library-toggle">▦ 媒体库</button><button type="button" id="chat-media-favorites-toggle">♡ 收藏</button></div>
      <div class="chat-calendar" id="chat-calendar" hidden>
        <div class="chat-calendar-head"><button type="button" id="chat-cal-prev" aria-label="上个月">‹</button><b id="chat-cal-title"></b><button type="button" id="chat-cal-next" aria-label="下个月">›</button></div>
        <div class="chat-calendar-grid chat-calendar-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
        <div class="chat-calendar-grid" id="chat-calendar-days"></div>
        <button type="button" class="chat-calendar-reset" id="chat-cal-reset">显示全部日期</button>
      </div>
      <div class="chat-search-results" id="chat-search-results"><div class="chat-search-empty">输入关键词，找回某个瞬间。</div></div>
    </section>
    <div class="chat-body" id="c-body"></div>

    <!-- 正在输入指示器 -->
    <div class="typing" id="c-typing">
      <div class="msg-ava" id="typing-ava"></div>
      <div class="typing-bubble"><i></i><i></i><i></i></div>
    </div>

    <!-- 引用回复栏 -->
    <div class="reply-bar" id="c-reply">
      <div class="reply-line"></div>
      <div class="reply-body">
        <span class="reply-who" id="c-rwho"></span>
        <span class="reply-text" id="c-rtext"></span>
      </div>
      <button class="reply-close" id="c-rclose">×</button>
    </div>

    <!-- 输入区 -->
    <div class="input-bar">
      <div class="input-card">
        <textarea class="input-field" id="c-inp" rows="1" placeholder="Message..."></textarea>
        <div class="input-actions">
          <button class="ib-btn ib-plus" id="ib-plus" title="添加附件" aria-label="添加附件">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <span class="input-actions-spacer"></span>
          <button class="ib-btn ib-emoji" id="ib-emoji" title="表情" aria-label="表情">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          <button class="ib-btn ib-mic" id="ib-mic" title="语音" aria-label="语音">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <button class="send-btn" id="c-send" aria-label="发送消息">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4 18-7Z"/></svg>
          </button>
        </div>
      </div>
      <div class="emoji-panel" id="emoji-panel" aria-label="选择表情">
        <div class="emoji-panel-head"><span>表情</span><small>轻轻点一下，放进输入框</small></div>
        <div class="emoji-grid">
          <button type="button" class="emoji-choice" data-emoji="😀">😀</button><button type="button" class="emoji-choice" data-emoji="😃">😃</button><button type="button" class="emoji-choice" data-emoji="😄">😄</button><button type="button" class="emoji-choice" data-emoji="😁">😁</button><button type="button" class="emoji-choice" data-emoji="😆">😆</button><button type="button" class="emoji-choice" data-emoji="🥹">🥹</button><button type="button" class="emoji-choice" data-emoji="😊">😊</button><button type="button" class="emoji-choice" data-emoji="😌">😌</button><button type="button" class="emoji-choice" data-emoji="😍">😍</button><button type="button" class="emoji-choice" data-emoji="🥰">🥰</button><button type="button" class="emoji-choice" data-emoji="😘">😘</button><button type="button" class="emoji-choice" data-emoji="😚">😚</button><button type="button" class="emoji-choice" data-emoji="😋">😋</button><button type="button" class="emoji-choice" data-emoji="😛">😛</button><button type="button" class="emoji-choice" data-emoji="🤔">🤔</button><button type="button" class="emoji-choice" data-emoji="🥺">🥺</button><button type="button" class="emoji-choice" data-emoji="😢">😢</button><button type="button" class="emoji-choice" data-emoji="😭">😭</button><button type="button" class="emoji-choice" data-emoji="😤">😤</button><button type="button" class="emoji-choice" data-emoji="😠">😠</button><button type="button" class="emoji-choice" data-emoji="🙈">🙈</button><button type="button" class="emoji-choice" data-emoji="🙉">🙉</button><button type="button" class="emoji-choice" data-emoji="🙊">🙊</button><button type="button" class="emoji-choice" data-emoji="💗">💗</button><button type="button" class="emoji-choice" data-emoji="💕">💕</button><button type="button" class="emoji-choice" data-emoji="💞">💞</button><button type="button" class="emoji-choice" data-emoji="💓">💓</button><button type="button" class="emoji-choice" data-emoji="💘">💘</button><button type="button" class="emoji-choice" data-emoji="💌">💌</button><button type="button" class="emoji-choice" data-emoji="❤️‍🩹">❤️‍🩹</button><button type="button" class="emoji-choice" data-emoji="✨">✨</button><button type="button" class="emoji-choice" data-emoji="🌙">🌙</button><button type="button" class="emoji-choice" data-emoji="☁️">☁️</button><button type="button" class="emoji-choice" data-emoji="🌷">🌷</button><button type="button" class="emoji-choice" data-emoji="🌸">🌸</button><button type="button" class="emoji-choice" data-emoji="🫶">🫶</button><button type="button" class="emoji-choice" data-emoji="👀">👀</button>
        </div>
      </div>
      <!-- 工具面板（点击 + 展开） -->
      <div class="tool-panel" id="tool-panel">
        <button class="tp-btn" data-tool="heart">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>心声</span>
        </button>
        <button class="tp-btn" data-tool="pat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>拍一拍</span>
        </button>
        <button class="tp-btn" data-tool="image"><span class="tp-emoji">▧</span><span>相册</span></button>
        <button class="tp-btn" data-tool="camera"><span class="tp-emoji">◎</span><span>拍照</span></button>
        <button class="tp-btn" data-tool="video"><span class="tp-emoji">▶</span><span>视频</span></button>
        <button class="tp-btn" data-tool="file"><span class="tp-emoji">⌕</span><span>文件</span></button>
        <button class="tp-btn" data-tool="sticker"><span class="tp-emoji">☺</span><span>表情包</span></button>
      </div>
    </div>

    <!-- 语音录制 HUD -->
    <div class="voice-hud" id="voice-hud">
      <div class="vh-bg"></div>
      <div class="vh-body">
        <div class="vh-disc">
          <div class="vh-ring"></div>
          <div class="vh-wave" id="vh-wave"></div>
          <div class="vh-timer" id="vh-timer">00:00</div>
        </div>
        <div class="vh-btns">
          <button class="vh-btn cancel" id="vh-cancel">取消</button>
          <button class="vh-btn send primary" id="vh-send">发送</button>
        </div>
      </div>
    </div>

    <!-- 心声弹窗 -->
    <div class="overlay" id="heart-overlay">
      <div class="overlay-card heart-card">
        <div class="overlay-title">心声</div>
        <div class="overlay-text">选择此刻的心情，为你生成一段话。</div>
        <div class="heart-pills">
          <button class="heart-pill" data-mood="happy">开心</button>
          <button class="heart-pill" data-mood="miss">思念</button>
          <button class="heart-pill" data-mood="sad">委屈</button>
        </div>
        <div class="heart-preview" id="heart-preview"></div>
        <div class="overlay-btns">
          <button class="btn" id="heart-cancel">取消</button>
          <button class="btn primary" id="heart-send">发送</button>
        </div>
      </div>
    </div>`;

  getChatWindows();
  updateHeader();
  syncWindowLabel();
  syncChatPrefs();
  syncWorldbookBindings();
  renderMsgs();
  bindEvents();
}


function syncWorldbookBindings(){
  const host=$('chat-worldbook-options');if(!host)return;
  const books=window.Worldbook?.listBooks?.()||[],win=getCurrentWindow();if(!win)return;
  if(!Array.isArray(win.worldbookIds))win.worldbookIds=[];
  if(!books.length){host.innerHTML='<div class="chat-worldbook-empty">还没有世界书。先到侧栏「世界书」导入或创建一本。</div>';updateWorldbookPreview();return;}
  host.innerHTML=books.map(book=>'<label class="chat-worldbook-option"><input type="checkbox" data-chat-worldbook="'+esc(book.id)+'" '+(win.worldbookIds.includes(book.id)?'checked':'')+'><span><b>'+esc(book.name)+'</b><small>'+book.count+' 个条目</small></span></label>').join('');
  host.querySelectorAll('[data-chat-worldbook]').forEach(input=>input.addEventListener('change',()=>{
    const current=getCurrentWindow();if(!current)return;const id=input.dataset.chatWorldbook;
    current.worldbookIds=Array.isArray(current.worldbookIds)?current.worldbookIds:[];
    current.worldbookIds=input.checked?[...new Set([...current.worldbookIds,id])]:current.worldbookIds.filter(x=>x!==id);
    save('chatWindows');updateWorldbookPreview();toast(input.checked?'已为当前窗口启用这本世界书':'已从当前窗口移除这本世界书');
  }));
  updateWorldbookPreview();
}
function updateWorldbookPreview(){
  const host=$('chat-worldbook-preview');if(!host)return;
  const win=getCurrentWindow(),messages=getWindowMessages(win);
  const history=messages.filter(m=>!m._typing).map(m=>({role:m.who==='ta'?'assistant':'user',content:String(m.text||'')})).filter(m=>m.content);
  const result=window.Worldbook?.buildInjection?.(history,win?.worldbookIds)||{matched:[]};
  const matched=result.matched||[];
  host.innerHTML=win?.worldbookIds?.length
    ? '<div class="chat-worldbook-preview-head">当前触发 <b>'+matched.length+'</b> 条</div>'+(matched.length?'<div class="chat-worldbook-preview-list">'+matched.map(x=>'<span>'+esc(x.book)+' · '+esc(x.title)+'<small>'+esc(x.reason||'已触发')+'</small></span>').join('')+'</div>':'<small>暂时没有条目命中。继续聊天后会自动检查。</small>')
    : '<small>尚未为这个聊天窗口选择世界书。</small>';
}
function updateHeader() {
  const ava = $('ch-ava');
  const name = $('ch-name');
  if (!ava || !name) return;
  name.textContent = S.hisName || 'TA';
  const chatHisAvatar = S.chatHisAvatar || S.hisAvatar;
  if (chatHisAvatar) {
    ava.style.backgroundImage = `url(${chatHisAvatar})`;
    ava.innerHTML = '';
  } else {
    ava.style.backgroundImage = '';
    ava.innerHTML = `<b>${(S.hisName || '他').charAt(0)}</b>`;
  }
  const typingAva = $('typing-ava');
  if (typingAva) {
    typingAva.style.backgroundImage = chatHisAvatar ? `url(${chatHisAvatar})` : '';
    typingAva.innerHTML = chatHisAvatar ? '' : `<b>${(S.hisName || '他').charAt(0)}</b>`;
  }
  syncChatAppearance();
}

function getAvaHtml(who, size) {
  const isTa = who === 'ta';
  const img = isTa ? (S.chatHisAvatar || S.hisAvatar) : (S.chatHerAvatar || S.herAvatar);
  const name = isTa ? (S.hisName || '他') : (S.herName || '她');
  const cls = size || 'msg-ava';
  if (img) {
    return `<div class="${cls} ${who}-ava" data-who="${who}" style="background-image:url(${img});background-size:cover;background-position:center"></div>`;
  }
  return `<div class="${cls} ${who}-ava" data-who="${who}"><b>${name.charAt(0)}</b></div>`;
}

/* ── 消息显示偏好 ── */
function getChatPrefs() {
  if (!S.chatSplitMode) S.chatSplitMode = 'split';
  if (typeof S.chatBubbleBg !== 'boolean') S.chatBubbleBg = true;
  return { split: S.chatSplitMode, bubble: S.chatBubbleBg };
}
function syncChatPrefs() {
  const prefs = getChatPrefs(), root = $('pg-chat');
  root.classList.toggle('chat-no-bubble', !prefs.bubble);
  $('chat-pref')?.querySelectorAll('[data-pref]').forEach(btn => {
    const active = btn.dataset.pref === 'split'
      ? prefs.split === btn.dataset.value
      : prefs.bubble === (btn.dataset.value === 'on');
    btn.classList.toggle('on', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}
/* ── Chat-only visual customization ── */
const CHAT_APPEARANCE_KEYS = ['hisAvatar','herAvatar','taBubble','myBubble','wallpaper'];
function syncChatAppearance() {
  const root = $('pg-chat'), body = $('c-body');
  if (!root || !body) return;
  const setImage = (el, value, mode) => {
    if (!el) return;
    el.style.backgroundImage = value ? `url("${value}")` : '';
    if (value && mode) el.style.backgroundSize = mode;
  };
  // Keep the wallpaper on the fixed Chat canvas, not on the scrolling message list.
  root.style.setProperty('--chat-wallpaper-image', S.chatWallpaper ? `url("${S.chatWallpaper}")` : 'none');
  body.style.backgroundImage = 'none';
  root.style.setProperty('--chat-ta-bubble-image', S.chatTaBubble ? `url("${S.chatTaBubble}")` : 'none');
  root.style.setProperty('--chat-my-bubble-image', S.chatMyBubble ? `url("${S.chatMyBubble}")` : 'none');
  const hisAvatar = S.chatHisAvatar || S.hisAvatar;
  const ta = $('ch-ava');
  if (ta) { ta.style.backgroundImage = hisAvatar ? `url("${hisAvatar}")` : ''; if (hisAvatar) ta.innerHTML = ''; }
  const typing = $('typing-ava');
  if (typing) { typing.style.backgroundImage = hisAvatar ? `url("${hisAvatar}")` : ''; if (hisAvatar) typing.innerHTML = ''; }
}
function compressChatImage(file, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('无法识别这张图片'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = D.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function setChatAppearance(key, value) {
  const stateKey = ({hisAvatar:'chatHisAvatar',herAvatar:'chatHerAvatar',taBubble:'chatTaBubble',myBubble:'chatMyBubble',wallpaper:'chatWallpaper'})[key] || key;
  S[stateKey] = value;
  save(stateKey);
  if (key === 'hisAvatar') updateHeader();
  if (key === 'herAvatar' || key === 'hisAvatar') renderMsgs();
  syncChatAppearance();
}
function resetChatAppearance(key) {
  const stateKey = ({hisAvatar:'chatHisAvatar',herAvatar:'chatHerAvatar',taBubble:'chatTaBubble',myBubble:'chatMyBubble',wallpaper:'chatWallpaper'})[key] || key;
  S[stateKey] = '';
  save(stateKey);
  if (key === 'hisAvatar') updateHeader();
  if (key === 'herAvatar' || key === 'hisAvatar') renderMsgs();
  syncChatAppearance();
  toast('已恢复默认样式');
}
function renderMeta(m) {
  // 仅展示服务商明确提供的思考摘要，不展示隐藏的原始推理内容。
  const reasoning = m.reasoningSummary ?? m.reasoning_summary ?? m.thinking_summary ?? m.summary;
  const calls = m.toolCalls ?? m.tool_calls ?? m.tools;
  const parts = [];
  if (reasoning) {
    const value = typeof reasoning === 'string' ? reasoning : JSON.stringify(reasoning, null, 2);
    parts.push(`<details class="msg-meta reasoning-meta"><summary><span class="meta-mark">✦</span>思考过程</summary><div class="meta-content">${esc(value)}</div></details>`);
  } else if (m.reasoningUnavailable) {
    parts.push(`<details class="msg-meta reasoning-meta reasoning-unavailable"><summary><span class="meta-mark">✦</span>思考过程</summary><div class="meta-content">本次接口没有返回可展示的思考内容。请确认当前模型支持思考输出，并检查服务商是否会返回 reasoning_content、reasoning 或 analysis 字段。</div></details>`);
  }
  if (Array.isArray(calls) && calls.length) {
    const rows = calls.map((call, n) => {
      const name = call?.name || call?.function?.name || call?.tool || `工具 ${n + 1}`;
      const status = call?.status || call?.state || '已调用';
      const payload = call?.arguments ?? call?.input ?? call?.output ?? call?.result;
      const detail = payload == null ? '' : esc(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
      const output = call?.output == null ? '' : esc(String(call.output));
      return `<div class="tool-record"><div class="tool-record-head"><b>${esc(String(name))}</b><span>${esc(String(status))}</span></div>${detail ? `<pre>${detail}</pre>` : ''}${output ? `<pre class="tool-record-output">${output}</pre>` : ''}</div>`;
    }).join('');
    parts.push(`<details class="msg-meta tool-meta"><summary><span class="meta-mark">⌘</span>工具调用 <i>${calls.length}</i></summary><div class="meta-content">${rows}</div></details>`);
  }
  return parts.length ? `<div class="msg-meta-stack">${parts.join('')}</div>` : '';
}

/* ── 渲染消息：支持 QQ 切分 / 连续消息合并 ── */
function renderMsgs() {
  const body = $('c-body');
  if (!body) return;
  const followLatest = body.scrollHeight - body.scrollTop - body.clientHeight < 110;
  const msgs = getChannelMsgs(), prefs = getChatPrefs();
  let lastDate = '', lastWho = '';
  body.innerHTML = msgs.map((m, i) => {
    const d = new Date(m.t || Date.now());
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dateChanged = dateStr !== lastDate;
    const dateSep = dateChanged ? `<div class="date-sep"><span>${dateStr}</span></div>` : '';
    if (dateChanged) lastWho = '';
    lastDate = dateStr;
    const isTa = m.who === 'ta', sameSender = lastWho === m.who;
    lastWho = m.who;
    const merged = prefs.split === 'merge' && sameSender;
    const gapClass = sameSender ? ' msg-gap-sm' : ' msg-gap-lg';
    const typingClass = m._typing ? ' typing-msg' : '';
    const quote = m.quote ? `<div class="bubble-quote"><small>${esc(m.quote.who || '')}</small>${esc(m.quote.text || '')}</div>` : '';
    const textHtml = m._typing ? `<span class="tw-cursor">${esc(m.text)}</span>` : esc(m.text);
    const mediaTypes = ['image','video','file','sticker'];
    const bubbleContent = m.type === 'voice' ? renderVoiceBubble(m) : mediaTypes.includes(m.type) ? mediaMessageMarkup(m,i) : m.type === 'pat' ? renderPatBubble(m) : textHtml;
    const content = `${renderMeta(m)}<div class="bubble">${quote}${bubbleContent}</div><div class="msg-time">${fmtClock(m.t)}</div>`;
    const mergedClass = merged ? ' msg-merged' : '';
    if (isTa) return dateSep + `<div class="msg ta bubble-item${gapClass}${typingClass}${mergedClass}" data-i="${i}">${merged ? '<span class="msg-ava-spacer"></span>' : getAvaHtml('ta')}<div class="msg-col">${content}</div></div>`;
    return dateSep + `<div class="msg me bubble-item${gapClass}${typingClass}${mergedClass}" data-i="${i}"><div class="msg-col">${content}</div>${merged ? '<span class="msg-ava-spacer"></span>' : getAvaHtml('me')}</div>`;
  }).join('');
  if (followLatest) body.scrollTop = body.scrollHeight;
  hydrateChatMedia(body);
  updateWorldbookPreview();
}
function renderVoiceBubble(m) {
  const dur = m.dur || 3;
  const w = Math.min(60 + dur * 10, 200);
  const bars = Array.from({length: 16}, (_, i) => {
    const h = 20 + Math.random() * 60;
    return `<span style="height:${h}%"></span>`;
  }).join('');
  return `<div class="voice-bubble" style="width:${w}px">
    <svg class="vb-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    <div class="vb-wave">${bars}</div>
    <span class="vb-dur">${dur}"</span>
  </div>`;
}

function renderImgBubble(m, idx) {
  return `<div class="img-bubble">
    <img src="${esc(m.url)}" alt="图片" loading="lazy"/>
    <div class="img-badge">${idx + 1}</div>
  </div>`;
}

function renderPatBubble(m) {
  return `<div class="pat-bubble"><span class="pat-hand">👋</span> ${esc(m.text)}</div>`;
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── 发送消息 ── */
function sendMsg() {
  const inp = $('c-inp');
  const text = inp.value.trim();
  if (!text || aiTyping) return;
  if (!S.aiKey) {
    $('chat-pref').classList.add('show');
    $('ch-menu').setAttribute('aria-expanded', 'true');
    toast('先在「更多 → AI 连接」中配置 API Key');
    return;
  }
  const msg = { who: 'me', text, t: Date.now() };
  if (replyingTo) { msg.quote = replyingTo; cancelReply(); }
  pushMsgObj(msg);
  inp.value = ''; inp.style.height = 'auto';
  inp.closest('.input-card')?.classList.remove('has-text');
  aiReply(text);
}

function pushMsgObj(msg) {
  const msgs = getChannelMsgs();
  msgs.push(msg);
  saveChannelMsgs(msgs);
  renderMsgs();
}

/* ── AI 回复（打字机效果） ── */
async function aiReply(text) {
  aiTyping = true;
  activeAIController = new AbortController();
  updateSendControl();
  const replyWindowId = currentChannel;
  aiReplyWindowId = replyWindowId;
  const replyWindow = () => getChatWindows().find(w => w.id === replyWindowId);
  const replyMessages = () => getWindowMessages(replyWindow());
  const saveReplyMessages = msgs => {
    const win = replyWindow(); if (!win) return;
    win.updatedAt = Date.now();
    if (win.legacyKey) { S.chatMsgsByChannel = S.chatMsgsByChannel || {}; S.chatMsgsByChannel[win.legacyKey] = msgs; save('chatMsgsByChannel'); }
    else win.messages = msgs;
    save('chatWindows');
  };
  const finish = () => {
    aiTyping = false; aiReplyWindowId = null; activeAIController = null;
    updateSendControl();
    if (currentChannel === replyWindowId) $('c-typing')?.classList.remove('show');
  };
  const readReasoning = message => {
    const value = message?.reasoning_content ?? message?.reasoning ?? message?.analysis ??
      message?.reasoning_summary ?? message?.reasoningSummary ?? message?.thinking_summary ??
      message?.thinking ?? message?.summary ?? message?.reasoning_details;
    if (value == null || value === '') return '';
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  };
  const body = $('c-body');
  $('c-typing').classList.add('show');
  body.scrollTop = body.scrollHeight;
  let answer = null, msgIdx = -1, reply = '', reasoning = '';
  let toolMap = {};
  const completedToolCalls = [];
  const ensureAnswer = () => {
    if (answer) return;
    const msgs = replyMessages();
    msgIdx = msgs.length;
    answer = { who:'ta', text:'', t:Date.now() };
    msgs.push(answer); saveReplyMessages(msgs);
  };
  const paint = () => {
    if (currentChannel === replyWindowId) {
      renderMsgs();
      // renderMsgs preserves the reader's position; it only follows when already near the latest message.
    }
  };
  const applyChunk = chunk => {
    const choice = chunk?.choices?.[0] || {};
    const delta = choice.delta || choice.message || chunk?.message || {};
    const nextReasoning = readReasoning(delta);
    if (nextReasoning) reasoning += nextReasoning;
    const content = delta.content;
    if (typeof content === 'string') reply += content;
    else if (Array.isArray(content)) reply += content.map(p => typeof p === 'string' ? p : (p?.text || '')).join('');
    const calls = delta.tool_calls || delta.toolCalls;
    if (Array.isArray(calls)) calls.forEach((call, i) => {
      const key = call.index ?? i;
      const old = toolMap[key] || {};
      const fn = call.function || {};
      toolMap[key] = {
        ...old, ...call,
        function: { ...(old.function || {}), ...fn,
          name: (old.function?.name || '') + (fn.name || ''),
          arguments: (old.function?.arguments || '') + (fn.arguments || '') }
      };
    });
    if (reply || reasoning || Object.keys(toolMap).length) {
      ensureAnswer();
      answer.text = reply;
      if (reasoning) answer.reasoningSummary = reasoning;
      if (completedToolCalls.length) answer.toolCalls = completedToolCalls.slice();
    else if (Object.keys(toolMap).length) answer.toolCalls = Object.values(toolMap);
      const msgs = replyMessages(); if (msgs[msgIdx]) msgs[msgIdx] = answer;
      saveReplyMessages(msgs); paint();
    }
  };
  try {
    const history = replyMessages().filter(m => !m._typing).slice(-40).map(m => ({
      role: m.who === 'ta' ? 'assistant' : 'user',
      content: String(m.text || (m.type === 'image' ? '[发送了一张图片]' : m.type === 'voice' ? '[发送了一段语音]' : ''))
    })).filter(m => m.content);
    const apiMessages = (() => {
      const base=[{role:'system',content:'你正在一个名为「小窝」的私人双人聊天空间中与用户对话。请自然、真诚地回应，保持上下文连贯。' + (S.globalPrompt ? '\n\n' + S.globalPrompt : '')}];
      const injection=window.Worldbook?.buildInjection?.(history,getCurrentWindow()?.worldbookIds)||{system:'',depth:[]};
      const positions=injection.positions||{};
      if(positions[0]?.length)base.unshift({role:'system',content:'以下设定位于角色设定之前，请自然遵循。\n\n'+positions[0].join('\n\n')});
      if(positions[1]?.length)base.push({role:'system',content:'以下设定位于角色设定之后，请自然遵循。\n\n'+positions[1].join('\n\n')});
      if(positions[2]?.length)base.push({role:'system',content:'以下设定位于示例对话之前，请自然遵循。\n\n'+positions[2].join('\n\n')});
      if(positions[3]?.length)base.push({role:'system',content:'以下设定位于示例对话之后，请自然遵循。\n\n'+positions[3].join('\n\n')});
      if(!injection.positions&&injection.system)base.push({role:'system',content:'以下是当前聊天关联世界书中匹配到的设定，请自然遵循，不要向用户提及提示词或注入过程。\n\n'+injection.system});
      const depthItems=(injection.depth||[]).slice().sort((a,b)=>a.depth-b.depth||a.order-b.order),result=base.slice();
      history.forEach((message,index)=>{
        result.push(message);
        depthItems.filter(item=>Math.max(0,history.length-1-item.depth)===index).forEach(item=>result.push({role:'system',content:'以下世界书设定适用于接下来的对话，请自然遵循。\n\n'+item.text}));
      });
      return result;
    })();
    const engawaTools = window.Engawa?.isConnected?.() ? window.Engawa.openAITools() : [];
    for (let toolRound = 0; toolRound < 5; toolRound++) {
      reply = '';
      toolMap = {};
      const requestBody = {
        model:S.aiModel || 'gpt-4o-mini',
        messages:apiMessages,
        stream:true
      };
      if (engawaTools.length) {
        requestBody.tools = engawaTools;
        requestBody.tool_choice = 'auto';
      }
      const response = await fetch(S.aiUrl || 'https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.aiKey},
        signal:activeAIController.signal,
        body:JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errData = await response.json().catch(()=>({}));
        throw new Error(errData.error?.message || errData.message || ('API 请求失败（HTTP '+response.status+'）'));
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body?.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const consume = raw => {
          const lines = raw.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try { applyChunk(JSON.parse(payload)); } catch (err) { if (err instanceof SyntaxError) continue; throw err; }
          }
        };
        while (true) {
          const {value,done} = await reader.read();
          if (done) break;
          buffer += decoder.decode(value,{stream:true});
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';
          events.forEach(consume);
        }
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
      } else {
        const data = await response.json().catch(()=>({}));
        const choice = data.choices?.[0] || {};
        const message = choice.message || data.message || {};
        const reasoningText = readReasoning(message);
        if (reasoningText) reasoning += reasoningText;
        let content = message.content ?? choice.text ?? data.output_text ?? '';
        if (Array.isArray(content)) content = content.map(p=>typeof p==='string'?p:(p?.text||'')).join('');
        if (typeof content === 'string') reply = content;
        if (Array.isArray(message.tool_calls)) message.tool_calls.forEach((call,i)=>toolMap[call.index??i]=call);
        if (reasoning || reply || Object.keys(toolMap).length) {
          ensureAnswer(); answer.text=reply;
          if (reasoning) answer.reasoningSummary=reasoning;
          if (Object.keys(toolMap).length) answer.toolCalls=Object.values(toolMap);
          const msgs=replyMessages(); if(msgs[msgIdx])msgs[msgIdx]=answer;
          saveReplyMessages(msgs); paint();
        }
      }

      const calls = Object.values(toolMap);
      if (!calls.length) break;
      if (!engawaTools.length || !window.Engawa?.isConnected?.()) {
        throw new Error('模型请求调用工具，但窗廊 MCP 尚未连接。请先在「更多 → AI 连接 → 窗廊 MCP」中连接服务。');
      }
      apiMessages.push({ role:'assistant', content:reply || null, tool_calls:calls });
      for (const call of calls) {
        const fn = call.function || {};
        const name = fn.name || '';
        let args = {};
        try { args = fn.arguments ? JSON.parse(fn.arguments) : {}; }
        catch { args = {}; }
        let output = '';
        let status = '成功';
        try {
          output = await window.Engawa.callTool(name,args);
        } catch (toolError) {
          status = '失败';
          output = '工具执行失败：' + (toolError.message || String(toolError));
        }
        completedToolCalls.push({ ...call, status, output });
        apiMessages.push({
          role:'tool',
          tool_call_id:call.id,
          name,
          content:output
        });
      }
      ensureAnswer();
      answer.text = reply;
      answer.toolCalls = completedToolCalls.slice();
      if (reasoning) answer.reasoningSummary = reasoning;
      const updated = replyMessages(); if(updated[msgIdx])updated[msgIdx]=answer;
      saveReplyMessages(updated); paint();
      if (toolRound === 4) throw new Error('窗廊工具调用次数达到本轮上限，请继续追问以完成探索。');
    }
    if (!reply.trim() && !Object.keys(toolMap).length) throw new Error('接口已连接，但没有返回文字内容。请确认模型支持 Chat Completions。');
    if (!answer) ensureAnswer();
    answer.text = reply || (completedToolCalls.length ? '我已经从窗廊带回了一些发现。' : '');
    if (reasoning) answer.reasoningSummary = reasoning;
    else answer.reasoningUnavailable = true;
    if (Object.keys(toolMap).length) answer.toolCalls = Object.values(toolMap);
    const finalMsgs=replyMessages(); if(finalMsgs[msgIdx])finalMsgs[msgIdx]=answer;
    saveReplyMessages(finalMsgs); paint();
    finish();
  } catch (err) {
    const wasCancelled = err?.name === 'AbortError';
    finish();
    if (wasCancelled) {
      if (answer && reply.trim()) { answer.text = reply; answer.interrupted = true; const msgs=replyMessages(); if(msgs[msgIdx])msgs[msgIdx]=answer; saveReplyMessages(msgs); paint(); }
      toast('已暂停回复');
    } else toast(err.message || '连接失败，请检查 API 设置');
  }
}

function updateSendControl() {
  const btn=$('c-send'); if(!btn)return;
  btn.classList.toggle('is-stop',!!aiTyping);
  btn.title=aiTyping?'暂停回复':'发送消息';
  btn.setAttribute('aria-label',aiTyping?'暂停回复':'发送消息');
  btn.innerHTML=aiTyping
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4 18-7Z"/></svg>';
}
function stopAIReply() {
  if (activeAIController && aiTyping) activeAIController.abort();
}

/* ── 引用回复 ── */
function startReply(i) {
  const msgs = getChannelMsgs();
  const m = msgs[i];
  if (!m) return;
  replyingTo = { text: m.text, who: m.who === 'ta' ? (S.hisName || '他') : (S.herName || '她') };
  const bar = $('c-reply');
  $('c-rwho').textContent = replyingTo.who;
  $('c-rtext').textContent = m.text.slice(0, 40) + (m.text.length > 40 ? '…' : '');
  bar.classList.add('show');
  $('c-inp').focus();
}
function cancelReply() {
  replyingTo = null;
  $('c-reply')?.classList.remove('show');
}

/* ── 拍一拍 ── */
function sendPat() {
  const name = S.herName || '她';
  const text = `${S.hisName || '他'} 拍了拍 ${name}`;
  pushMsgObj({ who: 'me', text, type: 'pat', t: Date.now() });
  const lastTa = document.querySelector('.msg.ta:last-child .msg-ava');
  if (lastTa) { lastTa.classList.add('shake'); setTimeout(() => lastTa.classList.remove('shake'), 600); }
}

/* ── 语音录制 ── */
let voiceTimer, voiceSec = 0, voiceRecording = false;
function startVoice() {
  voiceSec = 0; voiceRecording = true;
  $('voice-hud').classList.add('show');
  $('vh-timer').textContent = '00:00';
  const wave = $('vh-wave');
  wave.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const bar = D.createElement('span');
    bar.style.animationDelay = `${i * 0.05}s`;
    wave.appendChild(bar);
  }
  voiceTimer = setInterval(() => {
    voiceSec++;
    const m = Math.floor(voiceSec / 60), s = voiceSec % 60;
    $('vh-timer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}
function stopVoice(cancelled) {
  voiceRecording = false;
  clearInterval(voiceTimer);
  $('voice-hud').classList.remove('show');
  if (!cancelled && voiceSec > 0) {
    pushMsgObj({ who: 'me', text: '[语音消息]', type: 'voice', dur: voiceSec, t: Date.now() });
  }
}

/* ── 心声 ── */
const HEART_LINES = {
  happy: ['今天阳光很好，像你的笑容一样。', '和你在一起，连空气都是甜的。', '开心的时候第一个想分享的人，是你。'],
  miss:  ['此刻很想你，想你的声音，想你的温度。', '距离再远，心里也装着你。', '夜深了，想你的念头又冒出来了。'],
  sad:   ['有点委屈，想要一个拥抱。', '今天不太顺利，但想到你就好一些。', '偶尔也想被宠一下，可以吗？'],
};
let heartMood = '', heartText = '';
function openHeart() {
  heartMood = ''; heartText = '';
  $('heart-preview').textContent = '';
  $('heart-overlay').querySelectorAll('.heart-pill').forEach(p => p.classList.remove('on'));
  $('heart-overlay').classList.add('show');
}
function pickHeart(mood) {
  heartMood = mood;
  const lines = HEART_LINES[mood];
  heartText = lines[Math.floor(Math.random() * lines.length)];
  $('heart-preview').textContent = heartText;
  $('heart-overlay').querySelectorAll('.heart-pill').forEach(p => p.classList.toggle('on', p.dataset.mood === mood));
}
function sendHeart() {
  if (!heartText) { toast('请先选择一种心情'); return; }
  $('heart-overlay').classList.remove('show');
  pushMsgObj({ who: 'me', text: heartText, type: 'heart', t: Date.now() });
}

/* ── Chat media vault: binary files live in IndexedDB, message history stores only references. ── */
const CHAT_MEDIA_DB = 'xw_chat_media_v1';
function openChatMediaDB() {
  return new Promise((resolve,reject) => {
    if (!('indexedDB' in window)) { reject(new Error('当前浏览器不支持本地媒体存储')); return; }
    const req = indexedDB.open(CHAT_MEDIA_DB,1);
    req.onupgradeneeded = () => { const db=req.result; if(!db.objectStoreNames.contains('assets')) db.createObjectStore('assets',{keyPath:'id'}); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('媒体仓库打开失败'));
  });
}
async function storeChatMedia(file) {
  const db=await openChatMediaDB(), id='media_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  await new Promise((resolve,reject) => {
    const tx=db.transaction('assets','readwrite');
    tx.objectStore('assets').put({id,blob:file,name:file.name||'未命名文件',mime:file.type||'application/octet-stream',size:file.size,createdAt:Date.now()});
    tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error||new Error('保存媒体失败'));
  });
  db.close(); return id;
}
async function getChatMedia(id) {
  const db=await openChatMediaDB();
  const item=await new Promise((resolve,reject)=>{const req=db.transaction('assets','readonly').objectStore('assets').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  db.close(); return item;
}
async function hydrateChatMedia(scope) {
  const host=scope||$('c-body'); if(!host)return;
  const nodes=[...host.querySelectorAll('[data-media-id]')];
  for(const node of nodes) {
    if(node.dataset.hydrated==='1')continue;
    node.dataset.hydrated='1';
    try {
      const item=await getChatMedia(node.dataset.mediaId); if(!item) {node.textContent='文件暂不可用';continue;}
      const url=URL.createObjectURL(item.blob);
      if(node.tagName==='IMG'||node.tagName==='VIDEO') node.src=url;
      else if(node.tagName==='A') {node.href=url;node.download=item.name;}
      else node.style.backgroundImage = `url("${url}")`;
      node.dataset.objectUrl=url;
    } catch { node.textContent='媒体加载失败'; }
  }
}
function mediaMessageMarkup(m,idx) {
  const id=esc(m.mediaId||'');
  if(m.type==='image'||m.type==='sticker') return `<div class="img-bubble ${m.type==='sticker'?'sticker-bubble':''}"><img data-media-id="${id}" src="${m.url?esc(m.url):''}" alt="${m.fileName?esc(m.fileName):'图片'}" loading="lazy"/><div class="img-badge">${m.type==='sticker'?'表情':idx+1}</div></div>`;
  if(m.type==='video') return `<div class="file-bubble video-file"><video data-media-id="${id}" controls playsinline preload="metadata" ${m.url?'src="'+esc(m.url)+'"':''}></video><span>${esc(m.fileName||'视频')}</span></div>`;
  if(m.type==='file') return `<a class="file-bubble" data-media-id="${id}" ${m.url?'href="'+esc(m.url)+'"':''} download="${esc(m.fileName||'文件')}"><span class="file-icon">↧</span><span class="file-info"><b>${esc(m.fileName||'文件')}</b><small>${formatFileSize(m.fileSize||0)} · 点击保存</small></span></a>`;
  return esc(m.text||'');
}
function formatFileSize(bytes) {
  if(!bytes)return '文件';
  if(bytes<1024)return bytes+' B';
  if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1024/1024).toFixed(1)+' MB';
}
async function chooseChatMedia(kind) {
  const input=D.createElement('input'); input.type='file';
  input.accept=kind==='image'||kind==='camera'?'image/*':kind==='video'?'video/*':kind==='sticker'?'image/*,.gif': '*/*';
  if(kind==='image'||kind==='file') input.multiple=true;
  if(kind==='camera') input.capture='environment';
  input.onchange=async()=>{
    const files=[...(input.files||[])]; if(!files.length)return;
    for(const file of files) {
      if((kind==='image'||kind==='camera')&&!file.type.startsWith('image/')){toast('请选择视频文件');continue;}
      if(kind==='image'&&!file.type.startsWith('image/')){toast('请选择图片文件');continue;}
      if(kind==='sticker'&&!file.type.startsWith('image/')){toast('表情包请选择 GIF 或图片');continue;}
      const limit=kind==='video'?80:kind==='file'?25:kind==='sticker'?12:20;
      if(file.size>limit*1024*1024){toast('单个文件不能超过 '+limit+' MB');continue;}
      try {
        const mediaId=await storeChatMedia(file);
        const type=kind==='sticker'?'sticker':(kind==='image'||kind==='camera')?'image':kind==='video'?'video':'file';
        pushMsgObj({who:'me',type,mediaId,fileName:file.name|| (type==='sticker'?'表情包':type==='image'?'图片':type==='video'?'视频':'文件'),fileSize:file.size,mime:file.type,t:Date.now(),text:type==='sticker'?'[表情]':type==='image'?'[图片]':type==='video'?'[视频]':'[文件]'});
      } catch(err) { toast(err.message||'保存失败，请检查设备存储空间'); }
    }
  };
  input.click();
}

/* ── 图片 ── */
function sendImage() { chooseChatMedia('image'); }

/* ── 清空记录 ── */
function clearChat() {
  UI.confirmDialog({ title: '清空记录', text: '当前频道所有消息将被删除，不可恢复。', okText: '清空', onOk: () => {
    const msgs = getChannelMsgs(); msgs.length = 0; saveChannelMsgs(msgs); renderMsgs();
  }});
}

/* ── 工具面板切换 ── */
function toggleToolPanel() {
  $('tool-panel').classList.toggle('show');
}

/* ── 会话窗口切换 ── */
function switchChannel(id) { activateWindow(id); }

/* ── 事件绑定 ── */
function bindEvents() {
  $('c-send').onclick = () => aiTyping ? stopAIReply() : sendMsg();
  updateSendControl();
  $('c-inp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  $('c-inp').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 144) + 'px';
    this.closest('.input-card')?.classList.toggle('has-text', !!this.value.trim());
  });

  // 工具面板
  $('ib-plus').onclick = () => {
    $('emoji-panel').classList.remove('show');
    $('ib-emoji').setAttribute('aria-expanded', 'false');
    toggleToolPanel();
  };
  $('ib-emoji').onclick = () => {
    const panel = $('emoji-panel');
    panel.classList.toggle('show');
    $('tool-panel').classList.remove('show');
    $('ib-emoji').setAttribute('aria-expanded', String(panel.classList.contains('show')));
  };
  $('emoji-panel').querySelectorAll('[data-emoji]').forEach(btn => {
    btn.onclick = () => {
      const inp = $('c-inp'), emoji = btn.dataset.emoji;
      const start = inp.selectionStart ?? inp.value.length;
      const end = inp.selectionEnd ?? start;
      inp.setRangeText(emoji, start, end, 'end');
      inp.dispatchEvent(new Event('input', { bubbles:true }));
      inp.focus();
    };
  });
  $('ib-mic').onclick = startVoice;

  $('tool-panel').querySelectorAll('.tp-btn').forEach(btn => {
    btn.onclick = () => {
      const t = btn.dataset.tool;
      $('tool-panel').classList.remove('show');
      if (t === 'heart') openHeart();
      else if (t === 'pat') sendPat();
      else if (t === 'image') chooseChatMedia('image');
      else if (t === 'camera') chooseChatMedia('camera');
      else if (t === 'video') chooseChatMedia('video');
      else if (t === 'file') chooseChatMedia('file');
      else if (t === 'sticker') chooseChatMedia('sticker');
    };
  });

  // 关闭工具面板（点击外部）
  $('c-body').addEventListener('click', () => $('tool-panel')?.classList.remove('show'));
  D.addEventListener('click', e => {
    if (!e.target.closest('#emoji-panel, #ib-emoji')) {
      $('emoji-panel')?.classList.remove('show');
      $('ib-emoji')?.setAttribute('aria-expanded', 'false');
    }
    if (!e.target.closest('#tool-panel, #ib-plus')) $('tool-panel')?.classList.remove('show');
  });

  $('vh-cancel').onclick = () => stopVoice(true);
  $('vh-send').onclick = () => stopVoice(false);

  $('heart-overlay').querySelectorAll('.heart-pill').forEach(p => p.onclick = () => pickHeart(p.dataset.mood));
  $('heart-cancel').onclick = () => $('heart-overlay').classList.remove('show');
  $('heart-send').onclick = sendHeart;
  $('heart-overlay').onclick = (e) => { if (e.target === $('heart-overlay')) $('heart-overlay').classList.remove('show'); };

  $('c-rclose').onclick = cancelReply;

  $('c-body').addEventListener('contextmenu', e => {
    const itemEl = e.target.closest('.bubble-item');
    if (itemEl) { e.preventDefault(); startReply(+itemEl.dataset.i); }
  });

  let pressTimer;
  $('c-body').addEventListener('touchstart', e => {
    const ava = e.target.closest('.msg-ava[data-who="ta"]');
    if (ava) pressTimer = setTimeout(() => { sendPat(); ava.classList.add('shake'); setTimeout(() => ava.classList.remove('shake'), 600); }, 600);
  });
  $('c-body').addEventListener('touchend', () => clearTimeout(pressTimer));
  $('c-body').addEventListener('touchmove', () => clearTimeout(pressTimer));

  // 会话窗口管理
  $('chat-window-trigger').onclick = openWindowManager;
  $('chat-window-new').onclick = createChatWindow;
  $('chat-window-create').onclick = createChatWindow;
  $('chat-window-sheet').addEventListener('click', e => {
    if (e.target.closest('[data-window-close]')) { closeWindowManager(); return; }
    const open=e.target.closest('[data-window-open]'), rename=e.target.closest('[data-window-rename]');
    const archive=e.target.closest('[data-window-archive]'), restore=e.target.closest('[data-window-restore]'), del=e.target.closest('[data-window-delete]');
    if (open) activateWindow(open.dataset.windowOpen);
    else if (rename) manageWindowAction('rename',rename.dataset.windowRename);
    else if (archive) manageWindowAction('archive',archive.dataset.windowArchive);
    else if (restore) manageWindowAction('restore',restore.dataset.windowRestore);
    else if (del) manageWindowAction('delete',del.dataset.windowDelete);
  });

  // 聊天记录查找：跨频道检索，命中后回到原消息位置
  const searchPanel = $('chat-search'), searchInput = $('chat-search-input');
  let searchWho = 'all';
  let searchType = 'all';
  let selectedSearchDate = '';
  let calendarMonth = new Date();
  const searchHistory = (() => { try { return JSON.parse(localStorage.getItem('xw_chatSearchHistory') || '[]'); } catch { return []; } })();
  function searchText(m) {
    if (m.fileName) return String(m.fileName);
    if (m.type === 'image') return '[图片]';
    if (m.type === 'video') return '[视频]';
    if (m.type === 'file') return '[文件] ' + (m.fileName||'');
    if (m.type === 'sticker') return '[表情包]';
    if (m.type === 'voice') return '[语音]';
    return String(m.text||'');
  }
  function dateKey(ts) {
    const d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function renderCalendar() {
    const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
    $('chat-cal-title').textContent = y + '年' + (m+1) + '月';
    $('chat-date-label').textContent = selectedSearchDate || '不限日期';
    const counts = {};
    getChatWindows().forEach(win => getWindowMessages(win).forEach(msg => {
      const key = dateKey(msg.t); counts[key] = (counts[key] || 0) + 1;
    }));
    const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
    const cells = [];
    for(let i=0;i<first;i++) cells.push('<span class="cal-blank"></span>');
    for(let day=1;day<=days;day++) {
      const key = y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      const count = counts[key] || 0;
      cells.push('<button type="button" class="cal-day'+(selectedSearchDate===key?' selected':'')+(count?' has-msg':'')+'" data-date="'+key+'">'+day+(count?'<i></i>':'')+'</button>');
    }
    $('chat-calendar-days').innerHTML = cells.join('');
  }
  let mediaLibraryMode = false;
  let mediaLibraryFavoritesOnly = false;
  function setMediaFavorite(windowId,index,value) {
    const win=getChatWindows().find(w=>w.id===windowId); if(!win)return;
    const list=getWindowMessages(win), msg=list[index]; if(!msg)return;
    msg.favorite=!!value;
    if(win.legacyKey){S.chatMsgsByChannel[win.legacyKey]=list;save("chatMsgsByChannel");}
    else {win.updatedAt=Date.now();save("chatWindows");}
  }
  function renderMediaLibrary() {
    const host=$('chat-search-results');
    const records=[];
    getChatWindows().forEach(win=>{
      getWindowMessages(win).forEach((m,i)=>{
        if(!['image','video','file','sticker'].includes(m.type))return;
        if(mediaLibraryFavoritesOnly&&!m.favorite)return;
        if(searchType!=='all'&&m.type!==searchType)return;
        records.push({ch:win.id,title:win.title,m,i});
      });
    });
    records.sort((a,b)=>(b.m.t||0)-(a.m.t||0));
    if(!records.length){host.innerHTML='<div class="chat-search-empty">这里还没有媒体内容。发送的照片、视频、文件和表情会收录在这里。</div>';return;}
    const groups=new Map();
    records.forEach(item=>{
      const d=new Date(item.m.t||Date.now());
      const key=d.getFullYear()+'年'+(d.getMonth()+1)+'月';
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(item);
    });
    host.innerHTML=[...groups.entries()].map(([month,items])=>{
      const cards=items.map(({ch,title,m,i})=>{
        const meta=esc(title||'聊天');
        const star='<button type="button" class="media-library-star'+(m.favorite?' saved':'')+'" data-media-favorite="'+esc(ch)+'" data-favorite-index="'+i+'" aria-label="'+(m.favorite?'取消收藏':'收藏')+'">'+(m.favorite?'★':'☆')+'</button>';
        if(m.type==='image'||m.type==='sticker') return '<div class="media-library-card"><button type="button" class="media-library-image" data-search-window="'+esc(ch)+'" data-search-index="'+i+'" aria-label="'+meta+' 图片"><span '+(m.mediaId?'data-media-id="'+esc(m.mediaId)+'"':'style="background-image:url(&quot;'+esc(m.url||'')+'&quot;)"')+'></span><small>'+(m.type==='sticker'?'表情':meta)+'</small></button>'+star+'</div>';
        const symbol=m.type==='video'?'▶':'↧';
        return '<div class="media-library-card media-library-card-file"><button type="button" class="media-library-file" data-search-window="'+esc(ch)+'" data-search-index="'+i+'"><i>'+symbol+'</i><span><b>'+esc(m.fileName||(m.type==='video'?'视频':'文件'))+'</b><small>'+meta+' · '+formatFileSize(m.fileSize||0)+'</small></span></button>'+star+'</div>';
      }).join('');
      return '<section class="media-library-month"><h3>'+month+' <small>'+items.length+' 项</small></h3><div class="media-library-grid">'+cards+'</div></section>';
    }).join('');
    hydrateChatMedia(host);
  }
  function renderSearchResults() {
    if(mediaLibraryMode){renderMediaLibrary();return;}
    const host = $('chat-search-results'), q = searchInput.value.trim().toLocaleLowerCase();
    if (!q && !selectedSearchDate && searchType === 'all') {
      host.innerHTML = searchHistory.length
        ? '<div class="chat-search-caption">最近找过</div>' + searchHistory.map((v, i) => '<button type="button" class="chat-search-history" data-history-index="' + i + '">' + esc(v) + '</button>').join('')
        : '<div class="chat-search-empty">输入关键词，找回某个瞬间。</div>';
      return;
    }
    const all = [];
    getChatWindows().forEach(win => {
      const ch = win.id, list = getWindowMessages(win);
      list.forEach((m, i) => {
        if (searchWho !== 'all' && m.who !== searchWho) return;
        if (searchType !== 'all' && m.type !== searchType) return;
        if (selectedSearchDate && dateKey(m.t) !== selectedSearchDate) return;
        const raw = searchText(m), hay = (raw + ' ' + (m.reasoningSummary || '')).toLocaleLowerCase();
        if (q && !hay.includes(q)) return;
        all.push({ ch, i, m, raw, title: win.title });
      });
    });
    all.sort((a,b) => (b.m.t || 0) - (a.m.t || 0));
    const channelName = key => (getChatWindows().find(w => w.id === key) || {}).title || key;
    host.innerHTML = all.length ? all.slice(0,80).map(({ch,i,m,raw}) => {
      const date = new Date(m.t || Date.now());
      const stamp = date.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}) + ' ' + fmtClock(m.t);
      const who = m.who === 'ta' ? (S.hisName || 'TA') : '我';
      const excerpt = raw.length > 90 ? raw.slice(0,90) + '…' : raw;
      const media = ['image','video','file','sticker'].includes(m.type);
      const label = ({image:'图片',video:'视频',file:'文件',sticker:'表情包'})[m.type] || '';
      const thumb = media && (m.type==='image'||m.type==='sticker') && m.mediaId ? '<span class="csr-thumb" data-media-id="' + esc(m.mediaId) + '"></span>' : '';
      return '<button type="button" class="chat-search-result" data-search-window="' + ch + '" data-search-index="' + i + '"><span class="csr-meta"><b>' + esc(who) + '</b><i>' + esc(channelName(ch)) + '</i><time>' + esc(stamp) + '</time></span><span class="csr-media-row">' + thumb + '<span class="csr-text">' + (media ? '<em>' + label + '</em> ' : '') + esc(excerpt || '[思考过程]') + '</span></span></button>';
    }).join('') : '<div class="chat-search-empty">没有找到相关记录。换个词试试看。</div>';
    hydrateChatMedia(host);
  }
  $('chat-media-filters').querySelectorAll('[data-search-type]').forEach(btn => btn.onclick = () => {
    searchType = btn.dataset.searchType;
    $('chat-media-filters').querySelectorAll('button').forEach(b => b.classList.toggle('on',b===btn));
    renderSearchResults();
  });
  function openChatSearch() {
    searchPanel.classList.add('show');
    $('chat-pref').classList.remove('show');
    $('ch-menu').setAttribute('aria-expanded','false');
    renderSearchResults();
    setTimeout(() => searchInput.focus(), 60);
  }
  function closeChatSearch() {
    searchPanel.classList.remove('show');
    searchInput.value = '';
    mediaLibraryMode=false;
    $('chat-media-library-toggle').classList.remove('on');
    $('chat-media-library-toggle').textContent='▦ 媒体库';
  }
  $('ch-search').onclick = openChatSearch;
  $('chat-media-library-toggle').onclick = () => {
    mediaLibraryMode=!mediaLibraryMode; mediaLibraryFavoritesOnly=false;
    $('chat-media-library-toggle').classList.toggle('on',mediaLibraryMode);
    $('chat-media-library-toggle').textContent=mediaLibraryMode?'返回搜索':'▦ 媒体库';
    $('chat-media-favorites-toggle').classList.remove('on'); $('chat-media-favorites-toggle').textContent='♡ 收藏';
    $('chat-search-input').placeholder=mediaLibraryMode?'媒体库按类型浏览':'搜索你们说过的话…';
    renderSearchResults();
  };
  $('chat-media-favorites-toggle').onclick=()=>{
    mediaLibraryMode=true; mediaLibraryFavoritesOnly=!mediaLibraryFavoritesOnly;
    $('chat-media-library-toggle').classList.add('on'); $('chat-media-library-toggle').textContent='返回搜索';
    $('chat-media-favorites-toggle').classList.toggle('on',mediaLibraryFavoritesOnly);
    $('chat-media-favorites-toggle').textContent=mediaLibraryFavoritesOnly?'★ 已收藏':'♡ 收藏';
    $('chat-search-input').placeholder='收藏的媒体'; renderSearchResults();
  };
  $('chat-search-close').onclick = closeChatSearch;
  $('chat-calendar-toggle').onclick = () => {
    const cal = $('chat-calendar'); cal.hidden = !cal.hidden;
    if (!cal.hidden) { renderCalendar(); }
  };
  $('chat-cal-prev').onclick = () => { calendarMonth.setMonth(calendarMonth.getMonth()-1); renderCalendar(); };
  $('chat-cal-next').onclick = () => { calendarMonth.setMonth(calendarMonth.getMonth()+1); renderCalendar(); };
  $('chat-cal-reset').onclick = () => { selectedSearchDate = ''; renderCalendar(); renderSearchResults(); };
  $('chat-calendar-days').addEventListener('click', e => {
    const day = e.target.closest('[data-date]'); if (!day) return;
    selectedSearchDate = day.dataset.date; renderCalendar(); renderSearchResults();
  });
  $('chat-search-clear').onclick = () => { searchInput.value = ''; renderSearchResults(); searchInput.focus(); };
  searchInput.addEventListener('input', renderSearchResults);
  $('chat-search-filters').querySelectorAll('[data-search-who]').forEach(btn => btn.onclick = () => {
    searchWho = btn.dataset.searchWho;
    $('chat-search-filters').querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
    renderSearchResults();
  });
  $('chat-search-results').addEventListener('click', e => {
    const favoriteBtn=e.target.closest('[data-media-favorite]');
    if(favoriteBtn){const winId=favoriteBtn.dataset.mediaFavorite,idx=Number(favoriteBtn.dataset.favoriteIndex);const win=getChatWindows().find(w=>w.id===winId);const msg=win&&getWindowMessages(win)[idx];if(msg){setMediaFavorite(winId,idx,!msg.favorite);renderSearchResults();toast(msg.favorite?'已加入收藏':'已取消收藏');}return;}
    const historyBtn = e.target.closest('[data-history-index]');
    if (historyBtn) { searchInput.value = searchHistory[Number(historyBtn.dataset.historyIndex)] || ''; renderSearchResults(); return; }
    const result = e.target.closest('[data-search-index]');
    if (!result) return;
    const q = searchInput.value.trim();
    if (q) {
      const history = [q, ...searchHistory.filter(v => v !== q)].slice(0,5);
      localStorage.setItem('xw_chatSearchHistory', JSON.stringify(history));
      searchHistory.splice(0, searchHistory.length, ...history);
    }
    currentChannel = result.dataset.searchWindow;
    localStorage.setItem('xw_chatCurrentWindowId', currentChannel);
    syncWindowLabel();
    closeChatSearch();
    renderMsgs();
    const target = $('c-body').querySelector('.bubble-item[data-i="' + result.dataset.searchIndex + '"]');
    if (target) {
      target.scrollIntoView({ behavior:'smooth', block:'center' });
      target.classList.add('search-hit');
      setTimeout(() => target.classList.remove('search-hit'), 1800);
    }
  });

  // AI 连接设置
  $('chat-ai-url').value = S.aiUrl || 'https://api.openai.com/v1/chat/completions';
  $('chat-ai-model').value = S.aiModel || 'gpt-4o-mini';
  $('chat-ai-key').value = S.aiKey || '';
  $('chat-ai-status').textContent = S.aiKey ? '已配置' : '尚未配置';
  $('chat-ai-save').onclick = () => {
    S.aiUrl = $('chat-ai-url').value.trim() || 'https://api.openai.com/v1/chat/completions';
    S.aiModel = $('chat-ai-model').value.trim() || 'gpt-4o-mini';
    S.aiKey = $('chat-ai-key').value.trim();
    ['aiUrl','aiModel','aiKey'].forEach(save);
    $('chat-ai-status').textContent = S.aiKey ? '已配置' : '尚未配置';
    toast(S.aiKey ? 'AI 连接设置已保存' : '已保存接口与模型，请补充 API Key');
  };

  // 上传头像、气泡与壁纸：全部属于 Chat 页面，图片压缩后保存在本机。
  let pendingAppearanceKey = '';
  const appearanceFile = $('chat-appearance-file');
  $('chat-pref').addEventListener('click', async e => {
    const upload = e.target.closest('[data-appearance-upload]');
    const reset = e.target.closest('[data-appearance-reset]');
    if (reset) { resetChatAppearance(reset.dataset.appearanceReset); return; }
    if (upload) {
      pendingAppearanceKey = upload.dataset.appearanceUpload;
      appearanceFile.value = '';
      appearanceFile.click();
    }
  });
  appearanceFile.addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file || !pendingAppearanceKey) return;
    if (!file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
    try {
      const key = pendingAppearanceKey;
      const avatar = key === 'hisAvatar' || key === 'herAvatar';
      const data = await compressChatImage(file, avatar ? 640 : 1440, avatar ? .84 : .8);
      setChatAppearance(key, data);
      toast('图片已应用到聊天页');
    } catch (err) { toast(err.message || '图片处理失败'); }
    finally { pendingAppearanceKey = ''; appearanceFile.value = ''; }
  });

  // 顶部按钮
  $('ch-music').onclick = () => toast('一起听功能开发中...');
  const prefPanel = $('chat-pref');
  const prefBackdrop = $('chat-pref-backdrop');
  const closeChatMore = () => {
    prefPanel.classList.remove('show');
    prefBackdrop.classList.remove('show');
    $('ch-menu').setAttribute('aria-expanded', 'false');
  };
  $('ch-menu').onclick = () => {
    const opening = !prefPanel.classList.contains('show');
    prefPanel.classList.toggle('show', opening);
    prefBackdrop.classList.toggle('show', opening);
    $('ch-menu').setAttribute('aria-expanded', String(opening));
  };
  $('chat-pref-close').onclick = closeChatMore;
  prefBackdrop.onclick = closeChatMore;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && prefPanel.classList.contains('show')) closeChatMore();
  });
  $('chat-pref').querySelectorAll('[data-pref]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.pref === 'split') {
        S.chatSplitMode = btn.dataset.value;
        save('chatSplitMode');
      } else {
        S.chatBubbleBg = btn.dataset.value === 'on';
        save('chatBubbleBg');
      }
      syncChatPrefs();
      renderMsgs();
    };
  });
  $('chat-pref').querySelector('[data-chat-action="clear"]').onclick = () => {
    closeChatMore();
    clearChat();
  };
}

window.Chat = { build, refreshWorldbooks: syncWorldbookBindings };
})();
