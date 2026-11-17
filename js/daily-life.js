/* Daily life hub: shared date model for calendar, plans, mood and everyday notes. */
(function () {
  const KEY = 'xiaowo_daily_hub_v1';
  const LEGACY_KEY = 'xiaowo_calendar_events_v1';
  const WEEK = ['一','二','三','四','五','六','日'];
  const MEALS = [['breakfast','早餐'],['lunch','午餐'],['dinner','晚餐']];
  const MOODS = [['calm','◯','平静'],['happy','☼','愉快'],['tired','⌁','疲惫'],['low','⋯','低落'],['excited','✳','期待']];
  const $ = id => document.getElementById(id);
  let data = load();
  let cursor = firstMonth(new Date());
  let selected = iso(new Date());
  let activeView = 'today';

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
  function dayHasRecords(day) { return !!day && ((day.todos||[]).length>0 || (day.events||[]).length>0 || Object.values(day.meals||{}).some(value=>String(value||'').trim()) || !!(day.mood && (day.mood.value || day.mood.note))); }
  function monthMarkup() {
    const month=iso(firstMonth(cursor)).slice(0,7), today=iso(new Date());
    const cells=monthGrid().map(date=>{
      const day=data.days[date] || {events:[],todos:[]}, d=parse(date), count=(day.events||[]).length+(day.todos||[]).length;
      const cls=['dh-day',d.getMonth()!==cursor.getMonth()?'outside':'',date===selected?'selected':'',date===today?'today':''].filter(Boolean).join(' ');
      return '<button type="button" class="'+cls+'" data-date="'+date+'" aria-pressed="'+(date===selected)+'"><span>'+d.getDate()+'</span><i>'+(count?'·'.repeat(Math.min(count,3)):'')+'</i></button>';
    }).join('');
    const count=Object.keys(data.days).filter(date=>date.startsWith(month) && dayHasRecords(data.days[date])).length;
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
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">A LITTLE CARE</span><h3>今天吃什么</h3></div></div><div class="dh-meals">'+MEALS.map(([key,label])=>'<label><span>'+label+'</span><input type="text" data-meal="'+key+'" maxlength="80" value="'+esc(day.meals[key]||'')+'" placeholder="还没决定"></label>').join('')+'</div></section>';
  }
  function moodMarkup(day) {
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">HOW ARE YOU FEELING</span><h3>今天的心情</h3></div></div><div class="dh-moods">'+MOODS.map(([key,symbol,label])=>'<button type="button" data-mood="'+key+'" class="'+(day.mood.value===key?'active':'')+'" aria-pressed="'+(day.mood.value===key)+'"><i>'+symbol+'</i><span>'+label+'</span></button>').join('')+'</div><textarea class="dh-mood-note" data-mood-note maxlength="180" placeholder="留一句给今天的话…">'+esc(day.mood.note||'')+'</textarea></section>';
  }
  function eventsMarkup(day) {
    const events=day.events.slice().sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    return '<section class="dh-panel"><div class="dh-panel-head"><div><span class="dh-en">ON THIS DAY</span><h3>日程与约定</h3></div><button type="button" class="dh-text-btn" data-add="event">＋ 添加</button></div>'+(events.length?'<div class="dh-event-list">'+events.map(x=>'<article><time>'+(x.time?esc(x.time):'全天')+'</time><div><b>'+esc(x.title)+'</b>'+(x.note?'<small>'+esc(x.note)+'</small>':'')+'</div><button type="button" data-remove-event="'+esc(x.id)+'" aria-label="删除日程">×</button></article>').join('')+'</div>':'<p class="dh-muted dh-small">这一天还没有约定或纪念日</p>')+'</section>';
  }
  function viewCard(key, title, en, detail, mark) {
    return '<button type="button" class="dh-entry" data-view="'+key+'"><span class="dh-entry-mark">'+mark+'</span><span class="dh-entry-copy"><small>'+en+'</small><b>'+title+'</b><i>'+detail+'</i></span><span class="dh-entry-arrow">↗</span></button>';
  }
  function viewContent(day) {
    if(activeView==='calendar') return monthMarkup();
    if(activeView==='timetable') return timetableMarkup()+countdownMarkup();
    if(activeView==='todos') return todosMarkup(day);
    if(activeView==='life') return mealsMarkup(day)+moodMarkup(day);
    if(activeView==='events') return eventsMarkup(day);
    if(activeView==='countdown') return countdownMarkup();
    const done=day.todos.filter(x=>x.done).length;
    return '<div class="dh-overview-grid">'+
      '<section class="dh-overview-main"><span class="dh-en">A DAY TO KEEP</span><h3>'+dateLabel(selected)+'</h3><p>'+todayLabel(selected)+' · '+(selected===iso(new Date())?'今天':'正在查看')+'</p><div class="dh-overview-progress"><b>'+done+'<i> / '+day.todos.length+'</i></b><span>件待办已完成</span><em><i style="width:'+(day.todos.length?Math.round(done/day.todos.length*100):0)+'%"></i></em></div></section>'+
      '<div class="dh-overview-weather"><span>WEATHER</span><b>天气待接入</b><small>连接天气服务后显示</small></div></div>'+
      '<div class="dh-entry-grid">'+
      viewCard('calendar','日历','CALENDAR','按日期查看生活记录','◷')+
      viewCard('timetable','课表与倒数','SCHEDULE','固定安排 · 重要日子','▤')+
      viewCard('todos','待办清单','TO-DO LIST',day.todos.length+' 项 · '+done+' 项完成','✓')+
      viewCard('events','日程与约定','AGENDA',day.events.length+' 条今日安排','⌁')+
      viewCard('life','生活记录','LIFE NOTES','三餐 · 心情 · 随手记','✳')+
      viewCard('countdown','重要倒数','COUNTDOWN',data.countdowns.length+' 个值得记住的日子','⌛')+
      '</div>';
  }
  function render(viewKey) {
    const routeViews={calendar:'calendar',plans:'todos',mood:'life'};
    if(viewKey && routeViews[viewKey]) activeView=routeViews[viewKey];
    else if(viewKey==='calendar') activeView='calendar';
    const day=getDay(selected), today=iso(new Date());
    const views={today:['今天','TODAY'],calendar:['日历','CALENDAR'],timetable:['课表与倒数','SCHEDULE'],todos:['待办清单','TO-DO LIST'],life:['生活记录','LIFE NOTES'],events:['日程与约定','AGENDA'],countdown:['重要倒数','COUNTDOWN']};
    const meta=views[activeView]||views.today;
    const isHome=activeView==='today';
    return '<section class="daily-hub dh-redesigned" id="daily-hub">'+
      '<header class="dh-page-head">'+(isHome?'<span class="dh-en">XIAOWO / DAILY LIFE</span>':'<button type="button" class="dh-back" data-view="today">‹ <span>日常</span></button><span class="dh-en">'+meta[1]+'</span>')+
      '<div class="dh-title-row"><div><h2>'+meta[0]+'</h2><p>'+(isHome?'把日子一页页收好。':dateLabel(selected)+' · '+todayLabel(selected))+'</p></div>'+(isHome?'<span class="dh-date-stamp">'+parse(today).getDate()+'<small>'+today.slice(0,7).replace('-',' / ')+'</small></span>':'')+'</div></header>'+
      (activeView==='countdown'?'':'<div class="dh-date-rail"><button type="button" data-day-shift="-1" aria-label="前一天">‹</button><div><small>正在记录</small><b>'+dateLabel(selected)+'</b></div><button type="button" data-day-shift="1" aria-label="后一天">›</button><button type="button" class="dh-today" data-today>今天</button></div>')+
      viewContent(day)+'<p class="dh-footnote">把普通的一天，也认真地收进生活里。</p></section>';
  }
  function refresh() { const root=$('daily-hub'); if(!root)return; root.outerHTML=render(); bind(); }
  function addItem(kind) {
    if(kind==='todo') {
      const text=window.prompt('想完成什么？'); if(!text||!text.trim())return;
      getDay(selected).todos.push({id:makeId(),text:text.trim(),done:false});
    } else if(kind==='event') {
      const title=window.prompt('这一天有什么安排？'); if(!title||!title.trim())return;
      const time=window.prompt('时间（可留空，例如 14:30）','');
      getDay(selected).events.push({id:makeId(),title:title.trim(),time:(time||'').trim(),note:''});
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
    root.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{activeView=btn.dataset.view;refresh();});
    root.querySelectorAll('[data-day-shift]').forEach(btn=>btn.onclick=()=>{const d=parse(selected);d.setDate(d.getDate()+Number(btn.dataset.dayShift));selected=iso(d);cursor=firstMonth(d);refresh();});
    root.querySelectorAll('[data-date]').forEach(btn=>btn.onclick=()=>{selected=btn.dataset.date;cursor=firstMonth(parse(selected));refresh();});
    root.querySelectorAll('[data-month]').forEach(btn=>btn.onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()+Number(btn.dataset.month),1);refresh();});
    const today=root.querySelector('[data-today]'); if(today)today.onclick=()=>{selected=iso(new Date());cursor=firstMonth(new Date());refresh();};
    root.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addItem(btn.dataset.add));
    root.querySelectorAll('[data-todo]').forEach(input=>input.onchange=()=>{const item=getDay(selected).todos.find(x=>x.id===input.dataset.todo);if(item){item.done=input.checked;if(persist())refresh();}});
    root.querySelectorAll('[data-remove-todo]').forEach(btn=>btn.onclick=()=>{getDay(selected).todos=getDay(selected).todos.filter(x=>x.id!==btn.dataset.removeTodo);if(persist())refresh();});
    root.querySelectorAll('[data-remove-event]').forEach(btn=>btn.onclick=()=>{getDay(selected).events=getDay(selected).events.filter(x=>x.id!==btn.dataset.removeEvent);if(persist())refresh();});
    root.querySelectorAll('[data-remove-class]').forEach(btn=>btn.onclick=()=>{data.timetable=data.timetable.filter(x=>x.id!==btn.dataset.removeClass);if(persist())refresh();});
    root.querySelectorAll('[data-remove-count]').forEach(btn=>btn.onclick=()=>{data.countdowns=data.countdowns.filter(x=>x.id!==btn.dataset.removeCount);if(persist())refresh();});
    root.querySelectorAll('[data-meal]').forEach(input=>input.onchange=()=>{getDay(selected).meals[input.dataset.meal]=input.value.trim();persist();});
    root.querySelectorAll('[data-mood]').forEach(btn=>btn.onclick=()=>{getDay(selected).mood.value=btn.dataset.mood;if(persist())refresh();});
    const note=root.querySelector('[data-mood-note]'); if(note)note.onchange=()=>{getDay(selected).mood.note=note.value.trim();persist();};
  }
  function mount(){bind();}
  window.DailyLife={render,mount};
})();
