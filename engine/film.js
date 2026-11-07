// 二年级错题讲解（人教版 表内乘法）：渲染器。布局、标注、黑板上的每一步、镜头全部来自 mul/<A|B>.json（tools/build.py 生成，配乐读同一份）。
// 风格沿用「白话光互连」：纸纹桌面、从作业照片上剪下来的原题纸条、红笔圈错、黑卡片（这里是黑板）上一次只动一样东西；纸上的动作按 12 fps 步进。
// 给二年级孩子：屏幕上的字尽量少，数字和物体（桃、盘子、点子）为主，汉字用楷体（和课本一样）。纯时间函数：seek(t) 画第 t 秒，不带状态。
(() => {
const { clamp, lerp } = U; const seg = MO.seg;
const D = (() => { const x = new XMLHttpRequest(); x.open('GET', window.DESK_PATH, false); x.send(); return JSON.parse(x.responseText); })();
const W = 1080, H = 1920, Q = D.cue, KAI = 'LXGWWenKai-500', HAND = 'Kalam-700';
const COL = { desk: '#e4ddcf', ink: '#1b1b1a', red: '#b8433f', redHi: '#e0604f', board: '#1f2522', cream: '#f1ece1', dim: 'rgba(241,236,225,.45)', yel: '#f2d94e', hl: 'rgba(222,208,20,.85)',
  peach: '#f3a59c', peachDk: '#c96a62', leaf: '#86c97f', coral: '#f0907e', green: '#8fd48a' };
const S12 = t => MO.step(t, 12);
const BX = 540, BY = 1015, BW = 980, BH = 820;   // 黑板
const pop = (t, at, d = 0.28) => { if (t < at) return 0; const x = seg(t, at, at + d); return x >= 1 ? 1 : 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2); };   // 弹出来（稍微冲过头再回来）
const fadeIn = (t, at, d = 0.25) => MO.smooth(seg(t, at, at + d));
const txt = (c, s, x, y, size, col = COL.cream, fam = KAI, align = 'center') => { c.font = `${size}px "${fam}"`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); };
// 粉笔写字：从左往右「写」出来（按 12 fps 步进）
const chalk = (c, s, x, y, size, t, at, d, col = COL.cream, fam = KAI, align = 'center') => { if (t < at) return; const q = d > 0 ? seg(S12(t), at, at + d) : 1;
  c.save(); c.font = `${size}px "${fam}"`; const w = c.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.beginPath(); c.rect(x0 - 10, y - size, (w + 20) * q, size * 2); c.clip(); txt(c, s, x0, y, size, col, fam, 'left'); c.restore(); };

// ---------- 相机 ----------
const EASE = { lin: x => x, sine: MO.sineInOut, cubic: MO.cubicInOut };
const camAt = t => { const ks = D.cam; if (t <= ks[0].t) return ks[0];
  for (let i = 1; i < ks.length; i++) if (t <= ks[i].t) { const a = ks[i - 1], b = ks[i], e = EASE[b.e]((t - a.t) / (b.t - a.t)); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: a.z * Math.pow(b.z / a.z, e) }; }
  return ks[ks.length - 1]; };
window.CAM_SPEED = t => { const a = camAt(t - 1 / 60), b = camAt(t + 1 / 60); return Math.hypot(b.x - a.x, b.y - a.y) * b.z + Math.abs(Math.log(b.z / a.z)) * 1100; };

// ---------- 纸条：从作业照片上剪下来的原题 ----------
const SC = {};
const stripCanvas = s => SC[s.id] || (SC[s.id] = (() => { const img = IMG[s.photo || 'mul/photo.png']; const [x0, y0, x1, y1] = s.crop, w = x1 - x0, h = y1 - y0, pad = 26;
  const cv = document.createElement('canvas'); cv.width = w + pad * 2; cv.height = h + pad * 2; const g = cv.getContext('2d'); g.translate(pad, pad);
  CL.tornRect(g, w, h, s.id.length * 13 + 7, 10); g.save(); g.clip(); g.drawImage(img, x0, y0, w, h, 0, 0, w, h); g.restore(); return { cv, pad }; })());
const markOn = (c, m, t) => { const q = seg(S12(t), m.t[0], m.t[1]); if (q <= 0) return; const [x0, y0, x1, y1] = m.box;
  if (m.kind === 'hl') { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = COL.hl; c.fillRect(x0, y0 + 4, (x1 - x0) * q, y1 - y0 - 6); c.restore(); }
  else if (m.kind === 'tick') { c.save(); c.translate((x0 + x1) / 2, (y0 + y1) / 2); const k = Math.min(1, q * 1.2); check(c, 0, 0, (y1 - y0) * 0.45 * k, '#3f9a4a'); c.restore(); }
  else if (m.kind === 'circle') { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 6, ry = (y1 - y0) / 2 + 4, n = Math.ceil(80 * q) + 2;
    c.save(); c.strokeStyle = m.tone === 'soft' ? '#d9a400' : COL.red; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i <= n; i++) { const a = -2.4 + Math.PI * 2 * 1.08 * q * i / n, g = 1 + 0.06 * i / n; const x = cx + Math.cos(a) * rx * g, y = cy + Math.sin(a) * ry * g; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore(); }
  else if (m.kind === 'strike') { c.save(); c.strokeStyle = COL.red; c.lineWidth = 5; c.lineCap = 'round'; const ym = (y0 + y1) / 2; c.beginPath(); c.moveTo(x0, ym + 4); c.lineTo(lerp(x0, x1, q), ym - 4 * q); c.stroke(); c.restore(); }
  else if (m.kind === 'write') { c.save(); c.beginPath(); c.rect(x0 - 6, y0 - 30, (x1 - x0 + 30) * q, y1 - y0 + 60); c.clip(); c.font = `${(y1 - y0) * 0.95}px "${HAND}"`; c.fillStyle = m.tone === 'good' ? '#3f9a4a' : COL.red; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(m.text, x0, (y0 + y1) / 2 + 2); c.restore(); } };
const drawStrip = (c, s, t) => { const [tin, tout] = s.t; let dx = 0;
  if (tin > 0) { if (t < tin) return; dx = (1 - MO.cubicInOut(seg(t, tin, tin + 0.5))) * 1100; }
  if (tout != null && t >= tout) { const q = MO.cubicInOut(seg(t, tout, tout + 0.5)); if (q >= 1) return; dx = -q * 1100; }
  const { cv, pad } = stripCanvas(s), k = s.k, [x0, y0, x1, y1] = s.crop, w = (x1 - x0) * k, h = (y1 - y0) * k;
  c.save(); c.translate(s.at[0] + dx, s.at[1]); c.rotate(s.r);
  c.save(); c.shadowColor = 'rgba(50,40,25,.3)'; c.shadowBlur = 14; c.shadowOffsetX = 3; c.shadowOffsetY = 8; c.drawImage(cv, -w / 2 - pad * k, -h / 2 - pad * k, cv.width * k, cv.height * k); c.restore();
  CL.tape(c, -w / 2 + 50, -h / 2 - 4, -0.5, 120); CL.tape(c, w / 2 - 50, -h / 2 - 4, 0.5, 120);
  c.translate(-w / 2, -h / 2); c.scale(k, k); c.translate(-x0, -y0); D.marks.filter(m => m.strip === s.id).forEach(m => markOn(c, m, t)); c.restore(); };

// ---------- 黑板：一页一页，换页时黑板擦从左往右擦过去 ----------
const pages = Object.keys(Q).filter(k => /^page\d$/.test(k)).sort().map(k => [Number(k.slice(4)), Q[k]]);
const pageAt = t => { let p = 0; for (const [n, at] of pages) if (t >= at) p = n; return p; };
const peach = (c, x, y, r, a = 1) => { c.save(); c.globalAlpha *= a; c.fillStyle = COL.peach; c.strokeStyle = COL.peachDk; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 7); c.fill();
  c.fillStyle = COL.leaf; c.beginPath(); c.ellipse(x + r * 0.35, y - r * 1.0, r * 0.42, r * 0.2, -0.6, 0, 7); c.fill(); c.restore(); };
