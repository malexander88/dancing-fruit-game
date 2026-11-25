/* ---------- drawing helpers (unit coordinates) ---------- */
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.0001, rx), Math.max(0.0001, ry), rot || 0, 0, TAU); }
function gloss(c, x, y, rx, ry, rot, a) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
  g.addColorStop(0.55, 'rgba(255,255,255,' + (a * 0.45) + ')');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
}
function leafPath(c, len, w) {
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.45, -w, len, 0);
  c.quadraticCurveTo(len * 0.45, w, 0, 0); c.closePath();
}
function drawLeaf(c, x, y, ang, len, w, dark, light) {
  c.save(); c.translate(x, y); c.rotate(ang);
  leafPath(c, len, w);
  const g = c.createLinearGradient(0, -w * 0.6, 0, w * 0.6);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = Math.max(0.015, w * 0.12); c.lineCap = 'round';
  c.beginPath(); c.moveTo(len * 0.08, 0); c.quadraticCurveTo(len * 0.5, -w * 0.18, len * 0.88, 0); c.stroke();
  c.restore();
}
function seedTear(c, x, y, ang, len, col, shadow) {
  c.save(); c.translate(x, y); c.rotate(ang);
  if (shadow) { c.fillStyle = shadow; ell(c, 0.01, 0.015, len * 0.55, len * 0.85); c.fill(); }
  c.fillStyle = col; c.beginPath();
  c.moveTo(0, -len); c.quadraticCurveTo(len * 0.6, 0, 0, len * 0.6); c.quadraticCurveTo(-len * 0.6, 0, 0, -len); c.fill();
  c.restore();
}
function cherryBall(c, x, y, r) {
  const g = c.createRadialGradient(x - 0.32 * r, y - 0.38 * r, 0.04 * r, x, y, r * 1.05);
  g.addColorStop(0, '#ff9a9a'); g.addColorStop(0.3, '#f22a42'); g.addColorStop(0.75, '#b8001f'); g.addColorStop(1, '#6a000f');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(80,0,10,0.45)'; c.lineWidth = 0.05; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - r * 1.05, r * 0.28, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  c.strokeStyle = 'rgba(255,120,140,0.35)'; c.lineWidth = 0.05;
  c.beginPath(); c.arc(x, y, r * 0.93, 0.15 * Math.PI, 0.7 * Math.PI); c.stroke();
  gloss(c, x - 0.38 * r, y - 0.45 * r, 0.32 * r, 0.17 * r, -0.7, 0.9);
  gloss(c, x + 0.5 * r, y + 0.42 * r, 0.16 * r, 0.07 * r, -0.8, 0.3);
}
function drawCherry(c) {
  c.lineCap = 'round';
  const sg = c.createLinearGradient(0, -1.4, 0, 0);
  sg.addColorStop(0, '#3d8a1f'); sg.addColorStop(1, '#86c040');
  c.strokeStyle = sg; c.lineWidth = 0.09;
  c.beginPath(); c.moveTo(-0.46, -0.22); c.quadraticCurveTo(-0.4, -0.95, 0.12, -1.32); c.stroke();
  c.beginPath(); c.moveTo(0.5, -0.12); c.quadraticCurveTo(0.44, -0.8, 0.12, -1.32); c.stroke();
  drawLeaf(c, 0.12, -1.32, -2.55, 0.78, 0.27, '#1d7a1d', '#86e050');
  drawLeaf(c, 0.12, -1.32, -0.4, 0.66, 0.23, '#1d7a1d', '#9be862');
  cherryBall(c, 0.5, 0.42, 0.56);
  cherryBall(c, -0.46, 0.32, 0.56);
}
function drawBanana(c) {
  c.beginPath(); c.moveTo(-0.44, 0.7);
  c.bezierCurveTo(-0.5, -0.3, -0.36, -1.15, 0.02, -1.15);
  c.bezierCurveTo(0.38, -1.15, 0.5, -0.3, 0.44, 0.7); c.closePath();
  const g = c.createLinearGradient(-0.5, 0, 0.5, 0);
  g.addColorStop(0, '#f2dc86'); g.addColorStop(0.3, '#fffbe2'); g.addColorStop(0.7, '#fbeaa8'); g.addColorStop(1, '#d9bd62');
  c.fillStyle = g; c.fill();
  gloss(c, -0.2, -0.55, 0.12, 0.42, 0.1, 0.7);
  c.strokeStyle = 'rgba(200,170,80,0.35)'; c.lineWidth = 0.03;
  c.beginPath(); c.moveTo(0.02, -1.05); c.quadraticCurveTo(0.12, -0.3, 0.06, 0.5); c.stroke();
  const peelG = c.createLinearGradient(-0.6, 0, 0.6, 0);
  peelG.addColorStop(0, '#d99a00'); peelG.addColorStop(0.35, '#ffe23a'); peelG.addColorStop(0.65, '#ffd21a'); peelG.addColorStop(1, '#c98a00');
  c.beginPath(); c.moveTo(-0.52, 0.3);
  c.quadraticCurveTo(-0.62, 0.88, 0, 1.08); c.quadraticCurveTo(0.62, 0.88, 0.52, 0.3);
  c.lineTo(0.3, 0.46); c.lineTo(0.06, 0.3); c.lineTo(-0.2, 0.48); c.closePath();
  c.fillStyle = peelG; c.fill();
  gloss(c, -0.25, 0.65, 0.1, 0.22, 0.3, 0.45);
  function flap(s) {
    c.save(); c.scale(s, 1);
    c.beginPath(); c.moveTo(-0.5, 0.32);
    c.bezierCurveTo(-0.72, 0.18, -0.95, 0.35, -0.92, 0.72);
    c.bezierCurveTo(-0.75, 0.62, -0.55, 0.62, -0.42, 0.72); c.closePath();
    const fg = c.createLinearGradient(-0.9, 0.3, -0.45, 0.7);
    fg.addColorStop(0, '#fff3a0'); fg.addColorStop(0.5, '#ffd51e'); fg.addColorStop(1, '#d69a00');
    c.fillStyle = fg; c.fill();
    c.fillStyle = '#5a3d10'; ell(c, -0.91, 0.72, 0.045, 0.04); c.fill();
    c.restore();
  }
  flap(1); flap(-1);
  c.fillStyle = '#4a3210'; ell(c, 0, 1.07, 0.07, 0.045); c.fill();
}
function drawPineapple(c) {
  const leaves = [
    [-2.25, 0.85, 0.2, 1], [-0.85, 0.85, 0.2, 1], [-2.0, 1.0, 0.2, 1], [-1.1, 1.0, 0.2, 1],
    [-1.75, 1.15, 0.22, 0], [-1.35, 1.15, 0.22, 0], [-1.57, 1.25, 0.22, 0], [-2.55, 0.6, 0.17, 0], [-0.55, 0.6, 0.17, 0]
  ];
  for (const L of leaves) drawLeaf(c, 0, -0.68, L[0], L[1], L[2], L[3] ? '#1c6a1c' : '#2a8a26', L[3] ? '#4fb53a' : '#8be35a');
  const rx = 0.78, ry = 0.98, cy = 0.2;
  ell(c, 0, cy, rx, ry);
  const g = c.createRadialGradient(-0.25, -0.1, 0.05, 0, cy, 1.15);
  g.addColorStop(0, '#fff47a'); g.addColorStop(0.4, '#ffcb1f'); g.addColorStop(0.78, '#ff9800'); g.addColorStop(1, '#c95f00');
  c.fillStyle = g; c.fill();
  c.save(); ell(c, 0, cy, rx, ry); c.clip();
  const d = 0.3;
  for (let k = -9; k <= 9; k++) for (let m = -9; m <= 9; m++) {
    const u = (k + 0.5) * d, v = (m + 0.5) * d, x = (u + v) / 2, y = (u - v) / 2 + cy;
    const q = (x / rx) ** 2 + ((y - cy) / ry) ** 2; if (q > 1.1) continue;
    const h = d * 0.5 * 0.78;
    c.fillStyle = 'rgba(255,245,170,' + (0.32 * (1 - q * 0.7)) + ')';
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + h, y); c.lineTo(x, y + h * 0.3); c.lineTo(x - h, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(170,80,0,' + (0.25 + q * 0.2) + ')';
    c.beginPath(); c.moveTo(x - h, y); c.lineTo(x, y + h); c.lineTo(x + h, y); c.lineTo(x, y + h * 0.45); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(190,95,0,0.6)'; c.lineWidth = 0.035;
  for (let k = -12; k <= 12; k++) {
    const u = k * d;
    c.beginPath(); c.moveTo(u + 2, -2 + cy); c.lineTo(u - 2, 2 + cy); c.stroke();
    c.beginPath(); c.moveTo(u - 2, -2 + cy); c.lineTo(u + 2, 2 + cy); c.stroke();
  }
  c.restore();
  gloss(c, -0.32, -0.3, 0.3, 0.2, -0.6, 0.55);
  c.strokeStyle = 'rgba(255,200,90,0.35)'; c.lineWidth = 0.05;
  c.beginPath(); c.ellipse(0, cy, rx * 0.95, ry * 0.95, 0, 0.1 * Math.PI, 0.8 * Math.PI); c.stroke();
}
function strawberryPath(c) {
  c.beginPath(); c.moveTo(0, -0.62);
  c.bezierCurveTo(-0.55, -0.85, -1.05, -0.45, -0.88, 0.12);
  c.bezierCurveTo(-0.74, 0.6, -0.28, 0.98, 0, 1.06);
  c.bezierCurveTo(0.28, 0.98, 0.74, 0.6, 0.88, 0.12);
  c.bezierCurveTo(1.05, -0.45, 0.55, -0.85, 0, -0.62); c.closePath();
}
function drawStrawberry(c) {
  strawberryPath(c);
  const g = c.createRadialGradient(-0.3, -0.25, 0.05, 0, 0.1, 1.15);
  g.addColorStop(0, '#ff8a7a'); g.addColorStop(0.35, '#f6283a'); g.addColorStop(0.8, '#b90020'); g.addColorStop(1, '#78000f');
  c.fillStyle = g; c.fill();
  for (let y = -0.42; y < 0.95; y += 0.19) {
    const row = Math.round((y + 0.42) / 0.19);
    const w = y < 0.12 ? 0.86 - 0.5 * ((0.12 - y) / 0.6) ** 2 : 0.86 * (1 - ((y - 0.12) / 0.95) ** 1.5);
    for (let x = -w + 0.12 + (row % 2) * 0.1; x < w - 0.1; x += 0.22) {
      if (Math.abs(x) < 0.55 && y > -0.12 && y < 0.5) continue;
      seedTear(c, x, y, x * 0.5, 0.05, '#ffe07a', 'rgba(90,0,10,0.45)');
    }
  }
  gloss(c, -0.42, -0.3, 0.26, 0.14, -0.7, 0.75);
  gloss(c, 0.5, 0.55, 0.14, 0.06, -1.0, 0.25);
  const ang = [Math.PI * 1.08, Math.PI * 0.88, Math.PI * 0.66, Math.PI * 0.34, Math.PI * 0.12, -Math.PI * 0.08];
  const len = [0.55, 0.46, 0.34, 0.34, 0.46, 0.55];
  for (let i = 0; i < ang.length; i++) drawLeaf(c, 0, -0.64, ang[i], len[i], 0.17, '#1d7a1a', '#7fe04a');
  c.strokeStyle = '#3a9a28'; c.lineWidth = 0.09; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -0.66); c.quadraticCurveTo(0.02, -0.85, 0.1, -0.98); c.stroke();
}
function drawWatermelon(c) {
  const cy = -0.42;
  c.beginPath(); c.arc(0, cy, 1.18, 0, Math.PI); c.closePath();
  let g = c.createLinearGradient(0, cy, 0, cy + 1.2);
  g.addColorStop(0, '#4fbf3a'); g.addColorStop(1, '#1a6a22');
  c.fillStyle = g; c.fill();
  c.beginPath(); c.arc(0, cy, 1.07, 0, Math.PI); c.closePath();
  c.fillStyle = '#dff7a8'; c.fill();
  c.beginPath(); c.arc(0, cy, 0.99, 0, Math.PI); c.closePath();
  g = c.createRadialGradient(-0.1, cy + 0.1, 0.05, 0, cy, 1.0);
  g.addColorStop(0, '#ff9aa8'); g.addColorStop(0.55, '#ff4560'); g.addColorStop(1, '#e01a40');
  c.fillStyle = g; c.fill();
  c.fillStyle = 'rgba(255,200,210,0.55)'; c.fillRect(-0.99, cy, 1.98, 0.035);
  const seeds = [[-0.72, 0.15], [-0.45, 0.3], [0.48, 0.32], [0.74, 0.12], [-0.25, 0.45], [0.22, 0.47], [-0.82, -0.22], [0.83, -0.2]];
  for (const s of seeds) {
    const a = Math.atan2(s[1] - cy, s[0]) - Math.PI / 2;
    seedTear(c, s[0], s[1], a + Math.PI, 0.07, '#2a0c0c', null);
    c.fillStyle = 'rgba(255,255,255,0.5)'; ell(c, s[0] - 0.01, s[1] - 0.02, 0.012, 0.02); c.fill();
  }
  for (let i = 0; i < 14; i++) {
    const a = rand(0.15, Math.PI - 0.15), r = rand(0.2, 0.9);
    c.fillStyle = 'rgba(255,240,240,' + rand(0.3, 0.7) + ')';
    c.beginPath(); c.arc(Math.cos(a) * r, cy + Math.sin(a) * r, rand(0.008, 0.02), 0, TAU); c.fill();
  }
  gloss(c, -0.4, -0.25, 0.4, 0.12, 0.25, 0.4);
  c.strokeStyle = 'rgba(200,255,150,0.5)'; c.lineWidth = 0.035;
  c.beginPath(); c.arc(0, cy, 1.15, 0.15 * Math.PI, 0.45 * Math.PI); c.stroke();
}
function drawOrange(c) {
  const cy = 0.1;
  c.strokeStyle = '#6a4a1a'; c.lineWidth = 0.08; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0.05, -0.8); c.lineTo(0.08, -0.98); c.stroke();
  drawLeaf(c, 0.08, -0.96, -0.55, 0.6, 0.2, '#1d7a1d', '#86e050');
  c.beginPath(); c.arc(0, cy, 0.95, 0, TAU);
  let g = c.createRadialGradient(-0.3, cy - 0.35, 0.1, 0, cy, 0.98);
  g.addColorStop(0, '#ffc24a'); g.addColorStop(0.6, '#ff8a00'); g.addColorStop(1, '#c85200');
  c.fillStyle = g; c.fill();
  c.beginPath(); c.arc(0, cy, 0.86, 0, TAU); c.fillStyle = '#fff1cc'; c.fill();
  c.beginPath(); c.arc(0, cy, 0.8, 0, TAU);
  g = c.createRadialGradient(0, cy, 0.05, 0, cy, 0.8);
  g.addColorStop(0, '#ffe6a0'); g.addColorStop(0.5, '#ffb52e'); g.addColorStop(1, '#ff9500');
  c.fillStyle = g; c.fill();
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU + 0.05, a1 = (i + 1) / n * TAU - 0.05;
    for (let j = 0; j < 7; j++) {
      const a = rand(a0 + 0.08, a1 - 0.08), r = rand(0.2, 0.72);
      c.fillStyle = 'rgba(255,240,190,' + rand(0.25, 0.5) + ')';
      ell(c, Math.cos(a) * r, cy + Math.sin(a) * r, 0.05, 0.018, a); c.fill();
    }
  }
  c.strokeStyle = 'rgba(255,245,215,0.85)'; c.lineWidth = 0.035;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    c.beginPath(); c.moveTo(Math.cos(a) * 0.1, cy + Math.sin(a) * 0.1); c.lineTo(Math.cos(a) * 0.8, cy + Math.sin(a) * 0.8); c.stroke();
  }
  c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(0, cy, 0.1, 0, TAU); c.fill();
  gloss(c, -0.38, cy - 0.45, 0.32, 0.16, -0.6, 0.6);
}
function avoPath(c, s, oy) {
  c.save(); c.translate(0, oy); c.scale(s, s);
  c.beginPath(); c.moveTo(0, -1.15);
  c.bezierCurveTo(0.42, -1.15, 0.52, -0.5, 0.7, 0.0);
  c.bezierCurveTo(0.95, 0.6, 0.62, 1.07, 0, 1.07);
  c.bezierCurveTo(-0.62, 1.07, -0.95, 0.6, -0.7, 0.0);
  c.bezierCurveTo(-0.52, -0.5, -0.42, -1.15, 0, -1.15); c.closePath();
  c.restore();
}
function drawAvocado(c) {
  c.strokeStyle = '#5a3a14'; c.lineWidth = 0.08; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -1.1); c.lineTo(0.04, -1.28); c.stroke();
  drawLeaf(c, 0.04, -1.26, -0.6, 0.5, 0.17, '#1d7a1d', '#86e050');
  avoPath(c, 1, 0);
  let g = c.createLinearGradient(-0.8, 0, 0.8, 0);
  g.addColorStop(0, '#24520f'); g.addColorStop(0.4, '#4a8a20'); g.addColorStop(1, '#173a08');
  c.fillStyle = g; c.fill();
  avoPath(c, 0.87, 0.04);
  g = c.createRadialGradient(0, 0.35, 0.1, 0, 0.1, 1.05);
  g.addColorStop(0, '#f6f8b0'); g.addColorStop(0.5, '#dcec74'); g.addColorStop(0.85, '#9cc83c'); g.addColorStop(1, '#5e9a24');
  c.fillStyle = g; c.fill();
  c.beginPath(); c.arc(0, 0.45, 0.37, 0, TAU);
  g = c.createRadialGradient(-0.12, 0.32, 0.03, 0, 0.45, 0.4);
  g.addColorStop(0, '#d9a066'); g.addColorStop(0.45, '#9a5f2c'); g.addColorStop(1, '#5a3112');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(120,150,40,0.5)'; c.lineWidth = 0.04;
  c.beginPath(); c.arc(0, 0.45, 0.4, 0, TAU); c.stroke();
  gloss(c, -0.12, 0.3, 0.14, 0.08, -0.6, 0.8);
  gloss(c, -0.3, -0.55, 0.12, 0.28, 0.25, 0.45);
}
