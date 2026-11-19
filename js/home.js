/* ══════════════════════════════════════════════
   home.js · 首页（桌面式）
   widget 拼贴：天数 / 月历 / 正在播放 / 访客 + 图标格
   desk-2：修 GUEST 把 hisWords 对象直接塞进 textContent 的问题
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const { S, save } = XW;
const { fmtWeek, diffDay, greetWord, weatherNow } = UI;

let raf;

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

function compressImg(file, maxW, maxH, quality) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxW) { h *= maxW / w; w = maxW; } }
      else { if (h > maxH) { w *= maxH / h; h = maxH; } }
      const c = D.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  });
}

function bindAvatar(el, key) {
  if (!el) return;
  el.style.cursor = 'pointer';
  el.title = '点击更换头像';
  el.addEventListener('click', () => {
    const inp = D.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const data = await compressImg(f, 200, 200, 0.7);
      S[key] = data; save(key);
      el.style.backgroundImage = `url(${data})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
      UI.toast('头像已更新');
    };
    inp.click();
  });
}

const WEATHER_ICONS = {
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.5 12h2m15 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloud: '<path d="M7.5 18.2h9.2a4.3 4.3 0 0 0 .3-8.6 5.7 5.7 0 0 0-10.9 1.6 3.6 3.6 0 0 0 1.4 7z"/>',
  rain: '<path d="M7.5 15.5h9.2a4.3 4.3 0 0 0 .3-8.6 5.7 5.7 0 0 0-10.9 1.6 3.6 3.6 0 0 0 1.4 7zM8 18l-1 2m6-2-1 2m6-2-1 2"/>'
};

const APPS = [
  { go: 'chat', label: '聊天', paths: ['M4 5h16v11H9l-5 4z'] },
  { go: 'mem', label: '记忆', paths: ['M12 21s-7.5-4.9-9.5-9C1 8.5 3 4.5 7 4.5c2.2 0 3.7 1.2 5 3 1.3-1.8 2.8-3 5-3 4 0 6 4 4.5 7.5-2 4.1-9.5 9-9.5 9z'] },
  { go: 'diary', label: '日记', paths: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h4'] },
  { go: 'calendar', label: '日历', paths: ['M4 6h16v15H4z', 'M8 3v4M16 3v4M4 11h16'] },
  { go: 'album', label: '相册', paths: ['M4 4h16v16H4z', 'M9.4 10a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z', 'M20 16l-4-4-9 8'] },
  { go: 'music', label: '一起听', paths: ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
  { go: 'worldbook', label: '世界书', paths: ['M4 5h7v15H4z', 'M13 5h7v15h-7z'] },
  { go: 'windows', label: '窗廊', paths: ['M3 5h18v14H3z', 'M9 5v14'] },
  { go: 'accounting', label: '记账', paths: ['M4 6h16v13H4z', 'M8 11h8', 'M8 15h5'] },
  { go: 'settings', label: '设置', paths: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7'] }
];

/* 月历热度：这个月里每天说了多少句（只读，不改聊天数据） */
function readChatCounts(year, month) {
  const counts = {};
  const bump = list => {
    if (!Array.isArray(list)) return;
    list.forEach(msg => {
      if (!msg || !msg.t) return;
      const d = new Date(msg.t);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      counts[key] = (counts[key] || 0) + 1;
    });
  };
  try {
    const wins = JSON.parse(localStorage.getItem('xw_chatWindows') || '[]');
    const bag = JSON.parse(localStorage.getItem('xw_chatMsgsByChannel') || '{}');
    if (Array.isArray(wins)) wins.forEach(win => {
      if (!win) return;
      if (win.legacyKey) bump(bag[win.legacyKey]);
      else bump(win.messages);
    });
  } catch (err) { console.warn('[Home] calendar counts', err); }
  return counts;
}

function renderCalendar(now) {
  const title = $('h-cal-title'), grid = $('h-cal-grid');
  if (!grid) return;
  const y = now.getFullYear(), m = now.getMonth();
  if (title) title.textContent = `${y}.${String(m + 1).padStart(2, '0')}`;
  const counts = readChatCounts(y, m);
  const max = Math.max(1, ...Object.values(counts));
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<span class="dz-cal-blank"></span>');
  for (let day = 1; day <= days; day++) {
    const count = counts[day] || 0;
    const level = count ? Math.min(3, Math.ceil((count / max) * 3)) : 0;
    const today = day === now.getDate() ? ' is-today' : '';
    cells.push('<span class="dz-cal-day lv' + level + today + '">' + day + '</span>');
  }
  grid.innerHTML = cells.join('');
}

