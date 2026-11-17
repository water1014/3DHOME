/* Xiaowo calendar · local-first personal calendar */
(function () {
  const STORAGE_KEY = 'xiaowo_calendar_events_v1';
  const WEEKDAYS = ['一','二','三','四','五','六','日'];
  const CATEGORIES = ['日常','约定','纪念','提醒'];
  let cursor = firstOfMonth(new Date());
  let selectedDate = toISO(new Date());
  let events = loadEvents();
  let editingId = null;

  function toISO(date) {
    return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
  }
  function fromISO(value) {
    const p = String(value || '').split('-').map(Number);
    return new Date(p[0], (p[1] || 1)-1, p[2] || 1);
  }
  function firstOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function loadEvents() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && item.id && item.date && item.title) : [];
    } catch (_) { return []; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); return true; }
    catch (_) { window.UI?.toast?.('保存失败，请检查设备存储空间'); return false; }
  }
  function monthLabel(date) { return date.getFullYear() + '年 ' + (date.getMonth()+1) + '月'; }
  function fullDateLabel(value) {
    const d = fromISO(value);
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
  }
  function eventsFor(value) {
    return events.filter(item => item.date === value).sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }
  function renderCalendar() {
    const today = toISO(new Date());
    const first = firstOfMonth(cursor);
    const offset = (first.getDay()+6)%7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1-offset);
    const monthKey = toISO(first).slice(0,7);
    const monthCount = events.filter(item => item.date.slice(0,7) === monthKey).length;
    const cells = Array.from({length:42}, (_,i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i);
      const iso = toISO(d), list = eventsFor(iso), classes = ['cal-day'];
      if (d.getMonth() !== cursor.getMonth()) classes.push('is-outside');
      if (iso === selectedDate) classes.push('is-selected');
      if (iso === today) classes.push('is-today');
      const dots = list.slice(0,3).map(item => '<i class="cal-dot cal-dot-' + Math.max(0,CATEGORIES.indexOf(item.category)) + '"></i>').join('');
      return '<button type="button" class="' + classes.join(' ') + '" data-cal-date="' + iso + '" aria-label="' + fullDateLabel(iso) + (list.length ? '，'+list.length+'项安排' : '') + '" aria-pressed="' + (iso===selectedDate?'true':'false') + '"><span class="cal-day-number">' + d.getDate() + '</span><span class="cal-day-dots" aria-hidden="true">' + dots + '</span></button>';
    }).join('');
    const list = eventsFor(selectedDate);
    const eventMarkup = list.length ? '<div class="cal-event-list">' + list.map(item => {
      const cat = Math.max(0,CATEGORIES.indexOf(item.category));
      return '<article class="cal-event cal-event-' + cat + '"><span class="cal-event-line"></span><div class="cal-event-main"><div class="cal-event-top"><span class="cal-event-time">' + (item.time ? escapeHtml(item.time) : '全天') + '</span><span class="cal-event-category">' + escapeHtml(item.category || '日常') + '</span></div><b>' + escapeHtml(item.title) + '</b>' + (item.note ? '<p>' + escapeHtml(item.note) + '</p>' : '') + '</div><button type="button" class="cal-edit-btn" data-cal-edit="' + escapeHtml(item.id) + '">编辑</button><button type="button" class="cal-delete-btn" data-cal-delete="' + escapeHtml(item.id) + '" aria-label="删除安排">×</button></article>';
    }).join('') + '</div>' : '<div class="cal-empty"><span class="cal-empty-mark"></span><p>这一天还没有安排</p><small>给日子留一点空白，也可以写下一件想一起做的事。</small></div>';
    return '<div class="cal-toolbar"><div class="cal-month-switch"><button type="button" class="cal-icon-btn" data-cal-prev aria-label="上个月">‹</button><h2>' + monthLabel(cursor) + '</h2><button type="button" class="cal-icon-btn" data-cal-next aria-label="下个月">›</button></div><button type="button" class="cal-today-btn" data-cal-today>回到今天</button></div>' +
      '<div class="cal-month-meta"><span>' + monthKey.replace('-', ' / ') + '</span><span>' + monthCount + ' 项本月记录</span></div>' +
      '<div class="cal-grid" role="grid" aria-label="' + monthLabel(cursor) + '">' + WEEKDAYS.map(day => '<span class="cal-weekday" role="columnheader">' + day + '</span>').join('') + cells + '</div>' +
      '<section class="cal-agenda"><div class="cal-agenda-head"><div><span class="cal-overline">SELECTED DAY</span><h3>' + fullDateLabel(selectedDate) + '</h3></div><button type="button" class="cal-add-btn" data-cal-add>＋ 添加安排</button></div>' + eventMarkup + '</section>' +
      '<form class="cal-editor" id="cal-editor" hidden><div class="cal-editor-head"><div><span class="cal-overline">A LITTLE NOTE FOR THIS DAY</span><h3 id="cal-editor-title">添加安排</h3></div><button type="button" class="cal-close-btn" data-cal-cancel aria-label="关闭">×</button></div>' +
      '<label class="cal-field"><span>事项</span><input id="cal-title" name="title" maxlength="80" required placeholder="写下这一天要做的事"></label>' +
      '<div class="cal-field-row"><label class="cal-field"><span>日期</span><input id="cal-date" name="date" type="date" required></label><label class="cal-field"><span>时间</span><input id="cal-time" name="time" type="time"></label></div>' +
      '<label class="cal-field"><span>分类</span><select id="cal-category" name="category">' + CATEGORIES.map(name => '<option value="' + name + '">' + name + '</option>').join('') + '</select></label>' +
      '<label class="cal-field"><span>备注</span><textarea id="cal-note" name="note" rows="2" maxlength="240" placeholder="可选，记下一点细节"></textarea></label>' +
      '<div class="cal-editor-actions"><button type="button" class="cal-cancel-btn" data-cal-cancel>取消</button><button type="submit" class="cal-save-btn">保存安排</button></div></form>' +
      '<div class="cal-footnote">每一个日期，都是可以被好好收起来的一页。</div>';
  }
  function render() { return '<section class="calendar-content" id="calendar-app" aria-label="日历">' + renderCalendar() + '</section>'; }
  function refresh() {
    const root = document.getElementById('calendar-app');
    if (!root) return;
    root.innerHTML = renderCalendar();
    bind();
  }
  function openEditor(item) {
    const form = document.getElementById('cal-editor');
    if (!form) return;
    editingId = item ? item.id : null;
    form.hidden = false;
    document.getElementById('cal-editor-title').textContent = item ? '编辑安排' : '添加安排';
    document.getElementById('cal-title').value = item ? item.title : '';
    document.getElementById('cal-date').value = item ? item.date : selectedDate;
    document.getElementById('cal-time').value = item ? (item.time || '') : '';
    document.getElementById('cal-category').value = item ? (item.category || '日常') : '日常';
    document.getElementById('cal-note').value = item ? (item.note || '') : '';
    form.scrollIntoView({behavior:'smooth',block:'nearest'});
    document.getElementById('cal-title').focus({preventScroll:true});
  }
  function closeEditor() {
    const form = document.getElementById('cal-editor');
    if (form) form.hidden = true;
    editingId = null;
  }
  function bind() {
    document.querySelectorAll('[data-cal-prev]').forEach(button => button.onclick = () => { cursor = new Date(cursor.getFullYear(),cursor.getMonth()-1,1); refresh(); });
    document.querySelectorAll('[data-cal-next]').forEach(button => button.onclick = () => { cursor = new Date(cursor.getFullYear(),cursor.getMonth()+1,1); refresh(); });
    document.querySelectorAll('[data-cal-today]').forEach(button => button.onclick = () => { const now = new Date(); cursor = firstOfMonth(now); selectedDate = toISO(now); closeEditor(); refresh(); });
    document.querySelectorAll('[data-cal-date]').forEach(button => button.onclick = () => { selectedDate = button.dataset.calDate; cursor = firstOfMonth(fromISO(selectedDate)); refresh(); });
    document.querySelectorAll('[data-cal-add]').forEach(button => button.onclick = () => openEditor(null));
    document.querySelectorAll('[data-cal-edit]').forEach(button => button.onclick = () => { const item = events.find(entry => entry.id === button.dataset.calEdit); if (item) openEditor(item); });
    document.querySelectorAll('[data-cal-delete]').forEach(button => button.onclick = () => {
      if (!window.confirm('确定删除这条安排吗？')) return;
      events = events.filter(item => item.id !== button.dataset.calDelete);
      persist(); refresh(); window.UI?.toast?.('安排已删除');
    });
    document.querySelectorAll('[data-cal-cancel]').forEach(button => button.onclick = closeEditor);
    const form = document.getElementById('cal-editor');
    if (form) form.onsubmit = event => {
      event.preventDefault();
      const title = document.getElementById('cal-title').value.trim();
      const date = document.getElementById('cal-date').value;
      if (!title || !date) return;
      const payload = {id:editingId || ('cal-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)),title,date,time:document.getElementById('cal-time').value,category:document.getElementById('cal-category').value,note:document.getElementById('cal-note').value.trim()};
      if (editingId) events = events.map(item => item.id === editingId ? payload : item);
      else events.push(payload);
      if (!persist()) return;
      selectedDate = date; cursor = firstOfMonth(fromISO(date)); editingId = null;
      window.UI?.toast?.('安排已保存'); refresh();
    };
  }
  function mount() { bind(); }
  window.Calendar = {render,mount};
})();