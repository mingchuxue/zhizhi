(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cv = $('#cv'), cx = cv.getContext('2d'), gcv = $('#gcv'), gx = gcv.getContext('2d');
let W = 0, H = 0, GW = 0, GH = 0, DPR = 1;
const C = { ink: '#1d2b3a', ink2: '#4d5b69', ink3: '#8a96a2', grid: '#edf0ea', grid2: '#dfe3dc', red: '#e8573f', blue: '#2f6fd6', green: '#1f9a6e', amber: '#e3a21a', violet: '#7a5ad8' };
const PAL = [C.red, C.blue, C.green, C.amber, C.violet];
const f2 = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
const deg = Math.PI / 180;
function size() {
  DPR = Math.min(2, devicePixelRatio || 1);
  const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = gcv.getBoundingClientRect(); GW = g.width; GH = g.height; gcv.width = GW * DPR; gcv.height = GH * DPR; gx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cur && cur.resize && cur.resize();
}
/* ---------- helpers ---------- */
function arrow(x1, y1, x2, y2, col, w = 2, head = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
  cx.strokeStyle = col; cx.fillStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2 - Math.cos(a) * head * .6, y2 - Math.sin(a) * head * .6); cx.stroke();
  cx.beginPath(); cx.moveTo(x2, y2); cx.lineTo(x2 - head * Math.cos(a - .4), y2 - head * Math.sin(a - .4)); cx.lineTo(x2 - head * Math.cos(a + .4), y2 - head * Math.sin(a + .4)); cx.closePath(); cx.fill();
}
function gridPaper(step = 24) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.strokeStyle = C.grid; cx.lineWidth = 1; cx.beginPath(); for (let x = .5; x < W; x += step) { cx.moveTo(x, 0); cx.lineTo(x, H); } for (let y = .5; y < H; y += step) { cx.moveTo(0, y); cx.lineTo(W, y); } cx.stroke(); }
function text(t, x, y, col = C.ink2, size = 12, align = 'left', font = 'var(--mono)') { cx.fillStyle = col; cx.font = `${size}px ui-monospace, Menlo, Consolas, monospace`; cx.textAlign = align; cx.fillText(t, x, y); }
function label(t, x, y, col = C.ink2, size = 13, align = 'left') { cx.fillStyle = col; cx.font = `${size}px -apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`; cx.textAlign = align; cx.fillText(t, x, y); }
const series = { keys: [], data: [], max: 600 };
function graphReset(keys) { series.keys = keys; series.data = []; $('#graphWrap').hidden = !keys.length; }
function graphPush(t, vals) { series.data.push([t, ...vals]); if (series.data.length > series.max) series.data.shift(); }
function drawGraph() {
  if (!series.keys.length || !GW) return;
  gx.fillStyle = '#fff'; gx.fillRect(0, 0, GW, GH);
  const d = series.data, pl = 46, pr = 12, pt = 12, pb = 22;
  let lo = Infinity, hi = -Infinity; for (const r of d) for (let i = 1; i < r.length; i++) { lo = Math.min(lo, r[i]); hi = Math.max(hi, r[i]); }
  if (!isFinite(lo)) { lo = -1; hi = 1; } if (hi - lo < 1e-6) { hi += 1; lo -= 1; } const pad = (hi - lo) * .1; lo -= pad; hi += pad;
  const t0 = d.length ? d[0][0] : 0, t1 = d.length ? Math.max(d[d.length - 1][0], t0 + 1) : 1;
  const X = t => pl + (t - t0) / (t1 - t0) * (GW - pl - pr), Y = v => pt + (hi - v) / (hi - lo) * (GH - pt - pb);
  gx.strokeStyle = C.grid2; gx.lineWidth = 1; gx.beginPath(); gx.moveTo(pl, pt); gx.lineTo(pl, GH - pb); gx.lineTo(GW - pr, GH - pb); gx.stroke();
  if (lo < 0 && hi > 0) { gx.setLineDash([4, 4]); gx.beginPath(); gx.moveTo(pl, Y(0)); gx.lineTo(GW - pr, Y(0)); gx.stroke(); gx.setLineDash([]); }
  gx.font = '11px ui-monospace, Menlo, Consolas, monospace'; gx.fillStyle = C.ink3; gx.textAlign = 'right'; gx.fillText(f2(hi, 1), pl - 6, pt + 9); gx.fillText(f2(lo, 1), pl - 6, GH - pb); gx.textAlign = 'left'; gx.fillText(`t = ${f2(t0, 1)} s`, pl, GH - 6); gx.textAlign = 'right'; gx.fillText(`${f2(t1, 1)} s`, GW - pr, GH - 6);
  series.keys.forEach((k, i) => {
    gx.strokeStyle = k.c; gx.lineWidth = 2; gx.beginPath(); d.forEach((r, j) => { const x = X(r[0]), y = Y(r[i + 1]); j ? gx.lineTo(x, y) : gx.moveTo(x, y); }); gx.stroke();
    gx.fillStyle = k.c; gx.textAlign = 'left'; gx.fillText('● ' + k.n, pl + 10 + i * 110, pt + 10);
  });
}
function reads(list) { $('#reads').innerHTML = list.map(([k, v, w]) => `<div class="rd ${w ? 'w' : ''}"><span>${k}</span><b>${v}</b></div>`).join(''); }
const hud = t => { $('#hud').innerHTML = t || ''; };

/* ---------- experiments ---------- */
const EXPS = {};