/* hisWords 存的是 [{ text, date }]，不是字符串，取值时必须兼容两种形状 */
function pickHisWord(seed) {
  const list = Array.isArray(S.hisWords) ? S.hisWords : [];
  const usable = list
    .map(item => typeof item === 'string' ? item : (item && typeof item.text === 'string' ? item.text : ''))
    .filter(Boolean);
  if (!usable.length) return '门没锁。来过的人，都会在灯下坐一会儿。';
  return usable[Math.abs(seed) % usable.length];
}

function renderInfo() {
  const now = new Date();
  const love = new Date(S.loveDate || '2025-01-01');
  const days = diffDay(love, now);
  const years = Math.floor(days / 365);
  const nextY = years + 1;
  const nextYDate = new Date(love); nextYDate.setFullYear(love.getFullYear() + nextY);
  const nextDays = diffDay(now, nextYDate);

  const hNames = $('h-names');
  if (hNames) hNames.innerHTML = `${S.hisName || '他'} <span>&</span> ${S.herName || '她'}`;

  const hDays = $('h-days');
  if (hDays) hDays.textContent = days;

  const hSince = $('h-since');
  if (hSince) hSince.textContent = `${love.getFullYear()}.${String(love.getMonth()+1).padStart(2,'0')}.${String(love.getDate()).padStart(2,'0')}`;

  const hNext = $('h-next');
  if (hNext) hNext.textContent = `${nextY} 周年 · ${nextDays} 天后`;

  const w = weatherNow();
  const hWeather = $('h-weather');
  if (hWeather) hWeather.textContent = `${w.temp}°`;
  const hWeatherCond = $('h-weather-cond');
  if (hWeatherCond) hWeatherCond.textContent = w.cond || '';
  const hWeatherIcon = $('h-weather-icon');
  if (hWeatherIcon) hWeatherIcon.innerHTML = WEATHER_ICONS[w.icon] || WEATHER_ICONS.cloud;

  const hGreet = $('h-greet');
  if (hGreet) hGreet.innerHTML = `${greetWord(now.getHours())} · <i>${fmtWeek(now)} ${String(now.getMonth()+1)}月${now.getDate()}日</i>`;

  renderCalendar(now);

  const guest = $('h-guest');
  if (guest) guest.textContent = pickHisWord(now.getDate());
}

