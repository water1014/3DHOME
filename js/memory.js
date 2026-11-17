/* memory.js · memory room, rebuilt from the ground up */
(function () {
  const D=document, $=id=>D.getElementById(id), KEY='xw_memories_v1';
  const TYPES=[
    {id:'moment',name:'片刻',en:'MOMENTS',mark:'◌',desc:'那些不经意却想留下的日子'},
    {id:'preference',name:'偏爱',en:'FAVOURITES',mark:'✳',desc:'关于彼此，慢慢熟悉的细节'},
    {id:'promise',name:'约定',en:'PROMISES',mark:'⌁',desc:'说好要一起完成的小事'},
    {id:'important',name:'珍藏',en:'KEPT CLOSE',mark:'✧',desc:'不想被时间带走的东西'}
  ];
  let memories=[],filter='all',query='',editing=null,view='room';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')};
  const type=id=>TYPES.find(t=>t.id===id)||TYPES[0];
  const sorted=()=>memories.slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
  function read(){try{memories=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){memories=[]}if(!Array.isArray(memories))memories=[]}
  function persist(){localStorage.setItem(KEY,JSON.stringify(memories))}
  function visible(){return sorted().filter(m=>(filter==='all'||m.type===filter)&&(!query||((m.title||'')+' '+(m.body||'')+' '+(m.tags||[]).join(' ')).toLowerCase().includes(query.toLowerCase())))}
  function objectMarkup(m,i){
    const forms=['letter','photo','ticket','ribbon','glass'];
    const form=forms[i%forms.length];
    return '<button class="memory-object memory-object-'+form+'" data-edit="'+esc(m.id)+'" aria-label="打开 '+esc(m.title)+'">'+
      '<span class="object-number">NO. '+String(i+1).padStart(2,'0')+'</span>'+
      '<span class="object-art"><i class="art-back"></i><i class="art-front"></i><i class="art-detail"></i><i class="art-seal">'+type(m.type).mark+'</i></span>'+
      '<span class="object-caption"><small>'+esc(type(m.type).en)+'　/　'+esc(dateText(m.date))+'</small><strong>'+esc(m.title||'无题')+'</strong><em>'+esc((m.body||'').slice(0,46))+(m.body&&m.body.length>46?'…':'')+'</em></span>'+
      (m.pinned?'<span class="object-pin">PIN</span>':'')+'</button>';
  }
  function renderRoom(){
    const items=sorted(),hero=items[0];
    $('memory-stage').innerHTML=hero?
      '<div class="stage-atmosphere"><span class="stage-ring ring-one"></span><span class="stage-ring ring-two"></span><div class="rain-threads"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="stage-pedestal"></div><div class="stage-object"><span class="stage-object-back"></span><span class="stage-object-front"><small>KEPT IN THIS ROOM</small><i></i><strong>'+esc(hero.title||'无题')+'</strong><time>'+esc(dateText(hero.date))+'</time><b>✳</b></span></div><span class="stage-glint"></span></div>'+
      '<div class="stage-copy"><div class="stage-kicker">THE MOST RECENTLY KEPT <span>✳</span></div><h2>'+esc(hero.title||'无题')+'</h2><p>'+esc((hero.body||'').slice(0,110))+(hero.body&&hero.body.length>110?'…':'')+'</p><div class="stage-meta">'+esc(dateText(hero.date))+'　·　'+esc(type(hero.type).name)+(hero.pinned?'　·　已珍藏':'')+'</div><button data-edit="'+esc(hero.id)+'">打开这段记忆 <b>↗</b></button></div>'
      :'<div class="stage-empty"><div class="empty-orbit"><i></i><b>✳</b></div><small>A ROOM WAITING FOR YOU</small><h2>这里还没有收藏</h2><p>先放进一段记忆，让这个房间慢慢长出模样。</p><button data-mem-add>放入第一件记忆　＋</button></div>';
    $('memory-object-count').textContent=items.length+' PIECES';
    $('memory-objects').innerHTML=items.length?items.map(objectMarkup).join(''):'<div class="object-empty-note">每一段记忆，都会成为一件独一无二的收藏。</div>';
    $('memory-category-preview').innerHTML=TYPES.map(t=>'<button class="memory-category memory-category-'+t.id+'" data-category="'+t.id+'"><span class="category-orbit">'+t.mark+'</span><span class="category-label"><b>'+t.name+'</b><small>'+t.en+'</small></span><strong>'+memories.filter(m=>m.type===t.id).length+'</strong><i class="category-line"></i></button>').join('');
  }
  function renderCabinet(){
    $('memory-drawers').innerHTML=TYPES.map((t,i)=>'<button class="memory-drawer memory-drawer-'+t.id+'" data-category="'+t.id+'"><span class="drawer-index">0'+(i+1)+'</span><span class="drawer-face"><i class="drawer-paper drawer-paper-a"></i><i class="drawer-paper drawer-paper-b"></i><i class="drawer-pull"></i><b>'+t.mark+'</b></span><span class="drawer-info"><strong>'+t.name+'</strong><small>'+t.en+'</small><em>'+t.desc+'</em></span><span class="drawer-count">'+memories.filter(m=>m.type===t.id).length+' <small>件</small></span><span class="drawer-arrow">↗</span></button>').join('');
  }
  function renderIndex(){
    const items=visible();
    $('memory-index-count').textContent=items.length+' RECORDS';
    $('memory-index-list').innerHTML=items.length?items.map((m,i)=>'<article class="index-record"><span class="record-no">'+String(i+1).padStart(2,'0')+'</span><div class="record-main"><small>'+esc(type(m.type).en)+'　·　'+esc(dateText(m.date))+'</small><h3>'+esc(m.title||'无题')+'</h3><p>'+esc(m.body||'')+'</p>'+(m.tags&&m.tags.length?'<div class="record-tags">'+m.tags.map(t=>'<span>#'+esc(t)+'</span>').join('')+'</div>':'')+'<div class="record-actions"><button data-edit="'+esc(m.id)+'">打开</button><button data-pin="'+esc(m.id)+'">'+(m.pinned?'取消珍藏':'设为珍藏')+'</button><button data-delete="'+esc(m.id)+'">移除</button></div></div></article>').join(''):'<div class="index-empty">没有找到对应的记忆。</div>';
  }
  function render(){renderRoom();renderCabinet();renderIndex();$('memory-total').textContent=memories.length;$('memory-pinned').textContent=memories.filter(m=>m.pinned).length;}
  function setView(next){
    view=next;
    D.querySelectorAll('.memory-nav button').forEach(b=>b.classList.toggle('active',b.dataset-view===next));
    D.querySelectorAll('.memory-screen').forEach(s=>s.hidden=s.dataset.screen!==next);
    const page=$('memory-page'); if(page) page.dataset.current=next;
  }
  function setCategory(id){
    filter=id;query='';$('memory-search').value='';
    $('memory-filter-label').textContent=id==='all'?'全部记忆':type(id).name;
    setView('index');renderIndex();
  }
  function openEditor(item){
    editing=item?item.id:null;
    const old=item||{title:'',body:'',date:new Date().toISOString().slice(0,10),type:'moment',tags:[]};
    const overlay=$('mem-editor');
    overlay.innerHTML='<div class="mem-sheet" role="dialog" aria-modal="true" aria-label="编辑记忆"><div class="mem-sheet-grip"></div><div class="mem-sheet-head"><div><span class="mem-kicker">KEEP THIS MOMENT</span><h2>'+(item?'整理这件收藏':'放入一件新收藏')+'</h2></div><button class="mem-close" data-close>×</button></div>'+
      '<label class="mem-field"><span>标题</span><input id="mem-title-input" maxlength="60" placeholder="给这段记忆一个名字" value="'+esc(old.title)+'"></label>'+
      '<label class="mem-field"><span>记忆内容</span><textarea id="mem-body-input" rows="5" maxlength="3000" placeholder="写下值得留下的细节……">'+esc(old.body)+'</textarea></label>'+
      '<div class="mem-field-row"><label class="mem-field"><span>日期</span><input id="mem-date-input" type="date" value="'+esc(old.date)+'"></label><label class="mem-field"><span>收藏类型</span><select id="mem-type-input">'+TYPES.map(t=>'<option value="'+t.id+'" '+(old.type===t.id?'selected':'')+'>'+t.name+'</option>').join('')+'</select></label></div>'+
      '<label class="mem-field"><span>标签 · 用逗号分隔</span><input id="mem-tags-input" maxlength="120" placeholder="例如：旅行、第一次" value="'+esc((old.tags||[]).join(', '))+'"></label><div class="mem-sheet-foot"><button class="mem-cancel" data-close>取消</button><button class="mem-save" id="mem-save">保存收藏</button></div></div>';
    overlay.classList.add('show');$('mem-title-input').focus();
  }
  function closeEditor(){$('mem-editor').classList.remove('show');editing=null}
  function saveEditor(){
    const title=$('mem-title-input').value.trim(),body=$('mem-body-input').value.trim();
    if(!title&&!body){UI.toast('先写下一点内容吧');return}
    const tags=$('mem-tags-input').value.split(/[，,]/).map(s=>s.trim()).filter(Boolean).slice(0,8),existing=memories.find(m=>m.id===editing);
    const item={id:editing||('m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),title:title||'未命名记忆',body,date:$('mem-date-input').value||new Date().toISOString().slice(0,10),type:$('mem-type-input').value,tags,pinned:existing?!!existing.pinned:false,createdAt:existing?existing.createdAt:Date.now(),updatedAt:Date.now()};
    if(existing)memories=memories.map(m=>m.id===editing?item:m);else memories.push(item);
    persist();closeEditor();render();UI.toast(existing?'收藏已更新':'已放进记忆室');
  }
  function build(){
    const root=$('pg-mem');
    root.innerHTML='<div class="memory-page" id="memory-page" data-current="room"><header class="memory-masthead"><div class="memory-brand"><span class="brand-symbol">◉</span><span>THE KEEPSAKE ROOM</span><i></i><small>NO. 01 — OUR DAYS</small></div><button class="memory-add" data-mem-add aria-label="添加记忆">＋</button></header>'+
      '<div class="memory-heading"><div><small>AN ATLAS OF LITTLE THINGS</small><h1>记忆<span>室</span></h1></div><div class="memory-counter"><strong id="memory-total">0</strong><small>COLLECTED</small><i></i><strong id="memory-pinned">0</strong><small>KEPT CLOSE</small></div></div>'+
      '<nav class="memory-nav"><button class="active" data-view="room"><span>01</span> 展览</button><button data-view="cabinet"><span>02</span> 收藏室</button><button data-view="index"><span>03</span> 检索</button></nav>'+
      '<section class="memory-screen memory-room" data-screen="room"><div class="memory-stage-wrap"><div class="stage-side-note">A SMALL MUSEUM OF US <i>✳</i></div><div class="memory-stage" id="memory-stage"></div></div><div class="memory-section-head"><div><small>SELECTED OBJECTS</small><h2>最近留下的东西</h2></div><span id="memory-object-count">0 PIECES</span></div><div class="memory-objects" id="memory-objects"></div><div class="memory-section-head category-head"><div><small>FOUR WAYS TO REMEMBER</small><h2>记忆的不同形状</h2></div><span>EXPLORE ↗</span></div><div class="memory-category-preview" id="memory-category-preview"></div><footer class="memory-colophon">SOME THINGS DESERVE A PLACE OF THEIR OWN <span>✳</span></footer></section>'+
      '<section class="memory-screen memory-cabinet-screen" data-screen="cabinet" hidden><div class="cabinet-intro"><small>THE DRAWER COLLECTION</small><h2>每一种记忆，<br>都有自己的抽屉。</h2><p>轻轻拉开，看看里面收着什么。</p></div><div class="memory-drawers" id="memory-drawers"></div><div class="cabinet-footnote">分类只负责收纳，不会改变或移动原来的记忆。</div></section>'+
      '<section class="memory-screen memory-index-screen" data-screen="index" hidden><div class="index-heading"><small>FIND A PIECE OF US</small><h2>记忆目录</h2><p>从日期、标题或某个词，重新找到那一天。</p></div><label class="memory-search"><span>⌕</span><input id="memory-search" type="search" placeholder="搜索记忆内容、标题或标签"><b>↵</b></label><div class="memory-index-tools"><span id="memory-filter-label">全部记忆</span><button data-category="all">清除筛选 ×</button></div><div class="memory-index-count" id="memory-index-count">0 RECORDS</div><div id="memory-index-list" class="memory-index-list"></div></section>'+
      '<div class="memory-editor-overlay" id="mem-editor"></div></div>';
    read();
    root.addEventListener('click',e=>{
      const nav=e.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return}
      const cat=e.target.closest('[data-category]');if(cat){setCategory(cat.dataset.category);return}
      if(e.target.closest('[data-mem-add]')){openEditor(null);return}
      const edit=e.target.closest('[data-edit]');if(edit){openEditor(memories.find(m=>m.id===edit.dataset.edit));return}
      const pin=e.target.closest('[data-pin]');if(pin){const m=memories.find(x=>x.id===pin.dataset.pin);if(m){m.pinned=!m.pinned;persist();render()}return}
      const del=e.target.closest('[data-delete]');if(del){const m=memories.find(x=>x.id===del.dataset.delete);if(m&&confirm('确定从记忆室移除这件收藏吗？')){memories=memories.filter(x=>x.id!==m.id);persist();render();UI.toast('已移除')}return}
      if(e.target.closest('[data-close]')||e.target===$('mem-editor'))closeEditor();
      if(e.target.closest('#mem-save'))saveEditor();
    });
    $('memory-search').addEventListener('input',e=>{query=e.target.value.trim();renderIndex()});
    render();
  }
  window.Memory={build};
})();