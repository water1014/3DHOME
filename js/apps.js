/* apps.js · 桌面分页 + App 全屏打开层
   照 SullyOS 的 launcher：
   APPS_PER_PAGE = 8（4 列 x 2 行），横向 scroll-snap 翻页，
   第一页 = 组件（widget）+ 8 个图标，后面页 = 纯图标页。
   不重建 widget 节点，只移动它们，home.js 的事件绑定不会掉。 */
(function () {
  const D = document;
  const $ = id => D.getElementById(id);
  const PER_PAGE = 8;

  const APPS = [
    { key: 'chat', name: '聊天', page: true, p: ['M4 5h16v11H9l-5 4z'] },
    { key: 'mem', name: '记忆', page: true, p: ['M12 21s-7.5-4.9-9.5-9C1 8.5 3 4.5 7 4.5c2.2 0 3.7 1.2 5 3 1.3-1.8 2.8-3 5-3 4 0 6 4 4.5 7.5-2 4.1-9.5 9-9.5 9z'] },
    { key: 'diary', name: '日记', p: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h4'] },
    { key: 'accounting', name: '记账', p: ['M4 6h16v13H4z', 'M8 11h8', 'M8 15h5'] },
    { key: 'weather', name: '天气', p: ['M7.5 18.2h9.2a4.3 4.3 0 0 0 .3-8.6 5.7 5.7 0 0 0-10.9 1.6 3.6 3.6 0 0 0 1.4 7z'] },
    { key: 'mood', name: '心情', p: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8.5 14s1.4 2 3.5 2 3.5-2 3.5-2', 'M9.5 9.5h.01M14.5 9.5h.01'] },
    { key: 'health', name: '健康', p: ['M3 12h4l2-6 3 12 2.5-6H21'] },
    { key: 'cycle', name: '经期', p: ['M12 3c3 4 6 6.6 6 10a6 6 0 0 1-12 0c0-3.4 3-6 6-10z'] },
    { key: 'calendar', name: '日历', p: ['M4 6h16v15H4z', 'M8 3v4M16 3v4M4 11h16'] },
    { key: 'plans', name: '安排', p: ['M5 4h14v17H5z', 'M9 9h6M9 13h6M9 17h3'] },
    { key: 'study', name: '学习', p: ['M4 5h7v15H4z', 'M13 5h7v15h-7z'] },
    { key: 'quotes', name: '语录', p: ['M7 7h6v6H7z', 'M7 17h10', 'M17 7h.01M17 13h.01'] },
    { key: 'moments', name: '动态', p: ['M12 3v18', 'M3 12h18', 'M6 6l12 12', 'M18 6L6 18'] },
    { key: 'favorites', name: '收藏', p: ['M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z'] },
    { key: 'album', name: '相册', p: ['M4 4h16v16H4z', 'M9.4 10a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z', 'M20 16l-4-4-9 8'] },
    { key: 'games', name: '游戏', p: ['M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1.8A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4z', 'M8 11v2M7 12h2M15.5 11.5h.01M17 13h.01'] },
    { key: 'music', name: '一起听', p: ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
    { key: 'image-studio', name: '生图室', p: ['M4 5h16v14H4z', 'M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M20 15l-5-5-9 9'] },
    { key: 'worldbook', name: '世界书', p: ['M4 5h7v15H4z', 'M13 5h7v15h-7z', 'M6.5 9h2M6.5 13h2'] },
    { key: 'windows', name: '窗廊', p: ['M3 5h18v14H3z', 'M9 5v14'] },
    { key: 'mcp', name: 'MCP', p: ['M9 7V5a3 3 0 0 1 6 0v2', 'M7 7h10v6a5 5 0 0 1-10 0z', 'M12 18v3'] },
    { key: 'beautify', name: '美化', p: ['M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z'] },
    { key: 'settings', name: '设置', page: true, p: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7'] }
  ];

  function iconSvg(paths) {
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' +
      paths.map(d => '<path d="' + d + '"/>').join('') + '</svg>';
  }

  function iconGrid(list) {
    const grid = D.createElement('nav');
    grid.className = 'dz-icons';
    grid.setAttribute('aria-label', '应用');
    grid.innerHTML = list.map(app =>
      '<button type="button" class="dz-app" data-app="' + app.key + '">' +
      iconSvg(app.p) + '<span>' + app.name + '</span></button>'
    ).join('');
    return grid;
  }

  /* 把首页拆成一页页：第一页保留 widget + 前 8 个图标 */
  function buildPages() {
    const wrap = D.querySelector('#pg-home .dz-wrap');
    if (!wrap || wrap.dataset.paged === '1') return;

    const oldIcons = wrap.querySelector('.dz-icons');
    const widgets = Array.from(wrap.children).filter(el => el !== oldIcons);
    if (oldIcons) oldIcons.remove();

    const pages = [];
    for (let i = 0; i < APPS.length; i += PER_PAGE) pages.push(APPS.slice(i, i + PER_PAGE));
    if (!pages.length) pages.push([]);

    const first = D.createElement('section');
    first.className = 'dz-page';
    widgets.forEach(el => first.appendChild(el));
    first.appendChild(iconGrid(pages[0]));

    const nodes = [first];
    pages.slice(1).forEach(list => {
      const page = D.createElement('section');
      page.className = 'dz-page dz-page--apps';
      page.appendChild(iconGrid(list));
      nodes.push(page);
    });

    wrap.textContent = '';
    nodes.forEach(node => wrap.appendChild(node));
    wrap.dataset.paged = '1';

    renderDots(nodes.length);
    bindScroll();
  }

  function renderDots(count) {
    const desk = D.querySelector('#pg-home .fe-home');
    if (!desk) return;
    let dots = $('dz-dots');
    if (!dots) {
      dots = D.createElement('div');
      dots.id = 'dz-dots';
      dots.className = 'dz-dots';
      desk.appendChild(dots);
    }
    dots.innerHTML = Array.from({ length: count }, (_, i) =>
      '<span' + (i === 0 ? ' class="on"' : '') + '></span>').join('');
  }

  function bindScroll() {
    const wrap = D.querySelector('#pg-home .dz-wrap');
    if (!wrap || wrap.__dotsBound) return;
    wrap.__dotsBound = true;
    let raf = 0;
    wrap.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const dots = $('dz-dots');
        if (!dots) return;
        const index = Math.round(wrap.scrollLeft / Math.max(1, wrap.clientWidth));
        Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('on', i === index));
      });
    }, { passive: true });
  }

  function ensureBack() {
    if ($('app-back')) return;
    const btn = D.createElement('button');
    btn.id = 'app-back';
    btn.type = 'button';
    btn.setAttribute('aria-label', '返回桌面');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    btn.addEventListener('click', () => {
      D.body.classList.remove('app-mode');
      window.go?.('home');
    });
    D.body.appendChild(btn);
  }

  function openApp(key) {
    const app = APPS.find(item => item.key === key);
    if (!app) return;
    if (app.page) {
      if (key === 'settings') window.Settings?.build?.();
      D.body.classList.remove('app-mode');
      window.go?.(key);
      return;
    }
    if (typeof window.Daily?.select === 'function') {
      window.Daily.select(key);
      window.go?.('daily');
      D.body.classList.add('app-mode');
      return;
    }
    window.UI?.toast?.('这里还没开门');
  }

  D.addEventListener('click', event => {
    const btn = event.target.closest?.('.dz-app');
    if (!btn) return;
    const key = btn.dataset.app || btn.dataset.go;
    if (!key) return;
    event.preventDefault();
    event.stopPropagation();
    openApp(key);
  }, true);

  function patchHome() {
    const Home = window.Home;
    if (!Home || typeof Home.build !== 'function') return false;
    if (Home.__appsPatched) return true;
    const original = Home.build;
    Home.build = function () {
      const result = original.apply(this, arguments);
      try { buildPages(); ensureBack(); } catch (err) { console.warn('[Apps]', err); }
      return result;
    };
    Home.__appsPatched = true;
    return true;
  }

  let tries = 0;
  const boot = () => {
    ensureBack();
    if (!patchHome()) {
      if (++tries < 60) { setTimeout(boot, 100); return; }
      return;
    }
    if (D.querySelector('#pg-home .dz-wrap')) buildPages();
  };
  boot();

  window.Apps = { openApp, list: APPS, close: () => { D.body.classList.remove('app-mode'); window.go?.('home'); } };
})();
