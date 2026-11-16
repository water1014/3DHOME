/* ══════════════════════════════════════════════
   chat.js · 聊天页（频道切换 · 打字机 · 头像联动 · 参考版）
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const { S, save } = XW;
const { fmtClock, toast } = UI;

let aiTyping = false;
let replyingTo = null;
let currentChannel = 'general';
let typeWriterTimer = null;

const CHANNELS = [
  { key: 'general', label: '通用', sub: 'general' },
  { key: 'sweet',   label: '甜蜜', sub: 'sweet' },
  { key: 'daily',   label: '日常', sub: 'daily' },
  { key: 'secret',  label: '秘密', sub: 'secret' },
];

const CHANNEL_REPLIES = {
  general: {
    '想你|miss': '我也想你啦 ✨ 今天过得怎么样？',
    '爱': '我也是～♡ 我们的小窝一直在这里等你。',
    '晚安': '晚安，好梦～',
    '早安|早': '早安！新的一天也要元气满满哦。',
    '天气': '今天天气不错呢，记得出门带伞～',
    '吃饭|饿': '记得按时吃饭哦，健康最重要。',
    default: '收到你的消息啦！我在小窝里等你分享更多故事～',
  },
  sweet: {
    '想你|miss': '每一分每一秒都在想你 💭',
    '爱': '我爱你，比昨天更多一点。',
    '晚安': '晚安，梦里见～',
    '早安|早': '早安，我的太阳。',
    '天气': '不管晴天雨天，有你在就是晴天。',
    '吃饭|饿': '想和你一起吃每一顿饭。',
    default: '你说什么我都觉得好甜呀～',
  },
  daily: {
    '想你|miss': '忙完这阵就去找你。',
    '爱': '爱你，今天也要加油！',
    '晚安': '早点睡，别熬夜。',
    '早安|早': '早，今天有什么安排？',
    '天气': '今天降温了，多穿点。',
    '吃饭|饿': '记得吃饭，别饿着。',
    default: '收到，待会儿回你～',
  },
  secret: {
    '想你|miss': '……我也在想。',
    '爱': '……嗯。',
    '晚安': '……晚安。',
    '早安|早': '……早。',
    '天气': '……记得带伞。',
    '吃饭|饿': '……去吃饭。',
    default: '……',
  },
};

function getChannelMsgs() {
  if (!S.chatMsgsByChannel && S.chatMsgs) {
    S.chatMsgsByChannel = { general: S.chatMsgs, sweet: [], daily: [], secret: [] };
    save('chatMsgsByChannel');
  }
  S.chatMsgsByChannel = S.chatMsgsByChannel || {};
  S.chatMsgsByChannel[currentChannel] = S.chatMsgsByChannel[currentChannel] || [];
  return S.chatMsgsByChannel[currentChannel];
}

function saveChannelMsgs(msgs) {
  S.chatMsgsByChannel[currentChannel] = msgs;
  save('chatMsgsByChannel');
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
        <button class="ch-btn" id="ch-music" title="一起听">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </button>
        <button class="ch-btn" id="ch-menu" title="更多">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- 频道标签 -->
    <div class="channel-bar" id="c-channels">
      ${CHANNELS.map((c, i) => `<button class="channel-tab ${i===0?'on':''}" data-ch="${c.key}">${c.label}<span class="ch-sub">${c.sub}</span></button>`).join('')}
    </div>

    <div class="chat-pref" id="chat-pref" aria-label="聊天显示设置">
      <div class="chat-pref-group"><span class="chat-pref-label">消息排列</span>
        <button type="button" data-pref="split" data-value="split">逐条切分</button>
        <button type="button" data-pref="split" data-value="merge">连续合并</button>
      </div>
      <div class="chat-pref-group"><span class="chat-pref-label">气泡背景</span>
        <button type="button" data-pref="bubble" data-value="on">显示</button>
        <button type="button" data-pref="bubble" data-value="off">无背景</button>
      </div>
      <p class="chat-pref-note">思考过程与工具调用会收在消息下方，点击即可展开。</p>
      <div class="chat-pref-section">
        <span class="chat-pref-label">会话管理</span>
        <button type="button" class="chat-pref-action" data-chat-action="clear">
          <span>清空当前频道</span><small>删除此频道的全部消息</small>
        </button>
      </div>
    </div>

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
        <button class="ib-btn ib-plus" id="ib-plus" title="更多">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <textarea class="input-field" id="c-inp" rows="1" placeholder="ring the chime ..."></textarea>
        <button class="ib-btn ib-emoji" id="ib-emoji" title="表情">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>
        <button class="ib-btn ib-mic" id="ib-mic" title="语音">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        <button class="send-btn" id="c-send">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13"/></svg>
        </button>
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
        <button class="tp-btn" data-tool="image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span>图片</span>
        </button>
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

  updateHeader();
  syncChatPrefs();
  renderMsgs();
  bindEvents();
}

function updateHeader() {
  const ava = $('ch-ava');
  const name = $('ch-name');
  if (!ava || !name) return;
  name.textContent = S.hisName || 'TA';
  if (S.hisAvatar) {
    ava.style.backgroundImage = `url(${S.hisAvatar})`;
  } else {
    ava.style.backgroundImage = '';
    ava.innerHTML = `<b>${(S.hisName || '他').charAt(0)}</b>`;
  }
}

function getAvaHtml(who, size) {
  const isTa = who === 'ta';
  const img = isTa ? S.hisAvatar : S.herAvatar;
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
function renderMeta(m) {
  const reasoning = m.thinking ?? m.reasoning ?? m.thoughts ?? m.reasoning_content;
  const calls = m.toolCalls ?? m.tool_calls ?? m.tools;
  const parts = [];
  if (reasoning) {
    const value = typeof reasoning === 'string' ? reasoning : JSON.stringify(reasoning, null, 2);
    parts.push(`<details class="msg-meta"><summary><span class="meta-mark">✦</span>思考过程</summary><div class="meta-content">${esc(value)}</div></details>`);
  }
  if (Array.isArray(calls) && calls.length) {
    const rows = calls.map((call, n) => {
      const name = call?.name || call?.function?.name || call?.tool || `工具 ${n + 1}`;
      const status = call?.status || call?.state || '已调用';
      const payload = call?.arguments ?? call?.input ?? call?.output ?? call?.result;
      const detail = payload == null ? '' : esc(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
      return `<div class="tool-record"><div class="tool-record-head"><b>${esc(String(name))}</b><span>${esc(String(status))}</span></div>${detail ? `<pre>${detail}</pre>` : ''}</div>`;
    }).join('');
    parts.push(`<details class="msg-meta tool-meta"><summary><span class="meta-mark">⌘</span>工具调用 <i>${calls.length}</i></summary><div class="meta-content">${rows}</div></details>`);
  }
  return parts.length ? `<div class="msg-meta-stack">${parts.join('')}</div>` : '';
}

/* ── 渲染消息：支持 QQ 切分 / 连续消息合并 ── */
function renderMsgs() {
  const body = $('c-body');
  if (!body) return;
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
    const content = `${renderMeta(m)}<div class="bubble">${quote}${m.type === 'voice' ? renderVoiceBubble(m) : m.type === 'image' ? renderImgBubble(m, i) : m.type === 'pat' ? renderPatBubble(m) : textHtml}</div><div class="msg-time">${fmtClock(m.t)}</div>`;
    const mergedClass = merged ? ' msg-merged' : '';
    if (isTa) return dateSep + `<div class="msg ta bubble-item${gapClass}${typingClass}${mergedClass}" data-i="${i}">${merged ? '<span class="msg-ava-spacer"></span>' : getAvaHtml('ta')}<div class="msg-col">${content}</div></div>`;
    return dateSep + `<div class="msg me bubble-item${gapClass}${typingClass}${mergedClass}" data-i="${i}"><div class="msg-col">${content}</div>${merged ? '<span class="msg-ava-spacer"></span>' : getAvaHtml('me')}</div>`;
  }).join('');
  body.scrollTop = body.scrollHeight;
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
  const msg = { who: 'me', text, t: Date.now() };
  if (replyingTo) { msg.quote = replyingTo; cancelReply(); }
  pushMsgObj(msg);
  inp.value = ''; inp.style.height = 'auto';
  aiReply(text);
}

