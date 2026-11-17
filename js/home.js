/* ══════════════════════════════════════════════
   home.js · 首页（全新版 · 层叠材质 · 紧凑）
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
  clearTimeout(raf);
  raf = setTimeout(tickClock, 5000);
}
function startClock() { clearTimeout(raf); tickClock(); }
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
  if (hWeather) hWeather.textContent = `${w.icon === 'sun' ? '☼' : '◦'} ${w.temp}°`;
  const hTime = $('h-time');
  if (hTime) hTime.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const hGreet = $('h-greet');
  if (hGreet) hGreet.innerHTML = `${greetWord(now.getHours())} · <i>${fmtWeek(now)} ${String(now.getMonth()+1)}月${now.getDate()}日</i>`;

  const dateMonth = $('h-date-month');
  const dateDay = $('h-date-day');
  const dateWeek = $('h-date-week');
  if (dateMonth) dateMonth.textContent = `${String(now.getMonth()+1).padStart(2,'0')} / ${now.getFullYear()}`;
  if (dateDay) dateDay.textContent = String(now.getDate()).padStart(2,'0');
  if (dateWeek) dateWeek.textContent = ['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()];
}

function build() {
  const root = $('pg-home');
  root.innerHTML = `
    <div class="fe-home">
      <!-- 顶栏 -->
      <header class="fe-hd">
        <button class="fe-menu" id="h-menu">
          <svg class="ic" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="fe-meta">
          <span class="fe-time" id="h-time"></span>
          <span class="fe-weather" id="h-weather">22°</span>
        </div>
      </header>

      <!-- 主体 -->
      <main class="fe-body">
        <!-- 档案卡 — 层叠版 -->
        <section class="fe-profile">
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

        <!-- 快捷入口 — 紧凑 pill 行 -->
        <nav class="fe-nav">
          <a class="fn-pill" data-act="daily">
            <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>动态</span>
          </a>
          <a class="fn-pill" data-act="ai">
            <svg class="ic" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <span>生图</span>
          </a>
          <a class="fn-pill" data-act="fav">
            <svg class="ic" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>收藏</span>
          </a>
          <a class="fn-pill" data-act="album">
            <svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>相册</span>
          </a>
        </nav>

        <!-- 信纸与日期 -->
        <div class="fe-mix-grid">
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

          <section class="fe-date-stamp" aria-label="日期">
            <div class="fd-month" id="h-date-month"></div>
            <div class="fd-day" id="h-date-day"></div>
            <div class="fd-week" id="h-date-week"></div>
          </section>
        </div>

        <!-- 相册墙 -->
        <section class="fe-photos" id="h-photos">
          <div class="ph-header">
            <span class="ph-title">photos</span>
            <span class="ph-count">3</span>
          </div>
          <div class="ph-wall">
            <div class="ph-frame" style="transform:rotate(-3deg) translateY(2px)">
              <div class="ph-img" id="ph-img-1"></div>
              <div class="ph-cap">2025</div>
            </div>
            <div class="ph-frame" style="transform:rotate(2deg) translateY(-3px)">
              <div class="ph-img" id="ph-img-2"></div>
              <div class="ph-cap">summer</div>
            </div>
            <div class="ph-frame" style="transform:rotate(-1.5deg) translateY(4px)">
              <div class="ph-img" id="ph-img-3"></div>
              <div class="ph-cap">us</div>
            </div>
          </div>
        </section>

        <!-- 一起听 -->
        <section class="fe-vinyl" id="h-vinyl" data-act="music">
          <div class="v-disc" id="v-disc">
            <span class="v-ring"></span>
            <span class="v-ring"></span>
            <span class="v-core"></span>
          </div>
          <div class="v-info">
            <div class="v-label">一起听</div>
            <div class="v-title" id="v-title">夏天的风</div>
            <div class="v-artist" id="v-artist">温岚</div>
          </div>
          <button class="v-play" id="v-play">
            <svg class="ic play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg class="ic pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
        </section>
      </main>

      <!-- 底部 -->
      <footer class="fe-foot">
        <div class="fe-greet" id="h-greet"></div>
      </footer>
    </div>`;

  // 头像渲染
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

  // 翻面信纸
  const letter = $('h-letter');
  const letterLines = $('h-letter-lines');
  if (letterLines) letterLines.innerHTML = `<p>${(S.loveLetter || '遇见你之后，每一天都变得不一样了。').replace(/\n/g, '</p><p>')}</p>`;
  if (letter) letter.addEventListener('click', () => letter.classList.toggle('flipped'));

  // 唱片播放器
  let vinylPlaying = false;
  const vPlay = $('v-play');
  const vDisc = $('v-disc');
  const vTitle = $('v-title');
  const vArtist = $('v-artist');
  const songs = S.favSongs || [{ title: '夏天的风', artist: '温岚' }, { title: '慢慢喜欢你', artist: '莫文蔚' }];
  let songIdx = S.favIdx || 0;
  function updateSong() {
    const s = songs[songIdx] || songs[0];
    if (vTitle) vTitle.textContent = s.title;
    if (vArtist) vArtist.textContent = s.artist;
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

  // 相册
  const photos = S.photos || [];
  const photoCount = $("h-photos")?.querySelector(".ph-count");
  if (photoCount) photoCount.textContent = String(photos.filter(Boolean).length);
  for (let i = 0; i < 3; i++) {
    const imgEl = $(`ph-img-${i+1}`);
    if (imgEl) {
      if (photos[i]) {
        imgEl.style.backgroundImage = `url(${photos[i]})`;
        imgEl.classList.add('has-img');
      }
      imgEl.addEventListener('click', () => {
        const inp = D.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          const data = await compressImg(f, 400, 400, 0.8);
          S.photos = S.photos || [];
          S.photos[i] = data;
          save('photos');
          imgEl.style.backgroundImage = `url(${data})`;
          imgEl.classList.add('has-img');
          UI.toast('照片已更新');
        };
        inp.click();
      });
    }
  }

  // 侧栏按钮
  $('h-menu').onclick = () => {
    const sb = document.querySelector('.side-drawer');
    const ov = document.querySelector('.side-overlay');
    if (sb) sb.classList.toggle('show');
    if (ov) ov.classList.toggle('show');
  };

  // 功能入口点击
  const actNames = { daily: '动态', ai: '生图', fav: '收藏', music: '一起听', album: '相册' };
  root.querySelectorAll('[data-act]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const act = el.dataset.act;
      if (act === 'daily') { window.go('daily'); return; }
      if (act === 'album') {
        $('h-photos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (act === 'chat') { window.go('chat'); return; }
      UI.toast(`${actNames[act]}后续开放`);
    });
  });

  renderInfo();
}

window.Home = { build, startClock, stopClock };
})();
