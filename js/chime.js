/* ══════════════════════════════════════════════
   chime.js · 雨天（透明伞照片 + 伞沿挂牌）
   真实透明伞图片做单摆 · 入口挂牌挂伞沿
   雨滴落进伞面 → 伞沿滴落敲音
   ══════════════════════════════════════════════ */

(function() {
let cv, ctx, W = 0, H = 0, dpr = 1, wrap = null, imgEl = null;
let running = false, raf = null, lastT = 0, t = 0;
let drops = [], drips = [], ripples = [], bokeh = [], bigs = [];
let wind = 0, windTarget = 0;
let um;
let entries = [], handleTag = null;
let muted = false, actx = null, noiseGain = null, noteIdx = 0, cd = 0;

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.00];

// 挂牌锚点（伞图内的比例坐标：伞沿四个点 + 伞柄末端）
const ANCHORS = [
  { fx: 0.10, fy: 0.40, len: 26, off: -0.05 },
  { fx: 0.32, fy: 0.45, len: 36, off: 0.035 },
  { fx: 0.68, fy: 0.45, len: 36, off: -0.03 },
  { fx: 0.90, fy: 0.40, len: 26, off: 0.055 },
];
const HANDLE_ANCHOR = { fx: 0.5, fy: 0.90 };
const IMG_ASPECT = 0.777;   // 431/555 竖构图

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
// 敲伞声：低哑的咚咚（PVC 被手指敲）
function knock() {
  if (muted) return;
  try { ensureAudio(); } catch (e) { return; }
  const tt = actx.currentTime;
  const mk = (f, g, d) => {
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, tt);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, tt + d);
    gn.gain.setValueAtTime(g, tt);
    gn.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    o.connect(gn).connect(actx.destination);
    o.start(tt); o.stop(tt + d + 0.05);
  };
  mk(150, 0.22, 0.16);
  mk(82, 0.14, 0.28);
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

const GROUND = () => H * 0.8;

function spawnDrop(x) {
  return {
    x: x !== undefined ? x : Math.random() * (W + 120) - 60,
    y: -20 - Math.random() * 60,
    vy: 480 + Math.random() * 320, vx: 0,
    len: 13 + Math.random() * 16,
  };
}

function layout() {
  const h = Math.min(H * 0.52, (W * 0.92) / IMG_ASPECT);
  const w = h * IMG_ASPECT;
  um = {
    w, h,
    cx: W / 2, topY: H * 0.1,
    tcx: W / 2, ttopY: H * 0.1,
    angle: 0, vel: 0,
    squash: 0, squashV: 0,
    grabbed: false,
  };
  if (imgEl) {
    imgEl.style.width = w + 'px';
    imgEl.style.height = h + 'px';
  }
  layoutHangs();
}

// 伞图局部比例坐标 → 屏幕坐标（含摆角旋转，绕顶中心）
function imgPoint(fx, fy) {
  const a = um.angle;
  const lx = fx * um.w - um.w / 2;
  const ly = fy * um.h;
  const ca = Math.cos(a), sa = Math.sin(a);
  return {
    x: um.cx + lx * ca - ly * sa,
    y: um.topY + um.h * 0 + lx * sa + ly * ca,
  };
}

function layoutHangs() {
  entries.forEach((e, i) => {
    const c = ANCHORS[i] || ANCHORS[0];
    e.fx = c.fx; e.fy = c.fy; e.len = c.len; e.off = c.off || 0;
    e.angle = c.off || 0; e.vel = 0;
    e.el.style.setProperty('--len', c.len + 'px');
  });
  if (handleTag) {
    handleTag.fx = HANDLE_ANCHOR.fx; handleTag.fy = HANDLE_ANCHOR.fy;
    handleTag.len = 34;
    handleTag.angle = 0; handleTag.vel = 0;
    handleTag.el.style.setProperty('--len', '34px');
  }
}

function stepHangs(dt) {
  const g = 2600;
  const gustN = wind * 1.2;
  for (const e of entries) {
    // 平衡角 = 伞倾角传递 + 自身静息微偏（生动感）
    const eq = um.angle * 0.9 + e.off;
    const acc = -(g / e.len) * Math.sin(e.angle - eq) - 1.2 * e.vel + (gustN / e.len) * 0.4;
    e.vel += acc * dt;
    e.angle += e.vel * dt;
    const p = imgPoint(e.fx, e.fy);
    e.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${e.angle}rad)`;
  }
  if (handleTag) {
    const acc = -(g / handleTag.len) * Math.sin(handleTag.angle + um.angle) - 1.3 * handleTag.vel;
    handleTag.vel += acc * dt;
    handleTag.angle += handleTag.vel * dt;
    const p = imgPoint(handleTag.fx, handleTag.fy);
    handleTag.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${handleTag.angle}rad)`;
  }
}

function positionUmbrella() {
  const a = um.angle;
  const sq = um.squash;
  imgEl.style.transform =
    `translate(${um.cx - um.w / 2}px, ${um.topY}px) rotate(${a}rad) scale(${1 + sq * 0.45}, ${1 - sq})`;
}