function pushMsgObj(msg) {
  const msgs = getChannelMsgs();
  msgs.push(msg);
  saveChannelMsgs(msgs);
  renderMsgs();
}

/* ── AI 回复（打字机效果） ── */
function aiReply(text) {
  aiTyping = true;
  const body = $('c-body');
  body.scrollTop = body.scrollHeight;

  const replies = CHANNEL_REPLIES[currentChannel] || CHANNEL_REPLIES.general;
  let reply = replies.default;
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(replies)) {
    if (key === 'default') continue;
    const patterns = key.split('|');
    if (patterns.some(p => lower.includes(p))) { reply = val; break; }
  }

  // 先显示 typing 指示器
  $('c-typing').classList.add('show');
  body.scrollTop = body.scrollHeight;

  const delay = Math.min(800 + reply.length * 50, 2200);
  setTimeout(() => {
    $('c-typing').classList.remove('show');

    // 打字机效果
    const msgs = getChannelMsgs();
    const msgIdx = msgs.length;
    msgs.push({ who: 'ta', text: '', t: Date.now(), _typing: true });
    saveChannelMsgs(msgs);
    renderMsgs();

    let idx = 0;
    const speed = 40;
    clearInterval(typeWriterTimer);
    typeWriterTimer = setInterval(() => {
      idx++;
      const msgs2 = getChannelMsgs();
      if (msgIdx < msgs2.length) {
        msgs2[msgIdx].text = reply.slice(0, idx);
        saveChannelMsgs(msgs2);
        renderMsgs();
        const body2 = $('c-body');
        body2.scrollTop = body2.scrollHeight;
      }
      if (idx >= reply.length) {
        clearInterval(typeWriterTimer);
        const msgs3 = getChannelMsgs();
        if (msgIdx < msgs3.length) {
          delete msgs3[msgIdx]._typing;
          saveChannelMsgs(msgs3);
          renderMsgs();
        }
        aiTyping = false;
      }
    }, speed);
  }, delay);
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

