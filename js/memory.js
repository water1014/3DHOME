/* memory.js · single visual language: paper archive */
(function(){
const D=document,$=id=>D.getElementById(id),KEY='xw_memories_v1';
const TYPES=[['moment','片刻'],['preference','偏爱'],['promise','约定'],['important','珍藏']];
let memories=[],filter='all',query='',editing=null;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kind=id=>TYPES.find(t=>t[0]===id)||TYPES[0];
const date=v=>{const d=new Date(v);return isNaN(d)?'':d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')};
const sorted=()=>memories.slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
function toast(s){const el=$('toast');if(!el)return;el.textContent=s;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function read(){try{memories=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){memories=[]}if(!Array.isArray(memories))memories=[]}
function save(){localStorage.setItem(KEY,JSON.stringify(memories))}
function visible(){return sorted().filter(m=>(filter==='all'||m.type===filter)&&(!query||((m.title||'')+' '+(m.body||'')+' '+(m.tags||[]).join(' ')).toLowerCase().includes(query.toLowerCase())))}
function render(){
$('memory-total').textContent=memories.length;$('memory-pinned').textContent=memories.filter(m=>m.pinned).length;
D.querySelectorAll('.archive-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
const list=visible();$('memory-result-count').textContent=list.length+' 条记录';
$('memory-list').innerHTML=list.length?list.map((m,i)=>'<article class="archive-record"><span class="archive-no">'+String(i+1).padStart(2,'0')+'</span><button class="archive-paper" data-edit="'+esc(m.id)+'"><span class="paper-meta">'+esc(kind(m.type)[1])+'　·　'+esc(date(m.date))+(m.pinned?'　·　置顶':'')+'</span><strong>'+esc(m.title||'无题')+'</strong><span class="paper-preview">'+esc(m.body||'')+'</span>'+(m.tags&&m.tags.length?'<span class="paper-tags">'+m.tags.map(t=>'<i>#'+esc(t)+'</i>').join('')+'</span>':'')+'</button><button class="archive-more" data-menu="'+esc(m.id)+'">···</button></article>').join(''):'<div class="archive-empty"><span>—</span><p>这里暂时空着。</p><small>把想留下的片刻，收进这本档案。</small></div>';
}
function editor(item){
editing=item?item.id:null;const o=item||{title:'',body:'',date:new Date().toISOString().slice(0,10),type:'moment',tags:[]};
$('mem-editor').innerHTML='<div class="mem-sheet" role="dialog" aria-modal="true"><div class="mem-sheet-head"><div><small>PERSONAL ARCHIVE</small><h2>'+(item?'整理这条记忆':'收录一条记忆')+'</h2></div><button data-close>×</button></div><label class="mem-field"><span>标题</span><input id="mem-title-input" maxlength="60" value="'+esc(o.title)+'" placeholder="给这段记忆一个名字"></label><label class="mem-field"><span>内容</span><textarea id="mem-body-input" rows="5" maxlength="3000" placeholder="写下值得留下的细节……">'+esc(o.body)+'</textarea></label><div class="mem-field-row"><label class="mem-field"><span>日期</span><input id="mem-date-input" type="date" value="'+esc(o.date)+'"></label><label class="mem-field"><span>分类</span><select id="mem-type-input">'+TYPES.map(t=>'<option value="'+t[0]+'" '+(o.type===t[0]?'selected':'')+'>'+t[1]+'</option>').join('')+'</select></label></div><label class="mem-field"><span>标签 · 用逗号分隔</span><input id="mem-tags-input" value="'+esc((o.tags||[]).join(', '))+'" placeholder="例如：旅行、第一次"></label><div class="mem-sheet-foot"><button data-close>取消</button><button id="mem-save">保存</button></div></div>';
$('mem-editor').classList.add('show');$('mem-title-input').focus();
}
function close(){ $('mem-editor').classList.remove('show');editing=null }
function saveEditor(){
const title=$('mem-title-input').value.trim(),body=$('mem-body-input').value.trim();if(!title&&!body){toast('先写下一点内容吧');return}
const old=memories.find(m=>m.id===editing),item={id:editing||('m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),title:title||'未命名记忆',body,date:$('mem-date-input').value||new Date().toISOString().slice(0,10),type:$('mem-type-input').value,tags:$('mem-tags-input').value.split(/[，,]/).map(x=>x.trim()).filter(Boolean).slice(0,8),pinned:old?!!old.pinned:false,createdAt:old?old.createdAt:Date.now(),updatedAt:Date.now()};
if(old)memories=memories.map(m=>m.id===editing?item:m);else memories.push(item);save();close();render();toast(old?'记录已更新':'已收进档案');
}
function build(){
$('pg-mem').innerHTML='<div class="memory-page"><header class="archive-top"><div class="archive-brand"><span>THE ARCHIVE</span><i></i><small>OUR LITTLE RECORDS</small></div><button class="archive-add" data-add>＋</button></header><section class="archive-title"><div><small>KEPT, NOT FORGOTTEN</small><h1>记忆档案</h1><p>把一起走过的日子，好好收在这里。</p></div><div class="archive-stats"><strong id="memory-total">0</strong><span>记录</span><strong id="memory-pinned">0</strong><span>置顶</span></div></section><label class="archive-search"><span>⌕</span><input id="memory-search" type="search" placeholder="搜索标题、内容或标签"></label><nav class="archive-filters"><button class="archive-filter active" data-filter="all">全部</button>'+TYPES.map(t=>'<button class="archive-filter" data-filter="'+t[0]+'">'+t[1]+'</button>').join('')+'</nav><div class="archive-list-head"><span>FILE INDEX</span><span id="memory-result-count">0 条记录</span></div><div id="memory-list" class="archive-list"></div><footer class="archive-footer">ONE DAY AT A TIME　·　✳</footer><div class="memory-editor-overlay" id="mem-editor"></div></div>';
read();const root=$('pg-mem');
root.addEventListener('click',e=>{
if(e.target.closest('[data-add]')){editor(null);return}
const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;render();return}
const ed=e.target.closest('[data-edit]');if(ed){editor(memories.find(m=>m.id===ed.dataset.edit));return}
const more=e.target.closest('[data-menu]');if(more){const m=memories.find(x=>x.id===more.dataset.menu);if(!m)return;const a=prompt('输入操作：1 置顶/取消置顶，2 编辑，3 删除');if(a==='1'){m.pinned=!m.pinned;save();render()}else if(a==='2')editor(m);else if(a==='3'&&confirm('确定删除这条记忆吗？')){memories=memories.filter(x=>x.id!==m.id);save();render();toast('记录已删除')}return}
if(e.target.closest('[data-close]')||e.target===$('mem-editor')){close();return}
if(e.target.closest('#mem-save'))saveEditor();
});
$('memory-search').addEventListener('input',e=>{query=e.target.value.trim();render()});render();
}
window.Memory={build};
})();