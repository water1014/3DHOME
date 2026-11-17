/* ══════════════════════════════════════════════
   app.js · 路由 / 侧栏 / 初始化
   五页：home mem chat daily read（+ mine 走侧栏）
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const tabs = D.querySelectorAll('.tab-item');
const pages = {
  home: $('pg-home'), mem: $('pg-mem'), chat: $('pg-chat'),
  daily: $('pg-daily'), read: $('pg-read'), mine: $('pg-mine'),
};

let cur = '';

function go(name) {
  if (!Object.prototype.hasOwnProperty.call(pages, name) || !pages[name]) return;
  if (cur === 'home' && name !== 'home') window.Home?.stopClock();

  // 每次切页都校准全部页面，确保首页 / 聊天 / 记忆严格一一对应，
  // 不依赖上一次 cur 状态，也不允许两个页面同时保持显示。
  Object.entries(pages).forEach(([key, page]) => {
    if (page) page.classList.toggle('on', key === name);
  });
  tabs.forEach(t => t.classList.toggle('active', t.dataset.go === name));
  D.querySelectorAll('#side-drawer [data-go]').forEach(t => {
    t.classList.toggle('on', t.dataset.go === name);
  });

  cur = name;
  if (cur === 'home') window.Home?.startClock();
  if (cur === 'daily') window.Daily?.showCurrent();
}
window.go = go;

// ── 占位页（记忆 / 日常 / 阅读） ──
const PLACEHOLDER = {
  daily: { en: 'DAILY',  zh: '日常', desc: '便签墙与每一天的小确幸，筹备中。' },
  read:  { en: 'READ',   zh: '阅读', desc: '一起读的书单与进度，即将上线。' },
};
const builtPh = {};
function buildPlaceholder(name) {
  if (builtPh[name]) return;
  builtPh[name] = true;
  const p = PLACEHOLDER[name];
  pages[name].innerHTML = `
    <div class="main ph-page">
      <div class="ph-head">
        <div class="ph-title">${p.zh}</div>
        <div class="chat-status"><span class="dot"></span>${p.en} · COMING SOON</div>
      </div>
      <div class="card frame ph-card">
        <div class="ph-idx micro">SECTION · ${p.en}</div>
        <svg class="ic ph-ic" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        <div class="ph-desc">${p.desc}</div>
        <div class="micro">UNDER CONSTRUCTION</div>
      </div>
    </div>`;
}

// ── 侧栏 ──
function initSide() {
  const btn = $('side-btn'), overlay = $('side-overlay'), drawer = $('side-drawer');
  const open = () => { drawer.classList.add('show'); overlay.classList.add('show'); };
  const close = () => { drawer.classList.remove('show'); overlay.classList.remove('show'); };
  btn.onclick = open;
  overlay.onclick = close;

  // 导航
  drawer.querySelectorAll('[data-go]').forEach(item => {
    item.onclick = () => {
      const name = item.dataset.go;
      if (name === 'daily') {
        const group = $('sd-daily-group');
        const expanded = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', String(!expanded));
        group?.classList.toggle('expanded', !expanded);
        go('daily');
        return;
      }
      drawer.querySelectorAll('.sd-item').forEach(i => i.classList.toggle('on', i === item));
      if (name === 'mine') { window.Mine?.build(); }
      go(name);
      close();
    };
  });

  // 深色模式
  const sw = $('sd-switch');
  const syncTheme = () => sw.classList.toggle('on', D.documentElement.classList.contains('dark'));
  $('sd-theme').onclick = () => {
    const dark = D.documentElement.classList.toggle('dark');
    XW.S.theme = dark ? 'dark' : 'light';
    XW.save('theme');
    syncTheme();
  };
  syncTheme();

  // 侧栏名字
  const n = $('sd-names');
  if (n) n.textContent = `${XW.S.hisName || '他'} & ${XW.S.herName || '她'}`;
}

function init() {
  window.Mine?.applyTheme();
  window.Home?.build();
  window.Chat?.build();
  window.Mine?.build();
  window.Memory?.build();
  window.Daily?.build();
  buildPlaceholder('read');

  tabs.forEach(t => t.addEventListener('click', () => go(t.dataset.go)));
  initSide();
  go('home');
}

if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init);
else init();
})();
