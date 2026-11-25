/* ---------- popping & spawning ---------- */
function popFruit(f, bvx, bvy) {
  const i = fruits.indexOf(f); if (i < 0) return;
  fruits.splice(i, 1);
  lastPopped = f.type;
  const T = TYPES[f.type], s = f.size;
  const p0 = particles.length;
  burst(f);
  if (bvx || bvy) {
    const sp = Math.hypot(bvx, bvy), k = Math.min(1, unit * 18 / Math.max(1, sp)) * 0.35;
    for (let q = p0; q < particles.length; q++) { particles[q].vx += bvx * k; particles[q].vy += bvy * k * 0.6; }
  }
  effects.push({ kind: 'flash', x: f.hx, y: f.hy, r: s * 2, t: 0, dur: 0.2, color: T.glow });
  effects.push({ kind: 'ring', x: f.hx, y: f.hy, r0: s * 0.5, r1: s * 2.8, t: 0, dur: 0.45, color: T.glow, w: s * 0.16 });
  for (let k = 0; k < 10; k++) {
    const a = rand(0, TAU), sp = s * rand(3, 7);
    effects.push({ kind: 'star', x: f.hx, y: f.hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: rand(0.4, 0.8), s: s * rand(0.1, 0.22), color: Math.random() < 0.5 ? '#ffffff' : T.glow, rot: rand(0, TAU) });
  }
  shake = Math.max(shake, 0.16);
  popSound(f.type);
  for (const g of fruits) {
    const dx = g.x - f.x, dy = g.y - f.y, d = Math.hypot(dx, dy) || 1;
    if (d < unit * 5) {
      g.surpriseT = rand(0.6, 1.1); g.blinkPhase = -1; g.blink = 0;
      const imp = unit * 6 * (1 - d / (unit * 5));
      g.vx += dx / d * imp; g.vy += dy / d * imp;
    }
  }
  // random respawn: 0,1,2 or 3 new fruit, never fewer than 2 on screen, never more than maxFruit
  const n = fruits.length;
  const r = Math.random();
  let add = r < 0.25 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
  const need = Math.max(0, 2 - n);
  for (let k = 0; k < need; k++) spawnFruit('pop');
  add = Math.max(0, add - need);
  add = Math.min(add, maxFruit - fruits.length - pending.length);
  for (let k = 0; k < add; k++) pending.push({ at: t + rand(0.5, 1.4) + k * rand(0.3, 0.6), mode: Math.random() < 0.55 ? 'pop' : 'drift' });
}
function processPending() {
  for (let i = pending.length - 1; i >= 0; i--) {
    if (t >= pending[i].at) { const p = pending.splice(i, 1)[0]; if (fruits.length < maxFruit) spawnFruit(p.mode); }
  }
  if (fruits.length < 2 && pending.length === 0) spawnFruit('pop');
}

