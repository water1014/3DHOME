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
  const { S, save } = window.XW;
  let built = false;
  function render() {
    const page = document.getElementById('pg-daily');
    const item = sections[current] || sections.accounting;
    if (!page) return;
    const beauty = current === 'beautify';
    const worldbook = current === 'worldbook';
    page.innerHTML = `
      <main class="daily-page ${beauty ? 'beautify-page' : worldbook ? 'worldbook-page' : ''}">
        <header class="daily-heading">
          <div class="daily-kicker">XIAOWO / ${item.group}</div>
          <div class="daily-heading-row"><h1>${item.zh}</h1><span class="daily-number">XIAOWO <i>/ SPACE</i></span></div>
          <div class="daily-rule"></div><div class="daily-section-en">${item.en}</div>
        </header>
        ${worldbook ? (window.Worldbook?.render() || '') : beauty ? `
          <section class="beautify-content" aria-label="美化设置">
            <div class="beautify-intro"><span class="beautify-overline">PERSONALIZE YOUR SPACE</span><p>把小窝的每一处，调整成喜欢的模样。</p></div>
            <section class="beautify-block">
              <div class="beautify-block-head"><div><b>空间壁纸</b><small>WALLPAPERS</small></div><span>01</span></div>
              <article class="beautify-wallpaper-card">
                <div class="beautify-preview home-preview" id="beautify-home-preview"><span>HOME</span></div>
                <div class="beautify-wallpaper-info"><b>首页壁纸</b><small>为主页选择一张背景图片</small><div class="beautify-actions"><button type="button" class="beautify-btn primary" id="beautify-home-pick">选择图片</button><button type="button" class="beautify-btn" id="beautify-home-reset">恢复默认</button></div></div>
                <input type="file" accept="image/*" id="beautify-home-file" hidden>
              </article>
              <article class="beautify-wallpaper-card">
                <div class="beautify-preview sidebar-preview" id="beautify-sidebar-preview"><span>SIDEBAR</span></div>
                <div class="beautify-wallpaper-info"><b>侧栏壁纸</b><small>为左侧菜单单独设置背景</small><div class="beautify-actions"><button type="button" class="beautify-btn primary" id="beautify-sidebar-pick">选择图片</button><button type="button" class="beautify-btn" id="beautify-sidebar-reset">恢复默认</button></div></div>
                <input type="file" accept="image/*" id="beautify-sidebar-file" hidden>
              </article>
              <p class="beautify-hint">图片会自动压缩并保存在当前设备。侧栏会保留柔和遮罩，让菜单文字保持清晰。</p>
            </section>
            <section class="beautify-block">
              <div class="beautify-block-head"><div><b>界面细节</b><small>INTERFACE DETAILS</small></div><span>02</span></div>
              <div class="beautify-option-card">
                <div class="beautify-option-copy"><b>卡片圆角</b><small>统一调整主要卡片的边角形状</small></div>
                <select id="beautify-card-radius" aria-label="卡片圆角">
                  <option value="0">直角</option><option value=".55rem">微圆角</option><option value="1.15rem">标准圆角</option><option value="1.8rem">大圆角</option>
                </select>
              </div>
            </section>
            <section class="beautify-block">
              <div class="beautify-block-head"><div><b>材质实验室</b><small>MATERIAL STUDIO</small></div><span>03</span></div>
              <div class="beautify-material-grid" role="group" aria-label="选择界面材质">
                <button type="button" class="beautify-material-choice" data-material="glass" aria-pressed="false">
                  <span class="material-swatch material-glass"></span><b>轻雾玻璃</b><small>通透 · 柔光</small>
                </button>
                <button type="button" class="beautify-material-choice" data-material="paper" aria-pressed="false">
                  <span class="material-swatch material-paper"></span><b>信笺纸感</b><small>纤维 · 细纹</small>
                </button>
                <button type="button" class="beautify-material-choice" data-material="acrylic" aria-pressed="false">
                  <span class="material-swatch material-acrylic"></span><b>柔光亚克力</b><small>清透 · 高光</small>
                </button>
                <button type="button" class="beautify-material-choice" data-material="ceramic" aria-pressed="false">
                  <span class="material-swatch material-ceramic"></span><b>哑光瓷面</b><small>细腻 · 克制</small>
                </button>
              </div>
              <div class="beautify-material-controls">
                <label class="beautify-range-row"><span><b>材质浓度</b><small id="material-opacity-value">76%</small></span><input id="material-opacity" type="range" min="35" max="96" step="1" value="76"></label>
                <label class="beautify-range-row"><span><b>背景柔化</b><small id="material-blur-value">22 px</small></span><input id="material-blur" type="range" min="0" max="36" step="1" value="22"></label>
                <label class="beautify-range-row"><span><b>表面纹理</b><small id="material-texture-value">34%</small></span><input id="material-texture" type="range" min="0" max="100" step="1" value="34"></label>
                <div class="beautify-actions"><button type="button" class="beautify-btn" id="material-reset">恢复材质默认</button></div>
              </div>
              <p class="beautify-hint">材质会同步影响首页卡片、聊天入口、侧栏身份卡和主要内容卡片。壁纸与文字颜色不会被改动。</p>
            </section>
          </section>` : `
          <section class="daily-empty" aria-label="${item.zh}"><span class="daily-empty-mark"></span></section>`}
      </main>`;
    if (beauty) bindBeautify();
    if (worldbook) window.Worldbook?.mount();
    document.querySelectorAll('[data-daily-go]').forEach(link => {
      link.classList.toggle('active', link.dataset.dailyGo === current);
      link.setAttribute('aria-current', link.dataset.dailyGo === current ? 'page' : 'false');
    });
  }
  function bindBeautify() {
    const $ = id => document.getElementById(id);
    const radius = $('beautify-card-radius');
    if (radius) {
      radius.value = ['0','.55rem','1.15rem','1.8rem'].includes(S.cardRadius) ? S.cardRadius : '1.15rem';
      radius.onchange = () => {
        S.cardRadius = radius.value;
        save('cardRadius');
        document.documentElement.style.setProperty('--surface-radius', radius.value);
        UI.toast('卡片圆角已更新');
      };
    }
    const preview = (key,id) => {
      const el=$(id); if(!el) return;
      el.style.backgroundImage=S[key]?'linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.12)),url("'+S[key]+'")':'';
      el.classList.toggle('has-image',!!S[key]);
    };
    preview('homeWallpaper','beautify-home-preview');
    preview('sidebarWallpaper','beautify-sidebar-preview');
    const compress=file=>new Promise((resolve,reject)=>{
      const img=new Image(),url=URL.createObjectURL(file);
      img.onload=()=>{
        const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=canvas.getContext('2d');
        if(!ctx){URL.revokeObjectURL(url);reject(new Error('图片处理失败'));return;}
        ctx.drawImage(img,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg',.78));
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('无法读取这张图片'));};
      img.src=url;
    });
    const bind=(key,pickId,fileId,previewId,resetId,label)=>{
      const pick=$(pickId),file=$(fileId),reset=$(resetId);
      if(!pick||!file||!reset)return;
      pick.onclick=()=>file.click();
      file.onchange=async()=>{
        const selected=file.files&&file.files[0];if(!selected)return;
        if(!selected.type.startsWith('image/')){UI.toast('请选择图片文件');return;}
        try{S[key]=await compress(selected);save(key);preview(key,previewId);window.XW.applyWallpapers?.();UI.toast(label+'已更新');}
        catch(error){UI.toast(error.message||'壁纸保存失败');}
        file.value='';
      };
      reset.onclick=()=>{S[key]='';save(key);preview(key,previewId);window.XW.applyWallpapers?.();UI.toast(label+'已恢复默认');};
    };
    bind('homeWallpaper','beautify-home-pick','beautify-home-file','beautify-home-preview','beautify-home-reset','首页壁纸');
    bind('sidebarWallpaper','beautify-sidebar-pick','beautify-sidebar-file','beautify-sidebar-preview','beautify-sidebar-reset','侧栏壁纸');
    bindMaterial();
  }
  function bindMaterial() {
    const $ = id => document.getElementById(id);
    const defaults = { surfaceMaterial: 'glass', materialOpacity: 76, materialBlur: 22, materialTexture: 34 };
    const materialNames = ['glass','paper','acrylic','ceramic'];
    if (!materialNames.includes(S.surfaceMaterial)) S.surfaceMaterial = defaults.surfaceMaterial;
    ['materialOpacity','materialBlur','materialTexture'].forEach(key => {
      if (!Number.isFinite(Number(S[key]))) S[key] = defaults[key];
    });
    const choices = Array.from(document.querySelectorAll('[data-material]'));
    const controls = [
      { key: 'materialOpacity', id: 'material-opacity', output: 'material-opacity-value', suffix: '%' },
      { key: 'materialBlur', id: 'material-blur', output: 'material-blur-value', suffix: ' px' },
      { key: 'materialTexture', id: 'material-texture', output: 'material-texture-value', suffix: '%' },
    ];
    const sync = () => {
      window.XW.applySurfaceMaterial?.();
      choices.forEach(button => {
        const active = button.dataset.material === S.surfaceMaterial;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      controls.forEach(item => {
        const input = $(item.id), output = $(item.output);
        if (input) input.value = S[item.key];
        if (output) output.textContent = S[item.key] + item.suffix;
      });
    };
    choices.forEach(button => button.onclick = () => {
      S.surfaceMaterial = button.dataset.material;
      save('surfaceMaterial');
      sync();
    });
    controls.forEach(item => {
      const input = $(item.id);
      if (!input) return;
      input.oninput = () => {
        S[item.key] = Number(input.value);
        save(item.key);
        sync();
      };
    });
    const reset = $('material-reset');
    if (reset) reset.onclick = () => {
      Object.assign(S, defaults);
      Object.keys(defaults).forEach(save);
      sync();
      UI.toast('材质已恢复默认');
    };
    sync();
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