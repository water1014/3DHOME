/* ══════════════════════════════════════════════
   chime.js · 雨天（撑开放射伞面 · 水珠入口）
   仰视角大伞：中心枢纽 + 放射伞骨 + 扇形薄膜
   入口 = 伞面水珠 · 左右滑动转伞 · 雨滴沿骨滑走
   ══════════════════════════════════════════════ */

(function() {
let cv, ctx, W = 0, H = 0, dpr = 1, wrap = null;
let running = false, raf = null, lastT = 0, t = 0;
let drops = [], drips = [], ripples = [], bokeh = [], bigs = [];
let wind = 0, windTarget = 0;
let um;
let entries = [];
let muted = false, actx = null, noiseGain = null, noteIdx = 0, cd = 0;

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.00];
const RIB_N = 10;                  // 伞骨数量
const GROUND = () => H * 0.82;

function ensureAudio() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const sr = actx.sampleRate;
    const buf = actx.createBuffer(1, sr * 2, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 800;
    noiseGain = actx.createGain();
    noiseGain.gain.value = muted ? 0 : 0.032;
    src.connect(lp).connect(noiseGain).connect(actx.destination);
    src.start();
  }
  if (actx.state === 'suspended') actx.resume();
}
function plink(vel) {
  if (muted) return;
  try { ensureAudio(); } catch (e) { return; }
  const f = NOTES[noteIdx % NOTES.length]; noteIdx++;
  const tt = actx.currentTime;
  const g = Math.min(0.18, 0.05 + vel * 0.08);
  const mk = (f2, gv, d) => {
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = 'sine'; o.frequency.value = f2;
    gn.gain.setValueAtTime(gv, tt);
    gn.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    o.connect(gn).connect(actx.destination);
    o.start(tt); o.stop(tt + d + 0.1);
  };
  mk(f, g, 1.1);
  mk(f * 3.01, g * 0.15, 0.35);
}
function knock() {
  if (muted) return;
  try { ensureAudio(); } catch (e) { return; }
  const tt = actx.currentTime;
  const mk = (f, g, d) => {
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, tt);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, tt + d);
    gn.gain.setValueAtTime(g, tt);
    gn.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    o.connect(gn).connect(actx.destination);
    o.start(tt); o.stop(tt + d + 0.05);
  };
  mk(150, 0.2, 0.16);
  mk(82, 0.13, 0.28);
}

function spawnDrop(x) {
  return {
    x: x !== undefined ? x : Math.random() * (W + 120) - 60,
    y: -20 - Math.random() * 60,
    vy: 480 + Math.random() * 320, vx: 0,
    len: 13 + Math.random() * 16,
  };
}

function layout() {
  um = {
    cx: W / 2, cy: H * 0.38,
    tcx: W / 2, tcy: H * 0.38,
    R: Math.min(W * 0.55, 200),
    angle: 0, vel: 0,
    squash: 0, squashV: 0,
    open: 1, openV: 0, openT: 1,
    grabbed: false,
  };
  layoutEntries();
}

// 伞局部（绕伞心旋转 angle）→ 屏幕
function umPoint(lx, ly) {
  const a = um.angle, c = Math.cos(a), s = Math.sin(a);
  return { x: um.cx + lx * c - ly * s, y: um.cy + lx * s + ly * c };
}

// 水珠在伞面上的位置（固定角度，半径 0.52R）
function dropPos(a) {
  const r = um.R * 0.52;
  return umPoint(Math.cos(a) * r, Math.sin(a) * r);
}

function layoutEntries() {
  // 4 个入口均匀分布在伞面中圈
  const base = [0.25, 0.75, 1.75, 2.25].map(v => v * Math.PI);
  entries.forEach((e, i) => {
    e.a = base[i] || (i * Math.PI / 2);
    e.angle = 0; e.vel = 0;
  });
}

