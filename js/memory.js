/* memory.js · 可整理、可检索的共同记忆 */
(function () {
  const D = document;
  const $ = id => D.getElementById(id);
  const KEY = 'xw_memories_v1';
  const TYPES = [
    { id: 'moment', name: '片段', en: 'MOMENTS' },
    { id: 'preference', name: '偏好', en: 'PREFERENCES' },
    { id: 'promise', name: '约定', en: 'PROMISES' },
    { id: 'important', name: '重要', en: 'IMPORTANT' }
  ];
  let memories = [];
  let filter = 'all';
  let query = '';
  let editing = null;
  let view = 'read';

  function read() {
    try { memories = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (_) { memories = []; }
    if (!Array.isArray(memories)) memories = [];
  }
  function persist() { localStorage.setItem(KEY, JSON.stringify(memories)); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function dateText(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
  }
  function typeName(id) { return (TYPES.find(t => t.id === id) || TYPES[0]).name; }
  function sorted() {
    return memories.slice().sort((a,b) => Number(!!b.pinned)-Number(!!a.pinned) || (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0)-(a.createdAt || 0));
  }
  function render() {
    const list = $('mem-list');
    if (!list) return;
    const folders = TYPES.map(t => ({...t, count: memories.filter(m => m.type === t.id).length}));
    $('mem-folder-grid').innerHTML = folders.map(t => '<button class="mem-folder" data-filter="'+t.id+'"><span class="mem-folder-icon">'+({moment:'◷',preference:'◇',promise:'⌁',important:'✳'}[t.id])+'</span><span class="mem-folder-name">'+t.name+'</span><span class="mem-folder-en">'+t.en+'</span><b>'+t.count+'</b></button>').join('');
    const hero = sorted()[0];
    $('mem-feature').innerHTML = hero ? '<div class="mem-feature-label">RECENTLY KEPT <span>✳</span></div><div class="mem-feature-date">'+esc(dateText(hero.date))+'</div><h2>'+esc(hero.title)+'</h2><p>'+esc(hero.body.slice(0,112))+(hero.body.length>112?'…':'')+'</p><button data-edit="'+esc(hero.id)+'">打开这段记忆　↗</button>' : '<div class="mem-feature-label">A PAGE WAITING FOR US</div><h2>故事还在第一页</h2><p>把那些不想忘记的瞬间，轻轻收进来。</p><button data-mem-add>写下第一条　↗</button>';
    $('mem-feature-count').textContent = memories.length + ' ENTRIES';
    const items = sorted().filter(m => {
      const matchType = filter === 'all' || m.type === filter;
      const hay = (m.title + ' ' + m.body + ' ' + (m.tags || []).join(' ')).toLowerCase();
      return matchType && (!query || hay.includes(query.toLowerCase()));
    });
    $('mem-total').textContent = memories.length;
    $('mem-pinned').textContent = memories.filter(m => m.pinned).length;
    $('mem-filter-count').textContent = items.length + ' 条';
    if (!items.length) {
      list.innerHTML = '<div class="mem-empty"><div class="mem-empty-mark">✳</div><div class="mem-empty-title">' +
        (query ? '没有找到这段记忆' : (memories.length ? '这里暂时没有这一类记忆' : '故事还在第一页')) +
        '</div><p>' + (query ? '换个关键词试试看。' : '把想留下的片段写下来，日后就能随时找回。') +
        '</p><button class="mem-empty-add" data-mem-add>＋ 留下一条记忆</button></div>';
      return;
    }
    list.innerHTML = items.map((m, i) => {
      const tags = (m.tags || []).map(t => '<span class="mem-tag">#' + esc(t) + '</span>').join('');
      return '<article class="mem-entry ' + (m.pinned ? 'is-pinned' : '') + '" data-id="' + esc(m.id) + '">' +
        '<div class="mem-entry-rail"><span class="mem-entry-dot"></span>' + (i === items.length-1 ? '' : '<span class="mem-entry-line"></span>') + '</div>' +
        '<div class="mem-entry-content"><div class="mem-entry-meta"><span class="mem-type">' + esc(typeName(m.type)) + '</span>' +
        '<time>' + esc(dateText(m.date)) + '</time>' + (m.pinned ? '<span class="mem-pin">PINNED</span>' : '') + '</div>' +
        '<h3>' + esc(m.title || '未命名记忆') + '</h3><p>' + esc(m.body).replace(/\n/g,'<br>') + '</p>' +
        (tags ? '<div class="mem-tags">' + tags + '</div>' : '') +
        '<div class="mem-entry-actions"><button data-edit="' + esc(m.id) + '">编辑</button><button data-pin="' + esc(m.id) + '">' + (m.pinned ? '取消置顶' : '置顶') + '</button><button data-delete="' + esc(m.id) + '">删除</button></div>' +
        '</div></article>';
    }).join('');
  }
  function openEditor(item) {
    editing = item ? item.id : null;
    const old = item || { title:'', body:'', date:new Date().toISOString().slice(0,10), type:'moment', tags:[] };
    const overlay = $('mem-editor');
    overlay.innerHTML = '<div class="mem-sheet" role="dialog" aria-modal="true" aria-label="编辑记忆">' +
      '<div class="mem-sheet-grip"></div><div class="mem-sheet-head"><div><span class="mem-kicker">KEEP THIS MOMENT</span><h2>' + (item ? '整理记忆' : '留下一条记忆') + '</h2></div><button class="mem-close" data-close aria-label="关闭">×</button></div>' +
      '<label class="mem-field"><span>标题</span><input id="mem-title-input" maxlength="60" placeholder="给这段记忆一个名字" value="' + esc(old.title) + '"></label>' +
      '<label class="mem-field"><span>记忆内容</span><textarea id="mem-body-input" rows="5" maxlength="3000" placeholder="写下值得留下的细节……">' + esc(old.body) + '</textarea></label>' +
      '<div class="mem-field-row"><label class="mem-field"><span>日期</span><input id="mem-date-input" type="date" value="' + esc(old.date) + '"></label>' +
      '<label class="mem-field"><span>归入</span><select id="mem-type-input">' + TYPES.map(t => '<option value="' + t.id + '" ' + (old.type === t.id ? 'selected' : '') + '>' + t.name + '</option>').join('') + '</select></label></div>' +
      '<label class="mem-field"><span>标签 · 用逗号分隔</span><input id="mem-tags-input" maxlength="120" placeholder="例如：旅行、第一次" value="' + esc((old.tags || []).join(', ')) + '"></label>' +
      '<div class="mem-sheet-foot"><button class="mem-cancel" data-close>取消</button><button class="mem-save" id="mem-save">保存记忆</button></div></div>';
    overlay.classList.add('show');
    $('mem-title-input').focus();
  }
  function closeEditor() { $('mem-editor').classList.remove('show'); editing = null; }
  function saveEditor() {
    const title = $('mem-title-input').value.trim();
    const body = $('mem-body-input').value.trim();
    if (!title && !body) { UI.toast('先写下一点内容吧'); return; }
    const tags = $('mem-tags-input').value.split(/[，,]/).map(s => s.trim()).filter(Boolean).slice(0,8);
    const existing = memories.find(m => m.id === editing);
    const item = {
      id: editing || ('m' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
      title: title || '未命名记忆', body,
      date: $('mem-date-input').value || new Date().toISOString().slice(0,10),
      type: $('mem-type-input').value, tags,
      pinned: existing ? !!existing.pinned : false,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    if (existing) memories = memories.map(m => m.id === editing ? item : m);
    else memories.push(item);
    persist(); closeEditor(); render(); UI.toast(existing ? '记忆已更新' : '已收好这段记忆');
  }
  function build() {
    const root = $('pg-mem');
    root.innerHTML = '<div class="mem-page"><header class="mem-header"><div class="mem-overline">OUR LITTLE ARCHIVE <span>✳</span></div><div class="mem-title-row"><div><h1>记忆</h1><p>把我们走过的日子，妥帖收好。</p></div><button class="mem-add" data-mem-add aria-label="添加记忆">＋</button></div>' +
      '<div class="mem-stats"><div><strong id="mem-total">0</strong><span>收存的片段</span></div><i></i><div><strong id="mem-pinned">0</strong><span>珍藏置顶</span></div><span class="mem-stats-note">KEPT WITH CARE</span></div></header>' +
      '<nav class="mem-view-tabs" id="mem-view-tabs"><button class="active" data-view="read">阅览</button><button data-view="folders">分类夹</button><button data-view="journal">手账</button></nav>' +
      '<section class="mem-view mem-view-read" data-panel="read"><div class="mem-feature" id="mem-feature"></div><div class="mem-section-heading"><span>THE COLLECTION</span><span id="mem-feature-count">0 ENTRIES</span></div><div class="mem-folder-grid" id="mem-folder-grid"></div></section>' +
      '<section class="mem-view" data-panel="folders" hidden><div class="mem-section-heading"><span>YOUR FOLDERS</span><span>按主题收纳</span></div><div class="mem-folder-grid mem-folder-grid-large" id="mem-folder-grid-alt"></div></section>' +
      '<section class="mem-view" data-panel="journal" hidden><div class="mem-tools"><label class="mem-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="mem-search-input" type="search" placeholder="找一找某个瞬间、关键词……"><kbd>⌕</kbd></label><div class="mem-filter-row" id="mem-filters"><button class="active" data-filter="all">全部</button>' + TYPES.map(t => '<button data-filter="' + t.id + '">' + t.name + '</button>').join('') + '</div></div><div class="mem-timeline"><div class="mem-list-head"><span>MEMORY JOURNAL</span><span id="mem-filter-count">0 条</span></div><div id="mem-list" class="mem-list"></div></div></section>' +
      '<footer class="mem-footnote"><span>✳</span> 记忆由你亲手保管 · 仅保存在此设备</footer></div><div class="mem-editor-overlay" id="mem-editor"></div>';
    read();
    $('mem-search-input').addEventListener('input', e => { query = e.target.value.trim(); render(); });
    $('mem-view-tabs').addEventListener('click', e => { const b=e.target.closest('[data-view]'); if(!b)return; view=b.dataset.view; $('mem-view-tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==view); if(view==='folders') $('mem-folder-grid-alt').innerHTML=$('mem-folder-grid').innerHTML; });
    $('mem-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      filter = b.dataset.filter;
      $('mem-filters').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      render();
    });
    root.addEventListener('click', e => {
      const folder=e.target.closest('.mem-folder[data-filter]'); if(folder){ filter=folder.dataset.filter; view='journal'; $('mem-view-tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.view==='journal')); root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!=='journal'); $('mem-filters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.filter===filter)); render(); return; }
      if (e.target.closest('[data-mem-add]')) { openEditor(null); return; }
      const edit = e.target.closest('[data-edit]');
      if (edit) { openEditor(memories.find(m => m.id === edit.dataset.edit)); return; }
      const pin = e.target.closest('[data-pin]');
      if (pin) { const m = memories.find(x => x.id === pin.dataset.pin); if (m) { m.pinned = !m.pinned; persist(); render(); } return; }
      const del = e.target.closest('[data-delete]');
      if (del) {
        const m = memories.find(x => x.id === del.dataset.delete);
        if (m && confirm('确定删除这条记忆吗？')) { memories = memories.filter(x => x.id !== m.id); persist(); render(); UI.toast('已删除'); }
      }
    });
    $('mem-editor').addEventListener('click', e => {
      if (e.target === $('mem-editor') || e.target.closest('[data-close]')) closeEditor();
      if (e.target.closest('#mem-save')) saveEditor();
    });
    render();
  }
  window.Memory = { build };
})();