const plate = (c, x, y, rx, a = 1) => { c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(241,236,225,.07)'; c.strokeStyle = COL.cream; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, rx, rx * 0.27, 0, 0, 7); c.fill(); c.stroke(); c.restore(); };
const plateWithPeaches = (c, x, y, s, nPeach = 3, t = 1e9, peachAt = null) => { c.save(); c.translate(x, y); c.scale(s, s); plate(c, 0, 18, 95);
  [[-36, -6], [0, -24], [36, -6]].slice(0, nPeach).forEach(([dx, dy], i) => { const ps = peachAt ? pop(t, peachAt[i], 0.22) : 1; if (ps <= 0) return; c.save(); c.translate(dx, dy); c.scale(ps, ps); peach(c, 0, 0, 26); c.restore(); }); c.restore(); };
const ring = (c, x, y, rx, ry, col, a) => { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 6; c.setLineDash([14, 10]); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.stroke(); c.restore(); };
const brace = (c, x0, x1, y, q, col = COL.cream) => { if (q <= 0) return; const xm = (x0 + x1) / 2, xe = lerp(x0, x1, q); c.save(); c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
  c.moveTo(x0, y - 16); c.quadraticCurveTo(x0, y, x0 + 20, y); c.lineTo(Math.min(xe, xm - 20), y); if (xe > xm - 20) { c.quadraticCurveTo(xm, y, xm, y + 18); c.moveTo(xm, y + 18); c.quadraticCurveTo(xm, y, xm + 20, y); c.lineTo(Math.min(xe, x1 - 20), y); }
  if (xe >= x1 - 20) c.quadraticCurveTo(x1, y, x1, y - 16); c.stroke(); c.restore(); };
const check = (c, x, y, s, col = COL.green) => { c.save(); c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.3, y + s * 0.7); c.lineTo(x + s, y - s * 0.8); c.stroke(); c.restore(); };
const cross = (c, x, y, s, q = 1, col = COL.redHi) => { if (q <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s, y - s); c.lineTo(x - s + 2 * s * Math.min(1, q * 2), y - s + 2 * s * Math.min(1, q * 2));
  if (q > 0.5) { const r = (q - 0.5) * 2; c.moveTo(x + s, y - s); c.lineTo(x + s - 2 * s * r, y - s + 2 * s * r); } c.stroke(); c.restore(); };
const tag = (c, s, x, y, size, t, at, bg = COL.cream, fg = COL.ink, r = -0.015) => MD.label(c, s, x, y, { size, fam: KAI, align: 'center', bg, fg, t, at, rate: 24, r });

const PX = [-345, -115, 115, 345];
const pageA1 = (c, t) => {
  PX.forEach((x, i) => { const s = pop(t, Q.plates[i]); if (s <= 0) return; c.save(); c.translate(x, -200); c.scale(s, s); plateWithPeaches(c, 0, 0, 1, 3, t, i === 0 ? Q.peach1 : [Q.plates[i], Q.plates[i] + 0.08, Q.plates[i] + 0.16]); c.restore();
    if (t >= Q.plateTag[i]) txt(c, `${i + 1} 盘`, x, -118, 34, COL.dim);
    const ca = Q.count[i]; if (t >= ca) { ring(c, x, -205, 118, 72, COL.yel, t < (Q.count[i + 1] ?? Q.twelve) ? 1 : 0.35); c.save(); const s2 = pop(t, ca); c.translate(x, -318); c.scale(s2, s2); txt(c, String(3 * (i + 1)), 0, 0, 64, COL.yel); c.restore(); } });
  if (t >= Q.twelve) { c.save(); c.globalAlpha = fadeIn(t, Q.twelve); txt(c, '一共', -270, -10, 44, COL.dim); txt(c, '12 个', -120, -10, 76, COL.cream); check(c, 40, -14, 26); c.restore(); }
  if (t >= Q.notSeven) { c.save(); c.globalAlpha = fadeIn(t, Q.notSeven); txt(c, '7 个', 250, -10, 64, COL.dim); c.restore(); cross(c, 250, -10, 42, seg(S12(t), Q.notSeven + 0.25, Q.notSeven + 0.75)); }
  if (t >= Q.brace) chalk(c, '4 个 3 相加', 0, 110, 40, t, Q.brace, 0.6, COL.dim);
  Q.sum.forEach((at, k) => { chalk(c, '3', PX[k], 190, 70, t, at, 0.25); if (k) chalk(c, '+', (PX[k] + PX[k - 1]) / 2, 190, 60, t, at - 0.125, 0.125, COL.dim); });
  brace(c, PX[0] - 40, PX[3] + 40, 240, MO.smooth(seg(t, Q.sum[3] + 0.375, Q.sum[3] + 0.875)), COL.dim);
  chalk(c, '3 × 4 = 12', -215, 330, 66, t, Q.mul1, 0.5); chalk(c, '4 × 3 = 12', 225, 330, 66, t, Q.mul2, 0.5);
  if (t >= Q.eq12) { const a = fadeIn(t, Q.eq12, 0.3); c.save(); c.globalAlpha = a; c.strokeStyle = COL.yel; c.lineWidth = 5; c.beginPath(); c.moveTo(-370, 375); c.lineTo(-60, 375); c.moveTo(70, 375); c.lineTo(380, 375); c.stroke(); c.restore(); } };
const pageA2 = (c, t) => {
  chalk(c, '你写的', 0, -320, 38, t, Q.page2 + 0.375, 0.3, COL.dim); chalk(c, '3  +  4  =  7', 0, -210, 100, t, Q.page2 + 0.5, 0.5);
  const arrow = (x0, y0, x1, y1, q) => { if (q <= 0) return; c.save(); c.strokeStyle = COL.yel; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); c.stroke();
    if (q >= 1) { const a = Math.atan2(y1 - y0, x1 - x0); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 22 * Math.cos(a - 0.45), y1 - 22 * Math.sin(a - 0.45)); c.moveTo(x1, y1); c.lineTo(x1 - 22 * Math.cos(a + 0.45), y1 - 22 * Math.sin(a + 0.45)); c.stroke(); } c.restore(); };
  arrow(-175, -150, -270, -60, seg(S12(t), Q.why3, Q.why3 + 0.4)); if (t >= Q.why3 + 0.25) { c.save(); c.globalAlpha = fadeIn(t, Q.why3 + 0.25); plateWithPeaches(c, -270, 20, 0.62); txt(c, '一盘有几个', -270, 105, 38, COL.cream); c.restore(); }
  arrow(-25, -150, 230, -60, seg(S12(t), Q.why4, Q.why4 + 0.4)); if (t >= Q.why4 + 0.25) { c.save(); c.globalAlpha = fadeIn(t, Q.why4 + 0.25); [-90, -30, 30, 90].forEach(dx => plateWithPeaches(c, 230 + dx, 30, 0.3)); txt(c, '有几盘', 230, 105, 38, COL.cream); c.restore(); }
  cross(c, -100, -210, 40, seg(S12(t), Q.whyX, Q.whyX + 0.5));
  if (t >= Q.rule) { tag(c, '求几个几是多少，用乘法', 0, 270, 54, t, Q.rule); }
};
const FX = [-340, -170, 0, 170, 340];
const pageA3 = (c, t) => {
  FX.forEach((x, k) => { chalk(c, '4', x, -170, 92, t, Q.fours + k * 0.3, 0.25); if (k) chalk(c, '+', x - 85, -170, 70, t, Q.fours + k * 0.3 - 0.15, 0.125, COL.dim);
    const at = Q.tally[k]; if (t >= at) { const s = pop(t, at); c.save(); c.translate(x, -50); c.scale(s, s); c.strokeStyle = COL.yel; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 32, 0, 7); c.stroke(); txt(c, String(k + 1), 0, 2, 42, COL.yel); c.restore(); } });
  brace(c, FX[0] - 40, FX[4] + 40, 20, MO.smooth(seg(t, Q.five, Q.five + 0.5)), COL.dim); chalk(c, '5 个 4', 0, 80, 46, t, Q.five + 0.25, 0.4);
  chalk(c, '4 × 5', 0, 230, 96, t, Q.mul45, 0.5); chalk(c, '（4）×（5）', 0, 340, 46, t, Q.mul45 + 0.75, 0.5, COL.dim);
};
const GX = [-375, -225, -75, 75, 225, 375];
const dots = (c, x, y, col, s = 1) => { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = 'rgba(241,236,225,.25)'; c.lineWidth = 3; c.setLineDash([8, 8]); c.strokeRect(-56, -56, 112, 112); c.setLineDash([]);
  c.fillStyle = col; [[-23, -23], [23, -23], [-23, 23], [23, 23]].forEach(([dx, dy]) => { c.beginPath(); c.arc(dx, dy, 18, 0, 7); c.fill(); }); c.restore(); };
