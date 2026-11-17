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

// ── 侧栏：抽屉、单组折叠、键盘焦点与导航状态 ──
function initSide() {
  const btn = $('side-btn'), overlay = $('side-overlay'), drawer = $('side-drawer');
  if (!btn || !overlay || !drawer) return;
  let returnFocus = btn, scrollY = 0;
  const groups = Array.from(drawer.querySelectorAll('[data-sidebar-group]'));
  const groupFor = item => item?.closest('.sd-group-panel')?.previousElementSibling?.dataset.sidebarGroup || null;
  const setPanel = (toggle, expand) => {
    const panel = $(toggle.getAttribute('aria-controls'));
    if (!panel) return;
    toggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
    toggle.querySelector('svg')?.classList.toggle('is-open', expand);
    if (expand) {
      panel.hidden = false; panel.style.height = '0px'; panel.style.overflow = 'hidden';
      requestAnimationFrame(() => { panel.style.height = panel.scrollHeight + 'px'; });
      panel.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        panel.removeEventListener('transitionend', done);
        if (toggle.getAttribute('aria-expanded') === 'true') { panel.style.height = 'auto'; panel.style.overflow = 'visible'; }
      });
    } else if (!panel.hidden) {
      panel.style.height = panel.scrollHeight + 'px'; panel.style.overflow = 'hidden';
      requestAnimationFrame(() => { panel.style.height = '0px'; });
      panel.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        panel.removeEventListener('transitionend', done);
        if (toggle.getAttribute('aria-expanded') === 'false') { panel.hidden = true; panel.style.removeProperty('height'); panel.style.removeProperty('overflow'); }
      });
    }
  };
  const expandOnly = group => groups.forEach(toggle => {
    const shouldOpen = toggle.dataset.sidebarGroup === group;
    if ((toggle.getAttribute('aria-expanded') === 'true') !== shouldOpen) setPanel(toggle, shouldOpen);
  });
  const visibleControls = () => Array.from(drawer.querySelectorAll('button:not([disabled])')).filter(node =>
    !node.closest('[hidden]') && !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length));
  const open = () => {
    returnFocus = D.activeElement instanceof HTMLElement ? D.activeElement : btn;
    drawer.classList.add('show'); overlay.classList.add('show');
    btn.setAttribute('aria-expanded', 'true'); overlay.setAttribute('aria-hidden', 'false');
    scrollY = window.scrollY; D.body.style.position = 'fixed'; D.body.style.top = '-' + scrollY + 'px'; D.body.style.width = '100%';
    const activeSub = drawer.querySelector('.sd-subitem.active');
    if (activeSub) expandOnly(groupFor(activeSub));
    requestAnimationFrame(() => (visibleControls()[0] || drawer).focus());
  };
  const close = () => {
    if (!drawer.classList.contains('show')) return;
    drawer.classList.remove('show'); overlay.classList.remove('show');
    btn.setAttribute('aria-expanded', 'false'); overlay.setAttribute('aria-hidden', 'true');
    D.body.style.position = ''; D.body.style.top = ''; D.body.style.width = '';
    window.scrollTo(0, scrollY);
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  };
  btn.onclick = open; overlay.onclick = close;
  groups.forEach(toggle => toggle.onclick = () => {
    const key = toggle.dataset.sidebarGroup;
    expandOnly(toggle.getAttribute('aria-expanded') === 'true' ? null : key);
  });
  const syncActive = (target, kind) => {
    drawer.querySelectorAll('.sd-item[data-go]').forEach(item => {
      const active = kind === 'main' && item.dataset.go === target;
      item.classList.toggle('on', active);
      if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
    drawer.querySelectorAll('.sd-subitem').forEach(item => {
      const active = kind === 'daily' && item.dataset.dailyGo === target;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
  };
  drawer.querySelectorAll('[data-go]').forEach(item => item.onclick = () => {
    const name = item.dataset.go;
    if (name === 'settings') window.Settings?.build();
    if (name === 'daily') window.Daily?.showCurrent();
    syncActive(name, 'main'); go(name); close();
  });
  drawer.querySelectorAll('[data-settings-section]').forEach(item => item.onclick = () => {
    const section = item.dataset.settingsSection;
    syncActive(section, 'settings');
    window.Settings?.build();
    window.Settings?.openSection(section);
    go('settings');
    close();
  });
  drawer.querySelectorAll('[data-daily-go]').forEach(item => item.onclick = () => {
    const key = item.dataset.dailyGo;
    syncActive(key, 'daily'); window.Daily?.select(key); close();
  });
  drawer.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const controls = visibleControls();
    if (!controls.length) { event.preventDefault(); drawer.focus(); return; }
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && D.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && D.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  const sw = $('sd-switch');
  const syncTheme = () => sw?.classList.toggle('on', D.documentElement.classList.contains('dark'));
  $('sd-theme').onclick = () => {
    const dark = D.documentElement.classList.toggle('dark');
    XW.S.theme = dark ? 'dark' : 'light'; XW.save('theme'); syncTheme();
  };
  syncTheme();
  const n = $('sd-names');
  if (n) n.textContent = `${XW.S.hisName || '他'} & ${XW.S.herName || '她'}`;
  const dayCount = $('sd-day-count');
  if (dayCount) {
    const start = new Date((XW.S.loveDate || '2025-01-01') + 'T00:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    dayCount.textContent = `TOGETHER · DAY ${Math.max(1, Math.floor((now - start) / 86400000) + 1)}`;
  }
}


const MAIN_ORDER = ['home', 'mem', 'chat', 'daily'];
function initGestures() {
  let start = null;
  const drawer = $('side-drawer');
  const overlay = $('side-overlay');
  const closeDrawer = () => $('side-overlay')?.click();
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
      $('side-btn')?.click(); return;
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