EXPS.throw = {
  n: '抛体运动', d: '调节初速度、抛射角和高度，观察平抛与斜抛的轨迹；打开空气阻力看看射程如何变短。',
  P: [{ k: 'v0', n: '初速度 v₀', min: 1, max: 40, step: .5, v: 20, u: 'm/s' }, { k: 'ang', n: '抛射角 θ', min: 0, max: 90, step: 1, v: 45, u: '°' }, { k: 'h0', n: '抛出高度 h', min: 0, max: 40, step: 1, v: 0, u: 'm' }, { k: 'g', n: '重力加速度 g', min: 1.6, max: 24.8, step: .1, v: 9.8, u: 'm/s²' }, { k: 'k', n: '空气阻力系数 k', min: 0, max: .1, step: .002, v: 0, u: '1/m' }],
  acts: [['launch', '发射', 'pri'], ['clear', '清除轨迹']],
  note: `<p>不计阻力时，水平方向匀速、竖直方向匀加速：</p><p class="f">x = v₀cosθ·t，y = h + v₀sinθ·t − ½gt²</p><p>从地面抛出时，射程 <span class="f">R = v₀²sin2θ / g</span>，θ = 45° 时最远；最大高度 <span class="f">H = v₀²sin²θ / 2g</span>。</p><p>阻力按 <span class="f">f = k·m·v²</span> 处理，方向与速度相反。</p>`,
  init(p) { this.tr = []; this.ball = null; this.fit(p); this.launch(p); },
  theory(p) { const vy = p.v0 * Math.sin(p.ang * deg), vx = p.v0 * Math.cos(p.ang * deg); const T = (vy + Math.sqrt(vy * vy + 2 * p.g * p.h0)) / p.g; return { T, R: vx * T, H: p.h0 + vy * vy / (2 * p.g) }; },
  fit(p) { const th = this.theory(Object.assign({}, p, { ang: Math.min(p.ang, 89) })); const tmax = this.theory(Object.assign({}, p, { ang: 45 })); const wx = Math.max(th.R, 5) * 1.12, wy = Math.max(th.H, p.h0, 3) * 1.25; const sx = (W - 80) / wx, sy = (H - 60) / wy; this.s = Math.min(sx, sy); this.ox = 50; this.oy = H - 34; },
  onParam(p, k) { if (!this.ball || this.ball.done) { this.fit(p); } },
  launch(p) { const a = p.ang * deg; this.ball = { x: 0, y: p.h0, vx: p.v0 * Math.cos(a), vy: p.v0 * Math.sin(a), t: 0, pts: [[0, p.h0]], ymax: p.h0, c: PAL[this.tr.length % PAL.length], done: false, p: Object.assign({}, p) }; this.tr.push(this.ball); if (this.tr.length > 6) this.tr.shift(); graphReset([{ n: 'vx (m/s)', c: C.blue }, { n: 'vy (m/s)', c: C.red }]); },
  act(a, p) { if (a === 'launch') { this.fit(p); this.launch(p); } if (a === 'clear') { this.tr = this.ball && !this.ball.done ? [this.ball] : []; } },
  step(dt, p) {
    const b = this.ball; if (!b || b.done) return;
    const k = b.p.k, g = b.p.g;
    const acc = (vx, vy) => { const v = Math.hypot(vx, vy); return [-k * v * vx, -g - k * v * vy]; };
    const [ax1, ay1] = acc(b.vx, b.vy); const mx = b.vx + ax1 * dt / 2, my = b.vy + ay1 * dt / 2; const [ax2, ay2] = acc(mx, my);
    const nx = b.x + mx * dt, ny = b.y + my * dt; b.vx += ax2 * dt; b.vy += ay2 * dt;
    if (ny <= 0 && b.t > 0) { const f = b.y / (b.y - ny); b.x += (nx - b.x) * f; b.t += dt * f; b.y = 0; b.done = true; b.pts.push([b.x, 0]); return; }
    b.x = nx; b.y = ny; b.t += dt; b.ymax = Math.max(b.ymax, b.y);
    if (b.pts.length < 4000 && (b.t * 60 | 0) !== ((b.t - dt) * 60 | 0)) { b.pts.push([b.x, b.y]); graphPush(b.t, [b.vx, b.vy]); }
  },
  draw(p) {
    gridPaper(); const s = this.s, X = x => this.ox + x * s, Y = y => this.oy - y * s;
    // axes ticks
    const stepM = [1, 2, 5, 10, 20, 50, 100, 200].find(m => m * s > 60) || 500;
    cx.strokeStyle = C.grid2; cx.lineWidth = 1; for (let m = 0; X(m) < W; m += stepM) { text(String(m), X(m), this.oy + 16, C.ink3, 10, 'center'); cx.beginPath(); cx.moveTo(X(m), this.oy); cx.lineTo(X(m), this.oy + 4); cx.stroke(); }
    for (let m = stepM; Y(m) > 10; m += stepM) text(String(m), this.ox - 8, Y(m) + 3, C.ink3, 10, 'right');
    label('x / m', W - 12, this.oy + 16, C.ink3, 11, 'right'); label('y / m', this.ox + 6, 16, C.ink3, 11);
    cx.fillStyle = '#e9e4d6'; cx.fillRect(0, this.oy, W, H - this.oy); cx.strokeStyle = C.ink; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(0, this.oy); cx.lineTo(W, this.oy); cx.moveTo(this.ox, this.oy); cx.lineTo(this.ox, 6); cx.stroke();
    if (p.h0 > 0) { cx.fillStyle = '#d9d2bf'; cx.fillRect(this.ox - 26, Y(p.h0), 26, p.h0 * s); }
    // launcher
    const a = p.ang * deg; cx.save(); cx.translate(X(0), Y(p.h0)); cx.rotate(-a); cx.fillStyle = C.ink; cx.fillRect(-4, -5, 30, 10); cx.restore(); cx.fillStyle = C.ink; cx.beginPath(); cx.arc(X(0), Y(p.h0), 7, 0, 7); cx.fill();
    // theory dashed (no drag)
    if (p.k === 0 || true) { const th = this.theory(p); cx.setLineDash([5, 5]); cx.strokeStyle = 'rgba(29,43,58,.25)'; cx.lineWidth = 1.2; cx.beginPath(); for (let i = 0; i <= 60; i++) { const t = th.T * i / 60; const x = p.v0 * Math.cos(a) * t, y = p.h0 + p.v0 * Math.sin(a) * t - .5 * p.g * t * t; i ? cx.lineTo(X(x), Y(y)) : cx.moveTo(X(x), Y(y)); } cx.stroke(); cx.setLineDash([]); }
    for (const b of this.tr) {
      cx.strokeStyle = b.c; cx.lineWidth = 2.5; cx.beginPath(); b.pts.forEach(([x, y], i) => i ? cx.lineTo(X(x), Y(y)) : cx.moveTo(X(x), Y(y))); if (!b.done) cx.lineTo(X(b.x), Y(b.y)); cx.stroke();
      if (b.done) { cx.fillStyle = b.c; cx.beginPath(); cx.arc(X(b.x), Y(0), 4, 0, 7); cx.fill(); text(`${f2(b.x, 1)} m`, X(b.x), Y(0) - 10, b.c, 11, 'center'); }
    }
    const b = this.ball;
    if (b) {
      const bx = X(b.x), by = Y(b.y), vs = 3;
      if (!b.done) { arrow(bx, by, bx + b.vx * vs, by, C.blue, 1.6, 7); arrow(bx, by, bx, by - b.vy * vs, C.red, 1.6, 7); arrow(bx, by, bx + b.vx * vs, by - b.vy * vs, C.ink, 2, 8); }
      cx.fillStyle = b.c; cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(bx, by, 8, 0, 7); cx.fill(); cx.stroke();
      // apex marker
      if (b.ymax > b.p.h0 + .05) { const ap = b.pts.reduce((m, q) => q[1] > m[1] ? q : m, b.pts[0]); cx.setLineDash([3, 4]); cx.strokeStyle = b.c; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(X(ap[0]), Y(ap[1])); cx.lineTo(X(ap[0]), this.oy); cx.stroke(); cx.setLineDash([]); text(`H=${f2(b.ymax, 1)}`, X(ap[0]) + 6, Y(ap[1]) - 6, b.c, 11); }
    }
    hud(b ? `t = ${f2(b.t)} s　x = ${f2(b.x)} m　y = ${f2(b.y)} m<br>v = ${f2(Math.hypot(b.vx, b.vy))} m/s　vx = ${f2(b.vx)}　vy = ${f2(b.vy)}` : '');
    const th = this.theory(p);
    reads([['理论飞行时间', `${f2(th.T)} s`], ['理论射程', `${f2(th.R)} m`], ['理论最大高度', `${f2(th.H)} m`], ['实测射程', b && b.done ? `${f2(b.x)} m` : '—'], ['实测飞行时间', b && b.done ? `${f2(b.t)} s` : '—'], ['实测最大高度', b ? `${f2(b.ymax)} m` : '—'], ['说明', p.k > 0 ? '有阻力时实测会小于理论值' : '虚线为不计阻力的理论轨迹', 1]]);
  }
};

