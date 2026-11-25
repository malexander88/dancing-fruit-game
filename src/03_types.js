/* ---------- fruit type table ---------- */
const TYPES = {
  cherry:     { draw: drawCherry, glow: '#ff2240', faces: [{ x: -0.46, y: 0.36, s: 0.6 }, { x: 0.5, y: 0.47, s: 0.6 }], r: 1.0, cy: 0.3, bot: 0.98, scale: 1.0, splat: '#a10018' },
  banana:     { draw: drawBanana, glow: '#ffd83a', faces: [{ x: 0, y: -0.4, s: 0.64 }], r: 0.9, cy: 0.0, bot: 1.08, scale: 1.0, splat: '#f2dc8a' },
  pineapple:  { draw: drawPineapple, glow: '#ff9a10', faces: [{ x: 0, y: 0.28, s: 0.76 }], r: 1.0, cy: 0.1, bot: 1.18, scale: 1.0, splat: '#ffcc2e' },
  strawberry: { draw: drawStrawberry, glow: '#ff2238', faces: [{ x: 0, y: 0.16, s: 0.72 }], r: 0.95, cy: 0.15, bot: 1.06, scale: 0.95, splat: '#c40a25' },
  watermelon: { draw: drawWatermelon, glow: '#ff4f7a', faces: [{ x: 0, y: -0.06, s: 0.74 }], r: 1.12, cy: 0.05, bot: 0.76, scale: 0.95, splat: '#ff3558' },
  orange:     { draw: drawOrange, glow: '#ff8800', faces: [{ x: 0, y: 0.2, s: 0.74 }], r: 0.97, cy: 0.1, bot: 1.05, scale: 0.95, splat: '#ff9a14' },
  avocado:    { draw: drawAvocado, glow: '#a6ea2a', faces: [{ x: 0, y: -0.34, s: 0.6 }], r: 0.9, cy: 0.0, bot: 1.07, scale: 1.0, splat: '#9cc23a' }
};
const TYPE_NAMES = Object.keys(TYPES);
const cache = {};
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
function buildCaches() {
  const newK = Math.round(clamp(unit * 1.2 * DPR, 48, 260));
  if (Math.abs(newK - K) < 6 && cache.cherry) return;
  K = newK;
  for (const name of TYPE_NAMES) {
    const T = TYPES[name];
    const w = Math.ceil(3.8 * K), h = Math.ceil(4.6 * K), ox = 1.9 * K, oy = 2.6 * K;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tc = tmp.getContext('2d');
    tc.translate(ox, oy); tc.scale(K, K); T.draw(tc);
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const oc = out.getContext('2d');
    oc.shadowColor = T.glow; oc.shadowBlur = 0.55 * K;
    oc.drawImage(tmp, 0, 0); oc.drawImage(tmp, 0, 0);
    oc.shadowBlur = 0.15 * K; oc.drawImage(tmp, 0, 0);
    oc.shadowBlur = 0; oc.shadowColor = 'transparent'; oc.drawImage(tmp, 0, 0);
    const gs = document.createElement('canvas'); gs.width = gs.height = 128;
    const gc = gs.getContext('2d');
    const gg = gc.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0, T.glow); gg.addColorStop(0.35, hexA(T.glow, 0.45)); gg.addColorStop(1, hexA(T.glow, 0));
    gc.fillStyle = gg; gc.fillRect(0, 0, 128, 128);
    cache[name] = { c: out, w, h, ox, oy, glow: gs };
  }
}
let dustSprite = null;
function makeDust() {
  dustSprite = document.createElement('canvas'); dustSprite.width = dustSprite.height = 64;
  const c = dustSprite.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,230,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
}

/* ---------- faces ---------- */
function drawFace(c, fx, fy, s, expr, blink, lx, ly) {
  c.save(); c.translate(fx, fy); c.scale(s, s);
  c.fillStyle = 'rgba(255,105,160,0.6)';
  ell(c, -0.62, 0.24, 0.16, 0.1); c.fill();
  ell(c, 0.62, 0.24, 0.16, 0.1); c.fill();
  const ex = 0.37, ox = lx * 0.05, oy = ly * 0.04;
  c.strokeStyle = '#140808'; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const x = side * ex + ox, y = oy;
    const closed = expr === 'happy' || (expr === 'wink' && side === 1);
    c.lineWidth = 0.07;
    if (closed) {
      c.beginPath();
      if (expr === 'happy') { c.moveTo(x - 0.13, y + 0.05); c.quadraticCurveTo(x, y - 0.17, x + 0.13, y + 0.05); }
      else { c.moveTo(x - 0.13, y - 0.02); c.quadraticCurveTo(x, y + 0.1, x + 0.13, y - 0.02); }
      c.stroke();
    } else if (blink > 0.82) {
      c.beginPath(); c.moveTo(x - 0.12, y + 0.01); c.quadraticCurveTo(x, y + 0.07, x + 0.12, y + 0.01); c.stroke();
    } else {
      const big = expr === 'oh' ? 1.12 : 1;
      const ry = 0.17 * big * Math.max(0.1, 1 - blink), rx = 0.135 * big;
      c.fillStyle = '#140808'; ell(c, x, y, rx, ry); c.fill();
      if (ry > 0.07) {
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(x + 0.045, y - 0.075 * ry / 0.17, 0.056, 0, TAU); c.fill();
        c.beginPath(); c.arc(x - 0.045, y + 0.075 * ry / 0.17, 0.024, 0, TAU); c.fill();
      }
    }
    c.lineWidth = 0.04;
    const by = expr === 'oh' ? -0.42 : (expr === 'grin' || expr === 'happy') ? -0.33 : -0.3;
    const tilt = expr === 'oh' ? 0.02 * side : 0;
    c.beginPath();
    c.moveTo(x - 0.08, by + 0.03 + tilt);
    c.quadraticCurveTo(x, by - 0.03, x + 0.08, by + 0.03 - tilt);
    c.stroke();
  }
  c.lineWidth = 0.065;
  const mx = ox * 0.6, my = oy * 0.6;
  if (expr === 'grin' || expr === 'happy') {
    c.beginPath(); c.moveTo(mx - 0.17, my + 0.12); c.quadraticCurveTo(mx, my + 0.46, mx + 0.17, my + 0.12); c.closePath();
    c.fillStyle = '#5c0f1a'; c.fill();
    c.save(); c.clip(); c.fillStyle = '#ff6f8a'; ell(c, mx, my + 0.33, 0.1, 0.07); c.fill(); c.restore();
  } else if (expr === 'oh') {
    c.fillStyle = '#3a0a10'; ell(c, mx, my + 0.22, 0.065, 0.085); c.fill();
  } else if (expr === 'wink') {
    c.beginPath(); c.arc(mx + 0.02, my + 0.08, 0.14, 0.15 * Math.PI, 0.8 * Math.PI); c.stroke();
  } else {
    c.beginPath(); c.arc(mx, my + 0.09, 0.13, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  }
  c.restore();
}
const EXPRS = [['smile', 38], ['grin', 20], ['happy', 16], ['wink', 12], ['oh', 14]];
function pickExpr() {
  let r = Math.random() * 100;
  for (const e of EXPRS) { r -= e[1]; if (r <= 0) return e[0]; }
  return 'smile';
}