function stepEntries(dt) {
  // 水珠随伞旋转 + 轻微物理晃动
  for (const e of entries) {
    e.angle += e.vel * dt;
    e.vel *= Math.pow(0.4, dt);
    const p = dropPos(e.a + um.angle);
    e.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${e.angle}rad)`;
  }
}

// 点在多边形内？（伞面是 RIB_N 边形）
function inCanopy(px, py) {
  const dx = px - um.cx, dy = py - um.cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > um.R) return false;
  const a = Math.atan2(dy, dx) - um.angle;
  const seg = Math.PI * 2 / RIB_N;
  const half = seg / 2;
  const da = ((a % seg) + seg) % seg;
  // 多边形边到中心的距离
  const edgeR = um.R * Math.cos(half);
  return d <= edgeR;
}

// 最近伞骨角度
function nearestRib(a) {
  const seg = Math.PI * 2 / RIB_N;
  return Math.round(a / seg) * seg;
}

function step(dt) {
  t += dt;
  wind += (windTarget - wind) * 0.04;
  windTarget *= Math.pow(0.3, dt);

  // 开合弹簧
  um.openV += ((um.openT - um.open) * 70 - um.openV * 7.5) * dt;
  um.open += um.openV * dt;
  um.open = Math.max(0, Math.min(1, um.open));

  if (um.grabbed) {
    // 拖动 → 旋转伞
    const acc = (um.tAngle - um.angle) * 120 - um.vel * 10;
    um.vel += acc * dt;
    um.angle += um.vel * dt;
  } else {
    // 松手后伞面像陀螺般缓慢回正 + 风
    const g = 1200, L = um.R * 2;
    const acc = -(g / L) * Math.sin(um.angle) - 1.8 * um.vel + (wind * 6 / L) * Math.sin(t * 0.9);
    um.vel += acc * dt;
    um.angle += um.vel * dt;
    um.tcx += (W / 2 - um.tcx) * 0.15 * dt;
    um.tcy += (H * 0.38 - um.tcy) * 0.18 * dt;
  }
  um.cx += (um.tcx - um.cx) * Math.min(1, (um.grabbed ? 16 : 4) * dt);
  um.cy += (um.tcy - um.cy) * Math.min(1, (um.grabbed ? 16 : 4) * dt);
  um.squashV += (-160 * um.squash - 11 * um.squashV) * dt;
  um.squash += um.squashV * dt;
  um.squash = Math.max(-0.05, Math.min(0.18, um.squash));
  stepEntries(dt);

  const want = Math.floor(W / 6);
  while (drops.length < want) drops.push(spawnDrop());
  for (let i = drops.length - 1; i >= 0; i--) {
    const p = drops[i];
    p.vx = wind * 60;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (inCanopy(p.x, p.y)) {
      // 沿最近伞骨滑向边缘
      const dx = p.x - um.cx, dy = p.y - um.cy;
      const a = Math.atan2(dy, dx) - um.angle;
      const ribA = nearestRib(a);
      const edge = umPoint(Math.cos(ribA) * um.R, Math.sin(ribA) * um.R);
      drips.push({ x: p.x, y: p.y, vy: 40, vx: 0, ribA, edge });
      drops.splice(i, 1);
      continue;
    }
    if (p.y > GROUND()) {
      ripples.push({ x: p.x, y: GROUND(), r: 2, a: 0.35 });
      drops.splice(i, 1);
    }
  }

  for (let i = drips.length - 1; i >= 0; i--) {
    const g = drips[i];
    g.vy += 800 * dt;
    // 沿伞骨方向移动
    const dir = g.ribA + um.angle;
    g.x += Math.cos(dir) * g.vy * dt * 0.6;
    g.y += Math.sin(dir) * g.vy * dt * 0.6;
    const dx = g.x - um.cx, dy = g.y - um.cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > um.R || g.y > GROUND()) {
      ripples.push({ x: g.x, y: GROUND(), r: 2, a: 0.55 });
      if (cd <= 0) { plink(0.8); cd = 150; }
      drips.splice(i, 1);
    }
  }
  cd -= dt * 1000;

  for (let i = bigs.length - 1; i >= 0; i--) {
    const g = bigs[i];
    g.vy += 1500 * dt;
    g.y += g.vy * dt;
    g.x += (g.vx || 0) * dt + wind * 40 * dt;
    if (g.y > GROUND()) {
      ripples.push({ x: g.x, y: GROUND(), r: 3, a: 0.7 });
      plink(1.4);
      bigs.splice(i, 1);
    }
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += 42 * dt;
    r.a -= 0.55 * dt;
    if (r.a <= 0) ripples.splice(i, 1);
  }

  for (const b of bokeh) {
    b.ph += dt;
    b.x += (b.vx + wind * 14 + Math.sin(b.ph * 0.6) * 5) * dt;
    b.y += b.vy * dt;
    if (b.y < -b.r) { b.y = H + b.r; b.x = Math.random() * W; }
    if (b.x < -b.r) b.x = W + b.r;
    if (b.x > W + b.r) b.x = -b.r;
  }
}

// ── 绘制 ──
function drawUmbrella() {
  const { cx, cy, R, angle, open } = um;
  const seg = Math.PI * 2 / RIB_N;
  const half = seg / 2;
  const edgeR = R * Math.cos(half);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(1 + um.squash * 0.45, 1 - um.squash);

  // 开合因子：open=1 完全撑开，open=0 收拢成一束
  const o = open;
  const curR = R * o;
  const curEdgeR = edgeR * o;

  // 伞面薄膜（N 边形）
  ctx.beginPath();
  for (let i = 0; i <= RIB_N; i++) {
    const a = i * seg - half;
    const x = Math.cos(a) * curEdgeR;
    const y = Math.sin(a) * curEdgeR;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const film = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, curR);
  film.addColorStop(0, 'rgba(238, 238, 240, .22)');
  film.addColorStop(0.7, 'rgba(205, 205, 208, .28)');
  film.addColorStop(1, 'rgba(155, 155, 160, .38)');
  ctx.fillStyle = film;
  ctx.fill();

  // 伞面边缘
  ctx.strokeStyle = 'rgba(120, 120, 126, .45)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 伞骨
  ctx.strokeStyle = 'rgba(88, 88, 94, .55)';
  ctx.lineWidth = 1;
  for (let i = 0; i < RIB_N; i++) {
    const a = i * seg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * curR, Math.sin(a) * curR);
    ctx.stroke();
  }

  // 伞骨间细线（像 Yume 那种交叉感）
  ctx.strokeStyle = 'rgba(130, 130, 136, .25)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < RIB_N; i++) {
    const a1 = i * seg;
    const a2 = ((i + 2) % RIB_N) * seg;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a1) * curR * 0.5, Math.sin(a1) * curR * 0.5);
    ctx.lineTo(Math.cos(a2) * curR * 0.5, Math.sin(a2) * curR * 0.5);
    ctx.stroke();
  }

  // 中心枢纽
  ctx.fillStyle = 'rgba(52, 52, 54, .92)';
  ctx.beginPath(); ctx.arc(0, 0, 5 * o + 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(142, 142, 145, .8)';
  ctx.beginPath(); ctx.arc(0, 0, 2.5 * o + 1, 0, Math.PI * 2); ctx.fill();

  // 伞沿小珠
  for (let i = 0; i < RIB_N; i++) {
    const a = i * seg;
    const x = Math.cos(a) * curR;
    const y = Math.sin(a) * curR;
    ctx.fillStyle = 'rgba(118, 118, 122, .7)';
    ctx.beginPath(); ctx.arc(x, y, 2 * o, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of bokeh) {
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    bg.addColorStop(0, `rgba(255,255,255,${b.a})`);
    bg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  // 地面水雾
  const mg = ctx.createLinearGradient(0, GROUND() - 40, 0, H);
  mg.addColorStop(0, 'rgba(255,255,255,0)');
  mg.addColorStop(1, 'rgba(226,226,230,.65)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, GROUND() - 40, W, H - GROUND() + 40);
  ctx.strokeStyle = 'rgba(150,150,156,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND()); ctx.lineTo(W, GROUND()); ctx.stroke();

  for (const r of ripples) {
    ctx.strokeStyle = `rgba(148,148,154,${r.a})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.lineWidth = 1; ctx.lineCap = 'round';
  for (const p of drops) {
    const a = 0.18 + Math.min(0.18, p.vy / 4200);
    ctx.strokeStyle = `rgba(148,148,154,${a})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (p.vx || wind * 60) * 0.016, p.y - p.len);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(136,136,144,.55)';
  for (const g of drips) {
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x - g.vx * 0.012, g.y - 7);
    ctx.stroke();
  }
  for (const g of bigs) {
    const gr = ctx.createRadialGradient(g.x - 2, g.y - 3, 1, g.x, g.y, g.r);
    gr.addColorStop(0, 'rgba(255,255,255,.95)');
    gr.addColorStop(0.55, 'rgba(186,186,192,.5)');
    gr.addColorStop(1, 'rgba(150,150,158,.25)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
  }

  drawUmbrella();
}

function loop(ts) {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.033, (ts - lastT) / 1000 || 0.016);
  lastT = ts;
  step(dt);
  draw();
}

// ── 交互 ──
let down = null;
function onDown(e) {
  try { ensureAudio(); } catch (err) {}
  const r = cv.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  down = { x: e.clientX, y: e.clientY, moved: 0 };
  const dx = x - um.cx, dy = y - um.cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < um.R * 1.1) {
    um.grabbed = true;
    down.lastX = x;
  }
}
function onMove(e) {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down.moved += Math.abs(dx) + Math.abs(dy);
  down.x = e.clientX; down.y = e.clientY;
  if (um.grabbed) {
    const r = cv.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const rot = (nx - um.cx) * 0.004;
    um.vel = rot;
  } else {
    windTarget = Math.max(-2.2, Math.min(2.2, windTarget + dx * 0.02));
  }
}
function onUp(e) {
  if (!down) return;
  const tap = down.moved < 8;
  const wasGrabbed = um.grabbed;
  um.grabbed = false;
  if (wasGrabbed && !tap) { um.vel *= 0.5; return; }
  if (!tap || !e) return;
  const r = cv.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const dx = x - um.cx, dy = y - um.cy;
  const d = Math.sqrt(dx * dx + dy * dy);

  // 中心枢纽 → 开合
  if (d < 18) {
    um.openT = um.openT > 0.5 ? 0 : 1;
    return;
  }
  // 伞面 → 涟漪
  if (inCanopy(x, y)) {
    um.squashV += 1.2;
    knock();
    const ring = document.createElement('div');
    ring.className = 'tap-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    wrap.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
    return;
  }
  if (y < GROUND() - 30) {
    for (let i = 0; i < 5; i++) {
      bigs.push({
        x: x + (Math.random() - 0.5) * 46, y: y - 10 - i * 26,
        vy: 80, vx: (Math.random() - 0.5) * 40, r: 5 + Math.random() * 3,
      });
    }
  }
}
function onResize() {
  W = wrap.clientWidth || window.innerWidth;
  H = wrap.clientHeight || window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildBokeh();
  layout();
}

function buildBokeh() {
  bokeh = [];
  for (let i = 0; i < 10; i++) {
    bokeh.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 26 + Math.random() * 70,
      vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 5,
      a: 0.05 + Math.random() * 0.06, ph: Math.random() * 6,
    });
  }
}

function init(container, opts = {}) {
  wrap = container;
  wrap.innerHTML = '<canvas class="chime-bokeh" style="pointer-events:auto"></canvas>';
  cv = wrap.querySelector('canvas');
  ctx = cv.getContext('2d');

  entries = (opts.entries || []).map(el => ({ el, a: 0, angle: 0, vel: 0 }));

  onResize();

  cv.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', onResize);

  running = true;
  lastT = performance.now();
  raf = requestAnimationFrame(loop);
  return true;
}

function destroy() {
  running = false;
  cancelAnimationFrame(raf);
  if (cv) {
    cv.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('resize', onResize);
  }
  if (wrap) wrap.innerHTML = '';
  drops = []; drips = []; ripples = []; bigs = [];
  entries = [];
}

function gust() {
  windTarget += (Math.random() > 0.5 ? 1 : -1) * 1.8;
  um.vel += (Math.random() - 0.5) * 2;
  for (const e of entries) e.vel += (Math.random() - 0.5) * 2.4;
}
function poke(el) {
  const e = entries.find(x => x.el === el);
  if (e) { e.vel += (Math.random() > 0.5 ? 1 : -1) * 2.4; plink(0.5); }
}

window.Chime = {
  init, destroy, gust, poke,
  setMuted(v) { muted = v; if (noiseGain) noiseGain.gain.value = v ? 0 : 0.032; },
  isMuted() { return muted; },
};
})();
