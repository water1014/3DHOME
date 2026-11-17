/* Worldbook library · SillyTavern-compatible local importer */
(function(){
  const KEY='xw_worldbooks';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  let books=read(),activeId=null,query='';
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(books));return true}catch(e){window.UI?.toast?.('保存失败，可能是设备存储空间不足');return false}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=> 'wb_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  const keysOf=e=>{const k=e.key??e.keys??[];return Array.isArray(k)?k.join(', '):String(k||'')};
  const titleOf=(e,i)=>e.comment||e.name||e.title||('条目 '+(i+1));
  function unpack(data,filename){
    let root=data;
    if(root&&root.worldbook&&typeof root.worldbook==='object')root=root.worldbook;
    if(root&&root.lorebook&&typeof root.lorebook==='object')root=root.lorebook;
    let source=root?.entries;
    if(!source&&Array.isArray(root))source=root;
    if(!source||(!Array.isArray(source)&&typeof source!=='object'))throw new Error('没有找到世界书 entries 条目，请确认这是酒馆世界书 JSON');
    const values=Array.isArray(source)?source:Object.entries(source).map(([key,value])=>({__sourceKey:key,...(value||{})}));
    const entries=values.filter(v=>v&&typeof v==='object').map((v,i)=>{
      const raw={...v};delete raw.__sourceKey;
      return {id:String(v.uid??v.id??v.__sourceKey??i),raw,enabled:!Boolean(v.disable)};
    });
    if(!entries.length)throw new Error('这个文件里没有可导入的世界书条目');
    return {id:id(),name:String(root.name||root.title||filename.replace(/\.json$/i,'')||'未命名世界书'),description:String(root.description||root.desc||'从酒馆格式导入'),entries,sourceFormat:'SillyTavern',sourceRoot:root};
  }
  function normalizeEntry(e,i){
    if(!e.raw)e.raw={};
    if(typeof e.enabled!=='boolean')e.enabled=!Boolean(e.raw.disable);
    return e;
  }
  function activeBook(){return books.find(b=>b.id===activeId)||null}
  function entryMarkup(book,e,i){
    normalizeEntry(e,i);
    const raw=e.raw||{},title=titleOf(raw,i),keys=keysOf(raw),content=raw.content||'';
    const val=(key,fallback='')=>raw[key]??fallback;
    const checked=key=>raw[key]?'checked':'';
    const options=(items,current)=>items.map(([v,label])=>'<option value="'+v+'" '+(String(current)===String(v)?'selected':'')+'>'+label+'</option>').join('');
    return '<article class="wb-entry" data-entry-id="'+esc(e.id)+'">'+
      '<div class="wb-entry-top"><label><input type="checkbox" data-entry-toggle="'+esc(e.id)+'" '+(e.enabled?'checked':'')+'><span><span class="wb-entry-title">'+esc(title)+'</span><span class="wb-entry-keys">'+esc(keys||'无关键词')+'</span></span></label><span class="wb-entry-count">'+String(content).length+' 字</span></div>'+
      '<div class="wb-meta"><span class="wb-tag">'+(raw.constant?'常驻':raw.selective?'选择性':'关键词触发')+'</span><span class="wb-tag">位置 '+esc(val('position',0))+'</span>'+(raw.useProbability?'<span class="wb-tag">概率触发</span>':'')+'</div>'+
      '<details><summary>查看与编辑条目</summary>'+
        '<label class="wb-field"><span>条目名称 / 注释</span><input data-edit-title value="'+esc(title)+'"></label>'+
        '<label class="wb-field"><span>主关键词（逗号分隔）</span><input data-edit-keys value="'+esc(keys)+'"></label>'+
        '<label class="wb-field"><span>次级关键词（逗号分隔）</span><input data-edit-secondary value="'+esc(Array.isArray(raw.keysecondary)?raw.keysecondary.join(', '):raw.keysecondary||'')+'"></label>'+
        '<label class="wb-field"><span>条目内容</span><textarea data-edit-content>'+esc(content)+'</textarea></label>'+
        '<div class="wb-rule-grid">'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="constant" '+checked('constant')+'>常驻注入</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="selective" '+checked('selective')+'>启用次级关键词筛选</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="caseSensitive" '+checked('caseSensitive')+'>区分大小写</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="matchWholeWords" '+checked('matchWholeWords')+'>整词匹配</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="useProbability" '+checked('useProbability')+'>启用触发概率</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="preventRecursion" '+checked('preventRecursion')+'>阻止本条目继续递归</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="excludeRecursion" '+checked('excludeRecursion')+'>不允许递归内容触发本条</label>'+
          '<label class="wb-rule-check"><input type="checkbox" data-rule="delayUntilRecursion" '+checked('delayUntilRecursion')+'>仅递归触发时生效</label>'+
        '</div>'+
        '<div class="wb-field-grid">'+
          '<label class="wb-field"><span>次级逻辑</span><select data-rule="selectiveLogic">'+options([[0,'任一命中'],[1,'全部命中'],[2,'全部不命中'],[3,'并非全部命中']],val('selectiveLogic',0))+'</select></label>'+
          '<label class="wb-field"><span>注入位置</span><select data-rule="position">'+options([[0,'角色设定前'],[1,'角色设定后'],[2,'示例对话前'],[3,'示例对话后'],[4,'按深度插入']],val('position',0))+'</select></label>'+
          '<label class="wb-field"><span>插入深度</span><input type="number" min="0" max="100" data-rule="depth" value="'+esc(val('depth',0))+'"></label>'+
          '<label class="wb-field"><span>排序权重</span><input type="number" data-rule="order" value="'+esc(val('order',val('insertion_order',100)))+'"></label>'+
          '<label class="wb-field"><span>扫描消息数</span><input type="number" min="1" max="100" data-rule="scanDepth" value="'+esc(val('scanDepth',20))+'"></label>'+
          '<label class="wb-field"><span>触发概率 %</span><input type="number" min="0" max="100" data-rule="probability" value="'+esc(val('probability',100))+'"></label>'+
          '<label class="wb-field"><span>延迟消息数</span><input type="number" min="0" data-rule="delay" value="'+esc(val('delay',0))+'"></label>'+
          '<label class="wb-field"><span>冷却消息数</span><input type="number" min="0" data-rule="cooldown" value="'+esc(val('cooldown',0))+'"></label>'+
          '<label class="wb-field"><span>黏性消息数</span><input type="number" min="0" data-rule="sticky" value="'+esc(val('sticky',0))+'"></label>'+
          '<label class="wb-field"><span>互斥分组</span><input data-rule="group" value="'+esc(val('group',''))+'"></label>'+
          '<label class="wb-field"><span>分组权重</span><input type="number" data-rule="groupWeight" value="'+esc(val('groupWeight',100))+'"></label>'+
        '</div>'+
        '<div class="wb-entry-actions"><button class="wb-btn" type="button" data-save-entry="'+esc(e.id)+'">保存条目</button></div>'+
      '</details></article>';
  }
  function render(){
    const book=activeBook();
    if(!book){
      const filtered=books.filter(b=>(b.name+' '+(b.description||'')).toLowerCase().includes(query.toLowerCase()));
      return `<section class="worldbook-content">
        <div class="wb-intro"><div><span class="beautify-overline">WORLD INFO LIBRARY</span><p>把故事设定、人物背景与世界规则收进同一本书。</p></div><span class="wb-count">${books.length} 本</span></div>
        <div class="wb-toolbar"><button class="wb-btn primary" type="button" id="wb-import">导入酒馆世界书</button><button class="wb-btn" type="button" id="wb-create">新建世界书</button><input class="wb-hidden-file" id="wb-file" type="file" accept=".json,application/json" /></div>
        <input class="wb-search" id="wb-search" type="search" placeholder="搜索世界书名称…" value="${esc(query)}">
        <div class="wb-shelf-grid">${filtered.length?filtered.map((b,i)=>`<button class="wb-book-card" type="button" data-open-book="${esc(b.id)}"><span class="wb-cover wb-cover-${i%4}"><span class="wb-cover-spine"></span><span class="wb-cover-mark">XW</span><span class="wb-cover-title">${esc(b.name)}</span><span class="wb-cover-count">${b.entries?.length||0} ENTRIES</span></span><span class="wb-book-copy"><b>${esc(b.name)}</b><small>${esc(b.description||'暂无简介')}</small><small>${b.entries?.length||0} 页内容</small></span><span class="wb-book-arrow">›</span></button>`).join(''):`<div class="wb-empty"><b>${books.length?'没有找到这本世界书':'这里还没有世界书'}</b><p>${books.length?'试试其他关键词。':'可以导入酒馆导出的 JSON，或从一本空白世界书开始。'}</p></div>`}</div>
        <p class="beautify-hint">支持 SillyTavern 常见的 entries 对象 / 数组结构。原始条目规则会随文件一起保留，数据保存在当前设备。</p>
      </section>`;
    }
    const entries=(book.entries||[]).filter(e=>(titleOf(e.raw||{},0)+' '+keysOf(e.raw||{})+' '+(e.raw?.content||'')).toLowerCase().includes(query.toLowerCase()));
    return `<section class="worldbook-content wb-open-book">
      <button class="wb-back" type="button" id="wb-back">‹ 返回世界书书架</button>
      <div class="wb-detail-head"><div><span class="beautify-overline">WORLD INFO / ${(book.entries||[]).length} ENTRIES</span><h2>${esc(book.name)}</h2><div class="wb-detail-desc">${esc(book.description||'')}</div></div><span class="wb-count">${(book.entries||[]).filter(e=>e.enabled).length} 已启用</span></div>
      <div class="wb-toolbar"><button class="wb-btn" type="button" id="wb-export">导出 JSON</button><button class="wb-btn" type="button" id="wb-add-entry">新增条目</button><button class="wb-btn" type="button" id="wb-delete-book">删除世界书</button></div>
      <input class="wb-search" id="wb-search" type="search" placeholder="搜索条目名称、关键词或内容…" value="${esc(query)}">
      <div class="wb-entry-list wb-paper-stack">${entries.length?entries.map((e,i)=>entryMarkup(book,e,i)).join(''):`<div class="wb-empty"><b>没有匹配的条目</b><p>试试其他关键词，或者新增一个条目。</p></div>`}</div>
      <p class="beautify-hint">启用开关和编辑内容会保存在本机。酒馆的高级触发字段会原样保留在导出文件中。</p>
    </section>`;
  }
  function exportBook(book){
    const root=JSON.parse(JSON.stringify(book.sourceRoot||{}));
    const out={};
    (book.entries||[]).forEach((e,i)=>{
      const raw={...(e.raw||{})};raw.disable=!e.enabled;
      out[String(raw.uid??e.id??i)]=raw;
    });
    root.entries=out;root.name=book.name;root.description=book.description||root.description||'';
    const blob=new Blob([JSON.stringify(root,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(book.name||'worldbook').replace(/[\\/:*?"<>|]/g,'_')+'.json';a.click();URL.revokeObjectURL(url);
  }

  function buildInjection(history, selectedIds){
    const selected=new Set(Array.isArray(selectedIds)?selectedIds:[]);
    if(!selected.size)return {system:'',depth:[],matched:[],diagnostics:[]};
    const messages=(Array.isArray(history)?history:[]).map(m=>String(m?.content??m?.text??'')).filter(Boolean);
    const allEntries=[];
    books.filter(b=>selected.has(b.id)).forEach(book=>(book.entries||[]).forEach((entry,index)=>allEntries.push({book,entry,index,raw:entry.raw||{}})));
    const activated=new Map(),diagnostics=[],maxRounds=8;
    const splitKeys=value=>(Array.isArray(value)?value:String(value??'').split(/[,，\\n]/)).map(v=>String(v||'').trim()).filter(Boolean);
    const contains=(text,term,whole)=>{
      if(!term)return false;let at=text.indexOf(term);
      while(at>=0){const before=at?text[at-1]:'';const after=text[at+term.length]||'';
        const word=c=>!!c&&/[A-Za-z0-9_\\u0080-\\uFFFF]/.test(c);
        if(!whole||(!word(before)&&!word(after)))return true;
        at=text.indexOf(term,at+1);
      }return false;
    };
    const matches=(raw,scan)=>{
      const primary=splitKeys(raw.key??raw.keys),secondary=splitKeys(raw.keysecondary);
      const sensitive=!!raw.caseSensitive,whole=!!raw.matchWholeWords;
      const source=sensitive?scan:scan.toLocaleLowerCase();
      const test=term=>contains(source,sensitive?term:term.toLocaleLowerCase(),whole);
      const primaryHit=primary.some(test);
      let hit=!!raw.constant||primaryHit;
      if(hit&&raw.selective&&secondary.length){
        const found=secondary.map(test),logic=Number(raw.selectiveLogic||0);
        if(logic===1)hit=found.every(Boolean);
        else if(logic===2)hit=!found.some(Boolean);
        else if(logic===3)hit=!found.every(Boolean);
        else hit=found.some(Boolean);
      }
      return hit;
    };
    const attempt=(item,scan,recursive,round)=>{
      const {book,entry,index,raw}=item,key=String(entry.id||raw.uid||book.id+':'+index);
      if(activated.has(key)||entry.enabled===false||raw.disable||!String(raw.content||'').trim())return false;
      if(recursive&&raw.excludeRecursion)return false;
      if(!recursive&&raw.delayUntilRecursion)return false;
      const delay=Math.max(0,Number(raw.delay)||0);
      if(messages.length<delay)return false;
      const scanDepth=Math.max(1,Math.min(100,Number(raw.scanDepth)||20));
      const scoped=recursive?scan:messages.slice(-scanDepth).join('\\n');
      if(!matches(raw,scoped))return false;
      const probability=Math.max(0,Math.min(100,Number(raw.probability??100)));
      if(raw.useProbability&&Math.random()*100>=probability)return false;
      const group=String(raw.group||'').trim();
      const value={book:book.name,title:titleOf(raw,index),content:String(raw.content),position:Number(raw.position??raw.insertorder??0),depth:Math.max(0,Number(raw.depth)||0),order:Number(raw.order??raw.insertion_order??100),uid:key,group,groupWeight:Number(raw.groupWeight)||100,preventRecursion:!!raw.preventRecursion,round};
      activated.set(key,value);
      diagnostics.push({book:book.name,title:value.title,reason:recursive?'递归触发':raw.constant?'常驻触发':'关键词触发',round});
      return true;
    };
    const initial=messages.slice(-20).join('\\n');
    allEntries.forEach(item=>attempt(item,initial,false,0));
    let recursiveScan='';
    for(let round=1;round<=maxRounds;round++){
      const fresh=[...activated.values()].filter(v=>v.round===round-1&&!v.preventRecursion);
      if(!fresh.length)break;
      recursiveScan=fresh.map(v=>v.content).join('\\n');
      let added=0;
      allEntries.forEach(item=>{if(attempt(item,recursiveScan,true,round))added++;});
      if(!added)break;
    }
    let matched=[...activated.values()];
    const groups=new Map();
    matched.forEach(item=>{if(item.group){const old=groups.get(item.group);if(!old||item.groupWeight>old.groupWeight)groups.set(item.group,item);}});
    matched=matched.filter(item=>!item.group||groups.get(item.group)===item);
    matched.sort((a,b)=>a.order-b.order);
    const system=matched.filter(x=>x.position!==4).map(x=>'【'+x.book+' / '+x.title+'】\\n'+x.content).join('\\n\\n');
    const depth=matched.filter(x=>x.position===4).map(x=>({depth:x.depth,order:x.order,text:'【'+x.book+' / '+x.title+'】\\n'+x.content}));
    return {system,depth,matched:matched.map(x=>({book:x.book,title:x.title,position:x.position,depth:x.depth})),diagnostics};
  }
  function mount(){
    const $=id=>document.getElementById(id);
    $('wb-import')?.addEventListener('click',()=>$('wb-file')?.click());
    $('wb-file')?.addEventListener('change',async ev=>{
      const file=ev.target.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());const book=unpack(data,file.name);books.unshift(book);if(persist()){activeId=book.id;query='';window.Daily?.showCurrent();window.UI?.toast?.('世界书导入成功');}}
      catch(e){window.UI?.toast?.(e.message||'导入失败，请检查 JSON 文件');}
      ev.target.value='';
    });
    $('wb-create')?.addEventListener('click',()=>{
      const name=prompt('给这本世界书取个名字');if(!name?.trim())return;
      const book={id:id(),name:name.trim(),description:'',entries:[],sourceFormat:'xiaowo',sourceRoot:{name:name.trim(),entries:{}}};
      books.unshift(book);if(persist()){activeId=book.id;query='';window.Daily?.showCurrent();}
    });
    $('wb-search')?.addEventListener('input',e=>{const pos=e.target.selectionStart;query=e.target.value;const y=document.querySelector('.daily-page')?.scrollTop||0;window.Daily?.showCurrent();const input=$('wb-search');input?.focus();input?.setSelectionRange(pos,pos);const page=document.querySelector('.daily-page');if(page)page.scrollTop=y;});
    document.querySelectorAll('[data-open-book]').forEach(el=>el.addEventListener('click',()=>{activeId=el.dataset.openBook;query='';window.Daily?.showCurrent();}));
    $('wb-back')?.addEventListener('click',()=>{activeId=null;query='';window.Daily?.showCurrent();});
    $('wb-export')?.addEventListener('click',()=>{const b=activeBook();if(b)exportBook(b);});
    $('wb-delete-book')?.addEventListener('click',()=>{const b=activeBook();if(!b||!confirm('确定删除这本世界书吗？删除后无法恢复。'))return;books=books.filter(x=>x.id!==b.id);activeId=null;persist();window.Daily?.showCurrent();});
    $('wb-add-entry')?.addEventListener('click',()=>{
      const b=activeBook();if(!b)return;
      const entry={id:id(),enabled:true,raw:{uid:Date.now(),comment:'新条目',key:[],keysecondary:[],content:'',constant:false,selective:true,selectiveLogic:0,order:100,position:0,disable:false}};
      b.entries.push(entry);persist();window.Daily?.showCurrent();
    });
    document.querySelectorAll('[data-entry-toggle]').forEach(el=>el.addEventListener('change',()=>{
      const b=activeBook(),e=b?.entries.find(x=>x.id===el.dataset.entryToggle);if(!e)return;e.enabled=el.checked;e.raw.disable=!e.enabled;persist();
      const count=document.querySelector('.wb-detail-head .wb-count');if(count)count.textContent=b.entries.filter(x=>x.enabled).length+' 已启用';
    }));
    document.querySelectorAll('[data-save-entry]').forEach(el=>el.addEventListener('click',()=>{
      const b=activeBook(),e=b?.entries.find(x=>x.id===el.dataset.saveEntry);if(!e)return;
      const card=el.closest('.wb-entry'),raw=e.raw;
      raw.comment=card.querySelector('[data-edit-title]').value;
      raw.key=card.querySelector('[data-edit-keys]').value.split(/[,，\\n]/).map(x=>x.trim()).filter(Boolean);
      raw.content=card.querySelector('[data-edit-content]').value;
      raw.keysecondary=card.querySelector('[data-edit-secondary]').value.split(/[,，\\n]/).map(x=>x.trim()).filter(Boolean);
      card.querySelectorAll('[data-rule]').forEach(field=>{
        const key=field.dataset.rule;
        if(field.type==='checkbox')raw[key]=field.checked;
        else if(field.type==='number')raw[key]=Number(field.value)||0;
        else raw[key]=field.value;
      });
      raw.disable=!e.enabled;
      persist();window.UI?.toast?.('条目规则已保存');window.Daily?.showCurrent();
    }));
  }
  window.Worldbook={render,mount,listBooks:()=>books.map(b=>({id:b.id,name:b.name,count:(b.entries||[]).length})),buildInjection};
})();