function build() {
  const root = $('pg-home');
  const apps = APPS.map(app => {
    const icon = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' +
      app.paths.map(d => '<path d="' + d + '"/>').join('') + '</svg>';
    return '<button type="button" class="dz-app" data-go="' + app.go + '">' + icon +
      '<span>' + app.label + '</span></button>';
  }).join('');

  root.innerHTML = `
    <div class="fe-home desk">
      <header class="fe-hd">
        <button class="fe-menu" id="h-menu" aria-label="打开侧栏">
          <svg class="ic" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="fe-clock-wrap">
          <span class="fe-time" id="h-time"></span>
          <span class="fe-clock-mark" aria-hidden="true"></span>
        </div>
        <div class="fe-weather-wrap">
          <svg class="fe-weather-icon" id="h-weather-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.5 12h2m15 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          <span class="fe-weather" id="h-weather">22°</span>
          <span class="fe-weather-cond" id="h-weather-cond">晴</span>
        </div>
      </header>

      <main class="fe-body dz-wrap">
        <section class="dz-card dz-days">
          <div class="fp-avatars">
            <div class="fp-ava" id="h-hisAva">${S.hisAvatar ? '' : (S.hisName || '他').charAt(0)}</div>
            <span class="fp-amp">&amp;</span>
            <div class="fp-ava fp-ava--her" id="h-herAva">${S.herAvatar ? '' : (S.herName || '她').charAt(0)}</div>
          </div>
          <div class="fp-names" id="h-names"></div>
          <div class="fp-days-wrap">
            <span class="fp-days" id="h-days"></span>
            <span class="fp-days-label">天</span>
          </div>
          <div class="fp-line">
            <span id="h-since"></span>
            <span class="fp-dot"></span>
            <span id="h-next"></span>
          </div>
        </section>

        <section class="dz-card dz-cal">
          <div class="dz-head"><span class="dz-k">CALENDAR</span><b id="h-cal-title"></b></div>
          <div class="dz-cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
          <div class="dz-cal-grid" id="h-cal-grid"></div>
          <p class="dz-note">颜色越深，那天说的话越多</p>
        </section>

        <section class="dz-card dz-play" id="h-vinyl">
          <div class="v-disc" id="v-disc"><span class="v-ring"></span><span class="v-ring"></span><span class="v-core"></span></div>
          <div class="v-info">
            <div class="v-label">NOW PLAYING</div>
            <div class="v-title" id="v-title">夏天的风</div>
            <div class="v-artist" id="v-artist">温岚</div>
          </div>
          <button class="v-play" id="v-play" aria-label="播放">
            <svg class="ic play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg class="ic pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
        </section>

        <section class="dz-card dz-guest">
          <span class="dz-k">GUEST</span>
          <p id="h-guest">门没锁。来过的人，都会在灯下坐一会儿。</p>
        </section>

        <section class="fe-letter" id="h-letter">
          <div class="flip-inner">
            <div class="flip-front">
              <svg class="ic lf-icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span class="lf-text">一封情书</span>
              <span class="lf-hint">click to open</span>
            </div>
            <div class="flip-back">
              <div class="flip-lines" id="h-letter-lines"><p>加载中...</p></div>
            </div>
          </div>
        </section>

        <nav class="dz-icons" aria-label="全部入口">${apps}</nav>
      </main>

      <footer class="fe-foot">
        <div class="fe-greet" id="h-greet"></div>
      </footer>
    </div>`;

  const hisAva = $('h-hisAva');
  const herAva = $('h-herAva');
  if (S.hisAvatar && hisAva) {
    hisAva.style.backgroundImage = `url(${S.hisAvatar})`;
    hisAva.style.backgroundSize = 'cover';
    hisAva.style.backgroundPosition = 'center';
    hisAva.textContent = '';
  }
  if (S.herAvatar && herAva) {
    herAva.style.backgroundImage = `url(${S.herAvatar})`;
    herAva.style.backgroundSize = 'cover';
    herAva.style.backgroundPosition = 'center';
    herAva.textContent = '';
  }
  bindAvatar(hisAva, 'hisAvatar');
  bindAvatar(herAva, 'herAvatar');

  const letter = $('h-letter');
  const letterLines = $('h-letter-lines');
  if (letterLines) letterLines.innerHTML = `<p>${(S.loveLetter || '遇见你之后，每一天都变得不一样了。').replace(/\n/g, '</p><p>')}</p>`;
  if (letter) letter.addEventListener('click', () => letter.classList.toggle('flipped'));

  let vinylPlaying = false;
  const vPlay = $('v-play');
  const vDisc = $('v-disc');
  const vTitle = $('v-title');
  const vArtist = $('v-artist');
  const songs = S.favSongs || [{ title: '夏天的风', artist: '温岚' }, { title: '慢慢喜欢你', artist: '莫文蔚' }];
  let songIdx = S.favIdx || 0;
  function updateSong() {
    const song = songs[songIdx] || songs[0];
    if (vTitle) vTitle.textContent = song.title;
    if (vArtist) vArtist.textContent = song.artist;
  }
  if (vPlay) {
    vPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      vinylPlaying = !vinylPlaying;
      vDisc?.classList.toggle('spin', vinylPlaying);
      vPlay.querySelector('.play-icon').style.display = vinylPlaying ? 'none' : 'block';
      vPlay.querySelector('.pause-icon').style.display = vinylPlaying ? 'block' : 'none';
      if (vinylPlaying) { songIdx = (songIdx + 1) % songs.length; updateSong(); S.favIdx = songIdx; save('favIdx'); }
    });
  }
  updateSong();

  $('h-menu').onclick = () => {
    const sb = document.querySelector('.side-drawer');
    const ov = document.querySelector('.side-overlay');
    if (sb) sb.classList.toggle('show');
    if (ov) ov.classList.toggle('show');
  };

  root.querySelectorAll('.dz-app').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.go;
      if (key === 'chat' || key === 'mem' || key === 'settings' || key === 'home') {
        window.go?.(key);
        return;
      }
      if (typeof window.Daily?.select === 'function') {
        window.Daily.select(key);
        window.go?.('daily');
        return;
      }
      UI.toast('这里还没开门');
    });
  });

  window.XW.applyWallpapers?.();
  renderInfo();
}

window.Home = { build, startClock, stopClock };
})();
