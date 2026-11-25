/* ---------- particles / mess ---------- */
function chunkPts(n, irr) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i + rand(-0.3, 0.3)) / n * TAU, r = rand(1 - irr, 1);
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return pts;
}
function addP(p) { if (particles.length < MAXP) particles.push(p); }
function launch(x, y, s, kind, props, speed) {
  speed = speed || 1;
  const a = rand(0, TAU), sp = s * rand(2.2, 7.5) * speed;
  const p = Object.assign({
    kind, x: x + Math.cos(a) * s * rand(0, 0.45), y: y + Math.sin(a) * s * rand(0, 0.45),
    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - s * rand(3, 7) * speed,
    rot: rand(0, TAU), vr: rand(-12, 12),
    landY: floorTop + 8 + Math.pow(Math.random(), 0.85) * (floorH - 16),
    bounces: 0, splatted: false
  }, props);
  addP(p);
}
function burst(f) {
  const T = TYPES[f.type], s = f.size * Math.max(0.5, f.scaleNow), x = f.hx, y = f.hy;
  const J = (n, col, sz, sp) => { for (let i = 0; i < n; i++) launch(x, y, s, 'drop', { size: s * rand(sz[0], sz[1]), c1: col, juice: T.splat }, sp || 1.15); };
  switch (f.type) {
    case 'cherry':
      for (let i = 0; i < 5; i++) launch(x, y, s, 'chunk', { size: s * rand(0.17, 0.28), c1: '#d8102a', c2: '#ff8a9a', pts: chunkPts(6, 0.35), juice: T.splat });
      launch(x, y, s, 'ball', { size: s * 0.13, c1: '#ecd2a8', c2: '#ffffff' });
      launch(x, y, s, 'ball', { size: s * 0.12, c1: '#ecd2a8', c2: '#ffffff' });
      for (let i = 0; i < 2; i++) launch(x, y, s, 'stem', { size: s * rand(0.4, 0.55), c1: '#5aa02a' });
      launch(x, y, s, 'leaf', { size: s * 0.5, c1: '#3a9a2a', c2: '#9be862' });
      J(18, '#c4001f', [0.04, 0.09]);
      break;
    case 'banana':
      for (let i = 0; i < 7; i++) launch(x, y, s, 'slice', { size: s * rand(0.15, 0.22) });
      for (let i = 0; i < 3; i++) launch(x, y, s, 'peel', { size: s * rand(0.4, 0.55) });
      for (let i = 0; i < 5; i++) launch(x, y, s, 'chunk', { size: s * rand(0.1, 0.18), c1: '#fff1b8', c2: '#ffffff', pts: chunkPts(7, 0.4), juice: T.splat });
      J(10, '#fff0b0', [0.04, 0.08], 0.9);
      break;
    case 'pineapple':
      for (let i = 0; i < 10; i++) launch(x, y, s, 'cube', { size: s * rand(0.16, 0.26), c1: '#ffc61a', c2: '#e08600', c3: '#fff3a0', juice: T.splat });
      for (let i = 0; i < 5; i++) launch(x, y, s, 'leaf', { size: s * rand(0.45, 0.75), c1: '#2a8a26', c2: '#8be35a', thin: true });
      J(16, '#ffd84a', [0.04, 0.08]);
      break;
    case 'strawberry':
      for (let i = 0; i < 7; i++) launch(x, y, s, 'chunk', { size: s * rand(0.17, 0.28), c1: '#ee1c35', c2: '#ff8a8a', pts: chunkPts(6, 0.35), seeds: true, juice: T.splat });
      for (let i = 0; i < 2; i++) launch(x, y, s, 'leaf', { size: s * 0.4, c1: '#2a8a26', c2: '#8be35a' });
      for (let i = 0; i < 10; i++) launch(x, y, s, 'seed', { size: s * 0.05, c1: '#ffe27a' });
      J(16, '#e3122c', [0.04, 0.09]);
      break;
    case 'watermelon':
      for (let i = 0; i < 8; i++) launch(x, y, s, 'wedge', { size: s * rand(0.24, 0.38), c1: '#ff3b55', c2: '#2e9a3a', c3: '#dff7a8', juice: T.splat });
      for (let i = 0; i < 10; i++) launch(x, y, s, 'seed', { size: s * 0.065, c1: '#2a0d0d' });
      J(26, '#ff4d64', [0.04, 0.1], 1.25);
      break;
    case 'orange':
      for (let i = 0; i < 7; i++) launch(x, y, s, 'wedge', { size: s * rand(0.24, 0.34), c1: '#ffa31a', c2: '#ff7a00', c3: '#fff0c8', juice: T.splat });
      for (let i = 0; i < 4; i++) launch(x, y, s, 'chunk', { size: s * rand(0.12, 0.2), c1: '#ff8a00', c2: '#ffc060', pts: chunkPts(5, 0.3) });
      launch(x, y, s, 'leaf', { size: s * 0.4, c1: '#2a8a26', c2: '#8be35a' });
      J(24, '#ffb02e', [0.035, 0.09], 1.3);
      break;
    case 'avocado':
      for (let i = 0; i < 7; i++) launch(x, y, s, 'wedge', { size: s * rand(0.22, 0.32), c1: '#d4e870', c2: '#2d5e12', c3: '#a6cc44', juice: T.splat });
      launch(x, y, s, 'ball', { size: s * 0.34, c1: '#8a5225', c2: '#d9a066', pit: true }, 0.6);
      J(9, '#b6d64c', [0.04, 0.08], 0.9);
      break;
  }
}
function makeSplat(x, y, size, color, alpha) {
  const blobs = [[0, 0, size]];
  const n = randi(3, 6);
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), d = size * rand(0.5, 1.1); blobs.push([Math.cos(a) * d, Math.sin(a) * d, size * rand(0.25, 0.6)]); }
  const m = randi(2, 5);
  for (let i = 0; i < m; i++) { const a = rand(0, TAU), d = size * rand(1.3, 2.2); blobs.push([Math.cos(a) * d, Math.sin(a) * d, size * rand(0.08, 0.18)]); }
  messSplats.push({ x, y, blobs, color, born: t, a: alpha || 0.75 });
  if (messSplats.length > MAX_MESS_S) messSplats.shift();
}
let lastThunk = 0;
function settle(p) {
  if (p.born == null) p.born = t;
  p.vx = p.vy = 0; p.sliding = false;
  let j = messPieces.length;
  while (j > 0 && messPieces[j - 1].y > p.y) j--;
  messPieces.splice(j, 0, p);
  if (messPieces.length > MAX_MESS_P) {
    let oldest = 0;
    for (let k = 1; k < messPieces.length; k++) if (messPieces[k].born < messPieces[oldest].born) oldest = k;
    messPieces.splice(oldest, 1);
  }
}
function updateParticles(dt) {
  const G = H * 1.9;
  const fMin = floorTop + 6, fMax = H - 6;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.sliding) {
      // sliding / tumbling along the floor with friction
      const fr = Math.exp(-3.2 * dt);
      p.vx *= fr; p.vd *= fr;
      p.x += p.vx * dt; p.y += p.vd * dt; p.landY = p.y;
      p.rot += (p.vx / Math.max(4, p.size)) * dt * (p.kind === 'ball' || p.kind === 'slice' ? 1 : 0.6);
      if (p.x < 6) { p.x = 6; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > W - 6) { p.x = W - 6; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < fMin) { p.y = fMin; p.vd = Math.abs(p.vd) * 0.5; }
      if (p.y > fMax) { p.y = fMax; p.vd = -Math.abs(p.vd) * 0.5; }
      if (Math.abs(p.vx) + Math.abs(p.vd) < 14) { particles.splice(i, 1); settle(p); }
      continue;
    }
    p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.x < 4) { p.x = 4; p.vx = Math.abs(p.vx) * 0.5; }
    if (p.x > W - 4) { p.x = W - 4; p.vx = -Math.abs(p.vx) * 0.5; }
    if (p.y >= p.landY && p.vy > 0) {
      p.y = p.landY;
      if (p.kind === 'drop') {
        makeSplat(p.x, p.y, p.size * rand(1.6, 2.6), p.juice || p.c1, 0.9);
        particles.splice(i, 1); continue;
      }
      if (!p.splatted && p.juice) { makeSplat(p.x, p.y + p.size * 0.2, p.size * 0.9, p.juice, 0.6); p.splatted = true; }
      if (p.pit && audio && t - lastThunk > 0.08) { lastThunk = t; sfxThunk(actx.currentTime, 0.35); }
      p.bounces++;
      p.vy = -p.vy * (p.kind === 'ball' ? 0.45 : 0.28);
      p.vx *= p.flung ? 0.8 : 0.55; p.vr *= 0.5;
      if (Math.abs(p.vy) < 90 || p.bounces > 3) {
        if (p.flung && Math.abs(p.vx) > 30) { p.sliding = true; p.vd = p.vd || 0; p.vy = 0; continue; }
        particles.splice(i, 1);
        settle(p);
      }
    }
  }
  for (let i = messPieces.length - 1; i >= 0; i--) if (t - messPieces[i].born > MESS_LIFE) messPieces.splice(i, 1);
  for (let i = messSplats.length - 1; i >= 0; i--) if (t - messSplats[i].born > MESS_LIFE) messSplats.splice(i, 1);
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; if (p.born != null && t - p.born > MESS_LIFE) particles.splice(i, 1); }
}
function messAlpha(born) { const k = (t - born) / MESS_LIFE; return k >= 1 ? 0 : 1 - k * k * (0.4 + 0.6 * k); }
function drawPiece(p, alpha) {
  const s = p.size;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
  switch (p.kind) {
    case 'chunk': {
      const q = p.pts; ctx.beginPath(); ctx.moveTo(q[0] * s, q[1] * s);
      for (let i = 2; i < q.length; i += 2) ctx.lineTo(q[i] * s, q[i + 1] * s);
      ctx.closePath(); ctx.fillStyle = p.c1; ctx.fill();
      ctx.globalAlpha = alpha * 0.55; ctx.fillStyle = p.c2;
      ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.3, s * 0.3, s * 0.16, -0.6, 0, TAU); ctx.fill();
      if (p.seeds) { ctx.globalAlpha = alpha; ctx.fillStyle = '#ffe07a'; for (const o of [[0.2, 0.1], [-0.15, 0.3], [0.3, -0.3]]) { ctx.beginPath(); ctx.arc(o[0] * s, o[1] * s, s * 0.09, 0, TAU); ctx.fill(); } }
      break;
    }
    case 'wedge':
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, s, -0.6, 0.6); ctx.closePath();
      ctx.fillStyle = p.c1; ctx.fill();
      ctx.lineWidth = s * 0.14; ctx.strokeStyle = p.c3; ctx.beginPath(); ctx.arc(0, 0, s * 0.88, -0.6, 0.6); ctx.stroke();
      ctx.lineWidth = s * 0.18; ctx.strokeStyle = p.c2; ctx.beginPath(); ctx.arc(0, 0, s * 1.02, -0.6, 0.6); ctx.stroke();
      ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(s * 0.45, -s * 0.1, s * 0.18, s * 0.06, 0.3, 0, TAU); ctx.fill();
      break;
    case 'cube':
      ctx.fillStyle = p.c1; ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = p.c3; ctx.globalAlpha = alpha * 0.6; ctx.fillRect(-s / 2, -s / 2, s, s * 0.22);
      ctx.globalAlpha = alpha; ctx.strokeStyle = p.c2; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(0, -s / 2); ctx.moveTo(0, s / 2); ctx.lineTo(s / 2, 0); ctx.stroke();
      break;
    case 'slice':
      ctx.fillStyle = '#fff6cc'; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#efd88a'; ctx.lineWidth = s * 0.15; ctx.stroke();
      ctx.fillStyle = '#9a7a40';
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3, s * 0.08, 0, TAU); ctx.fill(); }
      break;
    case 'peel':
      ctx.lineCap = 'round'; ctx.strokeStyle = '#f5c400'; ctx.lineWidth = s * 0.38;
      ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(0, -s * 0.45, s / 2, 0); ctx.stroke();
      ctx.strokeStyle = '#fff09a'; ctx.lineWidth = s * 0.14;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.04); ctx.quadraticCurveTo(0, -s * 0.42, s * 0.4, -s * 0.04); ctx.stroke();
      ctx.fillStyle = '#5a3d10'; ctx.beginPath(); ctx.arc(s / 2, 0, s * 0.1, 0, TAU); ctx.fill();
      break;
    case 'leaf':
      leafPath(ctx, s, s * (p.thin ? 0.16 : 0.32)); ctx.fillStyle = p.c1; ctx.fill();
      ctx.strokeStyle = p.c2; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(s * 0.1, 0); ctx.lineTo(s * 0.85, 0); ctx.stroke();
      break;
    case 'stem':
      ctx.lineCap = 'round'; ctx.strokeStyle = p.c1; ctx.lineWidth = s * 0.14;
      ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(0, -s * 0.2, s / 2, 0); ctx.stroke();
      break;
    case 'ball':
      ctx.fillStyle = p.c1; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
      ctx.globalAlpha = alpha * 0.8; ctx.fillStyle = p.c2;
      ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.35, s * 0.32, s * 0.2, -0.7, 0, TAU); ctx.fill();
      break;
    case 'seed':
      ctx.fillStyle = p.c1; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s, 0, 0, TAU); ctx.fill();
      break;
    case 'drop':
      ctx.fillStyle = p.c1; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
      ctx.globalAlpha = alpha * 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.35, s * 0.3, 0, TAU); ctx.fill();
      break;
  }
  ctx.restore();
}
function drawSplats() {
  for (const m of messSplats) {
    const a = messAlpha(m.born) * m.a; if (a <= 0.003) continue;
    ctx.globalAlpha = a; ctx.fillStyle = m.color; ctx.beginPath();
    for (const b of m.blobs) { ctx.moveTo(m.x + b[0] + b[2], m.y + b[1] * 0.38); ctx.ellipse(m.x + b[0], m.y + b[1] * 0.38, b[2], b[2] * 0.38, 0, 0, TAU); }
    ctx.fill();
    ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#ffffff';
    const b0 = m.blobs[0]; ctx.beginPath(); ctx.ellipse(m.x - b0[2] * 0.3, m.y - b0[2] * 0.1, b0[2] * 0.3, b0[2] * 0.08, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- effects ---------- */
function starPath(c, r) {
  c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? r * 0.28 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath();
}
function updateDrawEffects(dt) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.t += dt; const k = e.t / e.dur;
    if (k >= 1) { effects.splice(i, 1); continue; }
    if (e.kind === 'ring') {
      const r = e.r0 + (e.r1 - e.r0) * (1 - Math.pow(1 - k, 3));
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = e.color; ctx.lineWidth = Math.max(0.5, e.w * (1 - k));
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke();
    } else if (e.kind === 'flash') {
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - k)) + ')'); g.addColorStop(0.4, hexA(e.color, 0.5 * (1 - k))); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
    } else if (e.kind === 'star') {
      e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.94; e.vy *= 0.94; e.rot += dt * 4;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = e.color;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); starPath(ctx, e.s * (1 - k * 0.5)); ctx.fill(); ctx.restore();
    }
  }
  ctx.restore();
}