const pageB1 = (c, t) => {
  chalk(c, '4 × 6  =  6 个 4', 0, -330, 64, t, Q.title, 0.6);
  GX.forEach((x, k) => { const at = k < 5 ? Q.groups[k] : Q.g6, s = pop(t, at); if (s > 0) dots(c, x, -130, k < 5 ? COL.cream : COL.coral, s);
    if (k < 5 && t >= at) { c.save(); const s2 = pop(t, at); c.translate(x, -232); c.scale(s2, s2); txt(c, String(4 * (k + 1)), 0, 0, 52, COL.yel); c.restore(); } });
  if (t >= Q.plus4) chalk(c, '+4', GX[5], -232, 52, t, Q.plus4, 0.25, COL.coral);
  brace(c, GX[0] - 60, GX[4] + 60, -40, MO.smooth(seg(t, Q.brace, Q.brace + 0.5)), COL.dim); chalk(c, '5 个 4', -150, 20, 44, t, Q.brace + 0.25, 0.4); chalk(c, '= 20', 20, 20, 44, t, Q.eq20, 0.3);
  if (t >= Q.yours) tag(c, '4 × 5 = 20  ← 你写的 20', 0, 125, 46, t, Q.yours, COL.red, '#f6efe4');
  chalk(c, '4 × 6 = 24', 0, 250, 92, t, Q.eq24, 0.5, COL.yel);
  if (t >= Q.koujue) tag(c, '四六二十四', 0, 360, 56, t, Q.koujue);
};
const pageB2 = (c, t) => {
  const rows = [['4 × 4 = 16', '四四十六', -230], ['4 × 5 = 20', '四五二十', -60], ['4 × 6 = 24', '四六二十四', 110]], st = Q.page2 + 0.375;
  rows.forEach(([f, k, y], i) => { chalk(c, f, -240, y, 56, t, st + i * 0.25, 0.3, COL.dim); chalk(c, k, 110, y, 66, t, st + i * 0.25 + 0.125, 0.3); });
  const box = (y, at, col) => { if (t < at) return; c.save(); c.globalAlpha = fadeIn(t, at); c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.roundRect(-450, y - 55, 790, 110, 18); c.stroke(); c.restore(); };
  box(-60, Q.prev, COL.yel); box(110, Q.addone, COL.green);
  if (t >= Q.addone) { c.save(); c.globalAlpha = fadeIn(t, Q.addone); c.strokeStyle = COL.coral; c.lineWidth = 5; c.beginPath(); c.moveTo(352, -40); c.quadraticCurveTo(405, 25, 352, 90); c.stroke(); c.restore(); chalk(c, '+4', 405, 25, 46, t, Q.addone, 0.25, COL.coral, KAI, 'left'); }
  chalk(c, '忘了口诀，就从上一句再加一个 4', 0, 300, 42, t, Q.addone + 0.75, 0.75, COL.cream);
};
// ---------- 讲解模板「除法的意义（包含除）」：总数 N 里有几个每份数 a。参数在 D.p（tools/tpl_div.py）。
// 一列 = 一份（a 个）；装进一个容器（bus：车，bag：袋）时，人/苹果跳进车窗/袋口，一份装满就缩成上方的一个小图标并编号 ----------
const TP = D.p || {}, BAG = TP.kind === 'bag';
const ROAD = -170;
const person = (c, x, y, s = 1, col = COL.cream, a = 1) => { if (a <= 0 || s <= 0) return; c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.arc(0, -31, 9.5, 0, 7); c.fill(); c.beginPath(); c.roundRect(-11.5, -19, 23, 27, 9); c.fill(); c.restore(); };
const apple = (c, x, y, s = 1, col = null, a = 1) => { if (a <= 0 || s <= 0) return; const dim = col && col !== COL.cream; c.save(); c.translate(x, y - 16 * s); c.scale(s, s); c.globalAlpha *= a;
  c.fillStyle = dim ? col : COL.coral; c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill(); if (!dim) { c.fillStyle = COL.leaf; c.beginPath(); c.ellipse(6, -16, 7, 3.5, -0.6, 0, 7); c.fill(); } c.restore(); };
const item = BAG ? apple : person;
const busW = seats => 50 + seats * 36;
const seatPos = (seats, i) => [-busW(seats) / 2 + 30 + i * 36, -59];          // 车窗 / 袋口格子的中心（相对容器底边中点）
const vehicle = (c, x, y, seats, filled, s = 1, a = 1) => { if (a <= 0 || s <= 0) return; const w = busW(seats), h = 72, x0 = -w / 2;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a;
  if (BAG) { c.strokeStyle = COL.cream; c.lineWidth = 4; [x0 + w * 0.3, w / 2 - w * 0.3].forEach(hx => { c.beginPath(); c.arc(hx, -h - 8, 18, Math.PI, 0); c.stroke(); });
    c.fillStyle = 'rgba(241,236,225,.10)'; c.beginPath(); c.roundRect(x0, -h - 8, w, h + 8, 10); c.fill(); c.stroke(); }
  else { c.fillStyle = 'rgba(242,217,78,.16)'; c.strokeStyle = COL.yel; c.lineWidth = 4; c.beginPath(); c.roundRect(x0, -h - 8, w, h, 14); c.fill(); c.stroke(); }
  for (let i = 0; i < seats; i++) { const [wx, wy] = seatPos(seats, i); c.strokeStyle = 'rgba(241,236,225,.6)'; c.lineWidth = 2.5;
    if (BAG) { c.beginPath(); c.arc(wx, wy + 14, 13, 0, 7); c.stroke(); if (i < filled) { c.fillStyle = COL.coral; c.beginPath(); c.arc(wx, wy + 14, 10, 0, 7); c.fill(); } }
    else { c.strokeRect(wx - 14, wy - 13, 28, 26); if (i < filled) { c.fillStyle = COL.cream; c.beginPath(); c.arc(wx, wy + 2, 8.5, 0, 7); c.fill(); } } }
  if (!BAG) { c.strokeStyle = COL.yel; c.lineWidth = 3; c.strokeRect(w / 2 - 14, -h + 2, 6, 30);
    [x0 + 32, w / 2 - 32].forEach(wx => { c.fillStyle = COL.board; c.strokeStyle = COL.cream; c.lineWidth = 3; c.beginPath(); c.arc(wx, -6, 11, 0, 7); c.fill(); c.stroke(); }); }
  c.restore(); };
const road = (c, a = 1) => { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = COL.dim; c.lineWidth = 3; c.beginPath(); c.moveTo(-BW / 2, ROAD + 6); c.lineTo(BW / 2, ROAD + 6); c.stroke();
  if (!BAG) { c.setLineDash([26, 22]); c.lineWidth = 2; c.beginPath(); c.moveTo(-BW / 2, ROAD + 30); c.lineTo(BW / 2, ROAD + 30); c.stroke(); } c.restore(); };
// 一个人/苹果从 from 跳到 to（抛物线），跳的过程中缩小；返回 true = 已经落进容器（由容器画）
const hop = (c, t, from, to, t0, d = 0.32, s0 = 1, s1 = 0.4) => { if (t < t0) { item(c, from[0], from[1], s0); return false; } const q = seg(S12(t), t0, t0 + d); if (q >= 1) return true;
  const e = MO.cubicInOut(q); item(c, lerp(from[0], to[0], e), lerp(from[1], to[1], e) - 110 * Math.sin(Math.PI * q), lerp(s0, s1, e)); return false; };
