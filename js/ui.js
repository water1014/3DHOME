/* ══════════════════════════════════════════════
   ui.js · 通用 UI 组件
   ══════════════════════════════════════════════ */

const D = document;

// 单例 toast
let toastTimer;
function toast(msg, dur = 2000) {
  let el = D.getElementById('toast');
  if (!el) { el = D.createElement('div'); el.id = 'toast'; D.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), dur);
}

// 单例 overlay（确认弹窗）
function confirmDialog({ title, text, okText = '确认', cancelText = '取消', onOk, onCancel }) {
  let el = D.getElementById('confirm-overlay');
  if (!el) { el = D.createElement('div'); el.id = 'confirm-overlay'; D.body.appendChild(el); }
  el.className = 'overlay';
  el.innerHTML = `
    <div class="overlay-card">
      <div class="overlay-title">${title}</div>
      <div class="overlay-text">${text}</div>
      <div class="overlay-btns">
        <button class="btn" id="cf-cancel">${cancelText}</button>
        <button class="btn primary" id="cf-ok">${okText}</button>
      </div>
    </div>`;
  requestAnimationFrame(() => el.classList.add('show'));
  el.onclick = (e) => { if (e.target === el) close(); };
  const close = () => { el.classList.remove('show'); setTimeout(() => el.innerHTML = '', 260); };
  D.getElementById('cf-ok').onclick = () => { close(); onOk?.(); };
  D.getElementById('cf-cancel').onclick = () => { close(); onCancel?.(); };
}

// 工具：精确时间问候
function greetWord(hour) {
  if (hour < 5) return '夜深了';
  if (hour < 7) return '清晨';
  if (hour < 11) return '早安';
  if (hour < 13) return '午安';
  if (hour < 17) return '下午好';
  if (hour < 21) return '傍晚好';
  return '晚安';
}

// 日期格式化
function fmtDate(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function fmtWeek(d) {
  const w = '日一二三四五六';
  return '星期' + w[d.getDay()];
}

// 计算相隔天数
function diffDay(a, b) {
  const A = new Date(a); const B = new Date(b);
  A.setHours(0,0,0,0); B.setHours(0,0,0,0);
  return Math.floor((B - A) / 864e5);
}

// 格式化秒 -> mm:ss
function fmtTime(s) { s = Math.floor(s); const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; }

// 格式化毫秒时间戳 -> HH:MM
function fmtClock(ms) {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 天气 mock（后续可接真实 API）
function weatherNow() {
  return { temp: 22, cond: '晴', icon: 'sun' };
}

window.UI = { toast, confirmDialog, greetWord, fmtDate, fmtWeek, diffDay, fmtTime, fmtClock, weatherNow };