/* ── 图片 ── */
function sendImage() {
  const inp = D.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => pushMsgObj({ who: 'me', text: '[图片]', type: 'image', url: reader.result, t: Date.now() });
    reader.readAsDataURL(f);
  };
  inp.click();
}

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

/* ── 频道切换 ── */
function switchChannel(ch) {
  currentChannel = ch;
  $('c-channels').querySelectorAll('.channel-tab').forEach(t => {
    t.classList.toggle('on', t.dataset.ch === ch);
  });
  renderMsgs();
}

/* ── 事件绑定 ── */
function bindEvents() {
  $('c-send').onclick = sendMsg;
  $('c-inp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  $('c-inp').addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 112) + 'px'; });

  // 工具面板
  $('ib-plus').onclick = toggleToolPanel;
  $('ib-emoji').onclick = () => { /* emoji picker placeholder */ };
  $('ib-mic').onclick = startVoice;

  $('tool-panel').querySelectorAll('.tp-btn').forEach(btn => {
    btn.onclick = () => {
      const t = btn.dataset.tool;
      $('tool-panel').classList.remove('show');
      if (t === 'heart') openHeart();
      else if (t === 'pat') sendPat();
      else if (t === 'image') sendImage();
    };
  });

  // 关闭工具面板（点击外部）
  $('c-body').addEventListener('click', () => $('tool-panel')?.classList.remove('show'));

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

  // 频道切换
  $('c-channels').querySelectorAll('.channel-tab').forEach(t => {
    t.onclick = () => switchChannel(t.dataset.ch);
  });

  // 顶部按钮
  $('ch-music').onclick = () => toast('一起听功能开发中...');
  $('ch-menu').onclick = () => {
    const panel = $('chat-pref');
    panel.classList.toggle('show');
    $('ch-menu').setAttribute('aria-expanded', String(panel.classList.contains('show')));
  };
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
    $('chat-pref').classList.remove('show');
    $('ch-menu').setAttribute('aria-expanded', 'false');
    clearChat();
  };
}

window.Chat = { build };
})();
