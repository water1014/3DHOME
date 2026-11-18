/* Daily navigation and section shell */
(function () {
  const sections = {
    accounting: { zh: '记账', en: 'EXPENSES', group: 'DAILY LIFE' },
    weather: { zh: '天气', en: 'WEATHER', group: 'DAILY LIFE' },
    mood: { zh: '心情', en: 'MOOD', group: 'DAILY LIFE' },
    diary: { zh: '日记', en: 'DIARY', group: 'DAILY LIFE' },
    health: { zh: '健康', en: 'WELLNESS', group: 'DAILY LIFE' },
    cycle: { zh: '生理期', en: 'CYCLE', group: 'DAILY LIFE' },
    abyss: { zh: '深渊区', en: 'ABYSS', group: 'DAILY LIFE' },
    games: { zh: '游戏', en: 'GAMES', group: 'PLAY & CREATE' },
    calendar: { zh: '日历', en: 'CALENDAR', group: 'DAILY LIFE' },
    plans: { zh: '安排', en: 'PLANS', group: 'DAILY LIFE' },
    study: { zh: '学习', en: 'STUDY', group: 'DAILY LIFE' },
    drawer: { zh: '抽屉', en: 'DRAWER', group: 'DAILY LIFE' },
    quotes: { zh: '语录', en: 'QUOTES', group: 'COLLECTIONS' },
    worldbook: { zh: '世界书', en: 'WORLDBOOK', group: 'OUR SPACE' },
    music: { zh: '音乐', en: 'MUSIC', group: 'PLAY & CREATE' },
    windows: { zh: '窗廊', en: 'WINDOW GALLERY', group: 'OUR SPACE' },
    moments: { zh: '动态', en: 'MOMENTS', group: 'COLLECTIONS' },
    favorites: { zh: '收藏', en: 'FAVORITES', group: 'COLLECTIONS' },
    beautify: { zh: '美化', en: 'APPEARANCE', group: 'SYSTEM' },
    mcp: { zh: 'MCP', en: 'CONNECTIONS', group: 'SYSTEM' },
    album: { zh: '相册', en: 'ALBUM', group: 'COLLECTIONS' },
    'image-studio': { zh: '生图室', en: 'IMAGE STUDIO', group: 'PLAY & CREATE' },
  };
  let current = 'diary';
  let windowTab = 'tonight';
  let windowToolsOpen = false;
  const { S, save } = window.XW;
  let built = false;
  function render() {
    const page = document.getElementById('pg-daily');
    const item = sections[current] || sections.diary;
    if (!page) return;
    const beauty = current === 'beautify';
    const worldbook = current === 'worldbook';
    const windows = current === 'windows';
    const calendar = current === 'calendar';
    page.innerHTML = `
      <main class="daily-page ${beauty ? 'beautify-page' : worldbook ? 'worldbook-page' : windows ? 'engawa-page' : ''}">
        <header class="daily-heading">
          <div class="daily-kicker">XIAOWO / ${item.group}</div>
          <div class="daily-heading-row"><h1>${item.zh}</h1><span class="daily-number">XIAOWO <i>/ SPACE</i></span></div>
          <div class="daily-rule"></div><div class="daily-section-en">${item.en}</div>
        </header>
        ${worldbook ? (window.Worldbook?.render() || '') : windows ? renderWindows() : current === 'diary' ? renderDiary() : calendar ? (window.DailyLife?.render('today') || '') : beauty ? `
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
    if (windows) bindWindows();
    if (current === 'diary') bindDiary();
    if (calendar) window.DailyLife?.mount();
    document.querySelectorAll('[data-daily-go]').forEach(link => {
      link.classList.toggle('active', link.dataset.dailyGo === current);
      link.setAttribute('aria-current', link.dataset.dailyGo === current ? 'page' : 'false');
    });
  }
  function renderWindows() {
    const panels = {
      tonight: {
        kicker: 'THE SKY ABOVE US',
        title: '今夜，抬头看看',
        intro: '月亮、日落与夜空里的行星。天象会根据设定的观测地点计算。',
        cards: [
          ['月相与月升落', 'SKY TONIGHT', '月相、照明度、月升月落、日落与夜间可见行星。'],
          ['NASA 每日天文图', 'ASTRONOMY PICTURE', '一张来自宇宙的影像，以及天文学家的说明。']
        ]
      },
      daily: {
        kicker: 'SMALL DAILY DISCOVERIES',
        title: '每日一页',
        intro: '每天一幅画、一首诗，还有历史上的今天。让日子有一点意外的光。',
        cards: [
          ['每日艺术', 'DAILY ART', '来自开放馆藏的一幅作品，可了解作者与作品背景。'],
          ['今日诗笺', 'DAILY POEM', '按时令挑选的古诗词，附出处与全文。'],
          ['历史上的今天', 'ON THIS DAY', '沿着日期，看看世界曾经发生过什么。']
        ]
      },
      shelf: {
        kicker: 'A SHELF OF OPEN WINDOWS',
        title: '檐下书架',
        intro: '这里放的是你愿意长期关注的来源。不是临时搜索，而是慢慢积累的阅读路径。',
        cards: [
          ['精选书架', 'CURATED FEEDS', '浏览科学、海洋、建筑、长文与奇想等主题来源。'],
          ['订阅来源', 'YOUR SOURCES', '添加 RSS / Atom 网站，或从候选来源中挑选。'],
          ['网页阅读', 'WEB READING', '打开文章正文，长文可以分段继续阅读。']
        ]
      },
      hobby: {
        kicker: 'THINGS WE KEEP NOTICING',
        title: '爱好角',
        intro: '把真正感兴趣的主题留下来。宋祁可以沿着这些线索持续发现新内容。',
        cards: [
          ['主题订阅', 'HOBBY CORNER', '查看已订阅主题的最新内容。'],
          ['发现新来源', 'SUGGESTIONS', '从候选 RSS 来源里挑选想关注的方向。']
        ]
      }
    };
    const panel = panels[windowTab] || panels.tonight;
    const engawaConnected = !!window.Engawa?.isConnected?.();
    const tabs = [['tonight','今夜'],['daily','每日'],['shelf','书架'],['hobby','爱好角']];
    return `
      <section class="engawa-content">
        <div class="engawa-intro">
          <div class="engawa-overline">ENGAWA / A PORCH FOR THE WORLD</div>
          <p>半在屋里，半向着世界。让宋祁也有一处可以独自漫游、再把见闻带回来的地方。</p>
        </div>
        <div class="engawa-status">
          <span class="engawa-status-dot"></span>
          <div><b>${engawaConnected ? 'Engawa 服务已连接' : '等待连接 Engawa 服务'}</b><small>${engawaConnected ? '服务已就绪，宋祁可以在聊天中按需漫游、阅读与管理订阅。' : '页面已就位，实时天象、诗画与订阅内容将在 MCP 服务接通后加载。'}</small></div>
          <span class="engawa-status-tag">${engawaConnected ? 'CONNECTED' : 'NOT CONNECTED'}</span>
        </div>
        <nav class="engawa-tabs" aria-label="窗廊分类">
          ${tabs.map(([key,label]) => `<button type="button" data-window-tab="${key}" class="${windowTab===key?'active':''}" aria-pressed="${windowTab===key?'true':'false'}">${label}</button>`).join('')}
        </nav>
        <section class="engawa-feature">
          <div class="engawa-feature-top"><span>${panel.kicker}</span><i>✳</i></div>
          <h2>${panel.title}</h2>
          <p>${panel.intro}</p>
          <div class="engawa-feature-rule"></div>
          <div class="engawa-card-list">
            ${panel.cards.map(([title,en,desc],i) => `
              <article class="engawa-item">
                <span class="engawa-item-index">0${i+1}</span>
                <div class="engawa-item-copy"><b>${title}</b><small>${en}</small><p>${desc}</p></div>
                <span class="engawa-item-lock" aria-label="等待服务连接">⌁</span>
              </article>`).join('')}
          </div>
        </section>
        <section class="engawa-tools">
          <button type="button" class="engawa-tools-toggle" id="engawa-tools-toggle" aria-expanded="${windowToolsOpen?'true':'false'}">
            <span><b>Engawa 工具目录</b><small>READ · DISCOVER · KEEP</small></span><span>${windowToolsOpen?'−':'＋'}</span>
          </button>
          ${windowToolsOpen ? `<div class="engawa-tools-list">
            <span>web_read</span><span>rss_read</span><span>shelf / shelf_add / shelf_suggest / shelf_remove</span>
            <span>sky_tonight</span><span>apod</span><span>daily_art</span><span>daily_poem</span>
            <span>arxiv_new</span><span>on_this_day</span><span>hobby_corner</span><span>hobby_add / hobby_remove</span>
          </div>` : ''}
        </section>
        <p class="engawa-footnote">窗廊不是搜索框。它是一条慢慢走出去、再带着故事回来的路。</p>
      </section>`;
  }
  function bindWindows() {
    document.querySelectorAll('[data-window-tab]').forEach(button => {
      button.onclick = () => { windowTab = button.dataset.windowTab; render(); };
    });
    const toggle = document.getElementById('engawa-tools-toggle');
    if (toggle) toggle.onclick = () => { windowToolsOpen = !windowToolsOpen; render(); };
  }


  // Private diary journal. Locked entries are encrypted locally with AES-GCM.
  const DIARY_KEY = 'xw_diary_journal_v1';
  const diaryUnlocked = Object.create(null);
  let diaryEditingId = '';
  function diaryRead() {
    try { const v=JSON.parse(localStorage.getItem(DIARY_KEY)||'[]'); return Array.isArray(v)?v:[]; }
    catch { return []; }
  }
  function diarySave(items) {
    try { localStorage.setItem(DIARY_KEY,JSON.stringify(items)); return true; }
    catch { UI.toast('日记保存失败，可能是设备存储空间不足'); return false; }
  }
  function diaryEsc(value) {
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function diaryId() { return (crypto.randomUUID?crypto.randomUUID():'d'+Date.now().toString(36)+Math.random().toString(36).slice(2)); }
  function diaryPrivate(entry) {
    return diaryUnlocked[entry.id] || {body:entry.body||'',annotations:entry.annotations||[],favorites:entry.favorites||[]};
  }
  function bytesToB64(bytes) { let s=''; new Uint8Array(bytes).forEach(b=>s+=String.fromCharCode(b)); return btoa(s); }
  function b64ToBytes(value) { return Uint8Array.from(atob(value),c=>c.charCodeAt(0)); }
  async function diaryKey(pin,salt) {
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function diaryEncrypt(payload,pin,existingSalt) {
    const salt=existingSalt?b64ToBytes(existingSalt):crypto.getRandomValues(new Uint8Array(16));
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await diaryKey(pin,salt);
    const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(payload)));
    return {salt:bytesToB64(salt),iv:bytesToB64(iv),ciphertext:bytesToB64(encrypted)};
  }
  async function diaryDecrypt(vault,pin) {
    const salt=b64ToBytes(vault.salt),iv=b64ToBytes(vault.iv),key=await diaryKey(pin,salt);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,b64ToBytes(vault.ciphertext));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  async function diaryPersistPrivate(entry) {
    if(!entry.locked) {
      const p=diaryPrivate(entry); entry.body=p.body; entry.annotations=p.annotations; entry.favorites=p.favorites;
      return true;
    }
    const p=diaryUnlocked[entry.id];
    if(!p||!p.pin) return false;
    entry.vault=await diaryEncrypt({body:p.body,annotations:p.annotations,favorites:p.favorites},p.pin,entry.vault?.salt);
    return true;
  }
  function renderDiary() {
    const entries=diaryRead().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.updatedAt||0)-(a.updatedAt||0));
    const count=entries.length,locked=entries.filter(x=>x.locked).length;
    let cards='';
    entries.forEach((entry,i)=>{
      const p=diaryPrivate(entry),isOpen=!entry.locked||!!diaryUnlocked[entry.id],id=diaryEsc(entry.id);
      cards+='<article class="diary-entry '+(entry.locked?'is-locked':'')+'" data-diary-entry="'+id+'">';
      cards+='<div class="diary-entry-top"><span class="diary-entry-no">'+String(i+1).padStart(2,'0')+'</span><div class="diary-entry-meta"><span>'+diaryEsc(entry.date||'未标日期')+'</span><i>'+(entry.locked?'PRIVATE / LOCKED':'PERSONAL NOTE')+'</i></div><button type="button" class="diary-entry-menu" data-diary-lock="'+id+'">'+(entry.locked?(isOpen?'重新上锁':'解锁'):'加锁')+'</button></div>';
      cards+='<h3>'+diaryEsc(entry.title||'无题')+'</h3>';
      if(isOpen){
        cards+='<p class="diary-entry-body" data-diary-selectable>'+diaryEsc(p.body).replace(/\n/g,'<br>')+'</p>';
        cards+='<div class="diary-entry-actions"><button type="button" data-diary-edit="'+id+'">编辑</button><button type="button" data-diary-favorite="'+id+'">收藏选中句子</button><button type="button" data-diary-delete="'+id+'">删除</button></div>';
        if(p.favorites?.length){cards+='<div class="diary-favorites"><span>✳ 收藏的句子</span>';p.favorites.forEach((s,n)=>{cards+='<button type="button" data-diary-unfavorite="'+id+'" data-sentence="'+n+'">“'+diaryEsc(s)+'”　×</button>';});cards+='</div>';}
        cards+='<div class="diary-annotation"><label for="diary-annotation-'+id+'">批注 · 留给宋祁的回应</label><textarea id="diary-annotation-'+id+'" data-diary-annotation rows="2" placeholder="读完这一页，想留下什么……">'+diaryEsc((p.annotations||[]).join('\n\n'))+'</textarea><button type="button" data-diary-save-annotation="'+id+'">保存批注</button></div>';
      }else cards+='<div class="diary-locked-note"><span>⌑</span><b>这一页已上锁</b><small>输入密码后才能重新阅读</small></div>';
      cards+='</article>';
    });
    const empty=entries.length?'':'<div class="diary-empty"><span>✳</span><b>这里还没有日记</b><p>第一篇可以从今天开始，也可以写很久以前的事。</p><button type="button" id="diary-empty-new">写下第一篇</button></div>';
    return '<section class="diary-page"><div class="diary-intro"><div><span>WORDS I LEFT HERE</span><h2>写给生活，也写给你</h2><p>你写下来的每一页，都会被认真读过。</p></div><div class="diary-stats"><b>'+count+'</b><small>篇日记</small><i></i><b>'+locked+'</b><small>把心事锁好</small></div></div>'+
      '<div class="diary-toolbar"><div><span>PERSONAL JOURNAL</span><small>只属于这个小窝的文字</small></div><button type="button" id="diary-new">＋ 写一篇</button></div>'+
      '<section class="diary-editor" id="diary-editor" hidden><div class="diary-editor-head"><div><span>NEW PAGE / EDIT PAGE</span><h3 id="diary-editor-title">写下一页</h3></div><button type="button" id="diary-editor-close" aria-label="关闭">×</button></div>'+
      '<label class="diary-field"><span>这一页的名字</span><input id="diary-title" maxlength="80" placeholder="给今天留下一个标题"></label><label class="diary-field"><span>日期</span><input id="diary-date" type="date"></label>'+
      '<label class="diary-field"><span>正文</span><textarea id="diary-body" rows="8" maxlength="12000" placeholder="不用整理得很漂亮，想到什么就写什么……"></textarea></label><div class="diary-editor-foot"><span>写完后可以选中喜欢的句子，收藏起来。</span><button type="button" id="diary-save">保存这一页</button></div></section>'+
      '<div class="diary-list-head"><span>THE PAGES</span><span>'+count+' ENTRIES</span></div><div class="diary-list">'+cards+empty+'</div><p class="diary-footnote">上锁的日记会在本机加密保存，聊天不会读取它们。请牢记每篇日记的密码。</p></section>';
  }
  function diaryRefresh() { render(); bindDiary(); }
  function diaryEditor(entry) {
    diaryEditingId=entry?.id||'';
    const editor=document.getElementById('diary-editor');if(!editor)return;
    if(entry?.locked&&!diaryUnlocked[entry.id]){UI.toast('请先解锁这篇日记');return;}
    const p=entry?diaryPrivate(entry):{body:''};
    document.getElementById('diary-editor-title').textContent=entry?'继续写这一页':'写下一页';
    document.getElementById('diary-title').value=entry?.title||'';
    document.getElementById('diary-date').value=entry?.date||new Date().toISOString().slice(0,10);
    document.getElementById('diary-body').value=p.body||'';
    editor.hidden=false;editor.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('diary-title').focus();
  }
  async function diaryToggleLock(id) {
    const entries=diaryRead(),entry=entries.find(x=>x.id===id);if(!entry)return;
    if(entry.locked&&diaryUnlocked[id]){delete diaryUnlocked[id];diaryRefresh();UI.toast('这一页已重新上锁');return;}
    if(entry.locked){
      const pin=prompt('输入这篇日记的解锁密码');if(pin===null)return;
      try{const payload=await diaryDecrypt(entry.vault,pin);diaryUnlocked[id]={...payload,pin};diaryRefresh();UI.toast('日记已解锁');}
      catch{UI.toast('密码不正确，或日记数据无法解密');}
      return;
    }
    const pin=prompt('设置这篇日记的锁定密码（至少 4 位）');if(pin===null)return;
    if(pin.length<4){UI.toast('密码至少需要 4 位');return;}
    const again=prompt('再输入一次密码确认');if(again!==pin){UI.toast('两次密码不一致');return;}
    try{
      const p=diaryPrivate(entry);entry.vault=await diaryEncrypt({body:p.body,annotations:p.annotations||[],favorites:p.favorites||[]},pin);
      entry.locked=true;delete entry.body;delete entry.annotations;delete entry.favorites;
      if(diarySave(entries)){delete diaryUnlocked[id];diaryRefresh();UI.toast('日记已加密上锁');}
    }catch{UI.toast('加锁失败，请确认浏览器支持安全加密');}
  }
  async function diarySaveAnnotation(id) {
    const entries=diaryRead(),entry=entries.find(x=>x.id===id);if(!entry)return;
    const card=document.querySelector('[data-diary-entry="'+CSS.escape(id)+'"]');
    const input=card?.querySelector('[data-diary-annotation]'),p=diaryPrivate(entry);
    p.annotations=(input?.value||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
    if(entry.locked){if(!diaryUnlocked[id])return;try{await diaryPersistPrivate(entry);}catch{UI.toast('批注保存失败');return;}}
    entry.updatedAt=Date.now();if(diarySave(entries))UI.toast('批注已留下');
  }
  async function diaryFavorite(id) {
    const selected=(window.getSelection?.().toString()||'').trim();
    if(!selected){UI.toast('先在日记正文里选中一句话');return;}
    const entries=diaryRead(),entry=entries.find(x=>x.id===id);if(!entry)return;
    const p=diaryPrivate(entry);p.favorites=p.favorites||[];
    if(!p.favorites.includes(selected))p.favorites.push(selected);
    if(entry.locked){if(!diaryUnlocked[id])return;try{await diaryPersistPrivate(entry);}catch{UI.toast('句子收藏失败');return;}}
    entry.updatedAt=Date.now();if(diarySave(entries))diaryRefresh();
  }
  function bindDiary() {
    const root=document.querySelector('.diary-page');if(!root)return;
    const openNew=()=>diaryEditor(null);
    document.getElementById('diary-new')?.addEventListener('click',openNew);
    document.getElementById('diary-empty-new')?.addEventListener('click',openNew);
    document.getElementById('diary-editor-close')?.addEventListener('click',()=>{document.getElementById('diary-editor').hidden=true;diaryEditingId='';});
    document.getElementById('diary-save')?.addEventListener('click',async()=>{
      const entries=diaryRead(),title=document.getElementById('diary-title').value.trim(),body=document.getElementById('diary-body').value.trim();
      if(!body){UI.toast('先写下这篇日记的内容');return;}
      const date=document.getElementById('diary-date').value||new Date().toISOString().slice(0,10);
      let entry=entries.find(x=>x.id===diaryEditingId);
      if(entry){
        entry.title=title||'无题';entry.date=date;
        const p=diaryPrivate(entry);p.body=body;
        if(entry.locked){try{await diaryPersistPrivate(entry);}catch{UI.toast('保存失败');return;}}
      }else{
        entry={id:diaryId(),title:title||'无题',date,body,annotations:[],favorites:[],locked:false,createdAt:Date.now(),updatedAt:Date.now()};
        entries.push(entry);
      }
      entry.updatedAt=Date.now();
      if(diarySave(entries)){diaryEditingId='';diaryRefresh();UI.toast('这一页已经收好');}
    });
    root.querySelectorAll('[data-diary-lock]').forEach(b=>b.addEventListener('click',()=>diaryToggleLock(b.dataset.diaryLock)));
    root.querySelectorAll('[data-diary-edit]').forEach(b=>b.addEventListener('click',()=>{const e=diaryRead().find(x=>x.id===b.dataset.diaryEdit);if(e)diaryEditor(e);}));
    root.querySelectorAll('[data-diary-favorite]').forEach(b=>b.addEventListener('click',()=>diaryFavorite(b.dataset.diaryFavorite)));
    root.querySelectorAll('[data-diary-save-annotation]').forEach(b=>b.addEventListener('click',()=>diarySaveAnnotation(b.dataset.diarySaveAnnotation)));
    root.querySelectorAll('[data-diary-delete]').forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('确定删除这篇日记吗？'))return;
      const id=b.dataset.diaryDelete;delete diaryUnlocked[id];diarySave(diaryRead().filter(x=>x.id!==id));diaryRefresh();
    }));
    root.querySelectorAll('[data-diary-unfavorite]').forEach(b=>b.addEventListener('click',async()=>{
      const entries=diaryRead(),entry=entries.find(x=>x.id===b.dataset.diaryUnfavorite);if(!entry)return;
      const p=diaryPrivate(entry);p.favorites.splice(Number(b.dataset.sentence),1);
      if(entry.locked){try{await diaryPersistPrivate(entry);}catch{return;}}
      diarySave(entries);diaryRefresh();
    }));
  }
  window.Diary = {
    getContext() {
      const entries=diaryRead().filter(e=>!e.locked).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
      return entries.map(e=>'【日记 '+(e.date||'')+' · '+(e.title||'无题')+'】\n'+String(e.body||'').slice(0,1800)+(e.annotations?.length?'\n批注：'+e.annotations.join('\n'):'')).join('\n\n').slice(0,8000);
    }
  };

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