function step(dt) {
  t += dt;
  wind += (windTarget - wind) * 0.04;
  windTarget *= Math.pow(0.3, dt);

  // 伞单摆（抓取时由指针驱动 tx）
  if (um.grabbed) {
    const acc = (um.tAngle - um.angle) * 120 - um.vel * 10;
    um.vel += acc * dt;
    um.angle += um.vel * dt;
  } else {
    const g = 2200, L = um.h * 0.9;
    const acc = -(g / L) * Math.sin(um.angle) - 1.4 * um.vel + (wind * 4 / L) * Math.sin(t * 0.9);
    um.vel += acc * dt;
    um.angle += um.vel * dt;
    um.angle = Math.max(-0.42, Math.min(0.42, um.angle));
    um.tcx += (W / 2 - um.tcx) * 0.2 * dt;
    um.topY += (H * 0.11 - um.topY) * 0.25 * dt;
  }
  // 戳伞回弹（弹簧）
  um.squashV += (-160 * um.squash - 11 * um.squashV) * dt;
  um.squash += um.squashV * dt;
  um.squash = Math.max(-0.05, Math.min(0.18, um.squash));
  um.cx += (um.tcx - um.cx) * Math.min(1, (um.grabbed ? 16 : 4) * dt);
  positionUmbrella();
  stepHangs(dt);

  // 雨滴
  const want = Math.floor(W / 6);
  while (drops.length < want) drops.push(spawnDrop());
  for (let i = drops.length - 1; i >= 0; i--) {
    const p = drops[i];
    p.vx = wind * 60;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // 落进伞面区域 → 变成伞沿滴水
    const ix = um.cx - um.w / 2, iy = um.topY;
    if (p.x > ix + um.w * 0.05 && p.x < ix + um.w * 0.95 &&
        p.y > iy + um.h * 0.14 && p.y < iy + um.h * 0.56 && Math.random() < 0.3) {
      // 找最近锚点
      let best = null, bd = 1e9;
      for (const e of entries) {
        const q = imgPoint(e.fx, e.fy);
        const d = Math.abs(q.x - p.x);
        if (d < bd) { bd = d; best = q; }
      }
      if (best) {
        // 找最近锚点对应的入口，雨滴会沿它的绳滑下、压一下牌
        let be = null, bd2 = 1e9;
        for (const e of entries) {
          const q = imgPoint(e.fx, e.fy);
          const dd = Math.abs(q.x - p.x);
          if (dd < bd2) { bd2 = dd; be = e; }
        }
        drips.push({ x: best.x, y: best.y, vy: 24, vx: 0, tag: be });
      }
      drops.splice(i, 1);
      continue;
    }
    if (p.y > GROUND()) {
      ripples.push({ x: p.x, y: GROUND(), r: 2, a: 0.35 });
      drops.splice(i, 1);
    }
  }

  // 滴水
  for (let i = drips.length - 1; i >= 0; i--) {
    const g = drips[i];
    g.vy += 1500 * dt;
    g.x += g.vx * dt + wind * 30 * dt;
    g.y += g.vy * dt;
    // 雨滴滑到牌顶 → 把牌压得一晃
    if (g.tag && !g.hit) {
      const q = imgPoint(g.tag.fx, g.tag.fy);
      if (g.y > q.y + g.tag.len - 4) {
        g.hit = true;
        g.tag.vel += 0.9;
        if (Math.random() < 0.5) plink(0.35);
      }
    }
    if (g.y > GROUND()) {
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

function draw() {
  ctx.clearRect(0, 0, W, H);

  // 伞后柔光衬底：白色伞在白底上的轮廓救星
  if (typeof ctx.filter === 'string') ctx.filter = 'blur(22px)';
  ctx.fillStyle = 'rgba(206, 216, 229, .55)';
  ctx.beginPath();
  ctx.ellipse(um.cx, um.topY + um.h * 0.42, um.w * 0.78, um.h * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  if (typeof ctx.filter === 'string') ctx.filter = 'none';

  for (const b of bokeh) {
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    bg.addColorStop(0, `rgba(255,255,255,${b.a})`);
    bg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  // 挂绳：屏顶 → 伞顶中心（考虑摆角）
  const tip = imgPoint(0.5, 0.02);
  ctx.strokeStyle = 'rgba(60,60,66,.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tip.x, 0);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  // 锚点系绳小珠
  for (const e of entries) {
    const q = imgPoint(e.fx, e.fy);
    ctx.fillStyle = 'rgba(96,88,72,.85)';
    ctx.beginPath(); ctx.arc(q.x, q.y, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.arc(q.x - 0.7, q.y - 0.7, 0.8, 0, Math.PI * 2); ctx.fill();
  }
  if (handleTag) {
    const q = imgPoint(handleTag.fx, handleTag.fy);
    ctx.fillStyle = 'rgba(96,88,72,.85)';
    ctx.beginPath(); ctx.arc(q.x, q.y, 2.3, 0, Math.PI * 2); ctx.fill();
  }

  // 地面水雾
  const mg = ctx.createLinearGradient(0, GROUND() - 40, 0, H);
  mg.addColorStop(0, 'rgba(255,255,255,0)');
  mg.addColorStop(1, 'rgba(226,232,240,.65)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, GROUND() - 40, W, H - GROUND() + 40);
  ctx.strokeStyle = 'rgba(150,166,188,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND()); ctx.lineTo(W, GROUND()); ctx.stroke();

  for (const r of ripples) {
    ctx.strokeStyle = `rgba(148,168,194,${r.a})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 雨丝
  ctx.lineWidth = 1; ctx.lineCap = 'round';
  for (const p of drops) {
    const a = 0.18 + Math.min(0.18, p.vy / 4200);
    ctx.strokeStyle = `rgba(148,166,190,${a})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (p.vx || wind * 60) * 0.016, p.y - p.len);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(136,156,186,.55)';
  for (const g of drips) {
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x - g.vx * 0.012, g.y - 7);
    ctx.stroke();
  }
  for (const g of bigs) {
    const gr = ctx.createRadialGradient(g.x - 2, g.y - 3, 1, g.x, g.y, g.r);
    gr.addColorStop(0, 'rgba(255,255,255,.95)');
    gr.addColorStop(0.55, 'rgba(186,206,230,.5)');
    gr.addColorStop(1, 'rgba(150,175,205,.25)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
  }
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
  // 伞图区域（轴对齐包围盒）
  const ix = um.cx - um.w / 2;
  if (x > ix - 10 && x < ix + um.w + 10 && y > um.topY - 10 && y < um.topY + um.h + 10) {
    um.grabbed = true;
    down.offX = x - um.cx;
    down.offY = y - um.topY;
  }
}
function onMove(e) {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down.moved += Math.abs(dx) + Math.abs(dy);
  down.x = e.clientX; down.y = e.clientY;
  if (um.grabbed) {
    const r = cv.getBoundingClientRect();
    um.tcx = e.clientX - r.left - down.offX;
    // 目标摆角：相对屏中心的偏移角
    const nx = (um.tcx - W / 2) / (W / 2);
    um.tAngle = Math.max(-0.4, Math.min(0.4, nx * 0.5));
    um.ttopY = Math.max(H * 0.08, Math.min(H * 0.4, e.clientY - r.top - down.offY));
  } else {
    windTarget = Math.max(-2.2, Math.min(2.2, windTarget + dx * 0.02));
  }
}
function onUp(e) {
  if (!down) return;
  const tap = down.moved < 8;
  down = null;
  if (um.grabbed) { um.grabbed = false; return; }
  if (!tap || !e) return;
  const r = cv.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;

  // 是否点中伞（逆旋转求局部比例坐标）
  const ca = Math.cos(um.angle), sa = Math.sin(um.angle);
  const dxs = x - um.cx, dys = y - um.topY;
  const lx = dxs * ca + dys * sa;
  const ly = -dxs * sa + dys * ca;
  const fx = (lx + um.w / 2) / um.w, fy = ly / um.h;

  if (fx > 0 && fx < 1 && fy > 0.04 && fy < 0.66) {
    // 戳伞面：凹陷回弹 + 敲伞声 + 涟漪圈
    um.squashV += 1.6;
    knock();
    const ring = document.createElement('div');
    ring.className = 'tap-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    wrap.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
    return;
  }
  if (fx > 0 && fx < 1 && fy >= 0.66) {
    // 拨伞柄：纸签晃动 + 轻音
    if (handleTag) handleTag.vel += (Math.random() - 0.5) * 4;
    plink(0.5);
    return;
  }
  // 点画天空：一串大雨滴
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
  wrap.innerHTML = `
    <canvas class="chime-bokeh" style="pointer-events:auto"></canvas>
    <img class="um-img" src="assets/umbrella.png" alt="" draggable="false">
  `;
  cv = wrap.querySelector('canvas');
  ctx = cv.getContext('2d');
  imgEl = wrap.querySelector('.um-img');

  entries = (opts.entries || []).map((el, i) => ({ el, fx: 0, fy: 0, len: 60, angle: 0, vel: 0 }));
  handleTag = opts.handleTag ? { el: opts.handleTag, fx: 0, fy: 0, len: 46, angle: 0, vel: 0 } : null;

  onResize();
  if (!imgEl.complete) imgEl.onload = () => { positionUmbrella(); };

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
  entries = []; handleTag = null;
}

function gust() {
  windTarget += (Math.random() > 0.5 ? 1 : -1) * 1.8;
  um.vel += (Math.random() - 0.5) * 2;
  for (const e of entries) e.vel += (Math.random() - 0.5) * 2.4;
  if (handleTag) handleTag.vel += (Math.random() - 0.5) * 2;
}

function poke(el) {
  const e = entries.find(x => x.el === el);
  if (e) { e.vel += (Math.random() > 0.5 ? 1 : -1) * 2.4; plink(0.5); }
  if (handleTag && el === handleTag.el) handleTag.vel += (Math.random() - 0.5) * 3;
}

window.Chime = {
  init, destroy, gust, poke,
  setMuted(v) { muted = v; if (noiseGain) noiseGain.gain.value = v ? 0 : 0.032; },
  isMuted() { return muted; },
};
})();
