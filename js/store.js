/* ══════════════════════════════════════════════
   store.js · 状态管理（唯一真源）
   ══════════════════════════════════════════════ */

const LS = localStorage;

const DEF = {
  theme: 'light',
  wallpaper: 'water', // water | none | custom
  loveDate: '2025-01-01',
  hisName: '他',
  herName: '她',
  chatMsgs: [
    { who: 'ta', text: '欢迎来到我们的小窝～这里是我们的秘密基地 ♡', t: Date.now() - 3600000 },
    { who: 'me', text: '以后这里只装我们俩的故事。', t: Date.now() - 3500000 },
  ],
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
  aiKey: '',
  aiUrl: 'https://api.openai.com/v1/chat/completions',
  aiModel: 'gpt-4o-mini',
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
