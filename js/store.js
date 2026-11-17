/* ══════════════════════════════════════════════
   store.js · 状态管理（唯一真源）
   ══════════════════════════════════════════════ */

const LS = localStorage;

const DEF = {
  theme: 'light',
  wallpaper: 'water', // water | none | custom
  homeWallpaper: '',
  sidebarWallpaper: '',
  surfaceMaterial: 'glass',
  materialOpacity: 76,
  materialBlur: 22,
  materialTexture: 34,
  loveDate: '2025-01-01',
  hisName: '他',
  herName: '她',
  chatSplitMode: 'split',
  chatBubbleBg: true,
  chatMsgsByChannel: {
    general: [
      { who: 'ta', text: '欢迎来到我们的小窝～这里是我们的秘密基地 ♡', t: Date.now() - 3600000 },
      { who: 'me', text: '以后这里只装我们俩的故事。', t: Date.now() - 3500000 },
    ],
    sweet: [],
    daily: [],
    secret: [],
  },
  nextAlbumId: 1,
  album: [
    { id: 0, title: '初见', desc: '2025-01-01', url: '' },
    { id: 0, title: '晴天', desc: '2025-02-14', url: '' },
    { id: 0, title: '海', desc: '2025-03-20', url: '' },
  ],
  favSongs: [
    { title: '夏天的风', artist: '温岚', lyric: '夏天的风 正暖暖吹过' },
    { title: '慢慢喜欢你', artist: '莫文蔚', lyric: '慢慢喜欢你 慢慢的亲密' },
  ],
  favIdx: 0,
  isPlaying: false,
  playProg: 0,
  annivList: [
    { d: '2025-02-14', t: '情人节' },
    { d: '2025-05-20', t: '520' },
    { d: '2025-01-01', t: '初见' },
  ],
  hisAvatar: '',
  herAvatar: '',
  hisWords: [
    { text: '你今天很好看。', date: '2025-11-14' },
    { text: '我想你了。', date: '2025-11-10' },
    { text: '晚安，做个好梦。', date: '2025-11-08' },
  ],
  aiKey: '',
  aiUrl: 'https://api.openai.com/v1/chat/completions',
  aiModel: 'gpt-4o-mini',
  globalPrompt: '',
  loveLetter: '遇见你之后，每一天都变得不一样了。\n\n以前我觉得日子就是一天天过去，没什么特别的。但有了你之后，连最普通的早晨都变得值得期待。\n\n谢谢你出现在我的生命里。',
  voiceMsgs: [],
  photos: [],
};

const S = {};
function load(k) { try { S[k] = JSON.parse(LS.getItem('xw_' + k) ?? 'null'); } catch {} if (S[k] === null) S[k] = JSON.parse(JSON.stringify(DEF[k])); }
function save(k) { LS.setItem('xw_' + k, JSON.stringify(S[k])); }
Object.keys(DEF).forEach(load);

// 响应式订阅：val.set(new) 会触发回调
function ref(k) {
  return {
    get v() { return S[k]; },
    set v(nv) { S[k] = nv; save(k); for (const fn of ref.__s[k] || []) fn(nv); },
    sub(fn) { (ref.__s[k] = ref.__s[k] || []).push(fn); },
  };
}
ref.__s = {};

// 便捷导出
window.XW = { S, save, load, ref, DEF };

function applyWallpapers() {
  const dark = document.documentElement.classList.contains('dark');
  const home = document.querySelector('#pg-home .fe-home');
  const drawer = document.getElementById('side-drawer');
  if (home) {
    if (S.homeWallpaper) {
      const wash = dark ? 'linear-gradient(rgba(12,12,14,.48), rgba(12,12,14,.56))' : 'linear-gradient(rgba(255,255,255,.34), rgba(248,248,250,.48))';
      home.style.backgroundImage = wash + ', url("' + S.homeWallpaper + '")';
      home.style.backgroundSize = 'cover';
      home.style.backgroundPosition = 'center';
      home.classList.add('has-home-wallpaper');
    } else {
      home.style.removeProperty('background-image');
      home.classList.remove('has-home-wallpaper');
    }
  }
  if (drawer) {
    if (S.sidebarWallpaper) {
      const wash = dark ? 'linear-gradient(rgba(18,18,20,.72), rgba(18,18,20,.78))' : 'linear-gradient(rgba(255,255,255,.78), rgba(250,250,251,.84))';
      drawer.style.backgroundImage = wash + ', url("' + S.sidebarWallpaper + '")';
      drawer.style.backgroundSize = 'cover';
      drawer.style.backgroundPosition = 'center';
    } else {
      drawer.style.removeProperty('background-image');
    }
  }
}
window.XW.applyWallpapers = applyWallpapers;
function applySurfaceMaterial() {
  const root = document.documentElement;
  const material = ['glass','paper','acrylic','ceramic'].includes(S.surfaceMaterial) ? S.surfaceMaterial : 'glass';
  root.dataset.surfaceMaterial = material;
  root.style.setProperty('--material-opacity', Math.min(96, Math.max(35, Number(S.materialOpacity) || 76)) + '%');
  root.style.setProperty('--material-blur', Math.min(36, Math.max(0, Number(S.materialBlur) || 0)) + 'px');
  root.style.setProperty('--material-texture-opacity', Math.min(100, Math.max(0, Number(S.materialTexture) || 0)) / 100);
}
window.XW.applySurfaceMaterial = applySurfaceMaterial;
document.addEventListener('DOMContentLoaded', () => { applyWallpapers(); applySurfaceMaterial(); });