EXPS.pend = {
  n: '单摆', d: '拖动摆球设定初始角度。比较小角度近似周期与实测周期，感受“等时性”在大角度时如何失效。',
  P: [{ k: 'L', n: '摆长 L', min: .2, max: 3, step: .05, v: 1, u: 'm' }, { k: 'th', n: '初始摆角 θ₀', min: 1, max: 85, step: 1, v: 15, u: '°' }, { k: 'g', n: '重力加速度 g', min: 1.6, max: 24.8, step: .1, v: 9.8, u: 'm/s²' }, { k: 'c', n: '阻尼系数', min: 0, max: .6, step: .01, v: 0, u: '1/s' }],
  acts: [['reset', '重新释放', 'pri']],
  note: `<p>小角度时单摆近似做简谐运动，周期只与摆长和重力加速度有关：</p><p class="f">T = 2π√(L / g)</p><p>摆角变大后周期会变长，例如 θ₀ = 60° 时约长 7%。实测周期取自相邻两次同向经过最低点的时间间隔。</p>`,
  init(p) { this.th = p.th * deg; this.w = 0; this.t = 0; this.cross = []; this.T = null; this.trail = []; graphReset([{ n: 'θ (°)', c: C.red }, { n: 'ω (rad/s)', c: C.blue }]); },
  onParam(p, k) { this.init(p); },
  act(a, p) { this.init(p); },
  geo(p) { const s = Math.min((H - 80) / 3.2, (W - 60) / 6.4); return { s, px: W / 2, py: 40 }; },
  step(dt, p) {
    if (this.drag) return;
    const f = (th, w) => -(p.g / p.L) * Math.sin(th) - p.c * w;
    const k1t = this.w, k1w = f(this.th, this.w), k2t = this.w + k1w * dt / 2, k2w = f(this.th + k1t * dt / 2, this.w + k1w * dt / 2), k3t = this.w + k2w * dt / 2, k3w = f(this.th + k2t * dt / 2, this.w + k2w * dt / 2), k4t = this.w + k3w * dt, k4w = f(this.th + k3t * dt, this.w + k3w * dt);
    const pth = this.th;
    this.th += dt / 6 * (k1t + 2 * k2t + 2 * k3t + k4t); this.w += dt / 6 * (k1w + 2 * k2w + 2 * k3w + k4w); this.t += dt;
    if (pth < 0 && this.th >= 0) { const tc = this.t - dt * this.th / (this.th - pth); this.cross.push(tc); if (this.cross.length > 1) this.T = this.cross[this.cross.length - 1] - this.cross[this.cross.length - 2]; }
    if ((this.t * 60 | 0) !== ((this.t - dt) * 60 | 0)) graphPush(this.t, [this.th / deg, this.w]);
  },
  draw(p) {
    gridPaper(); const { s, px, py } = this.geo(p); const L = p.L * s;
    const bx = px + L * Math.sin(this.th), by = py + L * Math.cos(this.th);
    this.trail.push([bx, by]); if (this.trail.length > 90) this.trail.shift();
    cx.fillStyle = C.ink; cx.fillRect(px - 60, py - 8, 120, 8);
    cx.setLineDash([4, 5]); cx.strokeStyle = C.grid2; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px, py + L + 30); cx.stroke(); cx.setLineDash([]);
    cx.strokeStyle = 'rgba(232,87,63,.15)'; cx.lineWidth = 1; cx.beginPath(); cx.arc(px, py, L, Math.PI / 2 - p.th * deg, Math.PI / 2 + p.th * deg); cx.stroke();
    this.trail.forEach(([x, y], i) => { cx.fillStyle = `rgba(232,87,63,${i / this.trail.length * .35})`; cx.beginPath(); cx.arc(x, y, 3, 0, 7); cx.fill(); });
    cx.strokeStyle = C.ink; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(bx, by); cx.stroke();
    // angle arc
    cx.strokeStyle = C.blue; cx.lineWidth = 1.5; cx.beginPath(); const r = Math.min(46, L * .3); if (this.th >= 0) cx.arc(px, py, r, Math.PI / 2 - this.th, Math.PI / 2); else cx.arc(px, py, r, Math.PI / 2, Math.PI / 2 - this.th); cx.stroke();
    text(`${f2(this.th / deg, 1)}°`, px + (this.th >= 0 ? 8 : -8), py + r + 16, C.blue, 12, this.th >= 0 ? 'left' : 'right');
    // gravity + tension arrows
    const m = 26; arrow(bx, by, bx, by + m * 1.4, C.green, 1.6, 7); label('mg', bx + 6, by + m * 1.4, C.green, 12);
    const rb = 12 + Math.cbrt(1) * 4; const g = cx.createRadialGradient(bx - 4, by - 4, 2, bx, by, rb); g.addColorStop(0, '#ff9b86'); g.addColorStop(1, C.red); cx.fillStyle = g; cx.beginPath(); cx.arc(bx, by, rb, 0, 7); cx.fill();
    const T0 = 2 * Math.PI * Math.sqrt(p.L / p.g), a0 = p.th * deg, Tl = T0 * (1 + a0 * a0 / 16 + 11 * a0 ** 4 / 3072);
    hud(`t = ${f2(this.t)} s　θ = ${f2(this.th / deg, 1)}°　ω = ${f2(this.w)} rad/s`);
    reads([['小角度周期 2π√(L/g)', `${f2(T0, 3)} s`], ['考虑大角度修正', `${f2(Tl, 3)} s`], ['实测周期', this.T ? `${f2(this.T, 3)} s` : '测量中…'], ['偏差', this.T ? `${f2((this.T / T0 - 1) * 100, 1)} %` : '—'], ['最低点速度', `${f2(Math.sqrt(2 * p.g * p.L * (1 - Math.cos(a0))))} m/s`, 1]]);
  },
  down(x, y, p) { const { s, px, py } = this.geo(p); const L = p.L * s; const bx = px + L * Math.sin(this.th), by = py + L * Math.cos(this.th); if (Math.hypot(x - bx, y - by) < 30) { this.drag = true; return true; } },
  move(x, y, p) { if (!this.drag) return; const { px, py } = this.geo(p); let a = Math.atan2(x - px, y - py); a = Math.max(-85 * deg, Math.min(85 * deg, a)); this.th = a; this.w = 0; },
  up(p) { if (!this.drag) return; this.drag = false; const v = Math.round(Math.abs(this.th) / deg); setParam('th', Math.max(1, v)); const sgn = this.th < 0 ? -1 : 1; this.init(P_()); this.th = sgn * Math.max(1, v) * deg; }
};

