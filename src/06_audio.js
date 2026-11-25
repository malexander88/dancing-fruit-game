/* ---------- audio ---------- */
let actx = null, audio = false, master, musicBus, sfxBus, noiseBuf, t0 = 0, stepIdx = 0, startStep = 0, nextTime = 0;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* --- embedded music track (CC0) --- */
const LOOP_LEN = 7232400 / 44100;   // 82 bars = 328 beats at 120 BPM (164.0 s)
const FIRST_SOUND = 194;            // index of first sample > 0.02 in the source wav
const LOOP_LEAD = 0.5;              // loop window starts here (file has 1 s of wrap-around tail)
const BEAT_OFFSET = 0.0;            // loop starts exactly on a downbeat
let musicBuffer = null, musicFailed = false, trackStarted = false, procStarted = false, trackStart = 0, trackDelay = 0, trackSrc = null;
function decodeMusic() {
  const b64 = window.__MUSIC_B64;
  if (!b64) { musicFailed = true; return; }
  try {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) { musicFailed = true; return; }
    const oc = new OAC(2, 44100, 44100);
    const ok = buf => {
      if (musicBuffer) return;
      musicBuffer = buf;
      const ch = buf.getChannelData(0); let i = 0;
      while (i < ch.length && Math.abs(ch[i]) < 0.02) i++;
      trackDelay = clamp(i / buf.sampleRate - FIRST_SOUND / 44100, 0, 0.2);
      if (audio && !trackStarted && !procStarted) startTrack();
    };
    const bad = () => { musicFailed = true; if (audio && !trackStarted && !procStarted) startProcedural(); };
    const pr = oc.decodeAudioData(u.buffer, ok, bad);
    if (pr && pr.catch) pr.catch(bad);
  } catch (e) { musicFailed = true; }
}
function startTrack() {
  trackStarted = true;
  const g = actx.createGain(); g.gain.value = 0.55; g.connect(master);
  const src = actx.createBufferSource();
  src.buffer = musicBuffer; src.loop = true;
  src.loopStart = LOOP_LEAD + trackDelay; src.loopEnd = LOOP_LEAD + trackDelay + LOOP_LEN;
  src.connect(g);
  trackStart = actx.currentTime + 0.06;
  src.start(trackStart, 0);
  trackSrc = src;
}
function startProcedural() {
  procStarted = true;
  SPB = 60 / 104; BPM = 104; STEP = SPB / 4;
  t0 = actx.currentTime - t;
  stepIdx = Math.ceil((actx.currentTime + 0.05 - t0) / STEP);
  stepIdx = Math.ceil(stepIdx / 4) * 4;
  startStep = stepIdx; nextTime = t0 + stepIdx * STEP;
  setInterval(scheduler, 25);
}
function initAudio() {
  if (audio) { if (actx.state !== 'running' && actx.resume) actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { actx = new AC(); } catch (e) { return; }
  audio = true;
  const comp = actx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  master = actx.createGain(); master.gain.value = 0.9;
  comp.connect(master); master.connect(actx.destination);
  musicBus = actx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(comp);
  sfxBus = actx.createGain(); sfxBus.gain.value = 0.95; sfxBus.connect(comp);
  noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const b = actx.createBufferSource(); b.buffer = actx.createBuffer(1, 1, 22050); b.connect(actx.destination); b.start(0);
  if (actx.resume) actx.resume();
  if (musicBuffer) startTrack();
  else if (musicFailed) startProcedural();
  // else: startTrack() runs as soon as decoding finishes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (actx.suspend) actx.suspend(); }
    else if (actx.resume) actx.resume();
  });
}
function getBeat() {
  if (audio && actx.state === 'running') {
    const lat = actx.outputLatency || 0;
    if (trackStarted) return (actx.currentTime - lat - trackStart - trackDelay - BEAT_OFFSET) / SPB;
    if (procStarted) return (actx.currentTime - lat - t0) / SPB;
  }
  return t / SPB;
}
function scheduler() {
  if (!audio || actx.state !== 'running') return;
  const now = actx.currentTime;
  let guard = 0;
  while (nextTime < now + 0.15 && guard++ < 400) {
    if (nextTime >= now - 0.02) playStep(stepIdx - startStep, nextTime);
    stepIdx++; nextTime = t0 + stepIdx * STEP;
  }
}
function envG(t, a, peak, dec, dest) {
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  g.connect(dest); return g;
}
function noise(t, dur) { const s = actx.createBufferSource(); s.buffer = noiseBuf; s.start(t, Math.random() * 1.5, dur + 0.05); return s; }
function filt(type, f, q) { const b = actx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
function osc(type, f, t, dur) { const o = actx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; }

function kick(t, v) {
  const g = envG(t, 0.004, 0.95 * v, 0.32, musicBus);
  const o = osc('sine', 150, t, 0.4); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); o.connect(g);
  const n = noise(t, 0.02), hp = filt('highpass', 3000); n.connect(hp); hp.connect(envG(t, 0.001, 0.25 * v, 0.02, musicBus));
}
function clap(t, v) {
  const bp = filt('bandpass', 1400, 0.9);
  for (let i = 0; i < 3; i++) { const tt = t + i * 0.011; const g = envG(tt, 0.001, 0.32 * v, i === 2 ? 0.14 : 0.01, musicBus); const n = noise(tt, 0.16); n.connect(bp); bp.connect(g); }
}
function shaker(t, v) { const n = noise(t, 0.07), hp = filt('highpass', 6500); n.connect(hp); hp.connect(envG(t, 0.004, v, 0.05, musicBus)); }
function guiro(t, dur, v) {
  const n = noise(t, dur), bp = filt('bandpass', 3600, 1.8);
  const am = actx.createGain(); am.gain.value = 0.5;
  const lfo = osc('square', dur > 0.15 ? 42 : 55, t, dur); const lg = actx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012);
  g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(am); am.connect(g); g.connect(musicBus);
}
function clave(t, v) {
  osc('sine', 2500, t, 0.08).connect(envG(t, 0.001, 0.3 * v, 0.06, musicBus));
  osc('triangle', 1650, t, 0.06).connect(envG(t, 0.001, 0.12 * v, 0.04, musicBus));
}
function tom(t, f, v) {
  const o = osc('sine', f, t, 0.3); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.25); o.connect(envG(t, 0.003, 0.4 * v, 0.25, musicBus));
}
function cowbell(t, v) {
  const bp = filt('bandpass', 800, 3); bp.connect(envG(t, 0.001, 0.12 * v, 0.12, musicBus));
  osc('square', 540, t, 0.15).connect(bp); osc('square', 800, t, 0.15).connect(bp);
}
function bass(t, m, dur) {
  const f = mtof(m);
  const lp = filt('lowpass', 520, 5); lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(300, t + dur);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
  lp.connect(g); g.connect(musicBus);
  osc('sawtooth', f, t, dur + 0.06).connect(lp);
  const sg = actx.createGain(); sg.gain.value = 0.9; sg.connect(g); osc('sine', f, t, dur + 0.06).connect(sg);
}
function stab(t, notes) {
  const lp = filt('lowpass', 1900, 1); lp.connect(envG(t, 0.004, 0.05, 0.14, musicBus));
  for (const n of notes) {
    const o = osc('sawtooth', mtof(n), t, 0.2); o.detune.value = rand(-6, 6); o.connect(lp);
    const o2 = osc('square', mtof(n), t, 0.2); o2.detune.value = rand(-6, 6); o2.connect(lp);
  }
}
function accordion(t, m, dur, v) {
  const f = mtof(m);
  const lp = filt('lowpass', 2800, 0.8);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02);
  g.gain.setValueAtTime(v * 0.85, t + Math.max(0.03, dur * 0.75)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
  lp.connect(g); g.connect(musicBus);
  const lfo = osc('sine', 5.6, t, dur + 0.1); const lg = actx.createGain(); lg.gain.value = 9; lfo.connect(lg);
  for (const det of [-8, 8]) { const o = osc('sawtooth', f, t, dur + 0.1); o.detune.value = det; lg.connect(o.detune); o.connect(lp); }
  const sq = osc('square', f / 2, t, dur + 0.1); const sqg = actx.createGain(); sqg.gain.value = 0.35; sq.connect(sqg); sqg.connect(lp);
}
function marimba(t, m, v) {
  const f = mtof(m);
  osc('sine', f, t, 0.5).connect(envG(t, 0.002, v, 0.45, musicBus));
  osc('sine', f * 4, t, 0.1).connect(envG(t, 0.001, v * 0.3, 0.08, musicBus));
}
const CHORDS = [[60, 64, 67], [60, 65, 69], [59, 62, 67], [60, 64, 67], [60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 64, 67]];
const ROOTS = [36, 41, 43, 36, 36, 41, 43, 36];
const BASSPAT = [0, null, null, 0, 7, null, 12, 7];
const MEL = [
  76, null, 79, 76, 72, null, 76, 79,
  81, null, 81, 79, 77, null, 81, null,
  79, 77, 76, 74, 71, null, 74, 79,
  76, null, 72, null, 72, null, null, null,
  79, null, 84, 79, 76, null, 79, 76,
  77, 81, 84, 81, 77, null, 76, 77,
  74, null, 79, 77, 76, 74, 71, 74,
  72, null, 76, 79, 84, null, null, null
];
const CLAVE = new Set([0, 6, 12, 20, 24]);
function playStep(m, time) {
  const s16 = m % 16, bar = Math.floor(m / 16), b8 = bar % 8, s32 = m % 32;
  const fill = b8 === 7 && s16 >= 12;
  if (s16 % 4 === 0) kick(time, s16 === 0 ? 1 : 0.8);
  if (s16 === 4 || s16 === 12) clap(time, 0.55);
  shaker(time, s16 % 4 === 2 ? 0.1 : 0.045);
  if (s16 % 4 === 0) guiro(time, STEP * 1.8, 0.16);
  else if (s16 % 4 === 2 || s16 % 4 === 3) guiro(time, STEP * 0.7, 0.11);
  if (CLAVE.has(s32) && !fill) clave(time, 1);
  if (s16 % 4 === 2 && bar % 2 === 1) cowbell(time, 1);
  if (fill) tom(time, [260, 210, 170, 135][s16 - 12], 1);
  if (s16 % 2 === 0) {
    const e8 = s16 / 2;
    const bp = BASSPAT[e8];
    if (bp != null) bass(time, ROOTS[b8] + bp, STEP * (e8 === 0 || e8 === 4 ? 2.6 : 1.6));
    if (e8 % 2 === 1) stab(time, CHORDS[b8]);
    const phrase = Math.floor(bar / 8) % 4;
    const note = MEL[b8 * 8 + e8];
    if (phrase !== 3 && note != null) {
      let n = 0; while (n < 2 && MEL[(b8 * 8 + e8 + 1 + n) % 64] == null) n++;
      const dur = (1 + n) * STEP * 2 * 0.9;
      if (phrase === 0) accordion(time, note, dur, 0.075);
      else if (phrase === 1) marimba(time, note + 12, 0.22);
      else { accordion(time, note, dur, 0.065); marimba(time, note + 12, 0.12); }
    } else if (phrase === 3 && e8 % 2 === 0) {
      const ch = CHORDS[b8]; marimba(time, ch[(e8 / 2 + bar) % ch.length] + 12, 0.16);
    }
  }
}
/* ---------- sound effects ---------- */
function sfxSplat(t, size, pitch) {
  const n = noise(t, 0.4), lp = filt('lowpass', 3500 * pitch, 1.2);
  lp.frequency.setValueAtTime(3800 * pitch, t); lp.frequency.exponentialRampToValueAtTime(220, t + 0.3);
  n.connect(lp); lp.connect(envG(t, 0.004, 0.75 * size, 0.32, sfxBus));
  const o = osc('sine', 340 * pitch, t, 0.25); o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
  o.connect(envG(t, 0.003, 0.5 * size, 0.2, sfxBus));
  const drips = randi(3, 5);
  for (let i = 0; i < drips; i++) {
    const tt = t + rand(0.14, 0.55), f = rand(900, 1800) * pitch;
    const d = osc('sine', f, tt, 0.07); d.frequency.exponentialRampToValueAtTime(f * 0.55, tt + 0.05);
    d.connect(envG(tt, 0.002, 0.07 * size, 0.05, sfxBus));
  }
}
function sfxSquelch(t, size) {
  const n = noise(t, 0.45), bp = filt('bandpass', 700, 7);
  const curve = new Float32Array(14); for (let i = 0; i < curve.length; i++) curve[i] = 350 + Math.random() * 1200 * (1 - i / curve.length * 0.6);
  bp.frequency.setValueCurveAtTime(curve, t, 0.4);
  n.connect(bp); bp.connect(envG(t, 0.01, 1.4 * size, 0.4, sfxBus));
  const o = osc('triangle', 190, t, 0.4);
  const c2 = new Float32Array(10); for (let i = 0; i < c2.length; i++) c2[i] = 190 - i * 11 + Math.random() * 45;
  o.frequency.setValueCurveAtTime(c2, t + 0.001, 0.35);
  o.connect(envG(t, 0.01, 0.3 * size, 0.33, sfxBus));
}
function sfxCrunch(t, size) {
  const n = randi(7, 10); let tt = t;
  for (let i = 0; i < n; i++) {
    const s = noise(tt, 0.06), hp = filt('highpass', 1200), bp = filt('bandpass', rand(1800, 5200), 1.4);
    s.connect(hp); hp.connect(bp); bp.connect(envG(tt, 0.001, 0.9 * size * (1 - i / n * 0.6), rand(0.02, 0.05), sfxBus));
    tt += rand(0.012, 0.035);
  }
  const o = osc('sine', 130, t, 0.2); o.frequency.exponentialRampToValueAtTime(50, t + 0.15); o.connect(envG(t, 0.003, 0.5 * size, 0.16, sfxBus));
}
function sfxCork(t) {
  const o = osc('sine', 1500, t, 0.1); o.frequency.exponentialRampToValueAtTime(260, t + 0.07); o.connect(envG(t, 0.002, 0.6, 0.09, sfxBus));
  const n = noise(t, 0.04), hp = filt('highpass', 2000); n.connect(hp); hp.connect(envG(t, 0.001, 0.35, 0.03, sfxBus));
}
function sfxPop(t, p) {
  const n = noise(t, 0.08), hp = filt('highpass', 900); n.connect(hp); hp.connect(envG(t, 0.001, 0.5, 0.07, sfxBus));
  const o = osc('sine', 620 * p, t, 0.12); o.frequency.exponentialRampToValueAtTime(150, t + 0.1); o.connect(envG(t, 0.002, 0.4, 0.1, sfxBus));
}
function sfxSpray(t) { const n = noise(t, 0.4), hp = filt('highpass', 3200); n.connect(hp); hp.connect(envG(t + 0.02, 0.02, 0.28, 0.35, sfxBus)); }
function sfxThunk(t, v) {
  v = v == null ? 1 : v;
  const o = osc('sine', 270, t, 0.16); o.frequency.exponentialRampToValueAtTime(130, t + 0.12); o.connect(envG(t, 0.002, 0.55 * v, 0.13, sfxBus));
  osc('triangle', 560, t, 0.05).connect(envG(t, 0.001, 0.15 * v, 0.03, sfxBus));
}
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
function sfxChime(t) {
  const st = randi(0, 4);
  for (let i = 0; i < 3; i++) {
    const tt = t + 0.05 + i * 0.065, f = mtof(PENTA[st + i] + 12);
    osc('triangle', f, tt, 0.3).connect(envG(tt, 0.003, 0.07, 0.25, sfxBus));
    osc('sine', f * 2, tt, 0.15).connect(envG(tt, 0.002, 0.025, 0.12, sfxBus));
  }
}
function sfxBoing(t) {
  const o = osc('sine', 220, t, 0.35); o.frequency.exponentialRampToValueAtTime(700, t + 0.2);
  const l = osc('sine', 16, t, 0.35), lg = actx.createGain(); lg.gain.value = 25; l.connect(lg); lg.connect(o.frequency);
  o.connect(envG(t, 0.01, 0.13, 0.28, sfxBus));
}
function sfxMiss(t) { osc('sine', mtof(pick(PENTA) + 12), t, 0.2).connect(envG(t, 0.002, 0.05, 0.15, sfxBus)); }
function popSound(type) {
  if (!audio) return;
  const tt = actx.currentTime + 0.005;
  switch (type) {
    case 'cherry': sfxCork(tt); sfxSplat(tt + 0.02, 0.6, 1.3); break;
    case 'banana': sfxSquelch(tt, 0.85); sfxPop(tt, 0.8); break;
    case 'pineapple': sfxCrunch(tt, 1); sfxSplat(tt + 0.03, 0.5, 1.1); break;
    case 'strawberry': sfxPop(tt, 1.1); sfxSplat(tt, 0.9, 1.15); break;
    case 'watermelon': sfxSplat(tt, 1.2, 0.8); sfxCrunch(tt, 0.5); break;
    case 'orange': sfxSplat(tt, 1.0, 1.0); sfxSpray(tt); break;
    case 'avocado': sfxSquelch(tt, 1); sfxThunk(tt + 0.04, 0.8); break;
  }
  sfxChime(tt);
}

function sfxSwoosh(t, v) {
  const n = noise(t, 0.25), bp = filt('bandpass', 900, 1.2);
  bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.16);
  n.connect(bp); bp.connect(envG(t, 0.03, 0.22 * v + 0.05, 0.16, sfxBus));
}
function sfxSlide(t, v) {
  const n = noise(t, 0.2), lp = filt('lowpass', 1200, 2);
  lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(350, t + 0.15);
  n.connect(lp); lp.connect(envG(t, 0.01, 0.35 * v + 0.05, 0.15, sfxBus));
  const f = rand(500, 900);
  const o = osc('sine', f, t, 0.1); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.07);
  o.connect(envG(t, 0.004, 0.06 * v + 0.02, 0.07, sfxBus));
}
decodeMusic();
