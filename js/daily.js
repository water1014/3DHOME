/* Daily navigation and section shell */
(function () {
  const sections = {
    diary: { zh: '日记', en: 'DIARY', no: '01' },
    health: { zh: '健康', en: 'WELLNESS', no: '02' },
    cycle: { zh: '生理期', en: 'CYCLE', no: '03' },
    abyss: { zh: '深渊区', en: 'ABYSS', no: '04' },
    games: { zh: '游戏', en: 'GAMES', no: '05' },
    calendar: { zh: '日历', en: 'CALENDAR', no: '06' },
    plans: { zh: '安排', en: 'PLANS', no: '07' },
    study: { zh: '学习', en: 'STUDY', no: '08' },
    drawer: { zh: '抽屉', en: 'DRAWER', no: '09' },
  };
  let current = 'diary';
  let built = false;

  function render() {
    const page = document.getElementById('pg-daily');
    const item = sections[current] || sections.diary;
    if (!page) return;
    page.innerHTML = `
      <main class="daily-page">
        <header class="daily-heading">
          <div class="daily-kicker">XIAOWO / DAILY LIFE</div>
          <div class="daily-heading-row">
            <h1>${item.zh}</h1>
            <span class="daily-number">${item.no} <i>/ 09</i></span>
          </div>
          <div class="daily-rule"></div>
          <div class="daily-section-en">${item.en}</div>
        </header>
        <section class="daily-empty" aria-label="${item.zh}">
          <span class="daily-empty-mark"></span>
        </section>
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
  };
})();