EXPS.spring = {
  n: '弹簧振子', d: '水平光滑面上的弹簧振子。拖动木块改变振幅，观察动能与弹性势能的相互转化。',
  P: [{ k: 'm', n: '质量 m', min: .1, max: 5, step: .1, v: 1, u: 'kg' }, { k: 'k', n: '劲度系数 k', min: 2, max: 100, step: 1, v: 20, u: 'N/m' }, { k: 'A', n: '振幅 A', min: .05, max: .5, step: .01, v: .3, u: 'm' }, { k: 'b', n: '阻尼 b', min: 0, max: 3, step: .05, v: 0, u: 'kg/s' }],
  acts: [['reset', '重新释放', 'pri']],
  note: `<p>回复力 <span class="f">F = −kx</span>，振子做简谐运动：</p><p class="f">T = 2π√(m / k)</p><p>机械能 <span class="f">E = ½kA²</span> 在动能 <span class="f">½mv²</span> 与弹性势能 <span class="f">½kx²</span> 之间来回转换；有阻尼时总能量逐渐减少。</p>`,
  init(p) { this.x = p.A; this.v = 0; this.t = 0; graphReset([{ n: 'x (m)', c: C.red }, { n: 'v (m/s)', c: C.blue }]); },
  onParam(p) { this.init(p); }, act(a, p) { this.init(p); },
  geo() { const narrow = W < 640; const s = Math.min((W - (narrow ? 70 : 260)) / 1.3, 600); return { s, wx: 40, ex: 40 + .75 * s, gy: H * (narrow ? .7 : .55), narrow }; },
  step(dt, p) { if (this.drag) return; const a = (x, v) => (-p.k * x - p.b * v) / p.m; const k1v = a(this.x, this.v), k1x = this.v; const k2v = a(this.x + k1x * dt / 2, this.v + k1v * dt / 2), k2x = this.v + k1v * dt / 2; const k3v = a(this.x + k2x * dt / 2, this.v + k2v * dt / 2), k3x = this.v + k2v * dt / 2; const k4v = a(this.x + k3x * dt, this.v + k3v * dt), k4x = this.v + k3v * dt; this.x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); this.v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); this.t += dt; if ((this.t * 60 | 0) !== ((this.t - dt) * 60 | 0)) graphPush(this.t, [this.x, this.v]); },
  draw(p) {
    gridPaper(); const { s, wx, ex, gy } = this.geo(); const bw = 40 + Math.cbrt(p.m) * 26, bh = bw * .8;
    const bx = ex + this.x * s;
    cx.fillStyle = '#e9e4d6'; cx.fillRect(0, gy, W, 14); cx.fillStyle = C.ink; cx.fillRect(wx - 16, gy - 120, 16, 134);
    for (let i = 0; i < 8; i++) { cx.strokeStyle = C.ink3; cx.beginPath(); cx.moveTo(wx - 16, gy - 120 + i * 16); cx.lineTo(wx - 28, gy - 108 + i * 16); cx.stroke(); }
    // spring
    const sx = wx, exs = bx - bw / 2, sy = gy - bh / 2, n = 14; cx.strokeStyle = C.ink2; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx, sy); const seg = (exs - sx) / (n + 2); cx.lineTo(sx + seg, sy); for (let i = 0; i < n; i++) cx.lineTo(sx + seg * (i + 1.5), sy + (i % 2 ? 12 : -12)); cx.lineTo(exs - seg, sy); cx.lineTo(exs, sy); cx.stroke();
    // equilibrium & amplitude marks
    cx.setLineDash([4, 5]); cx.strokeStyle = C.grid2; cx.lineWidth = 1; for (const xx of [0, -p.A, p.A]) { cx.beginPath(); cx.moveTo(ex + xx * s, gy - bh - 30); cx.lineTo(ex + xx * s, gy + 20); cx.stroke(); } cx.setLineDash([]);
    label('O', ex, gy + 34, C.ink3, 12, 'center'); label('−A', ex - p.A * s, gy + 34, C.ink3, 12, 'center'); label('+A', ex + p.A * s, gy + 34, C.ink3, 12, 'center');
    cx.fillStyle = C.blue; cx.beginPath(); cx.roundRect ? cx.roundRect(bx - bw / 2, gy - bh, bw, bh, 6) : cx.rect(bx - bw / 2, gy - bh, bw, bh); cx.fill(); label(`${p.m} kg`, bx, gy - bh / 2 + 5, '#fff', 13, 'center');
    const F = -p.k * this.x; arrow(bx, gy - bh - 14, bx + F * s * .02, gy - bh - 14, C.red, 2, 8); if (Math.abs(F) > .05) label(`F=${f2(F, 1)} N`, bx + F * s * .01, gy - bh - 22, C.red, 11, 'center');
    // energy bars
    const nar = this.geo().narrow, Ek = .5 * p.m * this.v ** 2, Ep = .5 * p.k * this.x ** 2, E0 = .5 * p.k * p.A ** 2, bx0 = W - (nar ? 120 : 150), bt = nar ? 64 : 40, bhh = H * (nar ? .22 : .38);
    [['动能', Ek, C.blue], ['势能', Ep, C.red], ['总能', Ek + Ep, C.green]].forEach(([n, v, c], i) => { const x = bx0 + i * (nar ? 38 : 44); cx.fillStyle = '#f1f2ee'; cx.fillRect(x, bt, 28, bhh); const h = Math.min(1, v / (E0 || 1)) * bhh; cx.fillStyle = c; cx.fillRect(x, bt + bhh - h, 28, h); label(n, x + 14, bt + bhh + 18, C.ink2, 12, 'center'); });
    text(`${f2(E0, 3)} J`, bx0 - 6, bt + 10, C.ink3, 10, 'right');
    hud(`t = ${f2(this.t)} s　x = ${f2(this.x, 3)} m　v = ${f2(this.v, 3)} m/s`);
    reads([['周期 T = 2π√(m/k)', `${f2(2 * Math.PI * Math.sqrt(p.m / p.k), 3)} s`], ['最大速度 A√(k/m)', `${f2(p.A * Math.sqrt(p.k / p.m), 3)} m/s`], ['动能', `${f2(Ek, 3)} J`], ['弹性势能', `${f2(Ep, 3)} J`], ['机械能', `${f2(Ek + Ep, 3)} J`], ['初始机械能', `${f2(E0, 3)} J`]]);
  },
  down(x, y, p) { const { s, ex, gy } = this.geo(); const bx = ex + this.x * s; if (Math.abs(x - bx) < 50 && y > gy - 120 && y < gy + 10) { this.drag = true; return true; } },
  move(x, y, p) { if (!this.drag) return; const { s, ex } = this.geo(); this.x = Math.max(-.5, Math.min(.5, (x - ex) / s)); this.v = 0; },
  up(p) { if (!this.drag) return; this.drag = false; const A = Math.max(.05, Math.min(.5, Math.abs(this.x))); setParam('A', +A.toFixed(2)); const sg = this.x < 0 ? -1 : 1; this.init(P_()); this.x = sg * A; }
};

