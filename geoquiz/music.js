/* Música y efectos del Geoquiz — compuestos y sintetizados en vivo con Web Audio (sin archivos).
 * Uso: Music.init() tras un clic; Music.play("lobby" | "question" | "none"); Music.sfx("tick" | "blip" | "reveal" | "roll" | "fanfare" | "whoosh");
 *      Music.toggle() silencia o activa; Music.muted indica el estado.
 */
(function () {
  "use strict";
  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let track = "none", step = 0, nextT = 0, timer = null;
  let muted = false;
  try { muted = localStorage.getItem("geoquiz:muted") === "1"; } catch (e) {}

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);       // nota MIDI → frecuencia
  const N = { C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, G5: 79, A5: 81, C6: 84 };

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9;
    musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    timer = setInterval(scheduler, 25);
  }

  /* ---------- instrumentos */
  function tone(f, t, dur, type, vol, bus, attack, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || musicBus); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, freq, type, bus) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type || "highpass"; f.frequency.value = freq || 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || musicBus); s.start(t); s.stop(t + dur + 0.02);
  }
  const kick = (t, v) => tone(150, t, 0.22, "sine", v || 0.9, musicBus, 0.002, 42);
  const hat = (t, v) => noise(t, 0.04, v || 0.12);
  const snare = (t, v) => { noise(t, 0.14, v || 0.35, 1800, "bandpass"); tone(190, t, 0.08, "triangle", 0.15); };

  /* ---------- pistas (16 pasos por compás) */
  const TRACKS = {
    // Lobby: tranquilo y alegre, C – Am – F – G
    lobby: {
      bpm: 104,
      bars: [[N.C3, N.E4, N.G4, N.C5], [N.A2, N.C4, N.E4, N.A4], [N.F2, N.A3, N.C4, N.F4], [N.G2, N.B3, N.D4, N.G4]],
      play(t, s, bar) {
        const c = this.bars[bar];
        if (s === 0 || s === 6 || s === 8 || s === 14) tone(hz(c[0]), t, 0.32, "triangle", 0.42);
        const arp = [1, 2, 3, 2, 1, 2, 3, 0];
        if (s % 2 === 0) tone(hz(c[arp[(s / 2) % 8]] + 12), t, 0.16, "square", 0.05);
        if (s === 4 || s === 12) tone(hz(c[3] + 12), t, 0.5, "sine", 0.06, musicBus, 0.04);
        if (s % 4 === 2) hat(t, 0.07);
        if (s === 0 || s === 8) kick(t, 0.5);
      }
    },
    // Pregunta: tenso y con pulso, Am – Am – F – E
    question: {
      bpm: 132,
      bars: [[N.A2, N.C4, N.E4], [N.A2, N.C4, N.E4], [N.F2, N.A3, N.C4], [N.E2, N.G3 + 1, N.B3]],
      play(t, s, bar) {
        const c = this.bars[bar];
        const bass = [0, 0, 12, 0, 0, 12, 0, 7];
        if (s % 2 === 0) tone(hz(c[0] + bass[(s / 2) % 8]), t, 0.12, "sawtooth", 0.16);
        if (s % 4 === 0) kick(t, 0.8);
        if (s === 4 || s === 12) snare(t, 0.22);
        hat(t, s % 2 ? 0.05 : 0.09);
        const lead = [2, null, 1, null, 2, 1, null, 0, 2, null, 1, null, 2, null, 1, null];
        if (lead[s] !== null && bar % 2 === 1) tone(hz(c[lead[s]] + 12), t, 0.1, "square", 0.045);
        if (s === 0) tone(hz(c[1] + 12), t, 0.9, "triangle", 0.05, musicBus, 0.05);
      }
    }
  };

  function scheduler() {
    if (!ctx || track === "none") return;
    const tr = TRACKS[track], spb = 60 / tr.bpm / 4;
    while (nextT < ctx.currentTime + 0.12) {
      tr.play(nextT, step % 16, Math.floor(step / 16) % tr.bars.length);
      step++; nextT += spb;
    }
  }

  function play(name) {
    if (!ctx || name === track) return;
    track = TRACKS[name] ? name : "none";
    step = 0; nextT = ctx.currentTime + 0.06;
  }

  /* ---------- efectos */
  function sfx(name) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "tick": tone(1600, t, 0.05, "square", 0.12, sfxBus); break;
      case "blip": tone(880, t, 0.07, "triangle", 0.18, sfxBus); tone(1320, t + 0.05, 0.08, "triangle", 0.14, sfxBus); break;
      case "whoosh": { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noiseBuf; f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.45);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 0.55); break; }
      case "reveal": [N.C4, N.E4, N.G4, N.C5].forEach((m, i) => tone(hz(m), t + i * 0.07, 0.5, "square", 0.09, sfxBus));
        tone(hz(N.C3), t, 0.7, "triangle", 0.3, sfxBus); noise(t + 0.28, 0.4, 0.15, 6000, "highpass", sfxBus); break;
      case "roll": for (let i = 0; i < 14; i++) noise(t + i * 0.045, 0.06, 0.06 + i * 0.015, 2000, "bandpass", sfxBus);
        tone(hz(N.G3), t + 0.65, 0.5, "triangle", 0.2, sfxBus); tone(hz(N.C4), t + 0.65, 0.6, "square", 0.08, sfxBus); break;
      case "fanfare": {
        const mel = [[N.G4, 0, .14], [N.G4, .16, .14], [N.G4, .32, .14], [N.C5, .5, .7], [N.E5, 1.25, .2], [N.D5, 1.45, .2], [N.E5, 1.65, .2], [N.G5, 1.85, 1.2]];
        mel.forEach(([m, d, l]) => { tone(hz(m), t + d, l, "square", 0.1, sfxBus); tone(hz(m - 12), t + d, l, "triangle", 0.12, sfxBus); });
        tone(hz(N.C3), t + .5, .7, "sawtooth", 0.1, sfxBus); tone(hz(N.G2), t + 1.85, 1.2, "sawtooth", 0.1, sfxBus);
        [0.5, 1.85].forEach(d => noise(t + d, 0.9, 0.18, 5000, "highpass", sfxBus)); break; }
    }
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem("geoquiz:muted", muted ? "1" : "0"); } catch (e) {}
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.05);
  }

  window.Music = {
    init, play, sfx,
    toggle() { setMuted(!muted); return muted; },
    get muted() { return muted; }
  };
})();
