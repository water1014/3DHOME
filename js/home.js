/* ══════════════════════════════════════════════
   home.js · 小窝首页：两个人的生活入口
   ══════════════════════════════════════════════ */
(function () {
  const D = document;
  const $ = D.getElementById.bind(D);
  const { S, save } = XW;
  const { fmtWeek, diffDay, greetWord } = UI;
  let clockTimer = null;

  // 修正旧版演示默认日期，不覆盖用户自己设置过的日期。
  if (S.loveDate === '2025-01-01') {
    S.loveDate = '2026-10-28';
    save('loveDate');
  }

  function localDate(value) {
    const [y, m, d] = String(value || '2026-10-28').split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function updateClock() {
    const el = $('h-time');
    const now = new Date();
    if (el) el.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const greet = $('h-greeting');
    if (greet) greet.textContent = greetWord(now.getHours());
    clockTimer = setTimeout(updateClock, 30000);
  }
  function startClock() {
    clearTimeout(clockTimer);
    updateClock();
  }
  function stopClock() {
    clearTimeout(clockTimer);
    clockTimer = null;
  }

  function compressImg(file, maxSide = 900, quality = .82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = D.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }

  function setAvatar(el, key) {
    if (!el) return;
    const value = S[key];
    if (value) {
      el.style.backgroundImage = `url("${value}")`;
      el.classList.add('has-photo');
      el.textContent = '';
    } else {
      el.textContent = (key === 'hisAvatar' ? S.hisName : S.herName || '你').charAt(0);
    }
    el.addEventListener('click', () => {
      const input = D.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const data = await compressImg(file, 420, .8);
          S[key] = data;
          save(key);
          setAvatar(el, key);
          UI.toast('头像已更新');
        } catch { UI.toast('图片读取失败，请重试'); }
      };
      input.click();
    });
  }

  function renderRelationship() {
    const now = new Date();
    const since = localDate(S.loveDate);
    const days = Math.max(0, diffDay(since, now));
    const years = Math.max(0, now.getFullYear() - since.getFullYear() - (
      now.getMonth() < since.getMonth() || (now.getMonth() === since.getMonth() && now.getDate() < since.getDate()) ? 1 : 0
    ));
    const next = new Date(since);
    next.setFullYear(since.getFullYear() + years + 1);
    const nextDays = Math.max(0, diffDay(now, next));
    const names = $('h-names');
    if (names) names.textContent = `${S.hisName || '他'}  &  ${S.herName || '你'}`;
    const count = $('h-days');
    if (count) count.textContent = days.toLocaleString('en-US');
    const sinceEl = $('h-since');
    if (sinceEl) sinceEl.textContent = `SINCE ${since.getFullYear()}. ${String(since.getMonth() + 1).padStart(2, '0')}. ${String(since.getDate()).padStart(2, '0')}`;
    const nextEl = $('h-next');
    if (nextEl) nextEl.textContent = `距离下一年，还有 ${nextDays} 天`;
    const date = $('h-date');
    if (date) date.textContent = `${fmtWeek(now)} · ${now.getMonth() + 1}月${now.getDate()}日`;
  }

  function renderPhotos() {
    const wall = $('h-photo-wall');
    if (!wall) return;
    const photos = Array.isArray(S.photos) ? S.photos : [];
    wall.innerHTML = [0, 1, 2].map(i => {
      const src = photos[i];
      return `<button class="home-photo ${src ? 'has-photo' : 'is-empty'}" type="button" data-photo-index="${i}" aria-label="${src ? '更换' : '添加'}第${i + 1}张照片">
        ${src ? `<img src="${src}" alt="我们的照片" loading="lazy">` : '<span class="photo-plus">＋</span><span class="photo-empty-label">放一张照片</span>'}
      </button>`;
    }).join('');
    wall.querySelectorAll('[data-photo-index]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.photoIndex);
        const input = D.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const data = await compressImg(file, 1000, .82);
            S.photos = Array.isArray(S.photos) ? S.photos : [];
            S.photos[index] = data;
            save('photos');
            renderPhotos();
            UI.toast('照片放进小窝啦');
          } catch { UI.toast('图片读取失败，请重试'); }
        };
        input.click();
      });
    });
    const count = $('h-photo-count');
    if (count) count.textContent = photos.filter(Boolean).length + ' / 3';
  }

  function build() {
    const root = $('pg-home');
    if (!root) return;
    root.innerHTML = `
      <div class="fe-home home-v2">
        <header class="home-topbar">
          <button class="home-menu" id="h-menu" type="button" aria-label="打开菜单">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h11M4 17h16"/></svg>
          </button>
          <div class="home-wordmark"><span>OUR LITTLE PLACE</span><strong>小窝</strong></div>
          <div class="home-clock" id="h-time">--:--</div>
        </header>

        <main class="home-scroll">
          <section class="home-intro">
            <div class="home-intro-copy">
              <span class="home-eyebrow" id="h-date"></span>
              <h1><span id="h-greeting">今天也</span><br>留一点时间给我们。</h1>
              <p>这里不需要赶路，只收留生活本来的样子。</p>
            </div>
            <span class="home-orbit" aria-hidden="true"><i></i><b></b></span>
          </section>

          <section class="home-together" aria-label="相处纪念">
            <div class="home-together-head">
              <div class="home-avatars">
                <button class="home-avatar" id="h-hisAva" type="button" aria-label="更换他的头像"></button>
                <span class="home-amp">&</span>
                <button class="home-avatar home-avatar-you" id="h-herAva" type="button" aria-label="更换我的头像"></button>
              </div>
              <div class="home-couple-name" id="h-names"></div>
              <span class="home-together-label">TWO PEOPLE · ONE LITTLE WORLD</span>
            </div>
            <div class="home-counter">
              <div class="home-counter-number"><strong id="h-days">0</strong><span>days<br>together</span></div>
              <div class="home-counter-foot">
                <span id="h-since"></span>
                <span id="h-next"></span>
              </div>
            </div>
            <div class="home-thread" aria-hidden="true"><span></span><i></i><span></span></div>
          </section>

          <section class="home-doors" aria-label="空间入口">
            <button class="home-door home-door-main" type="button" data-go="chat">
              <span class="door-index">01 / TALK</span>
              <span class="door-title">说说话</span>
              <span class="door-sub">把今天讲给彼此听</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
            </button>
            <button class="home-door" type="button" data-go="mem">
              <span class="door-index">02 / MEMORY</span>
              <span class="door-title">拾起记忆</span>
              <span class="door-sub">那些值得留下的瞬间</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
            </button>
            <button class="home-door" type="button" data-go="daily">
              <span class="door-index">03 / DAILY</span>
              <span class="door-title">一起生活</span>
              <span class="door-sub">把平凡日子慢慢过好</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
            </button>
          </section>

          <section class="home-moments">
            <div class="home-section-head">
              <div><span class="home-eyebrow">LITTLE MOMENTS</span><h2>留在这里的片刻</h2></div>
              <span class="home-photo-count" id="h-photo-count">0 / 3</span>
            </div>
            <div class="home-photo-wall" id="h-photo-wall"></div>
          </section>

          <section class="home-note">
            <span class="home-note-mark">“</span>
            <p id="h-note-text"></p>
            <span class="home-note-sign">A NOTE FOR US</span>
          </section>
        </main>
        <footer class="home-footer"><span>小窝 · 只属于我们</span><span>STAY A LITTLE LONGER</span></footer>
      </div>`;

    setAvatar($('h-hisAva'), 'hisAvatar');
    setAvatar($('h-herAva'), 'herAvatar');
    renderRelationship();
    renderPhotos();

    const note = $('h-note-text');
    if (note) note.textContent = (S.loveLetter || '愿每一个普通的日子，都有值得珍藏的瞬间。').split('\n').filter(Boolean)[0];

    $('h-menu')?.addEventListener('click', () => {
      D.querySelector('.side-drawer')?.classList.toggle('show');
      D.querySelector('.side-overlay')?.classList.toggle('show');
    });
    root.querySelectorAll('[data-go]').forEach(button => {
      button.addEventListener('click', () => window.go?.(button.dataset.go));
    });
  }

  window.Home = { build, startClock, stopClock };
})();