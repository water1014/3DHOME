/* ══════════════════════════════════════════════
   app.js · 路由 / 侧栏 / 初始化
   主页面：home mem chat daily settings
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const tabs = D.querySelectorAll('.tab-item');
const pages = {
  home: $('pg-home'), mem: $('pg-mem'), chat: $('pg-chat'),
  daily: $('pg-daily'), settings: $('pg-settings'),
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
        window.Daily?.showCurrent();
        go('daily');
        close();
        return;
      }
      drawer.querySelectorAll('.sd-item').forEach(i => i.classList.toggle('on', i === item));
      if (name === 'settings') { window.Settings?.build(); }
      go(name);
      close();
    };
  });

  drawer.querySelectorAll('[data-daily-go]').forEach(item => {
    item.onclick = () => {
      window.Daily?.select(item.dataset.dailyGo);
      drawer.querySelectorAll('[data-daily-go]').forEach(link => link.classList.toggle('active', link === item));
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


const MAIN_ORDER = ['home', 'mem', 'chat', 'daily'];
function initGestures() {
  let start = null;
  const drawer = $('side-drawer');
  const overlay = $('side-overlay');
  const closeDrawer = () => { drawer.classList.remove('show'); overlay.classList.remove('show'); };
  D.addEventListener('touchstart', e => {
    if (!e.touches || e.touches.length !== 1) { start = null; return; }
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY, target: e.target, time: Date.now() };
  }, { passive: true });
  D.addEventListener('touchcancel', () => { start = null; }, { passive: true });
  D.addEventListener('touchend', e => {
    if (!start || !e.changedTouches || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const originX = start.x;
    const dx = t.clientX - originX, dy = t.clientY - start.y;
    const elapsed = Date.now() - start.time;
    const target = start.target;
    start = null;
    if (elapsed > 700 || Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.35) return;

    const drawerOpen = drawer.classList.contains('show');
    if (drawerOpen) {
      if (dx < -55 && startSafeArea(target)) closeDrawer();
      return;
    }
    if (target.closest?.('input,textarea,select,button,a,img,video,canvas,[contenteditable="true"],[data-no-page-swipe],.chat-input,.chat-search,.chat-pref,.chat-window-sheet,.chat-media-filters,.overlay')) return;

    // 左边缘右滑呼出侧栏
    if (dx > 70 && originX < 28) {
      drawer.classList.add('show'); overlay.classList.add('show'); return;
    }

    if (cur === 'daily' && window.Daily?.step(dx < 0 ? 1 : -1)) return;
    const index = MAIN_ORDER.indexOf(cur);
    if (index < 0) return;
    const next = index + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < MAIN_ORDER.length) go(MAIN_ORDER[next]);
  }, { passive: true });
}
function startSafeArea(target) {
  return !!target && !!target.closest?.('#side-drawer');
}

function init() {
  if (XW.S.theme === 'dark') D.documentElement.classList.add('dark');
  else D.documentElement.classList.remove('dark');
  // Build each page independently: one broken feature must never blank the whole app.
  const buildPage = (name, fn) => {
    try { fn?.(); }
    catch (error) { console.error('[XIAOWO] ' + name + ' initialization failed:', error); }
  };
  buildPage('home', () => window.Home?.build());
  buildPage('chat', () => window.Chat?.build());
  buildPage('settings', () => window.Settings?.build());
  buildPage('memory', () => window.Memory?.build());
  buildPage('daily', () => window.Daily?.build());

  tabs.forEach(t => t.addEventListener('click', () => go(t.dataset.go)));
  try { initSide(); } catch (error) { console.error('[XIAOWO] sidebar initialization failed:', error); }
  try { initGestures(); } catch (error) { console.error('[XIAOWO] gesture initialization failed:', error); }
  go('home');
  if (!pages.home.innerHTML.trim()) {
    pages.home.innerHTML = '<main style="padding:28px;color:var(--ink);font:16px/1.7 sans-serif"><h2>小窝正在恢复</h2><p>首页模块暂时没有成功载入。其他页面入口仍可使用，请稍后重试。</p></main>';
  }
}

if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init);
else init();
})();