const landY = (by, sy, bs) => by + (sy + (BAG ? 30 : 22)) * bs;
const boardCol = (c, t, n, pos, seats, bx, by, bs, t0, gap = 0.07, d = 0.32, s0 = 1) => { let k = 0;
  for (let j = 0; j < n; j++) { const [sx, sy] = seatPos(seats, j); if (hop(c, t, pos(j), [bx + sx * bs, landY(by, sy, bs)], t0 + j * gap, d, s0, 0.45 * bs + 0.1)) k++; } return k; };
const busMove = (t, a, b, from, to) => { const q = MO.cubicInOut(seg(t, a, b)); return [lerp(from[0], to[0], q), lerp(from[1], to[1], q), lerp(from[2], to[2], q)]; };
const leave = (t, at, d = 1.0) => { const q = seg(t, at, at + d); return q * q * 1250; };                 // 开走 / 提走：先慢后快
const num = (c, s, x, y, size, t, at, col = COL.yel) => { if (t < at) return; const s2 = pop(t, at); c.save(); c.translate(x, y); c.scale(s2, s2); txt(c, s, 0, 0, size, col); c.restore(); };
// 方阵：cols 列（份数）× rows 行（每份几个），按数量自动排版
const grid = (cols, rows) => { const w = Math.min(720, (cols - 1) * 160), dy = Math.min(80, 330 / Math.max(1, rows - 1));
  return { cols, rows, seats: rows, x: i => cols > 1 ? -w / 2 + i * w / (cols - 1) : 0, y: j => 360 - (rows - 1 - j) * dy, s: Math.min(1.2, dy / 76),
    slot: k => { const sp = Math.min(175, 790 / Math.max(1, cols - 1)); return -sp * (cols - 1) / 2 + k * sp; },
    slotS: Math.min(0.5, 0.88 * Math.min(175, 790 / Math.max(1, cols - 1)) / busW(rows)) }; };
const GA = grid(TP.q || 1, TP.a || 1), GB = TP.b ? grid(TP.qb, TP.b) : null;
const SLOT_Y = -295, STOP = -200, BS0 = 1.3;
const kBS = () => Math.min(BS0, 940 / (TP.k * busW(TP.a) + (TP.k - 1) * 16));
const kX = b => { const s = kBS(), w = busW(TP.a) * s; return -475 + w / 2 + b * (w + 16); };
// 开头 / 演「a×k」：k 个容器各装 a 个，开走后剩下的圈起来
const kVehicles = (c, t, arrive, boardAt, goAt) => { const s = kBS(); let k = [...Array(TP.k)].map(() => TP.a);
  const dx = b => arrive != null ? -900 * (1 - MO.cubicOut(seg(t, arrive + b * 0.12, arrive + b * 0.12 + 0.6))) : 0;
  if (boardAt != null) k = k.map((_, b) => boardCol(c, t, TP.a, j => [GA.x(b), GA.y(j)], TP.a, kX(b) + dx(b), ROAD, s, boardAt + b * 0.2, 0.07, 0.32, GA.s));
  k.forEach((n, b) => { if (arrive != null && t < arrive + b * 0.12) return; vehicle(c, kX(b) + dx(b) + leave(t, goAt + b * 0.12), ROAD, TP.a, n, s); }); };
const leftRest = (c, t, at) => { if (t < at) return; const x0 = GA.x(TP.k), x1 = GA.x(GA.cols - 1), y0 = GA.y(0), y1 = GA.y(GA.rows - 1);
  ring(c, (x0 + x1) / 2, (y0 + y1) / 2 - 20 * GA.s, (x1 - x0) / 2 + 90, (y1 - y0) / 2 + 60, COL.yel, fadeIn(t, at)); num(c, `${TP.rem} ${TP.short}`, (x0 + x1) / 2, -95, 64, t, at); };
const restCrowd = c => { for (let i = TP.k; i < GA.cols; i++) for (let j = 0; j < GA.rows; j++) item(c, GA.x(i), GA.y(j), GA.s); };
const pageT1 = (c, t) => { road(c); restCrowd(c); kVehicles(c, t, null, null, Q.hookGo); leftRest(c, t, Q.hook25); };
const pageT2 = (c, t) => { road(c); restCrowd(c); kVehicles(c, t, Q.bus2, Q.board2, Q.go2); leftRest(c, t, Q.left25);
  chalk(c, `${TP.a} ×`, -290, -335, 66, t, Q.eq52, 0.25, COL.cream, KAI, 'right'); chalk(c, String(TP.k), -232, -335, 66, t, Q.eq52 + 0.25, 0.125); chalk(c, `= ${TP.r}`, -174, -335, 66, t, Q.eq52 + 0.375, 0.25, COL.cream, KAI, 'left');
  if (t >= Q.ring2) ring(c, -232, -337, 32, 42, COL.yel, fadeIn(t, Q.ring2));
  if (t >= Q.zhong) { const q = seg(S12(t), Q.zhong, Q.zhong + 0.3); c.save(); c.strokeStyle = COL.yel; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-222, -296); c.lineTo(lerp(-222, -160, q), lerp(-296, -252, q)); c.stroke(); c.restore();
    chalk(c, TP.kSrc, -150, -240, 56, t, Q.zhong + 0.25, 0.4, COL.cream, KAI, 'left'); }
  if (t >= Q.notTwo) tag(c, `不是 ${TP.k} ${TP.unit}`, 300, -240, 44, t, Q.notTwo, COL.red, '#f6efe4'); };
// 一份一份装：第 0 列先装进停在跟前的大容器，大容器缩到上方第 1 个位置；之后每数一个数，一列直接跳进上方一个小容器
const loadAll = (c, t, g, busIn, busBoard, mv, counts) => {
  road(c, 1 - seg(t, mv, mv + 0.5));
  const first = busMove(t, mv, mv + 0.6, [STOP, ROAD, BS0], [g.slot(0), SLOT_Y, g.slotS]);
  for (let i = 1; i < g.cols; i++) { const t0 = counts[i] - 0.3; let k = 0;
    for (let j = 0; j < g.rows; j++) { const [sx, sy] = seatPos(g.seats, j); if (hop(c, t, [g.x(i), g.y(j)], [g.slot(i) + sx * g.slotS, landY(SLOT_Y, sy, g.slotS)], t0 + j * 0.03, 0.3, g.s, 0.35)) k++; }
    if (t >= t0) vehicle(c, g.slot(i), SLOT_Y, g.seats, k, g.slotS * Math.min(1, pop(t, t0 - 0.1, 0.2) || 0)); }
  const dx = -900 * (1 - MO.cubicOut(seg(t, busIn, busIn + 0.6))); let k0 = g.rows;
  if (t < mv) k0 = boardCol(c, t, g.rows, j => [g.x(0), g.y(j)], g.seats, STOP + dx, ROAD, BS0, busBoard, 0.09, 0.34, g.s);
  if (t >= busIn) vehicle(c, t < mv ? STOP + dx : first[0], t < mv ? ROAD : first[1], g.seats, k0, t < mv ? BS0 : first[2]);
  counts.forEach((at, k) => num(c, String(k + 1), g.slot(k), -370, 40, t, at)); };
const pageT3 = (c, t) => { loadAll(c, t, GA, Q.busIn, Q.busBoard, Q.count[0] - 0.75, Q.count);
  if (t >= Q.allDone && t < Q.eqDiv) { c.save(); c.globalAlpha = 1 - seg(t, Q.eqDiv - 0.5, Q.eqDiv - 0.1); check(c, 0, 140, 50 * pop(t, Q.allDone)); c.restore(); }
  brace(c, GA.slot(0) - 55, GA.slot(GA.cols - 1) + 55, -240, MO.smooth(seg(t, Q.seven5, Q.seven5 + 0.5)), COL.dim); chalk(c, `${TP.q} 个 ${TP.a}`, 0, -188, 56, t, Q.seven5 + 0.375, 0.4);
  chalk(c, `${TP.N} ÷ ${TP.a} = ${TP.q}（${TP.M}）`, 0, 90, 90, t, Q.eqDiv, 0.6);
  if (t >= Q.useDiv) tag(c, `求有几个 ${TP.a}，用除法`, 0, 290, 48, t, Q.useDiv); };