EXPS.coll = {
  n: '一维碰撞', d: '两个滑块在光滑轨道上相碰。改变质量、速度和恢复系数，验证动量守恒，看看动能损失了多少。',
  P: [{ k: 'm1', n: '质量 m₁', min: .5, max: 5, step: .1, v: 1, u: 'kg' }, { k: 'm2', n: '质量 m₂', min: .5, max: 5, step: .1, v: 2, u: 'kg' }, { k: 'v1', n: '速度 v₁', min: -4, max: 6, step: .1, v: 3, u: 'm/s' }, { k: 'v2', n: '速度 v₂', min: -6, max: 4, step: .1, v: -1, u: 'm/s' }, { k: 'e', n: '恢复系数 e', min: 0, max: 1, step: .05, v: 1, u: '', opts: [[1, '弹性'], [.5, '一般'], [0, '完全非弹性']] }],
  acts: [['reset', '重新开始', 'pri']],
  note: `<p>碰撞前后系统动量守恒：</p><p class="f">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</p><p>恢复系数 <span class="f">e = (v₂′ − v₁′)/(v₁ − v₂)</span>：e = 1 为弹性碰撞，动能不损失；e = 0 为完全非弹性碰撞，碰后共速，动能损失最多。</p>`,
  init(p) { const L = 8; this.L = L; this.a = { x: 1.5, v: p.v1, m: p.m1 }; this.b = { x: 6.5, v: p.v2, m: p.m2 }; this.t = 0; this.hit = null; this.done = false; this.before = { p: p.m1 * p.v1 + p.m2 * p.v2, E: .5 * p.m1 * p.v1 ** 2 + .5 * p.m2 * p.v2 ** 2 }; graphReset([{ n: 'v₁ (m/s)', c: C.red }, { n: 'v₂ (m/s)', c: C.blue }]); },
  onParam(p) { this.init(p); }, act(a, p) { this.init(p); },
  w: m => .35 + Math.cbrt(m) * .3,
  step(dt, p) {
    const A = this.a, B = this.b; if (this.done || this.t > 30) return;
    const wa = this.w(A.m) / 2, wb = this.w(B.m) / 2; if (A.x + A.v * dt - wa < 0 || A.x + A.v * dt + wa > this.L || B.x + B.v * dt - wb < 0 || B.x + B.v * dt + wb > this.L) { this.done = true; return; }
    A.x += A.v * dt; B.x += B.v * dt; this.t += dt;
    const gap = (B.x - this.w(B.m) / 2) - (A.x + this.w(A.m) / 2);
    if (gap <= 0 && A.v - B.v > 0) { const e = p.e, M = A.m + B.m, P = A.m * A.v + B.m * B.v; const va = (P + B.m * e * (B.v - A.v)) / M, vb = (P + A.m * e * (A.v - B.v)) / M; A.v = va; B.v = vb; this.hit = this.t; }
    if ((this.t * 60 | 0) !== ((this.t - dt) * 60 | 0)) graphPush(this.t, [A.v, B.v]);
  },
  draw(p) {
    gridPaper(); const s = (W - 60) / this.L, ox = 30, gy = H * .6, X = x => ox + x * s;
    cx.fillStyle = '#e9e4d6'; cx.fillRect(0, gy, W, 12); for (let m = 0; m <= this.L; m++) { text(String(m), X(m), gy + 28, C.ink3, 10, 'center'); }
    for (const [o, c, n] of [[this.a, C.red, '1'], [this.b, C.blue, '2']]) {
      const w = this.w(o.m) * s, h = Math.max(w * .7, 30); cx.fillStyle = c; cx.beginPath(); cx.roundRect ? cx.roundRect(X(o.x) - w / 2, gy - h, w, h, 6) : cx.rect(X(o.x) - w / 2, gy - h, w, h); cx.fill();
      label(w > 70 ? `m${n === '1' ? '₁' : '₂'}=${o.m}kg` : (n === '1' ? 'm₁' : 'm₂'), X(o.x), gy - h / 2 + 5, '#fff', 12, 'center');
      if (Math.abs(o.v) > .01) arrow(X(o.x), gy - h - 16, X(o.x) + o.v * s * .35, gy - h - 16, c, 2, 8); label(`${f2(o.v)} m/s`, X(o.x), gy - h - 26, c, 12, 'center');
    }
    if (this.hit != null && this.t - this.hit < .3) { cx.fillStyle = 'rgba(227,162,26,.35)'; const mx = (X(this.a.x) + X(this.b.x)) / 2; cx.beginPath(); cx.arc(mx, gy - 30, 30 * (1 - (this.t - this.hit) / .3) + 6, 0, 7); cx.fill(); }
    const A = this.a, B = this.b, pN = A.m * A.v + B.m * B.v, EN = .5 * A.m * A.v ** 2 + .5 * B.m * B.v ** 2;
    hud(`t = ${f2(this.t)} s${this.hit != null ? '　已碰撞' : ''}${this.done ? '　滑块到达轨道端点，已停止' : ''}`);
    reads([['碰前总动量', `${f2(this.before.p)} kg·m/s`], ['当前总动量', `${f2(pN)} kg·m/s`], ['碰前总动能', `${f2(this.before.E)} J`], ['当前总动能', `${f2(EN)} J`], ['动能损失', `${f2(this.before.E - EN)} J（${this.before.E ? f2((1 - EN / this.before.E) * 100, 1) : 0}%）`, 1], ['v₁′', this.hit != null ? `${f2(A.v)} m/s` : '—'], ['v₂′', this.hit != null ? `${f2(B.v)} m/s` : '—']]);
    if (p.v1 <= p.v2) label('当前设置下两滑块不会相碰（需要 v₁ > v₂）', W / 2, 40, C.red, 14, 'center');
  }
};

