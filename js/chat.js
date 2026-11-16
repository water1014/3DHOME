/* ══════════════════════════════════════════════
   chat.js · 聊天页
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const { S, save } = XW;
const { fmtClock } = UI;

function build() {
  const root = $('pg-chat');
  root.innerHTML = `
    <div class="chat-header">
      <div style="flex:1">
        <div class="chat-title">Message</div>
        <div class="chat-status"><span class="dot"></span>${(S.hisName || 'TA').toUpperCase()} · ONLINE</div>
      </div>
      <button class="btn sm ghost" id="c-clear">清空</button>
    </div>
    <div class="chat-body" id="c-body"></div>
    <div class="typing" id="c-typing">
      <div class="msg-avatar"><b>${(S.hisName || '他').charAt(0)}</b></div>
      <div class="typing-bubble"><i></i><i></i><i></i></div>
    </div>
    <div class="input-bar">
      <div class="input-card">
        <textarea class="input-field" id="c-inp" rows="1" placeholder="说点什么..."></textarea>
        <button class="send-btn" id="c-send"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13"/></svg></button>
      </div>
    </div>`;

  renderMsgs();

  $('c-send').onclick = () => sendMsg();
  $('c-inp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  $('c-clear').onclick = () => {
    UI.confirmDialog({ title: '清空记录', text: '所有聊天消息将被删除，不可恢复。', okText: '清空', onOk: () => {
      S.chatMsgs = []; save('chatMsgs'); renderMsgs();
    }});
  };
}

function renderMsgs() {
  const body = $('c-body');
  if (!body) return;
  const msgs = S.chatMsgs || [];
  body.innerHTML = msgs.map((m, i) => `
    <div class="msg ${m.who}" data-i="${i}">
      <div class="msg-avatar ${m.who}-avatar"><b>${m.who === 'ta' ? (S.hisName || '他').charAt(0) : (S.herName || '她').charAt(0)}</b></div>
      <div class="msg-body">
        <div class="msg-meta">${fmtClock(m.t)}</div>
        <div class="bubble">${esc(m.text)}</div>
      </div>
    </div>`).join('');
  body.scrollTop = body.scrollHeight;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let aiTyping = false;
function sendMsg() {
  const inp = $('c-inp');
  const text = inp.value.trim();
  if (!text || aiTyping) return;
  pushMsg('me', text);
  inp.value = '';
  aiReply(text);
}

function pushMsg(who, text) {
  (S.chatMsgs = S.chatMsgs || []).push({ who, text, t: Date.now() });
  save('chatMsgs');
  renderMsgs();
}

function aiReply(text) {
  aiTyping = true;
  $('c-typing').classList.add('show');
  const body = $('c-body');
  body.scrollTop = body.scrollHeight;

  // 模拟 AI 回复：关键词匹配
  const lower = text.toLowerCase();
  let reply = '';
  if (lower.includes('想你') || lower.includes('miss')) reply = '我也想你啦 ✨ 今天过得怎么样？';
  else if (lower.includes('爱')) reply = '我也是～♡ 我们的小窝一直在这里等你。';
  else if (lower.includes('晚安')) reply = '晚安，好梦～';
  else if (lower.includes('早安') || lower.includes('早')) reply = '早安！新的一天也要元气满满哦。';
  else if (lower.includes('天气')) reply = '今天天气不错呢，记得出门带伞～';
  else if (lower.includes('吃饭') || lower.includes('饿')) reply = '记得按时吃饭哦，健康最重要。';
  else reply = '收到你的消息啦！我在小窝里等你分享更多故事～';

  const delay = Math.min(800 + reply.length * 80, 3000);
  setTimeout(() => {
    $('c-typing').classList.remove('show');
    pushMsg('ta', reply);
    aiTyping = false;
  }, delay);
}

window.Chat = { build };
})();
