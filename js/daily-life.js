/* Daily life hub: shared date model for calendar, plans, mood and everyday notes. */
(function () {
  const KEY = 'xiaowo_daily_hub_v1';
  const LEGACY_KEY = 'xiaowo_calendar_events_v1';
  const WISH_KEY = 'xw_shared_wishlist_v1';
  let wishes = loadWishes();
  const WEEK = ['一','二','三','四','五','六','日'];
  const MEALS = [['breakfast','早餐'],['lunch','午餐'],['dinner','晚餐']];
  const MOODS = [['calm','😌','平静'],['happy','😊','开心'],['tired','😴','疲惫'],['low','🥺','低落'],['excited','🤩','期待']];
  const $ = id => document.getElementById(id);
  let data = load();
  let cursor = firstMonth(new Date());
  let selected = iso(new Date());
  let viewMode = 'today';


  function loadWishes() {
    try { const v=JSON.parse(localStorage.getItem(WISH_KEY)||'[]'); return Array.isArray(v)?v:[]; }
    catch (_) { return []; }
  }
  function saveWishes() {
    try { localStorage.setItem(WISH_KEY,JSON.stringify(wishes)); return true; }
    catch (_) { window.UI?.toast?.('心愿清单保存失败，请检查设备存储空间'); return false; }
  }
  function wishlistMarkup() {
    const categories=[['go','想去'],['eat','想吃'],['do','想做']];
    const open=wishes.filter(x=>!x.done),done=wishes.filter(x=>x.done);
    const row=x=>'<label class="dh-wish-item '+(x.done?'done':'')+'"><input type="checkbox" data-wish-toggle="'+esc(x.id)+'" '+(x.done?'checked':'')+'><span class="dh-wish-kind kind-'+esc(x.kind)+'">'+(categories.find(c=>c[0]===x.kind)?.[1]||'心愿')+'</span><span class="dh-wish-text">'+esc(x.text)+'</span><button type="button" data-wish-remove="'+esc(x.id)+'" aria-label="删除心愿">×</button></label>';
    return '<section class="dh-panel dh-wishlist"><div class="dh-panel-head"><div><span class="dh-en">SOMEDAY, TOGETHER</span><h3>我们想一起完成的事</h3></div><span class="dh-wish-count">'+done.length+' / '+wishes.length+' 已完成</span></div>'+
      '<form class="dh-wish-form" id="dh-wish-form"><select id="dh-wish-kind" aria-label="心愿类型"><option value="go">想去</option><option value="eat">想吃</option><option value="do">想做</option></select><input id="dh-wish-text" maxlength="100" placeholder="想一起去哪里、吃什么、做什么？" aria-label="写下一个共同心愿"><button type="submit" aria-label="添加心愿">＋</button></form>'+
      (wishes.length?'<div class="dh-wish-list">'+open.map(row).join('')+(done.length?'<div class="dh-wish-done-head">已经一起打勾的 '+done.length+' 件小事</div>'+done.map(row).join(''):'')+'</div>':'<p class="dh-muted dh-small dh-wish-empty">先把一个想去的地方、一顿想吃的饭，或者一件想一起做的事放进来。</p>')+
      '<p class="dh-wish-note">不赶时间，慢慢把“想一起”变成“已经一起”。</p></section>';
  }

  function fresh() { return { days: {}, timetable: [], countdowns: [] }; }
  function load() {
    let value;
    try { value = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    if (!value || typeof value !== 'object') value = fresh();
    value.days = value.days && typeof value.days === 'object' ? value.days : {};
    value.timetable = Array.isArray(value.timetable) ? value.timetable : [];
    value.countdowns = Array.isArray(value.countdowns) ? value.countdowns : [];
    try {
      const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
      if (Array.isArray(old)) old.forEach(item => {
        if (!item || !item.date || !item.title) return;
        const day = getDay(item.date, value);
        if (!day.events.some(event => event.id === item.id)) day.events.push({
          id: item.id || makeId(), title: item.title, time: item.time || '',
          category: item.category || '日常', note: item.note || ''
        });
      });
    } catch (_) {}
    return value;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (_) { window.UI?.toast?.('保存失败，请检查设备存储空间'); return false; }
  }
  function getDay(date, store = data) {
    if (!store.days[date]) store.days[date] = { todos: [], events: [], meals: {}, mood: { value: '', note: '' } };
    const day = store.days[date];
    day.todos = Array.isArray(day.todos) ? day.todos : [];
    day.events = Array.isArray(day.events) ? day.events : [];
    day.meals = day.meals && typeof day.meals === 'object' ? day.meals : {};
    day.mood = day.mood && typeof day.mood === 'object' ? day.mood : { value: '', note: '' };
    return day;
  }
  function makeId() { return 'd-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function iso(date) { return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0'); }
  function parse(value) { const p=String(value).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function firstMonth(date) { return new Date(date.getFullYear(),date.getMonth(),1); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function dateLabel(value) { const d=parse(value); return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'; }
  function todayLabel(value) { const d=parse(value); return '星期'+WEEK[(d.getDay()+6)%7]; }
  function weekDates(value) {
    const d=parse(value), start=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7));
    return Array.from({length:7},(_,i)=>{const x=new Date(start);x.setDate(start.getDate()+i);return iso(x);});
  }
  function monthGrid() {
    const first=firstMonth(cursor), offset=(first.getDay()+6)%7;
    const start=new Date(first.getFullYear(),first.getMonth(),1-offset);
    return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return iso(d);});
  }
  function eventsForDate(date) {
    const own=(data.days[date]?.events||[]).map(event=>({...event,sourceDate:date}));
    const recurring=Object.keys(data.days).filter(source=>source!==date).flatMap(source=>(data.days[source]?.events||[]).filter(event=>event.repeatYearly && String(source).slice(5)===date.slice(5)).map(event=>({...event,sourceDate:source})));
    return own.concat(recurring).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  }
  function dayHasRecords(day) { return !!day && ((day.todos||[]).length>0 || (day.events||[]).length>0 || Object.values(day.meals||{}).some(value=>String(value||'').trim()) || !!(day.mood && (day.mood.value || day.mood.note))); }
  function monthMarkup() {
    const month=iso(firstMonth(cursor)).slice(0,7), today=iso(new Date());
    const cells=monthGrid().map(date=>{
      const day=data.days[date] || {events:[],todos:[]}, d=parse(date), count=eventsForDate(date).length+(day.todos||[]).length+data.countdowns.filter(item=>item.date===date).length;
      const cls=['dh-day',d.getMonth()!==cursor.getMonth()?'outside':'',date===selected?'selected':'',date===today?'today':''].filter(Boolean).join(' ');
      return '<button type="button" class="'+cls+'" data-date="'+date+'" aria-pressed="'+(date===selected)+'"><span>'+d.getDate()+'</span><i>'+(count?'·'.repeat(Math.min(count,3)):'')+'</i></button>';
    }).join('');
    const count=Object.keys(data.days).filter(date=>date.startsWith(month) && dayHasRecords(data.days[date])).length+data.countdowns.filter(item=>String(item.date||'').startsWith(month)).length;
    return '<section class="dh-calendar"><div class="dh-monthbar"><button type="button" data-month="-1" aria-label="上个月">‹</button><h3>'+cursor.getFullYear()+'年 '+(cursor.getMonth()+1)+'月</h3><button type="button" data-month="1" aria-label="下个月">›</button><button type="button" class="dh-today" data-today>今天</button></div><div class="dh-month-meta"><span>'+month.replace('-',' / ')+'</span><span>'+count+' 天有记录</span></div><div class="dh-grid">'+WEEK.map(x=>'<span class="dh-week">'+x+'</span>').join('')+cells+'</div></section>';
  }
  function timetableMarkup() {
    const dates=weekDates(selected), idx=(parse(selected).getDay()+6)%7;
    const items=data.timetable.filter(x=>Number(x.weekday)===idx).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">THIS WEEK</span><h3>本周课表</h3></div><button type="button" class="dh-text-btn" data-add="class">＋ 添加</button></div><div class="dh-week-strip">'+dates.map((date,i)=>'<button type="button" data-date="'+date+'" class="'+(date===selected?'active':'')+'"><small>'+WEEK[i]+'</small><b>'+parse(date).getDate()+'</b></button>').join('')+'</div>'+(items.length?'<div class="dh-schedule-list">'+items.map(x=>'<article><time>'+esc(x.time||'未设时间')+'</time><div><b>'+esc(x.title)+'</b>'+(x.place?'<small>'+esc(x.place)+'</small>':'')+'</div><button type="button" data-remove-class="'+esc(x.id)+'" aria-label="删除课表项目">×</button></article>').join('')+'</div>':'<p class="dh-muted dh-small">这一天暂时没有课表安排</p>')+'</section>';
  }
  function countdownMarkup() {
    const list=data.countdowns.slice().sort((a,b)=>a.date.localeCompare(b.date));
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">KEEP IN SIGHT</span><h3>重要倒数</h3></div><button type="button" class="dh-text-btn" data-add="countdown">＋ 添加</button></div>'+(list.length?'<div class="dh-count-list">'+list.map(x=>{const diff=Math.ceil((new Date(x.date+'T00:00:00')-new Date(iso(new Date())+'T00:00:00'))/86400000);return '<article><div><b>'+esc(x.title)+'</b><small>'+esc(x.date)+'</small></div><strong>'+(diff>0?'D-'+diff:diff===0?'今天':'已过 '+Math.abs(diff)+' 天')+'</strong><button type="button" data-remove-count="'+esc(x.id)+'" aria-label="删除倒数">×</button></article>';}).join('')+'</div>':'<p class="dh-muted dh-small">把考试、实习或值得期待的日子放在这里</p>')+'</section>';
  }
  function todosMarkup(day) {
    const open=day.todos.filter(x=>!x.done), done=day.todos.filter(x=>x.done);
    const row=x=>'<label class="dh-todo '+(x.done?'done':'')+'"><input type="checkbox" data-todo="'+esc(x.id)+'" '+(x.done?'checked':'')+'><span>'+esc(x.text)+'</span><button type="button" data-remove-todo="'+esc(x.id)+'" aria-label="删除待办">×</button></label>';
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">SMALL THINGS, DONE</span><h3>今日待办</h3></div><button type="button" class="dh-text-btn" data-add="todo">＋ 添加</button></div>'+(day.todos.length?'<div class="dh-todo-list">'+open.map(row).join('')+done.map(row).join('')+'</div>':'<p class="dh-muted dh-small">还没有待办，今天可以慢慢来</p>')+'</section>';
  }
  function mealsMarkup(day) {
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">A LITTLE CARE</span><h3>今天吃什么</h3></div></div><div class="dh-meals">'+MEALS.map(([key,label])=>'<label class="meal-'+key+'"><span>'+({breakfast:'☀️',lunch:'🍱',dinner:'🌙'}[key])+' '+label+'</span><input type="text" data-meal="'+key+'" maxlength="80" value="'+esc(day.meals[key]||'')+'" placeholder="还没决定"></label>').join('')+'</div></section>';
  }
  function moodMarkup(day) {
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">HOW ARE YOU FEELING</span><h3>今天的心情</h3></div></div><div class="dh-mood-prompt">此刻的你，是什么心情？</div><div class="dh-moods">'+MOODS.map(([key,symbol,label])=>'<button type="button" data-mood="'+key+'" class="mood-'+key+' '+(day.mood.value===key?'active':'')+'" aria-label="'+label+'" aria-pressed="'+(day.mood.value===key)+'"><i>'+symbol+'</i><span>'+label+'</span></button>').join('')+'</div><textarea class="dh-mood-note" data-mood-note maxlength="180" placeholder="留一句给今天的话…">'+esc(day.mood.note||'')+'</textarea></section>';
  }
  function eventsMarkup(day) {
    const events=eventsForDate(selected);
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">ON THIS DAY</span><h3>日程与纪念日</h3></div><button type="button" class="dh-text-btn" data-add="event">＋ 添加</button></div>'+(events.length?'<div class="dh-event-list">'+events.map(x=>'<article><time>'+(x.time?esc(x.time):'全天')+'</time><div><b>'+esc(x.title)+'</b><small class="dh-event-meta">'+esc(x.category||'日程')+(x.repeatYearly?' · 每年重复':'')+(x.note?' · '+esc(x.note):'')+'</small></div><button type="button" data-remove-event="'+esc(x.id)+'" data-event-source="'+esc(x.sourceDate||selected)+'" aria-label="删除日程">×</button></article>').join('')+'</div>':'<p class="dh-muted dh-small">这一天还没有约定或纪念日</p>')+'</section>';
  }
  function plansTimetableMarkup() {
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">WEEKLY ROUTINE</span><h3>每周固定安排</h3></div><button type="button" class="dh-text-btn" data-add="class">＋ 添加</button></div><div class="dh-plan-week">'+WEEK.map((label,index)=>{
      const items=data.timetable.filter(item=>Number(item.weekday)===index).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      return '<div class="dh-plan-week-row"><span class="dh-plan-weekday">周'+label+'</span><div class="dh-plan-week-items">'+(items.length?items.map(item=>'<div><time>'+esc(item.time||'未设时间')+'</time><span><b>'+esc(item.title)+'</b>'+(item.place?'<small>'+esc(item.place)+'</small>':'')+'</span><button type="button" data-remove-class="'+esc(item.id)+'" aria-label="删除固定安排">×</button></div>').join(''):'<small class="dh-plan-none">暂无固定安排</small>')+'</div></div>';
    }).join('')+'</div><p class="dh-plan-hint">固定安排按星期重复显示，修改或删除后会同步到日历。</p></section>';
  }
  function plansAgendaMarkup() {
    const start=parse(selected), dates=Array.from({length:14},(_,index)=>{const d=new Date(start);d.setDate(start.getDate()+index);return iso(d);});
    const rows=dates.map(date=>{
      const day=data.days[date]||{todos:[]}, events=eventsForDate(date), todos=day.todos||[];
      if(!events.length&&!todos.length)return '';
      return '<article class="dh-plan-date"><header><div><b>'+dateLabel(date)+'</b><small>'+todayLabel(date)+(date===iso(new Date())?' · 今天':'')+'</small></div><button type="button" class="dh-text-btn" data-plan-select="'+date+'">查看这天</button></header>'+
        (events.length?'<div class="dh-plan-items">'+events.map(event=>'<div class="dh-plan-item"><time>'+(event.time?esc(event.time):'全天')+'</time><span><b>'+esc(event.title)+'</b><small>'+esc(event.category||'日程')+(event.repeatYearly?' · 每年重复':'')+'</small></span><button type="button" data-remove-event="'+esc(event.id)+'" data-event-source="'+esc(event.sourceDate||date)+'" aria-label="删除日程">×</button></div>').join('')+'</div>':'')+
        (todos.length?'<div class="dh-plan-items">'+todos.map(todo=>'<label class="dh-plan-item dh-plan-todo '+(todo.done?'done':'')+'"><input type="checkbox" data-plan-todo="'+esc(todo.id)+'" data-plan-day="'+date+'" '+(todo.done?'checked':'')+'><span><b>'+esc(todo.text)+'</b><small>待办事项</small></span><button type="button" data-plan-remove-todo="'+esc(todo.id)+'" data-plan-day="'+date+'" aria-label="删除待办">×</button></label>').join('')+'</div>':'')+'</article>';
    }).join('');
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">NEXT 14 DAYS</span><h3>近期计划</h3></div><span class="dh-plan-range">从所选日期起</span></div>'+(rows||'<p class="dh-muted dh-small">接下来两周还没有安排。可以先添加一件小事。</p>')+'</section>';
  }
  function plansMarkup() {
    const day=getDay(selected), open=day.todos.filter(item=>!item.done).length;
    return '<section class="daily-hub plans-focus" id="daily-hub"><div class="dh-calendar-intro"><span class="dh-en">MAKE ROOM FOR WHAT MATTERS</span><h2>安排</h2><p>把固定节奏和眼前要做的事，放在同一个地方。</p></div><section class="dh-plan-overview"><div><span class="dh-en">START FROM</span><b>'+dateLabel(selected)+'</b><small>'+todayLabel(selected)+' · 当天还有 '+open+' 项待办未完成</small></div><label>查看起始日期<input type="date" data-plan-date value="'+selected+'"></label></section><section class="dh-plan-quick"><button type="button" data-add="todo"><b>＋</b><span>添加待办</span></button><button type="button" data-add="event"><b>＋</b><span>添加日程</span></button><button type="button" data-add="class"><b>＋</b><span>固定安排</span></button><button type="button" data-add="countdown"><b>＋</b><span>倒数日</span></button></section>'+plansAgendaMarkup()+plansTimetableMarkup()+countdownMarkup()+'<p class="dh-footnote">计划可以调整，生活不必赶路。</p></section>';
  }
  function calendarDayMarkup(day) {
    const done=day.todos.filter(item=>item.done).length;
    const dateCount=eventsForDate(selected).length+day.todos.length+data.countdowns.filter(item=>item.date===selected).length;
    return '<section class="dh-calendar-day"><div class="dh-calendar-day-head"><div><span class="dh-en">SELECTED DAY</span><h2>'+dateLabel(selected)+'</h2><p>'+todayLabel(selected)+' · '+(selected===iso(new Date())?'今天':'已选择日期')+'</p></div><span class="dh-day-total">'+dateCount+' 项记录</span></div><div class="dh-day-progress"><span>待办完成</span><b>'+done+' / '+day.todos.length+'</b><i><em style="width:'+(day.todos.length?Math.round(done/day.todos.length*100):0)+'%"></em></i></div></section>'+eventsMarkup(day)+todosMarkup(day)+mealsMarkup(day)+moodMarkup(day);
  }
  function render(mode) {
    if(mode) viewMode=mode;
    const day=getDay(selected), today=iso(new Date());
    if(viewMode==='calendar') return '<section class="daily-hub calendar-focus" id="daily-hub"><div class="dh-calendar-intro"><span class="dh-en">YOUR TIME, YOUR STORY</span><h2>日历</h2><p>把重要的日子、每天的小事，都放在时间里。</p></div>'+monthMarkup()+calendarDayMarkup(day)+countdownMarkup()+'<p class="dh-footnote">每一天都值得被好好记下。</p></section>';
    if(viewMode==='plans') return plansMarkup();
    const done=day.todos.filter(x=>x.done).length;
    return '<section class="daily-hub" id="daily-hub"><div class="dh-today-head"><div><span class="dh-en">TODAY / OUR LITTLE LIFE</span><h2>'+dateLabel(selected)+'</h2><p>'+todayLabel(selected)+' · '+(selected===today?'今天':'查看这一天')+'</p></div><div class="dh-weather"><span>WEATHER</span><b>天气待接入</b><small>连接天气服务后显示</small></div></div><div class="dh-progress"><span>今日完成</span><b>'+done+' / '+day.todos.length+'</b><i><em style="width:'+(day.todos.length?Math.round(done/day.todos.length*100):0)+'%"></em></i></div>'+timetableMarkup()+countdownMarkup()+todosMarkup(day)+mealsMarkup(day)+moodMarkup(day)+eventsMarkup(day)+monthMarkup()+wishlistMarkup()+'<p class="dh-footnote">把普通的一天，也认真地收进生活里。</p></section>';
  }
  function refresh() { const root=$('daily-hub'); if(!root)return; root.outerHTML=render(viewMode); bind(); }
  function addItem(kind) {
    if(kind==='todo') {
      const text=window.prompt('想完成什么？'); if(!text||!text.trim())return;
      getDay(selected).todos.push({id:makeId(),text:text.trim(),done:false});
    } else if(kind==='event') {
      const title=window.prompt('这一天有什么安排或纪念？'); if(!title||!title.trim())return;
      const time=window.prompt('时间（可留空，例如 14:30）',''); if(time===null)return;
      const category=(window.prompt('类型：日程 / 纪念日 / 生日','日程')||'日程').trim()||'日程';
      const repeatYearly=category!=='日程' && window.confirm('是否每年在这一天提醒？');
      const note=window.prompt('备注（可留空）',''); if(note===null)return;
      getDay(selected).events.push({id:makeId(),title:title.trim(),time:time.trim(),category,repeatYearly,note:note.trim()});
    } else if(kind==='class') {
      const title=window.prompt('课程或固定安排名称？'); if(!title||!title.trim())return;
      const time=window.prompt('开始时间（例如 09:00）','09:00'); if(time===null)return;
      const place=window.prompt('地点（可留空）','')||'';
      data.timetable.push({id:makeId(),weekday:(parse(selected).getDay()+6)%7,title:title.trim(),time:time.trim(),place:place.trim()});
    } else if(kind==='countdown') {
      const title=window.prompt('倒数事项名称？'); if(!title||!title.trim())return;
      const date=window.prompt('目标日期（YYYY-MM-DD）',selected); if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
      data.countdowns.push({id:makeId(),title:title.trim(),date});
    }
    if(persist()){window.UI?.toast?.('已保存');refresh();}
  }
  function bind() {
    const root=$('daily-hub'); if(!root)return;

    const wishForm=root.querySelector('#dh-wish-form');
    if(wishForm)wishForm.onsubmit=e=>{
      e.preventDefault();
      const input=root.querySelector('#dh-wish-text'),kind=root.querySelector('#dh-wish-kind'),text=(input?.value||'').trim();
      if(!text){window.UI?.toast?.('先写下一件想一起做的事');return;}
      wishes.push({id:makeId(),kind:kind?.value||'do',text,done:false,createdAt:Date.now()});
      if(saveWishes())refresh();
    };
    root.querySelectorAll('[data-wish-toggle]').forEach(input=>input.onchange=()=>{
      const item=wishes.find(x=>x.id===input.dataset.wishToggle);if(item){item.done=input.checked;if(saveWishes())refresh();}
    });
    root.querySelectorAll('[data-wish-remove]').forEach(button=>button.onclick=()=>{
      wishes=wishes.filter(x=>x.id!==button.dataset.wishRemove);if(saveWishes())refresh();
    });

    root.querySelectorAll('[data-date]').forEach(btn=>btn.onclick=()=>{selected=btn.dataset.date;cursor=firstMonth(parse(selected));refresh();});
    root.querySelectorAll('[data-month]').forEach(btn=>btn.onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()+Number(btn.dataset.month),1);refresh();});
    const planDate=root.querySelector('[data-plan-date]'); if(planDate)planDate.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(planDate.value)){selected=planDate.value;cursor=firstMonth(parse(selected));refresh();}};
    root.querySelectorAll('[data-plan-select]').forEach(btn=>btn.onclick=()=>{selected=btn.dataset.planSelect;cursor=firstMonth(parse(selected));refresh();});
    root.querySelectorAll('[data-plan-todo]').forEach(input=>input.onchange=()=>{const day=getDay(input.dataset.planDay),item=day.todos.find(todo=>todo.id===input.dataset.planTodo);if(item){item.done=input.checked;if(persist())refresh();}});
    root.querySelectorAll('[data-plan-remove-todo]').forEach(btn=>btn.onclick=()=>{const day=getDay(btn.dataset.planDay);day.todos=day.todos.filter(todo=>todo.id!==btn.dataset.planRemoveTodo);if(persist())refresh();});
    const today=root.querySelector('[data-today]'); if(today)today.onclick=()=>{selected=iso(new Date());cursor=firstMonth(new Date());refresh();};
    root.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addItem(btn.dataset.add));
    root.querySelectorAll('[data-todo]').forEach(input=>input.onchange=()=>{const item=getDay(selected).todos.find(x=>x.id===input.dataset.todo);if(item){item.done=input.checked;if(persist())refresh();}});
    root.querySelectorAll('[data-remove-todo]').forEach(btn=>btn.onclick=()=>{getDay(selected).todos=getDay(selected).todos.filter(x=>x.id!==btn.dataset.removeTodo);if(persist())refresh();});
    root.querySelectorAll('[data-remove-event]').forEach(btn=>btn.onclick=()=>{const source=btn.dataset.eventSource||selected;getDay(source).events=getDay(source).events.filter(x=>x.id!==btn.dataset.removeEvent);if(persist())refresh();});
    root.querySelectorAll('[data-remove-class]').forEach(btn=>btn.onclick=()=>{data.timetable=data.timetable.filter(x=>x.id!==btn.dataset.removeClass);if(persist())refresh();});
    root.querySelectorAll('[data-remove-count]').forEach(btn=>btn.onclick=()=>{data.countdowns=data.countdowns.filter(x=>x.id!==btn.dataset.removeCount);if(persist())refresh();});
    root.querySelectorAll('[data-meal]').forEach(input=>input.onchange=()=>{getDay(selected).meals[input.dataset.meal]=input.value.trim();persist();});
    root.querySelectorAll('[data-mood]').forEach(btn=>btn.onclick=()=>{getDay(selected).mood.value=btn.dataset.mood;if(persist())refresh();});
    const note=root.querySelector('[data-mood-note]'); if(note)note.onchange=()=>{getDay(selected).mood.note=note.value.trim();persist();};
  }
  function mount(){bind();}
  window.DailyLife={render,mount};
})();