/* ---------- input: taps pop, drags swipe mess & slice fruit ---------- */
let drawOrder = [];
const pointers = new Map();   // pointerId -> state
const trails = [];            // fading swipe trails
function fruitAt(x, y, scale) {
  let hit = null, near = null, nearD = 1e9;
  for (let i = drawOrder.length - 1; i >= 0; i--) {
    const f = drawOrder[i]; if (fruits.indexOf(f) < 0) continue;
    const R = f.size * TYPES[f.type].r * 1.15 * Math.max(0.6, f.scaleNow) * (scale || 1);
    const d = Math.hypot(x - f.hx, y - f.hy);
    if (d < R) { hit = f; break; }
    if (!scale && d < R * 1.35 && d < nearD) { nearD = d; near = f; }
  }
  return hit || near;
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let u = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  const cx = ax + dx * u, cy = ay + dy * u;
  return Math.hypot(px - cx, py - cy);
}
function onDown(e) {
  if (e.cancelable) e.preventDefault();
  initAudio();
  const x = e.clientX, y = e.clientY;
  pointer = { x, y, t };
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const st = { x, y, lx: x, ly: y, lt: performance.now(), vx: 0, vy: 0, moved: 0, pts: [{ x, y, t }] };
  pointers.set(e.pointerId, st);
  const hit = fruitAt(x, y);
  if (hit) { popFruit(hit); return; }
  if (y < floorTop - unit * 0.3) {
    for (let k = 0; k < 6; k++) {
      const a = rand(0, TAU), sp = unit * rand(1.5, 3);
      effects.push({ kind: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: rand(0.3, 0.5), s: unit * rand(0.08, 0.14), color: pick(['#ffffff', '#ff7ad9', '#7af0ff', '#ffe066']), rot: rand(0, TAU) });
    }
    if (audio) sfxMiss(actx.currentTime);
  }
}
function onMove(e) {
  const x = e.clientX, y = e.clientY;
  if (pointer) { pointer.x = x; pointer.y = y; pointer.t = t; }
  const st = pointers.get(e.pointerId);
  if (!st) return;
  const now = performance.now();
  const dtm = Math.max(4, now - st.lt) / 1000;
  const dx = x - st.lx, dy = y - st.ly, seg = Math.hypot(dx, dy);
  if (seg < 1) return;
  // smoothed swipe velocity (px/s)
  const ivx = dx / dtm, ivy = dy / dtm;
  st.vx = st.vx * 0.4 + ivx * 0.6; st.vy = st.vy * 0.4 + ivy * 0.6;
  st.moved += seg;
  const speed = Math.hypot(st.vx, st.vy);
  st.pts.push({ x, y, t });
  if (st.pts.length > 24) st.pts.shift();
  if (speed > unit * 6 && st.moved > unit * 0.4) {
    // fruit-ninja: a fast swipe through a fruit pops it
    for (const f of fruits.slice()) {
      const R = f.size * TYPES[f.type].r * 0.95 * Math.max(0.6, f.scaleNow);
      if (segDist(f.hx, f.hy, st.lx, st.ly, x, y) < R) popFruit(f, st.vx, st.vy);
    }
    if (audio && t - lastSwoosh > 0.14 && speed > unit * 14) { lastSwoosh = t; sfxSwoosh(actx.currentTime, Math.min(1, speed / (unit * 40))); }
  }
  // sweep the floor mess
  if (Math.max(y, st.ly) > floorTop - unit * 0.5) sweepMess(st.lx, st.ly, x, y, st.vx, st.vy, speed);
  st.lx = x; st.ly = y; st.lt = now;
}
let lastSwoosh = 0, lastSweepSnd = 0;
function sweepMess(ax, ay, bx, by, vx, vy, speed) {
  const R = unit * 0.75;
  const sp = Math.min(speed, unit * 60);
  const nx = speed > 0 ? vx / speed : 0, ny = speed > 0 ? vy / speed : 0;
  let pushed = 0;
  for (let i = messPieces.length - 1; i >= 0; i--) {
    const p = messPieces[i];
    const d = segDist(p.x, p.y, ax, ay, bx, by);
    if (d > R + p.size) continue;
    const fall = 1 - Math.min(1, d / (R + p.size)) * 0.6;
    messPieces.splice(i, 1);
    const push = sp * fall * rand(0.7, 1.15);
    p.vx = nx * push + rand(-0.15, 0.15) * push;
    p.vd = ny * push * 0.35;                          // along floor depth
    const flick = sp > unit * 10 ? push * rand(0.12, 0.45) : 0;
    p.flung = true; p.bounces = 0;
    if (flick > 40) { p.sliding = false; p.vy = -flick; p.landY = clamp(p.y + ny * push * 0.08, floorTop + 6, H - 6); p.vr = (p.vx / Math.max(4, p.size)) * rand(0.3, 0.8); }
    else { p.sliding = true; p.vy = 0; p.landY = p.y; }
    if (particles.length < MAXP) particles.push(p); else messPieces.splice(i, 0, p);
    pushed++;
  }
  // smear juice splats a little
  const seg = Math.hypot(bx - ax, by - ay);
  for (const m of messSplats) {
    if (segDist(m.x, m.y, ax, ay, bx, by) > R * 0.8 + m.blobs[0][2]) continue;
    const shift = Math.min(seg * 0.25, unit * 0.3);
    if (m.blobs.length < 18) {
      const b0 = m.blobs[0];
      m.blobs.push([-nx * b0[2] * rand(0.4, 1.0), -ny * b0[2] * rand(0.2, 0.8) / 0.38, b0[2] * rand(0.35, 0.7)]);
    }
    m.x += nx * shift; m.y = clamp(m.y + ny * shift * 0.3, floorTop + 4, H - 4);
    m.a = Math.max(0.35, m.a * 0.97);
  }
  if (pushed && audio && t - lastSweepSnd > 0.09) { lastSweepSnd = t; sfxSlide(actx.currentTime, Math.min(1, pushed / 6 + speed / (unit * 60))); }
}
function onUp(e) {
  const st = pointers.get(e.pointerId);
  if (st && st.pts.length > 2) trails.push({ pts: st.pts, end: t });
  pointers.delete(e.pointerId);
}
function drawTrails() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const list = [];
  for (const st of pointers.values()) list.push(st.pts);
  for (let i = trails.length - 1; i >= 0; i--) { if (t - trails[i].end > 0.4) trails.splice(i, 1); else list.push(trails[i].pts); }
  for (const pts of list) {
    for (let i = 1; i < pts.length; i++) {
      const age = t - pts[i].t; if (age > 0.35) continue;
      const k = 1 - age / 0.35;
      ctx.globalAlpha = 0.75 * k;
      ctx.strokeStyle = i % 2 ? '#ffd6f5' : '#c8f6ff';
      ctx.lineWidth = unit * 0.16 * k + 1;
      ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
    }
  }
  ctx.restore();
}
cv.addEventListener('pointerdown', onDown, { passive: false });
cv.addEventListener('pointermove', onMove);
cv.addEventListener('pointerup', onUp);
cv.addEventListener('pointercancel', onUp);
cv.addEventListener('lostpointercapture', onUp);
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
window.addEventListener('keydown', () => initAudio());
window.addEventListener('resize', resize);