EXPS.efield = {
  n: '电场线与等势线', d: '拖动电荷改变位置，点“添加”放入新的点电荷。背景颜色表示电势高低，细线为等势线。',
  P: [{ k: 'n', n: '每单位电荷的电场线条数', min: 6, max: 24, step: 2, v: 14, u: '条' }, { k: 'pot', n: '电势背景', min: 0, max: 1, step: 1, v: 1, u: '', opts: [[1, '显示'], [0, '隐藏']] }, { k: 'q', n: '新电荷电量', min: 1, max: 3, step: 1, v: 1, u: 'q' }],
  acts: [['addp', '＋ 添加正电荷'], ['addn', '－ 添加负电荷'], ['dipole', '等量异种'], ['same', '等量同种'], ['clear', '清空']],
  note: `<p>电场线从正电荷出发、终止于负电荷，疏密表示场强大小，切线方向为场强方向。</p><p>点电荷场强 <span class="f">E = kQ / r²</span>，电势 <span class="f">φ = kQ / r</span>；多个电荷时按矢量叠加。</p><p>等势线与电场线处处垂直。双击电荷可以删除。</p>`,
  init(p) { if (!this.qs) this.preset('dipole'); this.dirty = true; graphReset([]); },
  preset(k) { const w = W || 800, h = H || 500; if (k === 'dipole') this.qs = [{ x: w * .35, y: h * .5, q: 1 }, { x: w * .65, y: h * .5, q: -1 }]; if (k === 'same') this.qs = [{ x: w * .35, y: h * .5, q: 1 }, { x: w * .65, y: h * .5, q: 1 }]; if (k === 'clear') this.qs = []; this.dirty = true; },
  resize() { this.dirty = true; },
  onParam() { this.dirty = true; },
  act(a, p) { if (a === 'addp' || a === 'addn') { this.qs.push({ x: W * (.3 + Math.random() * .4), y: H * (.3 + Math.random() * .4), q: (a === 'addp' ? 1 : -1) * p.q }); } else this.preset(a); this.dirty = true; },
  E(x, y) { let ex = 0, ey = 0, v = 0; for (const c of this.qs) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 1e-3, r = Math.sqrt(r2); const f = c.q / (r2 * r); ex += f * dx; ey += f * dy; v += c.q / r; } return [ex, ey, v]; },
  step() {},
  draw(p) {
    if (!this.dirty && !this.hover) { return; }
    if (this.dirty) this.render(p);
    cx.drawImage(this.buf, 0, 0, W, H);
    if (this.hover) { const [ex, ey, v] = this.E(this.hover[0], this.hover[1]); const s = 40 * 40; hud(`场强 E ∝ ${f2(Math.hypot(ex, ey) * s, 3)}　电势 φ ∝ ${f2(v * 40, 3)}<br><span style="color:#8a96a2">以 40 像素为单位长度，k·q = 1</span>`); }
  },
  render(p) {
    this.dirty = false;
    if (!this.buf) { this.buf = document.createElement('canvas'); }
    this.buf.width = W * DPR; this.buf.height = H * DPR; const b = this.buf.getContext('2d'); b.setTransform(DPR, 0, 0, DPR, 0, 0);
    b.fillStyle = '#fff'; b.fillRect(0, 0, W, H);
    if (p.pot && this.qs.length) {
      const st = 3, gw = Math.ceil(W / st) + 1, gh = Math.ceil(H / st) + 1; const img = b.createImageData(gw, gh); const V = new Float32Array(gw * gh);
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
        const v = this.E(i * st, j * st)[2] * 40; V[j * gw + i] = v; const t = Math.tanh(v * .9);
        const o = (j * gw + i) * 4; const a = Math.abs(t);
        let r = 255, g = 255, bb = 255; if (t > 0) { g = 255 - 150 * a; bb = 255 - 170 * a; } else { r = 255 - 180 * a; g = 255 - 120 * a; }
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = bb; img.data[o + 3] = 255;
      }
      const tmp = document.createElement('canvas'); tmp.width = gw; tmp.height = gh; tmp.getContext('2d').putImageData(img, 0, 0); b.imageSmoothingEnabled = true; b.drawImage(tmp, 0, 0, gw * st, gh * st);
      // equipotential contours (marching squares)
      const levels = []; for (let k = -12; k <= 12; k++) if (k) levels.push(k * .25);
      b.lineWidth = 1; b.setLineDash([3, 3]);
      for (const L of levels) {
        b.strokeStyle = L > 0 ? 'rgba(170,60,40,.55)' : 'rgba(40,80,170,.55)'; b.beginPath();
        for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
          const a0 = V[j * gw + i], a1 = V[j * gw + i + 1], a2 = V[(j + 1) * gw + i + 1], a3 = V[(j + 1) * gw + i];
          if (Math.max(Math.abs(a0), Math.abs(a1), Math.abs(a2), Math.abs(a3)) > 4) continue;
          const pts = []; const x = i * st, y = j * st;
          const ed = (va, vb, xa, ya, xb, yb) => { if ((va - L) * (vb - L) < 0) { const t = (L - va) / (vb - va); pts.push([xa + (xb - xa) * t, ya + (yb - ya) * t]); } };
          ed(a0, a1, x, y, x + st, y); ed(a1, a2, x + st, y, x + st, y + st); ed(a2, a3, x + st, y + st, x, y + st); ed(a3, a0, x, y + st, x, y);
          for (let q = 0; q + 1 < pts.length; q += 2) { b.moveTo(pts[q][0], pts[q][1]); b.lineTo(pts[q + 1][0], pts[q + 1][1]); }
        }
        b.stroke();
      }
      b.setLineDash([]);
    } else { b.strokeStyle = C.grid; b.lineWidth = 1; b.beginPath(); for (let x = .5; x < W; x += 24) { b.moveTo(x, 0); b.lineTo(x, H); } for (let y = .5; y < H; y += 24) { b.moveTo(0, y); b.lineTo(W, y); } b.stroke(); }
    // field lines
    const pos = this.qs.filter(c => c.q > 0), neg = this.qs.filter(c => c.q < 0);
    const seeds = pos.length ? pos : neg, dir = pos.length ? 1 : -1;
    b.strokeStyle = 'rgba(29,43,58,.75)'; b.lineWidth = 1.2; b.fillStyle = 'rgba(29,43,58,.8)';
    for (const c of seeds) {
      const n = Math.round(p.n * Math.abs(c.q));
      for (let k = 0; k < n; k++) {
        const a = (k + .5) / n * Math.PI * 2; let x = c.x + Math.cos(a) * 14, y = c.y + Math.sin(a) * 14; const pts = [[x, y]];
        for (let s = 0; s < 1600; s++) {
          let [ex, ey] = this.E(x, y); let m = Math.hypot(ex, ey) || 1e-9; const h = 3 * dir;
          const mx = x + ex / m * h / 2, my = y + ey / m * h / 2; [ex, ey] = this.E(mx, my); m = Math.hypot(ex, ey) || 1e-9;
          x += ex / m * h; y += ey / m * h; pts.push([x, y]);
          if (x < -40 || y < -40 || x > W + 40 || y > H + 40) break;
          if (this.qs.some(o => o !== c && Math.hypot(o.x - x, o.y - y) < 10 && Math.sign(o.q) !== Math.sign(c.q))) break;
        }
        b.beginPath(); pts.forEach(([px, py], i) => i ? b.lineTo(px, py) : b.moveTo(px, py)); b.stroke();
        for (const fr of [.25, .6]) { const i = Math.floor(pts.length * fr); if (i < 2 || i >= pts.length - 1) continue; const [x1, y1] = pts[i - 1], [x2, y2] = pts[i + 1]; if (x2 < 0 || y2 < 0 || x2 > W || y2 > H) continue; let ang = Math.atan2(y2 - y1, x2 - x1); if (dir < 0) ang += Math.PI; const [ax, ay] = pts[i]; b.beginPath(); b.moveTo(ax + 6 * Math.cos(ang), ay + 6 * Math.sin(ang)); b.lineTo(ax - 5 * Math.cos(ang - .5), ay - 5 * Math.sin(ang - .5)); b.lineTo(ax - 5 * Math.cos(ang + .5), ay - 5 * Math.sin(ang + .5)); b.closePath(); b.fill(); }
      }
    }
    for (const c of this.qs) { const r = 11 + Math.abs(c.q) * 2; b.fillStyle = c.q > 0 ? C.red : C.blue; b.beginPath(); b.arc(c.x, c.y, r, 0, 7); b.fill(); b.strokeStyle = '#fff'; b.lineWidth = 2; b.stroke(); b.fillStyle = '#fff'; b.font = 'bold 15px sans-serif'; b.textAlign = 'center'; b.fillText(c.q > 0 ? '+' : '−', c.x, c.y + 5); if (Math.abs(c.q) > 1) { b.font = '10px sans-serif'; b.fillStyle = C.ink; b.fillText(`${Math.abs(c.q)}q`, c.x, c.y + r + 12); } }
    if (!this.qs.length) { b.fillStyle = C.ink3; b.font = '15px sans-serif'; b.textAlign = 'center'; b.fillText('点上方按钮添加电荷', W / 2, H / 2); }
    reads([['电荷数', `${this.qs.length}`], ['总电量', `${this.qs.reduce((a, c) => a + c.q, 0)} q`], ['操作', '拖动移动 · 双击删除', 1]]);
  },
  pick(x, y) { return this.qs.findIndex(c => Math.hypot(c.x - x, c.y - y) < 20); },
  down(x, y) { const i = this.pick(x, y); if (i >= 0) { this.drag = i; return true; } },
  move(x, y) { this.hover = [x, y]; if (this.drag != null) { this.qs[this.drag].x = Math.max(10, Math.min(W - 10, x)); this.qs[this.drag].y = Math.max(10, Math.min(H - 10, y)); this.dirty = true; } },
  up() { this.drag = null; },
  dbl(x, y) { const i = this.pick(x, y); if (i >= 0) { this.qs.splice(i, 1); this.dirty = true; } }
};

