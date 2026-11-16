/* ══════════════════════════════════════════════
   home.js · 首页（雨天 · 透明伞）
   结构：顶栏 → 雨景画布 → 功能入口卡 → 问候
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const { S } = XW;
const { fmtWeek, diffDay, greetWord, weatherNow } = UI;

let raf, chimeInited = false;

function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return 'TH';
  return { 1: 'ST', 2: 'ND', 3: 'RD' }[n % 10] || 'TH';
}

function tickClock() {
  const el = $('h-time');
  if (el) {
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
  raf = setTimeout(tickClock, 5000);
}
function startClock() { tickClock(); }
function stopClock() { clearTimeout(raf); }

function renderInfo() {
  const now = new Date();
  const love = new Date(S.loveDate || '2025-01-01');
  const days = diffDay(love, now);
  const years = Math.floor(days / 365);
  const nextY = years + 1;
  const nextYDate = new Date(love); nextYDate.setFullYear(love.getFullYear() + nextY);
  const nextDays = diffDay(now, nextYDate);

  $('h-names').innerHTML = `<b>${S.hisName || '他'}</b> & <b>${S.herName || '她'}</b> · ${days} 天`;
  $('h-next') && ($('h-next').textContent = `${nextY}${ordinal(nextY)} 周年 · ${nextDays} 天后`);
  $('h-date') && ($('h-date').textContent = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`);
  const w = weatherNow();
  $('h-weather').innerHTML = `
    <svg class="ic" viewBox="0 0 24 24" style="width:.82rem;height:.82rem">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <span class="wc-temp">${w.temp}°</span>`;
  $('h-weather').onclick = () => UI.toast('天气详情后续开放');

  $('h-greet').textContent = `${greetWord(now.getHours())} · ${fmtWeek(now)} ${String(now.getMonth()+1)}月${now.getDate()}日`;
}

function build() {
  const root = $('pg-home');
  root.innerHTML = `
    <div class="chime-wrap" id="chime-wrap"></div>
    <div class="chime-ui">
      <!-- 顶栏 -->
      <div class="hd">
        <div class="hd-title">小窝<i>petite pluie</i></div>
        <div class="hd-right">
          <span class="hd-time" id="h-time"></span>
          <div class="weather" id="h-weather"></div>
        </div>
      </div>
      <!-- 中部：雨景画布 + 伞沿挂牌层 -->
      <div class="chime-spacer"></div>
      <div class="hang-layer" id="hang-layer">
        <div class="hang"><div class="hang-str"></div><button class="hang-pill" data-act="chat">
          <svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>对话</span>
        </button></div>
        <div class="hang"><div class="hang-str"></div><button class="hang-pill" data-act="anniv">
          <svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>纪念日</span>
        </button></div>
        <div class="hang"><div class="hang-str"></div><button class="hang-pill" data-act="album">
          <svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>相册</span>
        </button></div>
        <div class="hang"><div class="hang-str"></div><button class="hang-pill" data-act="music">
          <svg class="ic" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><span>一起听</span>
        </button></div>
        <div class="hang handle-tag"><div class="hang-str"></div><div class="hang-pill tag-paper" id="h-names">他 & 她</div></div>
      </div>
      <!-- 底部操作条 -->
      <div class="scene-bar">
        <button class="cc-btn" id="h-gust">
          <svg class="ic" viewBox="0 0 24 24"><path d="M3 8h9.5a2.5 2.5 0 1 0-2.4-3.2"/><path d="M3 12h13.5a2.5 2.5 0 1 1-2.4 3.2"/><path d="M3 16h7a2 2 0 1 1-1.9 2.6"/></svg>
          起风
        </button>
        <button class="cc-btn" id="h-mute">
          <svg class="ic" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
          雨声
        </button>
      </div>
      <div class="cc-greet" id="h-greet"></div>
    </div>`;

  // 雨景 + 伞沿挂牌
  chimeInited = window.Chime ? Chime.init($('chime-wrap'), {
    entries: Array.from(root.querySelectorAll('.hang-layer .hang:not(.handle-tag)')),
    handleTag: root.querySelector('.hang.handle-tag'),
  }) : false;

  $('h-gust').onclick = () => { if (chimeInited) Chime.gust(); };
  $('h-mute').onclick = () => {
    if (!chimeInited) return;
    const m = !Chime.isMuted();
    Chime.setMuted(m);
    $('h-mute').classList.toggle('off', m);
    UI.toast(m ? '雨声已关' : '雨声已开');
  };

  root.querySelectorAll('.hang-pill[data-act]').forEach(el => {
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.onclick = () => {
      const act = el.dataset.act;
      if (window.Chime) Chime.poke(el.closest('.hang') || el);
      if (act === 'chat') { window.go('chat'); return; }
      const names = { anniv: '纪念日管理', album: '相册', music: '一起听' };
      UI.toast(`${names[act]}后续开放`);
    };
  });

  renderInfo();
}

window.Home = { build, startClock, stopClock };
})();