/* ---------- music credit (CC BY 4.0 attribution) ---------- */
const CREDIT = 'Music: \u201cElectrodoodle\u201d Kevin MacLeod (incompetech.com) \u00b7 CC BY 4.0';
function drawCredit() {
  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const fs = clamp(Math.round(Math.min(W, H) * 0.024), 9, 12);
  ctx.font = fs + 'px sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.32; ctx.fillStyle = '#ffffff';
  ctx.fillText(CREDIT, W - 10, 6);
  ctx.restore();
}
/* ---------- main loop ---------- */
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000 || 0.016));
  lastNow = now; t += dt;
  beat = getBeat();
  if (audio) scheduler();
  processPending();
  updateFruits(dt);
  updateParticles(dt);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (shake > 0) {
    shake -= dt; const m = unit * 0.08 * Math.max(0, shake) / 0.16;
    ctx.translate(rand(-m, m), rand(-m, m));
  }
  drawBackground(dt);
  drawFloor();
  drawFloorPools();
  drawSplats();
  for (const p of messPieces) { const a = messAlpha(p.born); if (a > 0.003) drawPiece(p, a); }
  drawOrder = fruits.slice().sort((a, b) => (a.y + a.size * TYPES[a.type].bot) - (b.y + b.size * TYPES[b.type].bot));
  for (const f of drawOrder) drawFruit(f);
  for (const p of particles) drawPiece(p, p.born != null ? messAlpha(p.born) : 1);
  updateDrawEffects(dt);
  drawTrails();
  drawCredit();
  requestAnimationFrame(frame);
}
makeDust(); initDust(); resize();
const startN = clamp(Math.round(maxFruit * 0.55), 3, 6);
for (let i = 0; i < startN; i++) pending.push({ at: 0.15 + i * 0.22, mode: 'pop' });
window.__fruitGame = { get trackOn() { return trackStarted; }, get spb() { return SPB; }, get delay() { return trackDelay; }, fruits, particles, messPieces, messSplats, pending, popFruit, get beat() { return beat; }, get audio() { return audio; }, get maxFruit() { return maxFruit; } };
requestAnimationFrame(ts => { lastNow = ts; requestAnimationFrame(frame); });
// Android app wrapper (index.html?app=1): the WebView allows audio without a gesture, so start the music immediately
if (/[?&]app=1/.test(location.search)) { try { initAudio(); } catch (e) {} }
})();
</script>
</body>
</html>
