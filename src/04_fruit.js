/* ---------- layout ---------- */
function resize() {
  const oldFloor = floorTop;
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  floorH = clamp(H * 0.15, 56, 150);
  floorTop = H - floorH;
  unit = clamp(Math.min(W * 0.14, H * 0.115, Math.sqrt(W * H) * 0.095), 32, 115);
  const usableH = Math.max(unit, floorTop - unit * 2.8);   // band fruit can actually occupy
  maxFruit = clamp(Math.floor(W * usableH / (unit * unit * 9)), 4, 11);
  buildCaches();
  if (oldFloor) {
    const d = floorTop - oldFloor;
    for (const m of messPieces) m.y += d;
    for (const m of messSplats) m.y += d;
    for (const p of particles) p.landY += d;
  }
  for (const f of fruits) { const b = bounds(f); f.tx = clamp(f.tx, b.x0, b.x1); f.ty = clamp(f.ty, b.y0, b.y1); }
}
function boundsFor(size, T) {
  const x0 = size * T.r + 6, x1 = W - size * T.r - 6;
  const y0 = size * 1.45 + 6, y1 = Math.max(y0 + 1, floorTop - size * (T.bot + 0.35));
  return { x0: Math.min(x0, W / 2), x1: Math.max(x1, W / 2), y0, y1 };
}
function bounds(f) { return boundsFor(f.size, TYPES[f.type]); }