// 检查页：N 个按 a 个一组排开；「a×k」那一行只亮 a×k 个（装上的），其余暗着（没装上的）
const MU = Math.min(22, 880 / (TP.N + (GA.cols - 1) * 1.1 || 1));
const miniX = i => -440 + i * MU + Math.floor(i / TP.a) * 1.1 * MU;
const mini = (c, nLit, lit, y, at, t, gap) => { for (let i = 0; i < TP.N; i++) { const on = i < nLit && t >= lit + i * gap; item(c, miniX(i), y, 0.72 * MU / 22 * pop(t, at + i * 0.012), on ? COL.cream : 'rgba(241,236,225,.22)'); } };
const pageT4 = (c, t) => { chalk(c, '用乘法检查', 0, -345, 46, t, Q.page4 + 0.375, 0.4, COL.dim); const r = TP.r, R = TP.N - 1;
  chalk(c, `${TP.a} × ${TP.k} = ${r}`, -190, -225, 72, t, Q.chk1, 0.4); if (t >= Q.chk1) mini(c, r, Q.chk1 + 0.3, -100, Q.chk1, t, 0.05);
  if (t >= Q.chk1) { brace(c, miniX(0) - 12, miniX(r - 1) + 12, -62, MO.smooth(seg(t, Q.chk1 + 0.9, Q.chk1 + 1.3)), COL.cream); chalk(c, `${r} ${TP.short}`, (miniX(0) + miniX(r - 1)) / 2, -20, 40, t, Q.chk1 + 1.1, 0.3); }
  if (t >= Q.chk1x) { cross(c, 130, -225, 30, seg(S12(t), Q.chk1x, Q.chk1x + 0.4));
    brace(c, miniX(r) - 12, miniX(R) + 12, -62, MO.smooth(seg(t, Q.chk1x + 0.2, Q.chk1x + 0.7)), COL.coral); chalk(c, `${TP.rem} ${TP.short}${TP.notOn}`, (miniX(r) + miniX(R)) / 2, -20, 40, t, Q.chk1x + 0.5, 0.4, COL.coral); }
  chalk(c, `${TP.q} × ${TP.a} = ${TP.N}`, -190, 90, 72, t, Q.chk2, 0.4); if (t >= Q.chk2) mini(c, TP.N, Q.chk2 + 0.3, 205, Q.chk2, t, 0.03);
  if (t >= Q.chk2v) { check(c, 130, 90, 32 * pop(t, Q.chk2v)); chalk(c, `${TP.N} ${TP.short}${TP.allOn}`, 290, 90, 40, t, Q.chk2v + 0.2, 0.4, COL.green); }
  if (!TP.b && t >= Q.rule) tag(c, `${TP.N} 里有几个 ${TP.a}，就要几${TP.unit}`, 0, 330, 50, t, Q.rule); };
const pageT5 = (c, t) => { loadAll(c, t, GB, Q.busIn7, Q.busBoard7, Q.how7 + 0.25, Q.count7);
  chalk(c, `${TP.N} ÷ ${TP.b} = ${TP.qb}（${TP.M}）`, 0, 150, 90, t, Q.eqDiv7, 0.6); };
const rowOf = (c, n, seats, y, at, t) => { const s = Math.min(0.5, 880 / (n * busW(seats) * 1.12)), w = busW(seats) * s * 1.12, x0 = -w * (n - 1) / 2;
  for (let k = 0; k < n; k++) vehicle(c, x0 + k * w, y, seats, seats, s * pop(t, at + k * 0.07)); };
const pageT6 = (c, t) => {
  if (t >= Q.rowA) { txt(c, TP.nameA, -440, -300, 48, COL.cream, KAI, 'left'); num(c, `${TP.q} ${TP.M}`, 380, -300, 60, t, Q.rowA + 0.6); }
  rowOf(c, TP.q, TP.a, -165, Q.rowA, t);
  if (t >= Q.rowB) { txt(c, TP.nameB, -440, -45, 48, COL.cream, KAI, 'left'); num(c, `${TP.qb} ${TP.M}`, 380, -45, 60, t, Q.rowB + 0.5); }
  rowOf(c, TP.qb, TP.b, 85, Q.rowB, t);
  if (t >= Q.pick) { c.save(); c.globalAlpha = fadeIn(t, Q.pick); c.strokeStyle = COL.green; c.lineWidth = 5; c.beginPath(); c.roundRect(-470, -100, 940, 220, 22); c.stroke(); c.restore(); check(c, 250, -45, 30 * pop(t, Q.pick)); }
  if (t >= Q.rule) tag(c, `${TP.N} 里有几个 ${TP.a}，就要几${TP.unit}`, 0, 285, 52, t, Q.rule); };
// ---------- 讲解模板「至少添上几个，至少拿走几个」第 2 版（D.tpl === 'rem'，参数 D.p，tools/tpl_rem.py）----------
// 7 只猴子一排；每只猴子下面一列格子，一格一根香蕉（数得清）；地上的香蕉一排 8 根。慢慢发：第一轮一根一根，第二轮完整一遍，后面每轮停一下。
const RP = D.p || {}, RG = RP.g || 7, RQ = RP.q || 5;
const MX = k => -390 + k * 780 / Math.max(1, RG - 1), MY = -335, CELL = j => -262 + j * 33, CW = 92, CHH = 29;
const BPX = i => -350 + (i % 8) * 100, BPY = i => 70 + Math.floor(i / 8) * 54;
const banana = (c, x, y, s = 1, a = 1) => { if (s <= 0 || a <= 0) return; c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(s * 1.35, s * 1.35); c.globalAlpha *= a;
  c.fillStyle = COL.yel; c.strokeStyle = '#b8951c'; c.lineWidth = 2; c.beginPath(); c.moveTo(-22, -2); c.quadraticCurveTo(0, 18, 22, -4); c.quadraticCurveTo(2, 7, -22, -2); c.fill(); c.stroke();
  c.fillStyle = '#6b4a2b'; c.beginPath(); c.arc(-22, -2, 2.5, 0, 7); c.fill(); c.restore(); };
// 猴子：hands 0–1 = 举手等香蕉（期待，不是难过）
const monkey = (c, x, y, s = 1, hands = 0) => { c.save(); c.translate(x, y); c.scale(s, s);
  if (hands > 0) { c.strokeStyle = '#a0704a'; c.lineWidth = 7; c.lineCap = 'round'; [-1, 1].forEach(d => { const hx = d * (30 + 20 * hands), hy = 20 - 58 * hands; c.beginPath(); c.moveTo(d * 22, 22); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = '#f0d9b5'; c.beginPath(); c.arc(hx, hy, 8, 0, 7); c.fill(); }); }
  c.fillStyle = '#a0704a'; [[-27, -4], [27, -4]].forEach(([ex, ey]) => { c.beginPath(); c.arc(ex, ey, 11, 0, 7); c.fill(); }); c.beginPath(); c.arc(0, 0, 28, 0, 7); c.fill();
  c.fillStyle = '#f0d9b5'; c.beginPath(); c.ellipse(0, 7, 18, 15, 0, 0, 7); c.fill(); c.fillStyle = COL.ink; [-8, 8].forEach(ex => { c.beginPath(); c.arc(ex, -5, 3, 0, 7); c.fill(); });
  c.strokeStyle = COL.ink; c.lineWidth = 2; c.beginPath(); c.arc(0, 9, 6, 0.2, Math.PI - 0.2); c.stroke(); c.restore(); };
const cellBox = (c, k, j, a = 1, col = 'rgba(241,236,225,.16)', dash = false, lw = 2) => { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash([7, 5]);
  c.beginPath(); c.roundRect(MX(k) - CW / 2, CELL(j) - CHH / 2, CW, CHH, 6); c.stroke(); c.restore(); };
