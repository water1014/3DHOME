/* dock.js · 底部 dock ─────────────────────────────
   base.css 里 .tabbar / .tab-item 的样式写全了，
   app.js 里也有给 .tab-item 同步 active 的逻辑，
   但 index.html 从来没建过这几个节点，所以一直是死代码。
   这里把 dock 建出来，并且必须在 app.js 之前执行：
   app.js 加载时 querySelectorAll('.tab-item') 才抓得到这五格。
   dock-2：dock 自己也支持左右滑 —— 手指落在 dock 上也能翻桌面页
   ─────────────────────────────────────────────── */
(function () {
  const D = document;
  if (D.querySelector('.tabbar')) return;

  const items = [
    {
      go: 'home', label: 'HOME',
      paths: ['M3 11.5 12 4l9 7.5', 'M5.5 10.5V20h13v-9.5']
    },
    {
      go: 'mem', label: 'MEMORY',
      paths: ['M12 21s-7.5-4.9-9.5-9C1 8.5 3 4.5 7 4.5c2.2 0 3.7 1.2 5 3 1.3-1.8 2.8-3 5-3 4 0 6 4 4.5 7.5-2 4.1-9.5 9-9.5 9z']
    },
    {
      go: 'chat', label: 'CHAT',
      paths: ['M4 5h16v11H9l-5 4z']
    },
    {
      go: 'daily', label: 'DAILY',
      paths: ['M4 6h16v15H4z', 'M8 3v4M16 3v4M4 11h16']
    },
    {
      go: 'settings', label: 'YOU',
      paths: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.74.48l-.06.06h-3.4l-.04-.08a1.7 1.7 0 0 0-1.5-1.02h-.1l-2.94-1.7.02-.08a1.7 1.7 0 0 0-.48-1.74l-.06-.06v-3.4l.08-.04a1.7 1.7 0 0 0 1.02-1.5v-.1l1.7-2.94.08.02a1.7 1.7 0 0 0 1.74-.48l.06-.06h3.4l.04.08a1.7 1.7 0 0 0 1.5 1.02h.1l2.94 1.7-.02.08a1.7 1.7 0 0 0 .48 1.74l.06.06z']
    }
  ];

  const bar = D.createElement('nav');
  bar.className = 'tabbar';
  bar.setAttribute('aria-label', '主导航');
  bar.innerHTML = items.map(item => {
    const icon = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' +
      item.paths.map(d => '<path d="' + d + '"/>').join('') + '</svg>';
    return '<button type="button" class="tab-item' + (item.go === 'home' ? ' active' : '') +
      '" data-go="' + item.go + '">' + icon + '<span>' + item.label + '</span></button>';
  }).join('');

  D.body.appendChild(bar);

  bar.addEventListener('click', event => {
    const item = event.target.closest('.tab-item');
    if (!item) return;
    const name = item.dataset.go;
    if (typeof window.go === 'function') {
      window.go(name);
    } else {
      D.querySelectorAll('.pg').forEach(p => p.classList.toggle('on', p.id === 'pg-' + name));
      bar.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t === item));
    }
  });

  /* ── dock 上左右滑 = 翻桌面页 ──
     手指落在 dock 上时，横向滑动被 dock 吃掉了；
     这里把横向位移转给桌面的横向滚动容器。 */
  let swallowClick = false;
  let start = null;

  function desktopScroller() {
    if (!D.querySelector('#pg-home.on')) return null;
    return D.querySelector('#pg-home .dz-wrap');
  }

  bar.addEventListener('touchstart', event => {
    if (!event.touches || event.touches.length !== 1) { start = null; return; }
    const t = event.touches[0];
    start = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  bar.addEventListener('touchmove', event => {
    if (!start) { swallowClick = false; return; }
    const t = event.touches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) swallowClick = true;
  }, { passive: true });

  bar.addEventListener('touchend', event => {
    if (!start || !event.changedTouches || event.changedTouches.length !== 1) {
      start = null;
      return;
    }
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    start = null;

    const scroller = desktopScroller();
    if (!scroller) { swallowClick = false; return; }
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    event.preventDefault();
    const width = Math.max(1, scroller.clientWidth);
    const page = Math.round(scroller.scrollLeft / width);
    const total = scroller.querySelectorAll('.dz-page').length || 1;
    const next = Math.min(total - 1, Math.max(0, page + (dx < 0 ? 1 : -1)));
    if (next !== page) scroller.scrollTo({ left: next * width, behavior: 'smooth' });
  }, { passive: false });

  /* 滑完之后不要把手抬起当成点击 dock */
  bar.addEventListener('click', event => {
    if (!swallowClick) return;
    swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.Dock = { el: bar };
})();
