/* Daily navigation and section shell */
(function () {
  const sections = {
    accounting: { zh: '记账', en: 'EXPENSES', group: 'DAILY LIFE' },
    weather: { zh: '天气', en: 'WEATHER', group: 'DAILY LIFE' },
    mood: { zh: '心情', en: 'MOOD', group: 'DAILY LIFE' },
    diary: { zh: '日记', en: 'DIARY', group: 'DAILY LIFE' },
    health: { zh: '健康', en: 'WELLNESS', group: 'DAILY LIFE' },
    cycle: { zh: '经期', en: 'CYCLE', group: 'DAILY LIFE' },
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
    const weather = current === 'weather';
    const accounting = current === 'accounting';
    const health = current === 'health';
    const cycle = current === 'cycle';
    page.innerHTML = `
      <main class="daily-page ${beauty ? 'beautify-page' : worldbook ? 'worldbook-page' : windows ? 'engawa-page' : ''}">
        <header class="daily-heading">
          <div class="daily-kicker">XIAOWO / ${item.group}</div>
          <div class="daily-heading-row"><h1>${item.zh}</h1><span class="daily-number">XIAOWO <i>/ SPACE</i></span></div>
          <div class="daily-rule"></div><div class="daily-section-en">${item.en}</div>
        </header>
        ${worldbook ? (window.Worldbook?.render() || '') : windows ? renderWindows() : current === 'diary' ? renderDiary() : calendar ? (window.DailyLife?.render('calendar') || '') : weather ? renderWeather() : accounting ? renderAccounting() : health ? renderHealth() : cycle ? renderCycle() : beauty ? `
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
    if (weather) bindWeather();
    if (accounting) bindAccounting();
    if (health) bindHealth();
    if (cycle) bindCycle();
    document.querySelectorAll('[data-daily-go]').forEach(link => {
      link.classList.toggle('active', link.dataset.dailyGo === current);
      link.setAttribute('aria-current', link.dataset.dailyGo === current ? 'page' : 'false');
    });
  }




  // Menstrual-cycle diary. All entries remain on this device.
  const CYCLE_KEY = 'xw_cycle_records_v1';
  const CYCLE_PREF_KEY = 'xw_cycle_preferences_v1';
  function cycleRead() {
    try { const rows=JSON.parse(localStorage.getItem(CYCLE_KEY)||'[]'); return Array.isArray(rows)?rows.filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.start)):[]; }
    catch (_) { return []; }
  }
  function cyclePrefs() {
    try { const p=JSON.parse(localStorage.getItem(CYCLE_PREF_KEY)||'{}'); return {length:Math.min(45,Math.max(21,Number(p.length)||28)),duration:Math.min(10,Math.max(2,Number(p.duration)||5))}; }
    catch (_) { return {length:28,duration:5}; }
  }
  function cycleSave(rows) {
    try { localStorage.setItem(CYCLE_KEY,JSON.stringify(rows)); return true; }
    catch (_) { UI.toast('保存失败，请检查设备存储空间'); return false; }
  }
  function renderCycle() {
    const today=new Date().toISOString().slice(0,10), prefs=cyclePrefs();
    return `
      <section class="cycle-page">
        <div class="cycle-intro"><span>YOUR CYCLE JOURNAL</span><p>记录自己的节奏，预测只是参考，一切以实际感受为准。</p></div>
        <section class="cycle-overview-card">
          <div class="cycle-card-head"><div><b>周期概览</b><small>CYCLE OVERVIEW</small></div><span>◷</span></div>
          <div class="cycle-overview-grid">
            <div><small>平均周期</small><strong id="cycle-average">${prefs.length} 天</strong></div>
            <div><small>经期时长</small><strong id="cycle-duration">${prefs.duration} 天</strong></div>
            <div class="cycle-next"><small>预计下次开始</small><strong id="cycle-next">记录后显示</strong></div>
          </div>
          <p id="cycle-estimate-note" class="cycle-estimate-note">记录至少一次经期开始日期后，即可查看估算。</p>
        </section>
        <section class="cycle-entry-card">
          <div class="cycle-card-head"><div><b>记录经期</b><small>PERIOD ENTRY</small></div><span>＋</span></div>
          <form id="cycle-form">
            <label class="cycle-field"><span>开始日期</span><input id="cycle-start" type="date" value="${today}" required></label>
            <label class="cycle-field"><span>结束日期 <small>可稍后补充</small></span><input id="cycle-end" type="date"></label>
            <div class="cycle-preferences">
              <label><span>周期长度 <small>21 至 45 天</small></span><div><input id="cycle-length" type="number" min="21" max="45" value="${prefs.length}"><i>天</i></div></label>
              <label><span>经期时长 <small>2 至 10 天</small></span><div><input id="cycle-duration-input" type="number" min="2" max="10" value="${prefs.duration}"><i>天</i></div></label>
            </div>
            <label class="cycle-field cycle-symptoms"><span>身体感受 / 症状</span><textarea id="cycle-note" rows="3" maxlength="500" placeholder="例如：腹部不适、疲惫、情绪变化……"></textarea></label>
            <div class="cycle-form-actions"><button type="submit" class="cycle-save">保存记录</button><button type="button" id="cycle-reset" class="cycle-reset">清空</button></div>
          </form>
        </section>
        <section class="cycle-history-card">
          <div class="cycle-card-head"><div><b>周期记录</b><small>PERIOD HISTORY</small></div><span id="cycle-count">0 次</span></div>
          <div id="cycle-history" class="cycle-history"><div class="cycle-empty">还没有经期记录，想记录时再来就好。</div></div>
        </section>
        <p class="cycle-privacy-note">记录仅保存在当前设备浏览器中。周期预测可能存在偏差，不用于避孕或诊断；如有持续异常或不适，请咨询专业医护人员。</p>
      </section>`;
  }
  function bindCycle() {
    const $=id=>document.getElementById(id), form=$('cycle-form');
    const start=$('cycle-start'), end=$('cycle-end'), history=$('cycle-history');
    const savePrefs=()=>{
      const length=Number($('cycle-length').value), duration=Number($('cycle-duration-input').value);
      if(!Number.isInteger(length)||length<21||length>45||!Number.isInteger(duration)||duration<2||duration>10){UI.toast('请检查周期长度和经期时长');return false;}
      try{localStorage.setItem(CYCLE_PREF_KEY,JSON.stringify({length,duration}));return true;}
      catch(_){UI.toast('设置保存失败');return false;}
    };
    const renderRows=()=>{
      const rows=cycleRead().sort((a,b)=>a.start.localeCompare(b.start));
      $('cycle-count').textContent=rows.length+' 次';
      const prefs=cyclePrefs(), starts=rows.map(x=>x.start);
      let average=prefs.length;
      if(starts.length>1){
        const gaps=[];
        for(let i=1;i<starts.length;i++){const days=Math.round((Date.parse(starts[i]+'T00:00:00')-Date.parse(starts[i-1]+'T00:00:00'))/86400000);if(days>=15&&days<=60)gaps.push(days);}
        if(gaps.length)average=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
      }
      $('cycle-average').textContent=average+' 天';
      $('cycle-duration').textContent=prefs.duration+' 天';
      const last=starts[starts.length-1], next=last?new Date(Date.parse(last+'T00:00:00')+average*86400000):null;
      $('cycle-next').textContent=next?next.toLocaleDateString('zh-CN',{month:'long',day:'numeric'}):'记录后显示';
      $('cycle-estimate-note').textContent=last?'根据最近记录估算，实际周期可能提前或延后。':'记录至少一次经期开始日期后，即可查看估算。';
      if(!rows.length){history.innerHTML='<div class="cycle-empty">还没有经期记录，想记录时再来就好。</div>';return;}
      history.innerHTML=rows.slice().reverse().slice(0,24).map(x=>{
        const duration=x.end?Math.max(1,Math.round((Date.parse(x.end+'T00:00:00')-Date.parse(x.start+'T00:00:00'))/86400000)+1):null;
        return '<article class="cycle-entry"><div class="cycle-entry-top"><div><b>'+weatherEsc(x.start)+'</b><small>'+(x.end?'至 '+weatherEsc(x.end):'结束日期未填写')+'</small></div><button type="button" data-cycle-delete="'+weatherEsc(x.start)+'" aria-label="删除记录">×</button></div>'+(duration?'<span class="cycle-duration-tag">'+duration+' 天</span>':'')+(x.note?'<p>'+weatherEsc(x.note)+'</p>':'')+'</article>';
      }).join('');
      history.querySelectorAll('[data-cycle-delete]').forEach(btn=>btn.addEventListener('click',()=>{
        if(!confirm('确定删除这次经期记录吗？'))return;
        if(cycleSave(cycleRead().filter(x=>x.start!==btn.dataset.cycleDelete)))renderRows();
      }));
    };
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!savePrefs())return;
      if(end.value&&end.value<start.value){UI.toast('结束日期不能早于开始日期');return;}
      if(end.value&&Math.round((Date.parse(end.value+'T00:00:00')-Date.parse(start.value+'T00:00:00'))/86400000)>20){UI.toast('请检查结束日期');return;}
      const rows=cycleRead().filter(x=>x.start!==start.value);
      rows.push({start:start.value,end:end.value,note:$('cycle-note').value.trim()});
      if(cycleSave(rows)){renderRows();form.reset();start.value=new Date().toISOString().slice(0,10);const p=cyclePrefs();$('cycle-length').value=p.length;$('cycle-duration-input').value=p.duration;UI.toast('经期记录已保存');}
    });
    $('cycle-reset').addEventListener('click',()=>{form.reset();start.value=new Date().toISOString().slice(0,10);const p=cyclePrefs();$('cycle-length').value=p.length;$('cycle-duration-input').value=p.duration;});
    renderRows();
  }

  // Private, device-local wellness notes. This is a journal, not a diagnostic tool.
  const HEALTH_KEY = 'xw_health_records_v1';
  function healthRead() {
    try { const rows=JSON.parse(localStorage.getItem(HEALTH_KEY)||'[]'); return Array.isArray(rows)?rows.filter(x=>x&&typeof x.date==='string'):[]; }
    catch (_) { return []; }
  }
  function healthWrite(rows) {
    try { localStorage.setItem(HEALTH_KEY,JSON.stringify(rows)); return true; }
    catch (_) { UI.toast('保存失败，请检查设备存储空间'); return false; }
  }
  function renderHealth() {
    const today=new Date().toISOString().slice(0,10);
    return `
      <section class="health-page">
        <div class="health-intro"><span>YOUR WELLNESS JOURNAL</span><p>轻轻记录身体状态，不必追求完美，只是多一点了解自己。</p></div>
        <section class="health-today-card">
          <div class="health-card-head"><div><b>今日记录</b><small>DAILY CHECK-IN</small></div><span>◷</span></div>
          <form id="health-form">
            <label class="health-date-field"><span>记录日期</span><input id="health-date" type="date" value="${today}" required></label>
            <div class="health-metric-grid">
              <label><span>饮水量 <small>毫升</small></span><input id="health-water" type="number" min="0" max="20000" step="50" inputmode="numeric" placeholder="例如 1500"></label>
              <label><span>睡眠时长 <small>小时</small></span><input id="health-sleep" type="number" min="0" max="24" step=".1" inputmode="decimal" placeholder="例如 7.5"></label>
              <label><span>活动时长 <small>分钟</small></span><input id="health-activity" type="number" min="0" max="1440" step="5" inputmode="numeric" placeholder="例如 30"></label>
              <label><span>体重 <small>千克，可不填</small></span><input id="health-weight" type="number" min="0" max="1000" step=".1" inputmode="decimal" placeholder="选填"></label>
            </div>
            <label class="health-note-field"><span>身体感受 / 备注</span><textarea id="health-note" rows="3" maxlength="500" placeholder="今天身体感觉怎么样？有什么想记下来的……"></textarea></label>
            <div class="health-form-actions"><button type="submit" class="health-save">保存今天的记录</button><button type="button" id="health-clear" class="health-clear">清空表单</button></div>
          </form>
        </section>
        <section class="health-history-card">
          <div class="health-card-head"><div><b>记录回顾</b><small>YOUR RECENT NOTES</small></div><span id="health-count">0 条</span></div>
          <div id="health-history" class="health-history"><div class="health-empty">还没有记录。想记的时候，再来这里就好。</div></div>
        </section>
        <p class="health-privacy-note">这些内容仅保存在当前设备的浏览器中，不会上传到云端。它们用于个人记录，不构成医疗建议。</p>
      </section>`;
  }
  function bindHealth() {
    const $=id=>document.getElementById(id), form=$('health-form');
    const fields=['water','sleep','activity','weight','note'];
    const date=$('health-date'), history=$('health-history');
    const clear=()=>{ fields.forEach(k=>{const el=$('health-'+k);if(el)el.value='';}); };
    const renderRows=()=>{
      const rows=healthRead().sort((a,b)=>b.date.localeCompare(a.date));
      $('health-count').textContent=rows.length+' 条';
      if(!rows.length){history.innerHTML='<div class="health-empty">还没有记录。想记的时候，再来这里就好。</div>';return;}
      history.innerHTML=rows.slice(0,30).map(x=>{
        const metrics=[x.water?x.water+' ml 饮水':'',x.sleep?x.sleep+' 小时睡眠':'',x.activity?x.activity+' 分钟活动':'',x.weight?x.weight+' kg':''].filter(Boolean);
        return '<article class="health-entry"><div class="health-entry-top"><b>'+weatherEsc(x.date)+'</b><button type="button" data-health-delete="'+weatherEsc(x.date)+'" aria-label="删除记录">×</button></div>'+(metrics.length?'<div class="health-entry-metrics">'+metrics.map(v=>'<span>'+weatherEsc(v)+'</span>').join('')+'</div>':'')+(x.note?'<p>'+weatherEsc(x.note)+'</p>':'<p class="health-entry-muted">没有添加备注</p>')+'</article>';
      }).join('');
      history.querySelectorAll('[data-health-delete]').forEach(btn=>btn.addEventListener('click',()=>{
        if(!confirm('确定删除这一天的健康记录吗？'))return;
        if(healthWrite(healthRead().filter(x=>x.date!==btn.dataset.healthDelete)))renderRows();
      }));
    };
    const existing=healthRead().find(x=>x.date===date.value);
    if(existing){fields.forEach(k=>{if($( 'health-'+k))$('health-'+k).value=existing[k]??'';});}
    date.addEventListener('change',()=>{
      clear(); const row=healthRead().find(x=>x.date===date.value);
      if(row)fields.forEach(k=>{if($('health-'+k))$('health-'+k).value=row[k]??'';});
    });
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const row={date:date.value};
      for(const key of fields){
        const value=$('health-'+key).value.trim();
        if(key==='note'){row.note=value;continue;}
        if(value===''){row[key]='';continue;}
        const n=Number(value), max={water:20000,sleep:24,activity:1440,weight:1000}[key];
        if(!Number.isFinite(n)||n<0||n>max){UI.toast('请检查'+({water:'饮水量',sleep:'睡眠时长',activity:'活动时长',weight:'体重'}[key])+'的数值');return;}
        row[key]=n;
      }
      const rows=healthRead().filter(x=>x.date!==row.date); rows.push(row);
      if(healthWrite(rows)){renderRows();UI.toast('这一天的记录已保存');}
    });
    $('health-clear').addEventListener('click',clear);
    renderRows();
  }

  // Local-first bookkeeping. Existing records are never cleared by rendering.
  const ACCOUNTING_KEY = 'xw_accounting_records_v1';
  const accountingCategories = {
    expense: ['餐饮','购物','交通','居住','娱乐','医疗','学习','其他'],
    income: ['工资','兼职','礼金','理财','退款','其他']
  };
  function accountingRead() {
    try {
      const rows = JSON.parse(localStorage.getItem(ACCOUNTING_KEY) || '[]');
      return Array.isArray(rows) ? rows.filter(x => x && typeof x.id === 'string' && Number.isFinite(Number(x.amount))) : [];
    } catch (_) { return []; }
  }
  function accountingWrite(rows) {
    try { localStorage.setItem(ACCOUNTING_KEY, JSON.stringify(rows)); return true; }
    catch (_) { UI.toast('保存失败，可能是本机存储空间不足'); return false; }
  }
  const money = value => Number(value || 0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  function renderAccounting() {
    const month = new Date().toISOString().slice(0,7);
    return `
      <section class="accounting-page">
        <div class="accounting-intro"><span>YOUR MONEY, CLEARLY</span><p>把每一笔收支记下来，慢慢看清生活的流向。</p></div>
        <section class="accounting-summary">
          <div class="accounting-summary-top"><span>本月结余</span><input id="accounting-month" type="month" value="${month}" aria-label="选择月份"></div>
          <strong id="accounting-balance">¥0.00</strong>
          <div class="accounting-totals"><div><small>收入</small><b id="accounting-income">¥0.00</b></div><div><small>支出</small><b id="accounting-expense">¥0.00</b></div></div>
        </section>
        <section class="accounting-form-card">
          <div class="accounting-section-head"><div><b>记一笔</b><small>NEW TRANSACTION</small></div><span>＋</span></div>
          <div class="accounting-type-switch" role="group" aria-label="收支类型">
            <button type="button" class="active" data-account-type="expense" aria-pressed="true">支出</button>
            <button type="button" data-account-type="income" aria-pressed="false">收入</button>
          </div>
          <form id="accounting-form">
            <label class="accounting-amount-field"><span>金额</span><div><i>¥</i><input id="accounting-amount" type="number" inputmode="decimal" min="0.01" max="999999999" step="0.01" placeholder="0.00" required></div></label>
            <div class="accounting-fields">
              <label><span>分类</span><select id="accounting-category"></select></label>
              <label><span>日期</span><input id="accounting-date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label>
            </div>
            <label class="accounting-note-field"><span>备注</span><input id="accounting-note" maxlength="100" placeholder="这笔钱花在哪里了？"></label>
            <button class="accounting-submit" type="submit" id="accounting-submit">保存记录</button>
          </form>
        </section>
        <section class="accounting-records-card">
          <div class="accounting-section-head"><div><b>收支明细</b><small>TRANSACTION HISTORY</small></div><span id="accounting-count">0 笔</span></div>
          <div class="accounting-filter"><button type="button" class="active" data-account-filter="all">全部</button><button type="button" data-account-filter="expense">支出</button><button type="button" data-account-filter="income">收入</button></div>
          <div id="accounting-record-list" class="accounting-record-list"><div class="accounting-empty">还没有记录，先记下第一笔吧。</div></div>
        </section>
        <p class="accounting-footnote">记录仅保存在当前设备浏览器中。更换设备或清理网站数据前，请先做好备份。</p>
      </section>`;
  }
  function bindAccounting() {
    const $ = id => document.getElementById(id);
    const form = $('accounting-form'), typeButtons = Array.from(document.querySelectorAll('[data-account-type]'));
    const filterButtons = Array.from(document.querySelectorAll('[data-account-filter]'));
    let type = 'expense', filter = 'all', editingId = '';
    const category = $('accounting-category');
    const fillCategories = () => {
      if (!category) return;
      category.innerHTML = accountingCategories[type].map(x => '<option value="'+weatherEsc(x)+'">'+weatherEsc(x)+'</option>').join('');
      typeButtons.forEach(b => {
        const active = b.dataset.accountType === type;
        b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));
      });
    };
    const monthValue = () => $('accounting-month')?.value || new Date().toISOString().slice(0,7);
    const renderRows = () => {
      const rows = accountingRead(), month = monthValue();
      const monthly = rows.filter(x => String(x.date || '').startsWith(month));
      const income = monthly.filter(x=>x.type==='income').reduce((s,x)=>s+Number(x.amount),0);
      const expense = monthly.filter(x=>x.type==='expense').reduce((s,x)=>s+Number(x.amount),0);
      $('accounting-income').textContent = '¥'+money(income);
      $('accounting-expense').textContent = '¥'+money(expense);
      $('accounting-balance').textContent = (income-expense<0?'-':'')+'¥'+money(Math.abs(income-expense));
      const visible = monthly.filter(x=>filter==='all'||x.type===filter).sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (b.createdAt||0)-(a.createdAt||0));
      $('accounting-count').textContent = visible.length+' 笔';
      const list = $('accounting-record-list');
      if (!visible.length) { list.innerHTML='<div class="accounting-empty">这个月份还没有'+(filter==='all'?'记录':filter==='income'?'收入':'支出')+'。</div>'; return; }
      list.innerHTML = visible.map(x => `
        <article class="accounting-record" data-account-record="${weatherEsc(x.id)}">
          <span class="accounting-record-icon">${x.type==='income'?'↙':'↗'}</span>
          <div class="accounting-record-main"><b>${weatherEsc(x.category||'其他')}</b><small>${weatherEsc(x.date||'')}${x.note?' · '+weatherEsc(x.note):''}</small></div>
          <strong class="${x.type}">${x.type==='income'?'+':'−'}¥${money(x.amount)}</strong>
          <button type="button" data-account-delete="${weatherEsc(x.id)}" aria-label="删除记录">×</button>
        </article>`).join('');
      list.querySelectorAll('[data-account-delete]').forEach(button=>button.addEventListener('click',()=>{
        const id=button.dataset.accountDelete;
        if (!confirm('确定删除这笔记录吗？')) return;
        if(accountingWrite(accountingRead().filter(x=>x.id!==id))) renderRows();
      }));
    };
    typeButtons.forEach(button=>button.addEventListener('click',()=>{type=button.dataset.accountType;fillCategories();}));
    filterButtons.forEach(button=>button.addEventListener('click',()=>{
      filter=button.dataset.accountFilter;
      filterButtons.forEach(b=>b.classList.toggle('active',b===button));
      renderRows();
    }));
    $('accounting-month')?.addEventListener('change',renderRows);
    form?.addEventListener('submit',event=>{
      event.preventDefault();
      const amount=Number($('accounting-amount').value);
      if(!Number.isFinite(amount)||amount<=0){UI.toast('请输入大于 0 的金额');return;}
      const rows=accountingRead(), now=Date.now();
      const record={id:editingId||('acct_'+now+'_'+Math.random().toString(36).slice(2,8)),type,amount:Math.round(amount*100)/100,category:category.value,date:$('accounting-date').value,note:$('accounting-note').value.trim(),createdAt:now};
      rows.push(record);
      if(accountingWrite(rows)){
        form.reset(); $('accounting-date').value=new Date().toISOString().slice(0,10);
        editingId=''; fillCategories(); renderRows(); UI.toast('这一笔已经记下啦');
      }
    });
    fillCategories(); renderRows();
  }

  // Weather page: Open-Meteo provides current conditions and a five-day outlook.
  const WEATHER_KEY = 'xw_weather_location_v1';
  const weatherCode = code => {
    const map = {
      0:['晴朗','☀️'],1:['大致晴朗','🌤️'],2:['局部多云','⛅'],3:['阴天','☁️'],
      45:['有雾','🌫️'],48:['雾凇','🌫️'],51:['毛毛雨','🌦️'],53:['小雨','🌦️'],
      55:['较强毛毛雨','🌧️'],56:['冻毛毛雨','🌧️'],57:['强冻毛毛雨','🌧️'],
      61:['小雨','🌧️'],63:['中雨','🌧️'],65:['大雨','🌧️'],66:['冻雨','🌧️'],67:['强冻雨','🌧️'],
      71:['小雪','🌨️'],73:['中雪','🌨️'],75:['大雪','❄️'],77:['雪粒','🌨️'],
      80:['阵雨','🌦️'],81:['较强阵雨','🌧️'],82:['强阵雨','⛈️'],
      85:['阵雪','🌨️'],86:['强阵雪','❄️'],95:['雷雨','⛈️'],96:['雷雨伴冰雹','⛈️'],99:['强雷雨伴冰雹','⛈️']
    };
    return map[Number(code)] || ['天气情况','🌡️'];
  };
  function weatherEsc(value) {
    return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function renderWeather() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null'); } catch (_) {}
    return `
      <section class="weather-page">
        <div class="weather-intro"><span>WEATHER / RIGHT NOW</span><p>看看窗外的天气，也安排好今天的出门时间。</p></div>
        <section class="weather-location-card">
          <div class="weather-location-top"><div><span>当前地点</span><b id="weather-place">${saved?.name ? weatherEsc(saved.name) : '还没有选择地点'}</b></div><button type="button" id="weather-locate" aria-label="定位当前位置">⌖ 定位</button></div>
          <div class="weather-search"><input id="weather-city-input" type="search" maxlength="80" placeholder="搜索城市，例如：南京、米兰" autocomplete="off"><button type="button" id="weather-city-search">搜索</button></div>
          <p class="weather-status" id="weather-status" role="status">输入城市名称，或使用定位获取天气。</p>
        </section>
        <section class="weather-current-card" id="weather-current" aria-live="polite">
          <div class="weather-placeholder"><span>☁</span><b>等待天气数据</b><small>选择地点后，这里会显示实时天气。</small></div>
        </section>
        <section class="weather-forecast-card" id="weather-forecast" hidden></section>
        <p class="weather-source">天气数据来自 Open-Meteo · 自动按当地时区显示</p>
      </section>`;
  }
  function bindWeather() {
    const $ = id => document.getElementById(id);
    const status = $('weather-status');
    const search = $('weather-city-search');
    const input = $('weather-city-input');
    const setStatus = message => { if (status) status.textContent = message; };
    const saveLocation = value => {
      try { localStorage.setItem(WEATHER_KEY, JSON.stringify(value)); } catch (_) {}
      const place = $('weather-place');
      if (place) place.textContent = value.name;
    };
    const showWeather = async location => {
      setStatus('正在获取天气数据…');
      const current = $('weather-current'), forecast = $('weather-forecast');
      if (current) current.innerHTML = '<div class="weather-placeholder"><span>◌</span><b>天气正在更新</b><small>正在连接天气服务…</small></div>';
      try {
        const params = new URLSearchParams({
          latitude: location.latitude, longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
          timezone: 'auto', forecast_days: '5'
        });
        const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params.toString());
        if (!response.ok) throw new Error('天气服务暂时不可用，请稍后重试。');
        const data = await response.json();
        if (!data.current || !data.daily) throw new Error('没有取得完整天气数据。');
        const now = data.current, [desc,icon] = weatherCode(now.weather_code);
        const time = now.time ? now.time.replace('T',' ') : '';
        if (current) current.innerHTML = `
          <div class="weather-current-head"><span>NOW / ${weatherEsc(time)}</span><span>${Number(now.is_day) ? '白天' : '夜间'}</span></div>
          <div class="weather-main"><div><div class="weather-temp">${Math.round(now.temperature_2m)}<sup>°</sup></div><b>${desc}</b><small>体感 ${Math.round(now.apparent_temperature)}°</small></div><span class="weather-icon">${icon}</span></div>
          <div class="weather-metrics"><div><span>湿度</span><b>${Math.round(now.relative_humidity_2m)}%</b></div><div><span>风速</span><b>${Math.round(now.wind_speed_10m)} km/h</b></div><div><span>降水</span><b>${Number(now.precipitation || 0).toFixed(1)} mm</b></div></div>`;
        if (forecast) {
          const days = data.daily.time.map((date,i) => {
            const [label,emoji] = weatherCode(data.daily.weather_code[i]);
            const dateObj = new Date(date + 'T12:00:00');
            const dayName = i === 0 ? '今天' : new Intl.DateTimeFormat('zh-CN',{weekday:'short'}).format(dateObj);
            return `<article class="weather-day"><div><b>${dayName}</b><small>${date.slice(5).replace('-',' / ')}</small></div><span>${emoji}</span><small>${label}</small><strong>${Math.round(data.daily.temperature_2m_max[i])}° <i>/</i> ${Math.round(data.daily.temperature_2m_min[i])}°</strong><em>${data.daily.precipitation_probability_max?.[i] ?? 0}%</em></article>`;
          }).join('');
          forecast.innerHTML = '<div class="weather-forecast-head"><b>未来五天</b><span>5-DAY FORECAST</span></div><div class="weather-days">' + days + '</div>';
          forecast.hidden = false;
        }
        setStatus('已更新 · ' + (time || '当地时间'));
      } catch (error) {
        setStatus(error.message || '天气加载失败，请检查网络后重试。');
        if (current) current.innerHTML = '<div class="weather-placeholder"><span>☁</span><b>暂时无法取得天气</b><small>请检查网络连接，或重新选择地点。</small></div>';
        if (forecast) forecast.hidden = true;
      }
    };
    const searchCity = async () => {
      const query = input?.value.trim();
      if (!query) { setStatus('先输入一个城市名称吧。'); return; }
      setStatus('正在查找城市…');
      try {
        const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=1&language=zh&format=json';
        const response = await fetch(url);
        if (!response.ok) throw new Error('城市搜索暂时不可用。');
        const data = await response.json(), place = data.results?.[0];
        if (!place) { setStatus('没有找到这个地点，试试更完整的城市名称。'); return; }
        const name = [place.name,place.admin1,place.country].filter((v,i,a)=>v && a.indexOf(v)===i).join(' · ');
        const location = {name,latitude:place.latitude,longitude:place.longitude};
        saveLocation(location); await showWeather(location);
      } catch (error) { setStatus(error.message || '城市搜索失败，请稍后重试。'); }
    };
    search?.addEventListener('click', searchCity);
    input?.addEventListener('keydown', event => { if (event.key === 'Enter') searchCity(); });
    $('weather-locate')?.addEventListener('click', () => {
      if (!navigator.geolocation) { setStatus('当前浏览器不支持定位，请直接搜索城市。'); return; }
      setStatus('正在请求定位权限…');
      navigator.geolocation.getCurrentPosition(async position => {
        const location = {name:'我的当前位置',latitude:position.coords.latitude,longitude:position.coords.longitude};
        try {
          const url = 'https://geocoding-api.open-meteo.com/v1/reverse?latitude='+location.latitude+'&longitude='+location.longitude+'&language=zh&format=json';
          const response = await fetch(url), data = response.ok ? await response.json() : {};
          const place = data.results?.[0];
          if (place) location.name = [place.name,place.admin1,place.country].filter(Boolean).join(' · ');
        } catch (_) {}
        saveLocation(location); await showWeather(location);
      }, error => {
        setStatus(error.code === 1 ? '定位权限未开启，请搜索城市。' : '暂时无法定位，请手动搜索城市。');
      }, {enableHighAccuracy:false,timeout:10000,maximumAge:600000});
    });
    const refresh = document.createElement('button');
    refresh.type = 'button'; refresh.className = 'weather-refresh'; refresh.textContent = '刷新天气';
    refresh.addEventListener('click', () => {
      let location = null; try { location = JSON.parse(localStorage.getItem(WEATHER_KEY)||'null'); } catch (_) {}
      if (location) showWeather(location); else setStatus('请先定位或搜索城市。');
    });
    $('weather-current')?.before(refresh);
    let saved = null; try { saved = JSON.parse(localStorage.getItem(WEATHER_KEY)||'null'); } catch (_) {}
    if (saved?.latitude != null && saved?.longitude != null) showWeather(saved);
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