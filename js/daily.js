/* Daily navigation and section shell */
(function () {
  const sections = {
    accounting: { zh: '记账', en: 'QUICK EXPENSES', group: 'DAILY LIFE' },
    weather: { zh: '天气', en: 'WEATHER', group: 'DAILY LIFE' },
    health: { zh: '健康', en: 'WELLNESS', group: 'DAILY LIFE' },
    cycle: { zh: '经期', en: 'CYCLE', group: 'DAILY LIFE' },
    calendar: { zh: '日历', en: 'CALENDAR', group: 'DAILY LIFE' },
    plans: { zh: '安排', en: 'PLANS', group: 'DAILY LIFE' },
    mood: { zh: '心情', en: 'MOOD JOURNAL', group: 'DAILY LIFE' },
    study: { zh: '学习', en: 'STUDY', group: 'DAILY LIFE' },
    quotes: { zh: '语录', en: 'QUOTES', group: 'COLLECTIONS' },
    worldbook: { zh: '世界书', en: 'WORLDBOOK', group: 'OUR SPACE' },
    games: { zh: '游戏', en: 'GAMES', group: 'PLAY & CREATE' },
    music: { zh: '音乐', en: 'MUSIC', group: 'PLAY & CREATE' },
    windows: { zh: '窗廊', en: 'WINDOW GALLERY', group: 'OUR SPACE' },
    moments: { zh: '动态', en: 'MOMENTS', group: 'COLLECTIONS' },
    favorites: { zh: '收藏', en: 'FAVORITES', group: 'COLLECTIONS' },
    beautify: { zh: '美化', en: 'APPEARANCE', group: 'SYSTEM' },
    mcp: { zh: 'MCP', en: 'CONNECTIONS', group: 'SYSTEM' },
    album: { zh: '相册', en: 'ALBUM', group: 'COLLECTIONS' },
    'image-studio': { zh: '生图室', en: 'IMAGE STUDIO', group: 'PLAY & CREATE' },
  };
  let current = 'accounting';
  let built = false;
  function render() {
    const page = document.getElementById('pg-daily');
    const item = sections[current] || sections.accounting;
    if (!page) return;
    page.innerHTML = `
      <main class="daily-page">
        <header class="daily-heading">
          <div class="daily-kicker">XIAOWO / ${item.group}</div>
          <div class="daily-heading-row"><h1>${item.zh}</h1><span class="daily-number">XIAOWO <i>/ SPACE</i></span></div>
          <div class="daily-rule"></div><div class="daily-section-en">${item.en}</div>
        </header>
        <section class="daily-empty" aria-label="${item.zh}"><span class="daily-empty-mark"></span></section>
      </main>`;
    document.querySelectorAll('[data-daily-go]').forEach(link => {
      link.classList.toggle('active', link.dataset.dailyGo === current);
      link.setAttribute('aria-current', link.dataset.dailyGo === current ? 'page' : 'false');
    });
  }
  window.Daily = {
    build() { if (built) return; built = true; render(); },
    select(key) { if (!sections[key]) return; current = key; render(); window.go?.('daily'); },
    showCurrent() { if (built) render(); },
    step(delta) {
      const keys = Object.keys(sections), index = keys.indexOf(current);
      const next = Math.max(0, Math.min(keys.length - 1, index + delta));
      if (next !== index) { current = keys[next]; render(); return true; }
      return false;
    },
  };
})();