const cellXY = (k, j) => [MX(k), CELL(j) + 4];
const flyTo = (t, t0, from, to, d = 0.4, arc = 90) => { const q = seg(S12(t), t0, t0 + d); if (q <= 0) return from; if (q >= 1) return to; const e = MO.cubicInOut(q); return [lerp(from[0], to[0], e), lerp(from[1], to[1], e) - arc * Math.sin(Math.PI * q)]; };
const label = (c, s, x, y, size, t, at, until = 1e9, col = COL.yel) => { if (t < at || t >= until) return; num(c, s, x, y, size, t, at, col); };
// 发香蕉的顺序：从地上最后一根往前拿；剩下的是最前面 r 根（0..r-1）。A[p] = {k: 第几只猴子, j: 第几轮, s: 开始飞的时间}
const dealPlan = (rounds) => { const N = RP.N, A = {}; let p = N - 1;
  rounds.forEach((ts, j) => { for (let k = 0; k < RG && p >= RP.r; k++, p--) A[p] = { k, j, s: ts[k] }; }); return A; };
const roundTimes = () => { const r1 = Q.r1, r2 = [...Array(RG)].map((_, k) => Q.r2 + 0.25 + k * 0.16), rk = Q.rk.map(t0 => [...Array(RG)].map((_, k) => t0 + k * 0.06)); return [r1, r2, ...rk]; };
const pageR1 = (c, t) => {   // 开头：每只猴子已经有 q 根，地上 r 根；增加 ka 根 → 再发一轮 → 还剩几根？
  const left = (RP.r + RP.ka) % RG, n = RP.r + RP.ka;
  for (let k = 0; k < RG; k++) { monkey(c, MX(k), MY); for (let j = 0; j <= RQ; j++) cellBox(c, k, j); for (let j = 0; j < RQ; j++) banana(c, ...cellXY(k, j), 0.85); }
  for (let i = 0; i < n; i++) { if (i >= RP.r && t < Q.hkAdd + (i - RP.r) * 0.1) continue; const s0 = i >= RP.r ? pop(t, Q.hkAdd + (i - RP.r) * 0.1) : 1;
    const dealt = i >= left, k = n - 1 - i, t0 = Q.hkDeal + k * 0.14; const pos = dealt ? flyTo(t, t0, [BPX(i), BPY(i)], cellXY(k, RQ)) : [BPX(i), BPY(i)]; banana(c, pos[0], pos[1], dealt && t > t0 ? lerp(1, 0.85, seg(t, t0, t0 + 0.4)) : s0); }
  if (t >= Q.hkLeft) { const x1 = BPX(left - 1); ring(c, (BPX(0) + x1) / 2, BPY(0), (x1 - BPX(0)) / 2 + 70, 46, COL.yel, fadeIn(t, Q.hkLeft)); num(c, `还剩 ${left} ${RP.M}`, x1 + 190, BPY(0), 54, t, Q.hkLeft); num(c, '?', 0, 260, 130, t, Q.hkLeft + 0.3); } };
const pageR2 = (c, t) => { const N = RP.N, r = RP.r, need = RP.need, g = RG, A = dealPlan(roundTimes());
  const waitOn = (t >= Q.place + 0.5 && t < Q.away) || (t >= Q.back + 0.5 && t < Q.add2 + 0.3) || (t >= Q.try5 + 0.4 && t < Q.give2 + 0.4);   // 拿走那一段大家都一样多，没人在等
  for (let k = 0; k < g; k++) { monkey(c, MX(k), MY, 1, k >= r && waitOn ? Math.min(1, (t - (t >= Q.try5 ? Q.try5 + 0.4 : t >= Q.back ? Q.back + 0.5 : Q.place + 0.5)) * 3) : 0);
    for (let j = 0; j <= RQ; j++) cellBox(c, k, j, t >= Q.page2 + 0.3 ? 1 : 0); }
  // 前 q 轮
  for (let p = N - 1; p >= r; p--) { const a = A[p], home = [BPX(p), BPY(p)], to = cellXY(a.k, a.j); const pos = flyTo(t, a.s, home, to); banana(c, pos[0], pos[1], t > a.s ? lerp(1, 0.85, seg(t, a.s, a.s + 0.4)) : 1); }
  // 剩下的 r 根：放到前 r 只猴子的第 q+1 格 → 拿走飞出去 → 要增加时飞回来
  for (let p = 0; p < r; p++) { const home = [BPX(p), BPY(p)], cell = cellXY(p, RQ), off = [520 + p * 30, -300]; let pos = home, sc = 1;
    if (t >= Q.place) { pos = flyTo(t, Q.place + p * 0.15, home, cell); sc = lerp(1, 0.85, seg(t, Q.place + p * 0.15, Q.place + p * 0.15 + 0.4)); }
    if (t >= Q.away && t < Q.back) pos = flyTo(t, Q.away + p * 0.08, cell, off, 0.5, 60);
    if (t >= Q.back) pos = flyTo(t, Q.back + p * 0.08, off, cell, 0.5, 60);
    banana(c, pos[0], pos[1], sc); }
  // 空着的格子：还差的
  const dashA = (t >= Q.place + 0.4 && t < Q.away) || (t >= Q.back + 0.5 && t < Q.add2 + 0.2) || (t >= Q.try5 + 0.4 && t < Q.give2 + 0.4);
  if (dashA) for (let k = r; k < g; k++) cellBox(c, k, RQ, 1, t >= Q.need ? COL.yel : COL.coral, true, 3);
  // 增加 need 根（第 9 句），到第 10 句开头收走
  for (let i = 0; i < need; i++) { const at = Q.add2 + i * 0.25; if (t < at) continue; const a = t >= Q.try5 ? 1 - seg(t, Q.try5, Q.try5 + 0.3) : 1; banana(c, ...cellXY(r + i, RQ), 0.85 * pop(t, at), a); }
  // 如果增加 ka 根：need 根给最后几只猴子，多出来的留在地上
  if (t >= Q.try5 + 0.4) for (let i = 0; i < RP.ka; i++) { const home = [-(RP.ka - 1) * 55 + i * 110, 200], at = Q.try5 + 0.4 + i * 0.1; if (t < at) continue;
    const pos = i < need ? flyTo(t, Q.give2 + i * 0.2, home, cellXY(r + i, RQ)) : home; banana(c, pos[0], pos[1], (i < need && t > Q.give2 + i * 0.2 ? 0.85 : 1) * pop(t, at)); }
  if (t >= Q.left3) { const x0 = -(RP.ka - 1) * 55 + need * 110, x1 = (RP.ka - 1) * 55; ring(c, (x0 + x1) / 2, 200, (x1 - x0) / 2 + 70, 46, COL.yel, fadeIn(t, Q.left3)); label(c, `还多出 ${RP.ka - need} ${RP.M}`, (x0 + x1) / 2, 120, 46, t, Q.left3); }
  if (t >= Q.short2) chalk(c, '又不够一轮了', 0, 330, 54, t, Q.short2, 0.5, COL.coral);
  // 文字：第几轮 / 每只几根 / 一共发了 / 还剩
  const ends = [Q.r1end, Q.r2, ...Q.rk.slice(1), Q.each]; let n = 0; [Q.r1[0], Q.r2 + 0.25, ...Q.rk].forEach(at => { if (t >= at) n++; });
  if (n && t < Q.each) label(c, `第 ${n} 轮`, 0, -40, 54, t, [Q.r1[0], Q.r2 + 0.25, ...Q.rk][n - 1]);
  label(c, `每只 ${RQ} ${RP.M}`, 0, -40, 54, t, Q.each, Q.sent); label(c, `一共发了 ${RQ * g} ${RP.M}`, 0, -40, 54, t, Q.sent, Q.left);
  if (t >= Q.left && t < Q.place) { const x1 = BPX(r - 1); ring(c, (BPX(0) + x1) / 2, BPY(0), (x1 - BPX(0)) / 2 + 70, 46, COL.yel, fadeIn(t, Q.left)); num(c, `还剩 ${r} ${RP.M}`, x1 + 190, BPY(0), 54, t, Q.left); }
  label(c, `${r} ${RP.M}不够一轮`, 0, -40, 50, t, Q.short, Q.away, COL.coral);
  label(c, `还差 ${need} ${RP.M}`, 0, -40, 54, t, Q.need, Q.add2 + 0.2);
  if (t >= Q.ansRemove && t < Q.back) tag(c, `至少拿走 ${r} ${RP.M}`, 0, 120, 64, t, Q.ansRemove, COL.cream, COL.ink);
  if (t >= Q.ansAdd && t < Q.try5) tag(c, `至少增加 ${need} ${RP.M}`, 0, 120, 64, t, Q.ansAdd, COL.cream, COL.ink); };