EXPS.bfield = {
  n: '磁场中的带电粒子', d: '粒子从左侧射入右侧的匀强磁场区域。加上竖直电场，就成了速度选择器：当 v = E/B 时粒子沿直线通过。',
  P: [{ k: 'sg', n: '电荷正负', min: -1, max: 1, step: 2, v: 1, u: '', opts: [[1, '正电荷'], [-1, '负电荷']] }, { k: 'dir', n: '磁场方向', min: -1, max: 1, step: 2, v: -1, u: '', opts: [[-1, '垂直纸面向里 ×'], [1, '垂直纸面向外 ·']] }, { k: 'm', n: '质量 m', min: .5, max: 4, step: .1, v: 1, u: '' }, { k: 'v', n: '入射速度 v', min: 1, max: 10, step: .1, v: 4, u: 'm/s' }, { k: 'B', n: '磁感应强度 B', min: .2, max: 3, step: .05, v: 1, u: 'T' }, { k: 'E', n: '电场强度 E（区域内竖直）', min: 0, max: 20, step: .1, v: 0, u: 'V/m' }],
  acts: [['launch', '射入粒子', 'pri'], ['clear', '清除轨迹']],
  note: `<p>洛伦兹力提供向心力：<span class="f">qvB = mv² / r</span></p><p class="f">r = mv / (qB)，T = 2πm / (qB)</p><p>周期与速度无关。电荷量取 q = 1，长度单位为米。</p><p>速度选择器：电场力与洛伦兹力平衡 <span class="f">qE = qvB</span>，只有 <span class="f">v = E / B</span> 的粒子能沿直线穿过。</p>`,
  init(p) { this.tr = []; this.pt = null; this.fit(); this.launch(p); },
  fit() { this.s = W / 24; this.x0 = 6; this.oy = H / 2; },
  resize() { this.fit(); },
  onParam(p) { },
  launch(p) { this.pt = { x: 0, y: 0, vx: p.v, vy: 0, t: 0, pts: [[0, 0]], c: PAL[this.tr.length % PAL.length], p: Object.assign({}, p), done: false, tin: null, tout: null }; this.tr.push(this.pt); if (this.tr.length > 6) this.tr.shift(); graphReset([]); },
  act(a, p) { if (a === 'launch') this.launch(p); if (a === 'clear') this.tr = this.pt && !this.pt.done ? [this.pt] : []; },
  step(dt, p) {
    const o = this.pt; if (!o || o.done) return; const q = o.p.sg, m = o.p.m, Bz = o.p.dir * o.p.B, E = o.p.E;
    const sub = 4, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const inF = o.x >= this.x0;
      // Boris push
      const Ey = inF ? (o.p.dir < 0 ? -E : E) : 0;
      let vx = o.vx, vy = o.vy + q * Ey / m * h / 2;
      if (inF) { const t = q * Bz / m * h / 2, s = 2 * t / (1 + t * t); const vpx = vx + vy * t, vpy = vy - vx * t; vx = vx + vpy * s; vy = vy - vpx * s; }
      vy += q * Ey / m * h / 2;
      o.vx = vx; o.vy = vy; o.x += vx * h; o.y += vy * h; o.t += h;
      if (inF && o.tin == null) o.tin = o.t;
      if (!inF && o.tin != null && o.tout == null) o.tout = o.t;
    }
    if (o.pts.length < 6000) o.pts.push([o.x, o.y]);
    const X = this.s * o.x, Y = this.s * o.y;
    if (o.x < -1 || o.x > 26 || Math.abs(Y) > H / 2 + 40 || o.t > 60) o.done = true;
  },
  draw(p) {
    gridPaper(); const s = this.s, X = x => x * s, Y = y => this.oy - y * s;
    const fx = X(this.x0);
    cx.fillStyle = 'rgba(47,111,214,.06)'; cx.fillRect(fx, 0, W - fx, H); cx.strokeStyle = C.blue; cx.lineWidth = 1.5; cx.setLineDash([6, 5]); cx.beginPath(); cx.moveTo(fx, 0); cx.lineTo(fx, H); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(47,111,214,.45)'; cx.font = '14px sans-serif'; cx.textAlign = 'center';
    for (let x = fx + 24; x < W; x += 48) for (let y = 24; y < H; y += 48) { if (p.dir < 0) cx.fillText('×', x, y + 5); else { cx.beginPath(); cx.arc(x, y, 2.5, 0, 7); cx.fill(); } }
    if (p.E > 0) { const down = p.dir < 0; for (let x = fx + 48; x < W; x += 96) arrow(x, down ? 30 : H - 30, x, down ? H - 30 : 30, 'rgba(232,87,63,.25)', 1.5, 8); label(`E ${down ? '↓' : '↑'}`, W - 30, 22, C.red, 13, 'right'); }
    label(`B ${p.dir < 0 ? '×' : '·'}`, fx + 10, 22, C.blue, 13);
    // gun
    cx.fillStyle = C.ink; cx.fillRect(0, Y(0) - 7, 22, 14);
    for (const o of this.tr) { cx.strokeStyle = o.c; cx.lineWidth = 2.2; cx.beginPath(); o.pts.forEach(([x, y], i) => i ? cx.lineTo(X(x), Y(y)) : cx.moveTo(X(x), Y(y))); cx.stroke(); }
    const o = this.pt;
    if (o) {
      const px = X(o.x), py = Y(o.y);
      cx.fillStyle = o.p.sg > 0 ? C.red : C.blue; cx.beginPath(); cx.arc(px, py, 8, 0, 7); cx.fill(); cx.fillStyle = '#fff'; cx.font = 'bold 12px sans-serif'; cx.textAlign = 'center'; cx.fillText(o.p.sg > 0 ? '+' : '−', px, py + 4);
      if (!o.done) arrow(px, py, px + o.vx * 8, py - o.vy * 8, C.ink, 1.8, 7);
      if (o.x >= this.x0 && !o.done) { const fxm = o.p.sg * o.vy * o.p.dir * o.p.B, fym = -o.p.sg * o.vx * o.p.dir * o.p.B; arrow(px, py, px + fxm * 6, py - fym * 6, C.violet, 1.8, 7); }
    }
    const r = p.m * p.v / p.B, T = 2 * Math.PI * p.m / p.B;
    hud(o ? `t = ${f2(o.t)} s　v = ${f2(Math.hypot(o.vx, o.vy))} m/s${o.tin != null ? `　在场中 ${f2((o.tout ?? o.t) - o.tin)} s` : ''}<br><span style="color:${C.violet}">紫色箭头：洛伦兹力方向</span>` : '');
    reads([['半径 r = mv/(qB)', `${f2(r)} m`], ['周期 T = 2πm/(qB)', `${f2(T)} s`], ['半个周期', `${f2(T / 2)} s`], ['在场中运动时间', o && o.tout != null ? `${f2(o.tout - o.tin)} s` : '—'], ['选择速度 E/B', p.E > 0 ? `${f2(p.E / p.B)} m/s` : '未加电场'], ['离开时速度', o && o.done ? `${f2(Math.hypot(o.vx, o.vy))} m/s` : '—']]);
  }
};