/* ---------- background ---------- */
const dust = [];
function initDust() {
  dust.length = 0;
  for (let i = 0; i < 22; i++) dust.push({ x: Math.random(), y: Math.random() * 0.85, r: rand(2, 7), vx: rand(-0.004, 0.004), vy: rand(-0.006, -0.002), a: rand(0.05, 0.16), ph: rand(0, TAU) });
}
function washHue() { return (345 + 40 * Math.sin(t * 0.045) + t * 3) % 360; }
function drawBackground(dt) {
  ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, W + 40, H + 40);
  const hue = washHue();
  const pulse = Math.exp(-(((beat % 1) + 1) % 1) * 4);
  const R = Math.hypot(W, H) * 0.62;
  const g = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.25, W / 2, H * 0.42, R);
  g.addColorStop(0, 'hsla(' + hue + ',80%,20%,0)');
  g.addColorStop(0.6, 'hsla(' + hue + ',75%,16%,' + (0.28 + 0.06 * pulse) + ')');
  g.addColorStop(1, 'hsla(' + ((hue + 30) % 360) + ',80%,22%,' + (0.6 + 0.08 * pulse) + ')');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const d of dust) {
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.y < -0.05) { d.y = 0.9; d.x = Math.random(); }
    if (d.x < -0.05) d.x = 1.05;
    if (d.x > 1.05) d.x = -0.05;
    ctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(t * 1.3 + d.ph));
    const r = d.r * 3;
    ctx.drawImage(dustSprite, d.x * W - r, d.y * floorTop - r, r * 2, r * 2);
  }
  ctx.restore();
}
function drawFloor() {
  const hue = washHue();
  const g = ctx.createLinearGradient(0, floorTop, 0, H);
  g.addColorStop(0, '#16121e'); g.addColorStop(0.25, '#0e0b14'); g.addColorStop(1, '#050408');
  ctx.fillStyle = g; ctx.fillRect(0, floorTop, W, floorH + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
  const vx = W / 2, vy = floorTop - floorH * 2.2;
  ctx.beginPath();
  for (let i = -12; i <= 12; i++) {
    const xb = W / 2 + i * W / 9;
    const k = (floorTop - vy) / (H - vy);
    ctx.moveTo(vx + (xb - vx) * k, floorTop); ctx.lineTo(xb, H);
  }
  for (let j = 1; j < 4; j++) { const y = floorTop + floorH * Math.pow(j / 4, 1.6); ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  const pulse = Math.exp(-(((beat % 1) + 1) % 1) * 4);
  const eg = ctx.createLinearGradient(0, 0, W, 0);
  eg.addColorStop(0, 'hsla(' + hue + ',90%,60%,0)');
  eg.addColorStop(0.5, 'hsla(' + hue + ',90%,65%,' + (0.35 + 0.2 * pulse) + ')');
  eg.addColorStop(1, 'hsla(' + hue + ',90%,60%,0)');
  ctx.fillStyle = eg; ctx.fillRect(0, floorTop - 1, W, 2);
  const sg = ctx.createLinearGradient(0, floorTop, 0, floorTop + floorH * 0.5);
  sg.addColorStop(0, 'hsla(' + hue + ',80%,50%,' + (0.08 + 0.05 * pulse) + ')'); sg.addColorStop(1, 'hsla(' + hue + ',80%,50%,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, floorTop, W, floorH * 0.5);
}
function drawFloorPools() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of fruits) {
    const C = cache[f.type]; if (!C) continue;
    const h = clamp((floorTop - f.cy) / floorTop, 0, 1);
    ctx.globalAlpha = 0.22 * (1 - h * 0.7) * clamp(f.scaleNow, 0, 1);
    const rx = f.size * (2.2 - h), ry = floorH * 0.25;
    ctx.drawImage(C.glow, f.cx - rx, floorTop + floorH * 0.18 - ry, rx * 2, ry * 2);
  }
  ctx.restore();
}