/* ---------- fruit ---------- */
let lastPopped = null;
function chooseType() {
  const counts = {}; for (const n of TYPE_NAMES) counts[n] = 0;
  for (const f of fruits) counts[f.type]++;
  const min = Math.min(...TYPE_NAMES.map(n => counts[n]));
  let opts = TYPE_NAMES.filter(n => counts[n] <= min && n !== lastPopped);
  if (!opts.length) opts = TYPE_NAMES.filter(n => counts[n] <= min + 1 && n !== lastPopped);
  return pick(opts.length ? opts : TYPE_NAMES);
}
function freeSpot(size, T) {
  const B = boundsFor(size, T);
  let best = null, bestD = -1e9;
  for (let i = 0; i < 30; i++) {
    const x = rand(B.x0, B.x1), y = rand(B.y0, B.y1);
    let md = 1e9;
    for (const f of fruits) {
      const r = f.size * TYPES[f.type].r;
      md = Math.min(md, Math.hypot(f.x - x, f.y - y) - r, Math.hypot(f.tx - x, f.ty - y) - r);
    }
    const score = Math.min(md, size * 2.6) + Math.random() * size * 0.3;
    if (score > bestD) { bestD = score; best = { x, y }; }
  }
  return best;
}
function spawnFruit(mode, type) {
  if (fruits.length >= maxFruit) return null;
  type = type || chooseType();
  const T = TYPES[type];
  const size = unit * rand(0.88, 1.15) * T.scale;
  const spot = freeSpot(size, T);
  const f = {
    type, size, x: spot.x, y: spot.y, vx: 0, vy: 0, tx: spot.x, ty: spot.y,
    ph: rand(0, TAU), hopAmp: rand(0.07, 0.2), swayAmp: rand(0.1, 0.26), beatOff: Math.random() < 0.25 ? 0.5 : 0,
    shimmy: rand(0.2, 1), tumbleAt: Infinity, tumbleDir: Math.random() < 0.5 ? -1 : 1,
    tumbler: Math.random() < 0.5, enter: 0, mode: mode || 'pop', drifting: false,
    expr: pickExpr(), exprT: rand(1, 3), blink: 0, blinkT: rand(0.5, 3.5), blinkPhase: -1,
    wanderT: rand(2, 5), surpriseT: 0, lean: rand(-0.12, 0.12), cx: spot.x, cy: spot.y, hx: spot.x, hy: spot.y, scaleNow: 0
  };
  if (f.tumbler) f.tumbleAt = Math.ceil(beat / 4) * 4 + randi(1, 4) * 4;
  if (f.mode === 'drift') {
    const side = pick(['l', 'r', 't']);
    if (side === 'l') { f.x = -size * 2; f.y = spot.y; }
    else if (side === 'r') { f.x = W + size * 2; f.y = spot.y; }
    else { f.x = spot.x; f.y = -size * 2.5; }
    f.drifting = true; f.enter = 1; f.scaleNow = 1;
    f.vx = (spot.x - f.x) * 0.9; f.vy = (spot.y - f.y) * 0.9;
  } else {
    effects.push({ kind: 'ring', x: f.x, y: f.y, r0: size * 0.3, r1: size * 1.8, t: 0, dur: 0.5, color: T.glow, w: size * 0.1 });
    for (let i = 0; i < 8; i++) {
      const a = rand(0, TAU), sp = size * rand(2, 4);
      effects.push({ kind: 'star', x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: rand(0.4, 0.7), s: size * rand(0.1, 0.18), color: Math.random() < 0.5 ? '#ffffff' : T.glow, rot: rand(0, TAU) });
    }
    if (audio) sfxBoing(actx.currentTime + 0.01);
  }
  fruits.push(f);
  return f;
}
function fruitPose(f) {
  const T = TYPES[f.type];
  const b = beat + f.beatOff;
  const fr = b - Math.floor(b);
  const hop = -f.hopAmp * 0.85 * f.size * Math.sin(Math.PI * fr);
  const sq = 0.15 * Math.exp(-fr * 9) - 0.06 * Math.sin(Math.PI * fr);
  const sy = 1 - sq, sx = 1 + sq * 0.85;
  let rot = f.lean + f.swayAmp * Math.sin(Math.PI * (b * 0.5 + 0.5) + f.ph * 0.15);
  rot += 0.04 * Math.sin(t * 7 + f.ph);
  if (beat >= f.tumbleAt && beat < f.tumbleAt + 2) {
    rot += f.tumbleDir * TAU * easeInOut((beat - f.tumbleAt) / 2);
  } else if (beat >= f.tumbleAt + 2) {
    f.tumbleAt = f.tumbler ? Math.ceil(beat / 4) * 4 + randi(2, 6) * 4 : Infinity;
    f.tumbleDir = Math.random() < 0.5 ? -1 : 1;
  }
  const shim = f.shimmy * f.size * 0.16 * Math.sin(Math.PI * (b * 0.5 + 0.5));
  let sc = 1;
  if (f.mode === 'pop' && f.enter < 1) sc = elasticOut(f.enter);
  return { hop, sx, sy, rot, shim, sc, T };
}
function updateFruits(dt) {
  for (const f of fruits) {
    const T = TYPES[f.type];
    if (f.enter < 1) f.enter = Math.min(1, f.enter + dt / 0.8);
    const B = bounds(f);
    f.wanderT -= dt;
    if (f.wanderT <= 0 && !f.drifting) {
      f.wanderT = rand(3, 7);
      if (Math.random() < 0.6) {
        f.tx = clamp(f.x + rand(-1, 1) * f.size * 3, B.x0, B.x1);
        f.ty = clamp(f.y + rand(-1, 1) * f.size * 2, B.y0, B.y1);
      } else { f.tx = rand(B.x0, B.x1); f.ty = rand(B.y0, B.y1); }
    }
    const kSpring = f.drifting ? 2.0 : 0.9, damp = f.drifting ? 2.4 : 1.7;
    let ax = (f.tx - f.x) * kSpring - f.vx * damp;
    let ay = (f.ty - f.y) * kSpring - f.vy * damp;
    for (const g of fruits) {
      if (g === f) continue;
      const dx = f.x - g.x, dy = f.y - g.y, d = Math.hypot(dx, dy) || 0.01;
      const minD = (f.size * T.r + g.size * TYPES[g.type].r) * 1.08;
      if (d < minD) {
        const push = (minD - d) / minD;
        ax += dx / d * push * unit * 45; ay += dy / d * push * unit * 45;
        if (push > 0.15) { f.tx += dx / d * unit * dt * 2; f.ty += dy / d * unit * dt * 2; }
      }
    }
    f.vx += ax * dt; f.vy += ay * dt;
    const sp = Math.hypot(f.vx, f.vy), maxSp = unit * (f.drifting ? 14 : 6);
    if (sp > maxSp) { f.vx *= maxSp / sp; f.vy *= maxSp / sp; }
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.drifting) {
      if (f.x > B.x0 && f.x < B.x1 && f.y > B.y0 && f.y < B.y1) f.drifting = false;
    } else {
      f.tx = clamp(f.tx, B.x0, B.x1); f.ty = clamp(f.ty, B.y0, B.y1);
      if (f.x < B.x0) { f.x = B.x0; f.vx = Math.abs(f.vx) * 0.4; }
      if (f.x > B.x1) { f.x = B.x1; f.vx = -Math.abs(f.vx) * 0.4; }
      if (f.y < B.y0) { f.y = B.y0; f.vy = Math.abs(f.vy) * 0.4; }
      if (f.y > B.y1) { f.y = B.y1; f.vy = -Math.abs(f.vy) * 0.4; }
    }
    if (f.surpriseT > 0) f.surpriseT -= dt;
    f.exprT -= dt;
    if (f.exprT <= 0) {
      f.expr = pickExpr();
      f.exprT = f.expr === 'oh' ? rand(0.6, 1.2) : f.expr === 'wink' ? rand(0.5, 1.0) : rand(1.5, 4);
    }
    f.blinkT -= dt;
    if (f.blinkT <= 0 && f.blinkPhase < 0) { f.blinkPhase = 0; f.blinkT = rand(1.8, 4.5); }
    if (f.blinkPhase >= 0) {
      f.blinkPhase += dt / 0.17;
      f.blink = Math.sin(Math.min(1, f.blinkPhase) * Math.PI);
      if (f.blinkPhase >= 1) { f.blinkPhase = -1; f.blink = 0; }
    }
  }
}
function drawFruit(f) {
  const P = fruitPose(f), T = P.T, C = cache[f.type];
  const s = f.size;
  f.scaleNow = P.sc;
  f.cx = f.x + P.shim; f.cy = f.y + P.hop;
  f.hx = f.cx; f.hy = f.cy + T.cy * s;
  const fr = ((beat + f.beatOff) % 1 + 1) % 1;
  const pulse = Math.exp(-fr * 5);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = (0.14 + 0.14 * pulse) * Math.min(1, Math.max(0, P.sc));
  const gr = s * (2.5 + 0.25 * pulse) * Math.max(0.01, P.sc);
  ctx.drawImage(C.glow, f.hx - gr, f.hy - gr, gr * 2, gr * 2);
  ctx.restore();
  ctx.save();
  ctx.translate(f.cx, f.cy + T.cy * s);
  ctx.rotate(P.rot);
  ctx.translate(0, (T.bot - T.cy) * s * P.sc);
  ctx.scale(P.sx * P.sc, P.sy * P.sc);
  ctx.translate(0, -T.bot * s);
  const k = s / K;
  ctx.drawImage(C.c, -C.ox * k, -C.oy * k, C.w * k, C.h * k);
  ctx.scale(s, s);
  let lx = Math.sin(t * 0.7 + f.ph) * 0.6, ly = Math.cos(t * 0.5 + f.ph) * 0.4;
  if (pointer && t - pointer.t < 4) {
    const dx = pointer.x - f.hx, dy = pointer.y - f.hy, d = Math.hypot(dx, dy) || 1;
    lx = dx / d; ly = dy / d;
  }
  const c = Math.cos(-P.rot), sn = Math.sin(-P.rot);
  const llx = lx * c - ly * sn, lly = lx * sn + ly * c;
  const expr = f.surpriseT > 0 ? 'oh' : f.expr;
  for (const fd of T.faces) drawFace(ctx, fd.x, fd.y, fd.s, expr, f.blink, llx, lly);
  ctx.restore();
}