// 数轴上的「口诀石头」：g 的得数一块一块排开；小猴子一跳 g 格
const stoneLine = (c, t, o) => { const X = v => -430 + v * 860 / o.top, Y = o.y;
  c.save(); c.strokeStyle = COL.dim; c.lineWidth = 3; c.beginPath(); c.moveTo(X(0), Y); c.lineTo(X(o.top) + 20, Y); c.stroke(); c.restore(); txt(c, '0', X(0), Y + 42, 32, COL.dim);
  o.times.forEach((at, i) => { if (t < at) return; const v = o.g * (i + 1), s = pop(t, at); c.save(); c.translate(X(v), Y); c.scale(s, s); c.fillStyle = 'rgba(242,217,78,.18)'; c.strokeStyle = COL.yel; c.lineWidth = 4;
    c.beginPath(); c.roundRect(-42, -27, 84, 54, 12); c.fill(); c.stroke(); txt(c, String(v), 0, 2, 38, COL.yel); c.restore(); });
  if (o.hop) { let i = -1; o.times.forEach((at, k) => { if (t >= at - 0.25) i = k; }); const pv = i < 0 ? 0 : o.g * (i + 1), prev = i <= 0 ? 0 : o.g * i, q = i < 0 ? 1 : seg(t, o.times[i] - 0.25, o.times[i] + 0.05);
    monkey(c, lerp(X(prev), X(pv), MO.cubicInOut(q)), Y - 70 - 60 * Math.sin(Math.PI * q), 0.7); }
  if (o.mark != null && t >= o.mark) { const x = X(o.N), s = pop(t, o.mark); c.save(); c.translate(x, Y); c.scale(s, s); c.fillStyle = COL.cream; c.beginPath(); c.moveTo(0, -6); c.lineTo(-12, -30); c.lineTo(12, -30); c.fill(); txt(c, String(o.N), 0, -60, 46, COL.cream); c.restore(); }
  const arm = (to, at, txtS, col, side) => { if (at == null || t < at) return; const x0 = X(o.N), x1 = X(to), q = MO.smooth(seg(t, at, at + 0.5)); c.save(); c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, Y + 50); c.lineTo(lerp(x0, x1, q), Y + 50); c.stroke(); if (q >= 1) { c.beginPath(); c.moveTo(x1, Y + 50); c.lineTo(x1 + side * 14, Y + 40); c.moveTo(x1, Y + 50); c.lineTo(x1 + side * 14, Y + 60); c.stroke(); } c.restore();
    chalk(c, txtS, x1 + (side > 0 ? -30 : 30), Y + 52, 40, t, at + 0.3, 0.4, col, KAI, side > 0 ? 'right' : 'left'); };
  arm(o.lo, o.down, o.downTxt, COL.coral, 1); arm(o.hi, o.up, o.upTxt, COL.green, -1); };
const pageR3 = (c, t) => { chalk(c, `${RG} 的口诀得数`, 0, -330, 52, t, Q.title3, 0.5, COL.cream);
  stoneLine(c, t, { g: RG, top: RP.top * RG, y: -120, times: Q.stones, hop: true, N: RP.N, mark: Q.mark, lo: RP.lo, hi: RP.hi, down: Q.down, up: Q.up, downTxt: '往下找', upTxt: '往上找' });
  if (t >= Q.downAns) tag(c, `拿走 ${RP.r}`, -230, 200, 64, t, Q.downAns, COL.cream, COL.ink);
  if (t >= Q.upAns) tag(c, `添上 ${RP.need}`, 230, 200, 64, t, Q.upAns, COL.cream, COL.ink); };
const pageR4 = (c, t) => { if (t >= Q.quiz) tag(c, '轮到你了', 0, -340, 50, t, Q.quiz, COL.yel, COL.ink);
  chalk(c, `${RP.zN} ${RP.zM}${RP.zitem}，每 ${RP.zg} ${RP.zM}一${RP.zunit}`, 0, -240, 56, t, Q.qtext, 0.6); chalk(c, `至少拿走几${RP.zM}？`, 0, -160, 56, t, Q.qtext + 0.8, 0.5);
  const qs = Q.qstones[0]; chalk(c, `想一想 ${RP.zg} 的口诀`, 0, -70, 44, t, Q.hint, 0.5, COL.dim);
  Q.cd.forEach((at, i) => { if (t >= at && t < (Q.cd[i + 1] ?? qs - 0.3)) { const s = pop(t, at); c.save(); c.translate(0, 140); c.scale(s, s); c.strokeStyle = COL.yel; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 80, 0, 7); c.stroke(); txt(c, String(3 - i), 0, 4, 110, COL.yel); c.restore(); } });
  if (t >= Q.cd[0] - 0.4 && t < qs - 0.3) chalk(c, '先暂停，想一想', 0, 300, 44, t, Q.cd[0] - 0.4, 0.4, COL.dim);
  if (t >= qs - 0.3) { stoneLine(c, t, { g: RP.zg, top: RP.zhi + RP.zg, y: 100, times: Q.qstones, hop: false, N: RP.zN, mark: Q.qmark, lo: RP.zlo, hi: RP.zhi, down: Q.qdown, up: null, downTxt: `多 ${RP.zr}` });
    if (t >= Q.qans) tag(c, `拿走 ${RP.zr} ${RP.zM}`, 0, 320, 64, t, Q.qans, COL.cream, COL.ink); } };
const pageR5 = (c, t) => { const arrow = (x, dir, col, at) => { if (t < at) return; const a = fadeIn(t, at); c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - dir * 120, -60); c.lineTo(x + dir * 120, -60); c.moveTo(x + dir * 120, -60); c.lineTo(x + dir * 90, -88); c.moveTo(x + dir * 120, -60); c.lineTo(x + dir * 90, -32); c.stroke(); c.restore(); };
  arrow(-230, -1, COL.coral, Q.e1); if (t >= Q.e1) tag(c, '拿走 往下找', -230, 40, 56, t, Q.e1, COL.cream, COL.ink);
  arrow(230, 1, COL.green, Q.e2); if (t >= Q.e2) tag(c, '添上 往上找', 230, 40, 56, t, Q.e2, COL.cream, COL.ink);
  chalk(c, '找最近的口诀得数', 0, 220, 60, t, Q.e3, 0.6, COL.yel); };
// 第一段的小结：上一行 r 根（多出来的）→ 拿走；下一行 r 根 + 还差的空格 → 增加
const pageR6 = (c, t) => { const r = RP.r, g = RG, x = i => (i - (g - 1) / 2) * 92;
  if (t >= Q.sum1) { for (let i = 0; i < r; i++) banana(c, x(i), -170, pop(t, Q.sum1 + i * 0.06)); tag(c, `拿走：看多出来几${RP.M}`, 0, -60, 52, t, Q.sum1 + 0.25, COL.cream, COL.ink); }
  if (t >= Q.sum2) { for (let i = 0; i < g; i++) { if (i < r) banana(c, x(i), 110, pop(t, Q.sum2 + i * 0.06)); else { c.save(); c.globalAlpha = fadeIn(t, Q.sum2 + 0.4); c.strokeStyle = COL.yel; c.lineWidth = 3; c.setLineDash([7, 5]); c.beginPath(); c.roundRect(x(i) - 28, 92, 56, 36, 8); c.stroke(); c.restore(); } }
    tag(c, `增加：看下一轮还差几${RP.M}`, 0, 220, 52, t, Q.sum2 + 0.25, COL.cream, COL.ink); } };
