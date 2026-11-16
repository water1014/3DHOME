/* ══════════════════════════════════════════════
   mine.js · 我的页
   ══════════════════════════════════════════════ */

(function() {
const D = document, $ = D.getElementById.bind(D);
const { S, save, ref } = XW;

function build() {
  const root = $('pg-mine');
  root.innerHTML = `
    <div class="main">
      <div class="mine-title">Profile</div>

      <!-- 档案卡 -->
      <div class="card frame idcard">
        <div class="an-head">
          <span class="micro">PROFILE</span>
          <span class="micro">AUTHORITY · S</span>
        </div>
        <div class="id-main">
          <div class="mine-ava">${(S.herName || '她').charAt(0)}</div>
          <div class="id-table">
            <div class="id-row" id="m-name-row">
              <span class="micro">NAME</span><b id="m-name-val">${S.herName || '她'}</b>
            </div>
            <div class="id-row" id="m-his-row">
              <span class="micro">PARTNER</span><b id="m-his-val">${S.hisName || '他'}</b>
            </div>
            <div class="id-row" id="m-date-row">
              <span class="micro">SINCE</span><b id="m-date-val">${S.loveDate || '2025-01-01'}</b>
            </div>
          </div>
        </div>
      </div>

      <!-- 纪念日 -->
      <div class="sec">
        <div class="sec-head"><div class="sec-tick"></div><div class="sec-name">纪念日</div></div>
        <div class="card" id="m-anniv-list">
          ${(S.annivList || []).map(a => `
          <div class="lrow">
            <div class="r-body"><div class="r-name">${a.t}</div><div class="r-desc">${a.d}</div></div>
          </div>`).join('')}
        </div>
      </div>

      <!-- 外观 -->
      <div class="sec">
        <div class="sec-head"><div class="sec-tick"></div><div class="sec-name">外观</div></div>
        <div class="card">
          <div class="lrow" id="m-theme-row">
            <div class="r-body"><div class="r-name">主题</div><div class="r-desc">浅色 / 深色</div></div>
            <div class="switch ${S.theme === 'dark' ? 'on' : ''}" id="m-theme-switch"></div>
          </div>
          <div class="lrow" id="m-font-row">
            <div class="r-body"><div class="r-name">字体风格</div></div>
            <div class="r-arrow">宋体 + 楷体</div>
          </div>
        </div>
      </div>

      <!-- 数据 -->
      <div class="sec">
        <div class="sec-head"><div class="sec-tick"></div><div class="sec-name">数据</div></div>
        <div class="card">
          <div class="lrow" id="m-export"><div class="r-body"><div class="r-name">导出主题</div></div><div class="r-arrow">›</div></div>
          <div class="lrow" id="m-import"><div class="r-body"><div class="r-name">导入主题</div></div><div class="r-arrow">›</div></div>
          <div class="lrow" id="m-clear"><div class="r-body"><div class="r-name">清空所有数据</div></div><div class="r-arrow">›</div></div>
        </div>
      </div>

      <!-- AI 设置 -->
      <div class="sec">
        <div class="sec-head"><div class="sec-tick"></div><div class="sec-name">AI 设置</div></div>
        <div class="card">
          <div class="lrow" id="m-ai-model">
            <div class="r-body"><div class="r-name">模型</div></div>
            <div class="r-arrow" id="m-model-val">${S.aiModel || 'gpt-4o-mini'}</div>
          </div>
          <div class="lrow" id="m-ai-key">
            <div class="r-body"><div class="r-name">API Key</div></div>
            <div class="r-arrow">${S.aiKey ? '已设置' : '未设置'}</div>
          </div>
        </div>
      </div>

      <div style="height:1rem"></div>
    </div>`;

  bindEvents();
}

function bindEvents() {
  // 主题切换
  $('m-theme-switch').onclick = function() {
    const dark = !this.classList.toggle('on');
    this.classList.toggle('on', !dark);
    S.theme = dark ? 'dark' : 'light';
    save('theme');
    applyTheme();
  };

  // 昵称编辑
  $('m-name-row').onclick = () => editText('你的昵称', 'herName');
  $('m-his-row').onclick = () => editText('对方昵称', 'hisName');
  $('m-date-row').onclick = () => editText('在一起日期 (YYYY-MM-DD)', 'loveDate');

  // 导出 / 导入 / 清空
  $('m-export').onclick = () => {
    const data = JSON.stringify(S, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `xiaowo-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    UI.toast('已导出');
  };
  $('m-import').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          Object.assign(S, d);
          Object.keys(d).forEach(k => save(k));
          UI.toast('导入成功'); location.reload();
        } catch { UI.toast('文件格式错误'); }
      };
      r.readAsText(f);
    };
    inp.click();
  };
  $('m-clear').onclick = () => {
    UI.confirmDialog({ title: '清空所有数据', text: '此操作不可撤销，所有数据将被删除。', okText: '确认清空', onOk: () => {
      localStorage.clear(); location.reload();
    }});
  };

  // AI 设置统一放在聊天页「更多」中，避免出现两套配置入口。
  const openChatAiSettings = () => {
    window.go?.('chat');
    setTimeout(() => $('ch-menu')?.click(), 80);
  };
  $('m-ai-model').onclick = openChatAiSettings;
  $('m-ai-key').onclick = openChatAiSettings;
  $('m-font-row').onclick = () => UI.toast('字体切换后续开放');
}

function editText(label, key) {
  const val = prompt(label, S[key] || '');
  if (val === null) return;
  S[key] = val.trim() || S[key];
  save(key);
  UI.toast('已保存');
  build(); // 重绘
  applyTheme();
}

function applyTheme() {
  if (S.theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

window.Mine = { build, applyTheme };
})();