/* ---------- framework ---------- */
let curK = 'throw', cur = null, PV = {}, running = true, speed = 1;
const P_ = () => PV[curK];
function setParam(k, v) { PV[curK][k] = v; const el = $(`#prm-${k}`); if (el) { el.value = v; el.dispatchEvent(new Event('sync')); } }
function load(k) {
  curK = k; cur = EXPS[k]; location.hash = k;
  $$('#exps button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  $('#title').textContent = cur.n; $('#desc').textContent = cur.d; $('#note').innerHTML = cur.note;
  if (!PV[k]) { PV[k] = {}; cur.P.forEach(q => PV[k][q.k] = q.v); }
  const p = PV[k];
  $('#params').innerHTML = cur.P.map(q => q.opts ? `<div class="prm"><div class="l"><span>${q.n}</span></div><div class="seg" data-k="${q.k}">${q.opts.map(([v, t]) => `<button data-v="${v}" class="${p[q.k] == v ? 'on' : ''}">${t}</button>`).join('')}</div>${q.k === 'e' ? `<input type="range" id="prm-${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${p[q.k]}" style="margin-top:10px">` : ''}</div>` : `<div class="prm"><div class="l"><span>${q.n}</span><b id="pv-${q.k}">${p[q.k]} ${q.u}</b></div><input type="range" id="prm-${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${p[q.k]}"></div>`).join('');
  cur.P.forEach(q => {
    const el = $(`#prm-${q.k}`);
    const upd = () => { p[q.k] = +el.value; const lab = $(`#pv-${q.k}`); if (lab) lab.textContent = `${p[q.k]} ${q.u}`; if (q.opts) $$(`.seg[data-k="${q.k}"] button`).forEach(b => b.classList.toggle('on', +b.dataset.v === p[q.k])); };
    if (el) { el.oninput = () => { upd(); cur.onParam && cur.onParam(p, q.k); }; el.addEventListener('sync', upd); }
    if (q.opts) $$(`.seg[data-k="${q.k}"] button`).forEach(b => b.onclick = () => { p[q.k] = +b.dataset.v; if (el) el.value = p[q.k]; $$(`.seg[data-k="${q.k}"] button`).forEach(x => x.classList.toggle('on', x === b)); cur.onParam && cur.onParam(p, q.k); });
  });
  $('#acts').innerHTML = cur.acts.map(([a, t, c]) => `<button class="btn ${c || ''}" data-a="${a}">${t}</button>`).join('') + `<button class="btn" id="pp">${running ? '暂停' : '继续'}</button><button class="btn" id="spd">${speed === 1 ? '慢放' : '常速'}</button>`;
  $$('#acts [data-a]').forEach(b => b.onclick = () => { cur.act(b.dataset.a, p); if (!running) { running = true; $('#pp').textContent = '暂停'; } });
  $('#pp').onclick = () => { running = !running; $('#pp').textContent = running ? '暂停' : '继续'; };
  $('#spd').onclick = () => { speed = speed === 1 ? .25 : 1; $('#spd').textContent = speed === 1 ? '慢放' : '常速'; };
  hud(''); size(); cur.init(p);
  Motion.enter($('.stage-h'), 'zz-in'); Motion.enter($('#cvWrap'), 'zz-cv'); Motion.stagger($('#params'), '.prm', 40, 8); Motion.stagger($('.side'), '.box', 60, 4); Motion.stagger($('#acts'), '.btn', 30, 6);
}
let last = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  if (!cur) return;
  if (running) { const h = 1 / 480; let acc = dt * speed; while (acc > 1e-9) { const d = Math.min(h, acc); cur.step(d, P_()); acc -= d; } }
  cur.draw(P_()); drawGraph();
}
const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => { if (cur.down && cur.down(...pos(e), P_())) { cv.setPointerCapture(e.pointerId); e.preventDefault(); } });
cv.addEventListener('pointermove', e => { cur.move && cur.move(...pos(e), P_()); });
cv.addEventListener('pointerup', e => { cur.up && cur.up(P_()); });
cv.addEventListener('pointerleave', () => { if (cur.hover !== undefined) { cur.hover = null; hud(''); } });
cv.addEventListener('dblclick', e => { cur.dbl && cur.dbl(...pos(e)); });
addEventListener('resize', () => { size(); if (cur && cur.fit) cur.fit(P_()); });
$('#exps').innerHTML = Object.entries(EXPS).map(([k, v]) => `<button data-k="${k}">${v.n}</button>`).join('');
$$('#exps button').forEach(b => b.onclick = () => load(b.dataset.k));
Motion.pills([{ sel: '#exps', scroll: true }, { sel: '#params .seg' }]);
const foot = document.createElement('footer'); foot.className = 'foot'; foot.textContent = '数值模拟采用小步长积分，结果与理论公式会有极小的计算误差。'; document.body.appendChild(foot);
load(EXPS[location.hash.slice(1)] ? location.hash.slice(1) : 'throw');
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