// 第二段开头：猴子一排、地上一大堆香蕉（一根一根分要分好久）
const pageR7 = (c, t) => { for (let k = 0; k < RG; k++) monkey(c, MX(k), MY, pop(t, Q.intro + k * 0.05) || 0.001);
  for (let i = 0; i < RP.N; i++) banana(c, BPX(i), BPY(i) - 60, pop(t, Q.intro + 0.3 + i * 0.015));
  label(c, `${RP.N} ${RP.M}，分给 ${RG} 只${RP.who}`, 0, -170, 54, t, Q.intro + 0.4);
  if (t >= Q.slow) { const q = (Math.sin(t * 6) + 1) / 2; c.save(); c.globalAlpha = 0.6 + 0.4 * q; txt(c, '……', 0, 300, 80, COL.dim); c.restore(); } };
const PAGE = D.tpl === 'rem' ? (RP.part === 2 ? { 1: pageR7, 2: pageR3, 3: pageR4, 4: pageR5 } : { 1: pageR1, 2: pageR2, 3: pageR6 }) : D.tpl === 'div' ? { 1: pageT1, 2: pageT2, 3: pageT3, 4: pageT4, ...(TP.b ? { 5: pageT5, 6: pageT6 } : {}) } : D.kind === 'A' ? { 1: pageA1, 2: pageA2, 3: pageA3 } : { 1: pageB1, 2: pageB2 };
const drawBoard = (c, t) => { const p0 = pages[0][1]; if (t < p0 - 0.6) return; const a = MO.smooth(seg(t, p0 - 0.6, p0 - 0.1));
  c.save(); c.translate(BX, BY); c.globalAlpha = a; c.translate(0, (1 - a) * 60);
  c.save(); c.translate(-BW / 2, -BH / 2); c.shadowColor = 'rgba(40,30,15,.35)'; c.shadowBlur = 14; c.shadowOffsetY = 8; c.fillStyle = COL.board; CL.tornRect(c, BW, BH, 77, 5); c.fill(); c.restore();
  c.save(); c.globalAlpha *= 0.05; c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const r = U.rng(i * 31 + 7); c.fillRect(-BW / 2 + r() * BW, -BH / 2 + r() * BH, 60 + r() * 140, 2); } c.restore();
  CL.tape(c, -BW / 2 + 70, -BH / 2 + 6, -0.6, 150); CL.tape(c, BW / 2 - 70, -BH / 2 + 6, 0.6, 150);
  const p = Math.max(pages[0][0], pageAt(t)), at = pages.find(([n]) => n === p)[1], prev = pages.find(([n]) => n === p - 1);
  const wq = MO.cubicInOut(seg(t, at - 0.05, at + 0.45)), front = -BW / 2 + wq * BW;
  c.save(); c.beginPath(); c.rect(-BW / 2, -BH / 2, BW, BH); c.clip();
  if (prev && wq < 1) { c.save(); c.beginPath(); c.rect(front, -BH / 2, BW, BH); c.clip(); PAGE[p - 1](c, t); c.restore(); c.save(); c.beginPath(); c.rect(-BW / 2, -BH / 2, front + BW / 2, BH); c.clip(); PAGE[p](c, t); c.restore();
    c.fillStyle = 'rgba(241,236,225,.12)'; c.fillRect(front - 30, -BH / 2, 60, BH); }
  else PAGE[p](c, t);
  c.restore(); c.restore(); };

// ---------- 标题标签、字幕 ----------
const drawHeader = (c, t) => { const [a, b] = D.header; MD.label(c, a, 60, 96, { size: 40, fam: 'PuHui-Heavy', align: 'left', bg: COL.red, fg: '#f6efe4', r: -0.02 });
  c.save(); c.font = '40px "PuHui-Heavy"'; const w = c.measureText(a).width + 40 * 0.84; c.restore(); MD.label(c, b, 60 + w + 18, 98, { size: 40, fam: KAI, align: 'left', r: 0.01 }); };
const SUB_Y = 1565; let SUB_BAND = null;
const subBand = () => SUB_BAND || (SUB_BAND = (() => { const cv = document.createElement('canvas'); cv.width = W; cv.height = 230; const g = cv.getContext('2d');
  g.fillStyle = g.createPattern(CL.paperTile('desk', COL.desk, { amt: 12, grain: 10, fibers: 320, seed: 5 }), 'repeat'); g.fillRect(0, 0, W, 230);
  const gr = g.createLinearGradient(0, 0, 0, 230); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.28, 'rgba(0,0,0,.93)'); gr.addColorStop(0.72, 'rgba(0,0,0,.93)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, W, 230); return cv; })());
const camMoving = t => { const a = camAt(t - 0.04), b = camAt(t + 0.04); return Math.hypot(b.x - a.x, b.y - a.y) * b.z > 3 || Math.abs(Math.log(b.z / a.z)) > 0.004; };
const drawSubs = (c, t) => { const s_ = D.subs.find(x => x.show && t >= x.t[0] && t < x.t[1]); if (!s_) return;
  let k = 1; for (const dt of [-0.12, -0.06, 0, 0.06, 0.12]) if (camMoving(t + dt)) k = Math.min(k, Math.abs(dt) / 0.18);
  if (s_.run) k = Math.min(k, seg(t, s_.run[0] - 0.02, s_.run[0] + 0.15), 1 - seg(t, s_.run[1] - 0.12, s_.run[1] + 0.03)); if (k <= 0.02) return;
  c.save(); c.globalAlpha = k; c.drawImage(subBand(), 0, SUB_Y - 115); c.restore();
  let size = 46; c.save(); c.font = `${size}px "PuHui-Heavy"`; let w = c.measureText(s_.text).width; if (w > 940) { size = Math.floor(size * 940 / w); c.font = `${size}px "PuHui-Heavy"`; w = c.measureText(s_.text).width; }
  const bw = Math.round(w + size * 1.3), bh = Math.round(size * 1.75);
  c.globalAlpha = k; c.save(); c.translate(540 - bw / 2, SUB_Y - bh / 2); c.shadowColor = 'rgba(40,30,15,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
  c.fillStyle = 'rgba(29,29,28,.94)'; CL.tornRect(c, bw, bh, [...s_.text].length * 7 + 11, 3); c.fill(); c.restore();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3efe6'; c.fillText(s_.text, 540, SUB_Y + size * 0.04); c.restore(); };

let deskPat = null;
SCENES.mul = {
  init() { D.strips.forEach(s => MD.size(IMG[s.photo || 'mul/photo.png']));
    U.assertGlyphs('PuHui-Heavy', [...D.subs.map(x => x.text), ...D.header].join('').replace(/\s/g, ''), 'mul');
    U.assertGlyphs(KAI, '全盘一共个你写的有几是多少求几个几是多少，用乘法相加四六二十四五十六忘了口诀就从上句再加乘法的意义：几的乘口诀人车种不辆÷（）没坐上落检查里就要', 'mul'); U.assertGlyphs(KAI, Object.values(TP).filter(v => typeof v === 'string').join('').replace(/\s/g, '') + '里有几个就要用除法检查拿走增加看多出来下一轮还差不够没分完剩发了添上至少先分一就出要的是每装袋个橘香蕉根第轮只共往下上找最近得数轮到你想暂停组支毛笔又中间', 'tpl'); },
  draw(c, lt, t) {
    const k = camAt(t + (window.CAM_DT || 0)), view = [k.x - W / 2 / k.z, k.y - H / 2 / k.z, k.x + W / 2 / k.z, k.y + H / 2 / k.z];
    c.save(); c.translate(W / 2, H / 2); c.scale(k.z, k.z); c.translate(-k.x, -k.y);
    deskPat = deskPat || c.createPattern(CL.paperTile('desk', COL.desk, { amt: 12, grain: 10, fibers: 320, seed: 5 }), 'repeat');
    c.fillStyle = deskPat; c.fillRect(view[0] - 4, view[1] - 4, view[2] - view[0] + 8, view[3] - view[1] + 8);
    drawBoard(c, t); D.strips.forEach(s => drawStrip(c, s, t));
    c.restore();
    const vg = c.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H / 2, H * 0.78); vg.addColorStop(0, 'rgba(40,30,15,0)'); vg.addColorStop(1, 'rgba(40,30,15,.2)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    drawHeader(c, t); drawSubs(c, t);
  },
};
})();
