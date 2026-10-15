/* Geoquiz en vivo — GeologyCraft (versión Firebase)
 * La partida vive en Firebase Realtime Database:
 *   games/<pin>/host                → uid del presentador
 *   games/<pin>/state               → fase actual (lobby, q, reveal, board, end) y la pregunta en juego
 *   games/<pin>/players/<uid>       → apodo y si está conectado (lo escribe cada jugador)
 *   games/<pin>/answers/<i>/<uid>   → respuesta del jugador a la pregunta i, con hora del servidor
 *   games/<pin>/scores/<uid>        → puntaje y último resultado (lo escribe el presentador)
 * Las respuestas correctas solo se publican al revelar cada pregunta.
 */
(function () {
  "use strict";

  const LV = { facil: { n: "Fácil", t: 20 }, intermedia: { n: "Intermedia", t: 25 }, dificil: { n: "Difícil", t: 30 } };
  const MK = ["A", "B", "C", "D"];
  const INTRO_MS = 3000;          // tiempo para leer la pregunta antes de que aparezcan las alternativas
  const Q = window.PREGUNTAS || [];
  const app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => Number(n || 0).toLocaleString("es-CL");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem("geoquiz:" + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem("geoquiz:" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("geoquiz:" + k); } catch (e) {} }
  };
  const joinUrl = pin => location.origin + location.pathname + "?pin=" + pin;
  // Firebase puede devolver listas como objetos {0:…,1:…}; esto las normaliza
  const arr = v => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
  const center = html => `<div class="center">${html}</div>`;
  const spinner = text => center(`<div class="spin"></div><p class="muted">${text}</p>`);

  const M = window.Music || { init() {}, play() {}, sfx() {}, toggle() { return true; }, muted: true };

  /* ------------------------------------------------------------ Firebase */
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || /PEGAR/.test(cfg.apiKey + cfg.databaseURL)) {
    app.innerHTML = `<section class="hero"><div class="label">Geoquiz · Falta configurar</div><h1 style="font-size:48px">Falta conectar Firebase</h1>
      <p class="muted">Pega la configuración de tu proyecto en <b>firebase-config.js</b> y sube el archivo de nuevo. Los pasos están en LEEME.txt.</p></section>`;
    return;
  }
  if (typeof firebase === "undefined") { app.innerHTML = `<p class="err">No se pudieron cargar las librerías de Firebase (carpeta vendor).</p>`; return; }
  firebase.initializeApp(cfg);
  const auth = firebase.auth(), db = firebase.database(), TS = firebase.database.ServerValue.TIMESTAMP;
  let offset = 0;
  db.ref(".info/serverTimeOffset").on("value", s => { offset = s.val() || 0; });
  const now = () => Date.now() + offset;
  let UID = null;

  function signIn() {
    return new Promise((resolve, reject) => {
      const off = auth.onAuthStateChanged(u => {
        if (u) { off(); UID = u.uid; resolve(u); }
        else auth.signInAnonymously().catch(e => { off(); reject(e); });
      });
    });
  }
  function fatal(e) {
    console.error(e);
    const code = (e && e.code) || "error";
    const hint = /operation-not-allowed|admin-restricted/.test(code) ? "Activa el inicio de sesión Anónimo en Firebase → Authentication → Sign-in method."
      : /permission/.test(code) ? "Revisa que las reglas de la base de datos sean las de reglas-firebase.json."
      : "Revisa la conexión a internet y vuelve a intentar.";
    app.innerHTML = center(`<p class="err">Algo falló (${esc(code)}).</p><p class="muted" style="max-width:46ch">${hint}</p><button class="go" onclick="location.reload()">Reintentar</button>`);
  }

  /* ------------------------------------------------------------ confeti */
  function confetti(ms) {
    if (reduced) return;
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const x = c.getContext("2d"); let W, Hh;
    const size = () => { W = c.width = innerWidth * devicePixelRatio; Hh = c.height = innerHeight * devicePixelRatio; };
    size(); addEventListener("resize", size);
    const cols = ["#d9482b", "#3a6fb0", "#d8a91c", "#4f9a4a", "#f08a3c", "#f1efe9"];
    const P = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -Math.random() * Hh * .6, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.3, vr: (Math.random() - .5) * .3, s: (6 + Math.random() * 8) * devicePixelRatio, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    (function f(t) {
      x.clearRect(0, 0, W, Hh);
      for (const p of P) { p.x += p.vx; p.y += p.vy * devicePixelRatio; p.vy += .03; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }
      if (t - t0 < ms) requestAnimationFrame(f); else { removeEventListener("resize", size); c.remove(); }
    })(t0);
  }
  function countUp(el, from, to, ms) {
    if (reduced || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); })(t0);
  }

  /* ------------------------------------------------------------ PORTADA */
  function home() {
    app.innerHTML = `
    <section class="hero">
      <div class="label">GeologyCraft · Repaso de geología general</div>
      <h1>Geo<span>quiz</span></h1>
      <p class="muted">${Q.length} preguntas de petrología, volcanología, sedimentología y tectónica. Una persona proyecta la partida y el resto juega desde el celular.</p>
      <div class="paths">
        <div class="path">
          <h2>Presentar</h2>
          <p class="muted">Abre esto en el computador conectado al proyector. Aparecerá un QR para que se unan.</p>
          <button class="go" id="host">Crear partida</button>
        </div>
        <div class="path">
          <h2>Jugar</h2>
          <label class="label" for="pin">PIN de la partida</label>
          <input type="tel" id="pin" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="off">
          <button class="ghost" id="join">Unirme</button>
        </div>
      </div>
    </section>`;
    app.querySelector("#host").onclick = hostEntry;
    const go = () => { const p = app.querySelector("#pin").value.replace(/\D/g, ""); if (p.length === 6) location.search = "?pin=" + p; };
    app.querySelector("#join").onclick = go;
    app.querySelector("#pin").onkeydown = e => { if (e.key === "Enter") go(); };
  }

  /* ============================================================ PRESENTADOR */
  const H = {
    pin: "", ref: null, deck: [], i: 0, phase: "lobby",
    set: Object.assign({ sel: "j1", mix: true, auto: true, reveal: 3, board: 5 }, store.get("settings") || {}),
    players: {}, scores: {}, answers: {}, ansRef: null, kicked: {},
    startAt: 0, deadline: 0, T: 0, opened: false, allAt: 0,
    due: null, dueFn: null, dueTotal: 0, paused: false, pausedLeft: 0,
    boardData: [], ticker: null
  };

  async function hostEntry() {
    M.init();
    app.innerHTML = spinner("Conectando…");
    try { await signIn(); } catch (e) { return fatal(e); }
    const active = store.get("activePin");
    if (active) {
      try {
        const snap = await db.ref("games/" + active).once("value");
        const g = snap.val();
        if (g && g.host === UID && g.state && g.state.phase !== "end" && store.get("host:" + active)) {
          app.innerHTML = center(`<div class="label">Partida en curso</div><div class="pin">${active.slice(0, 3)} ${active.slice(3)}</div>
            <p class="muted">Tienes una partida sin terminar en este computador.</p>
            <div class="row" style="justify-content:center"><button class="go" id="resume">Retomar</button><button class="ghost" id="fresh">Crear una nueva</button></div>`);
          app.querySelector("#resume").onclick = () => resume(active, g);
          app.querySelector("#fresh").onclick = () => { db.ref("games/" + active).remove().catch(() => {}); store.del("host:" + active); store.del("activePin"); createGame(); };
          return;
        }
      } catch (e) {}
    }
    createGame();
  }

  async function createGame() {
    app.innerHTML = spinner("Creando la partida…");
    for (let n = 0; n < 6; n++) {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      try {
        const res = await db.ref("games/" + pin).transaction(cur => cur === null ? { host: UID, created: Date.now(), state: { phase: "lobby" } } : undefined);
        if (res.committed) { startHosting(pin); lobby(); return; }
      } catch (e) { return fatal(e); }
    }
    fatal({ code: "sin-pin-libre" });
  }

  function startHosting(pin) {
    H.pin = pin; H.ref = db.ref("games/" + pin);
    store.set("activePin", pin);
    H.ref.child("players").on("value", s => {
      const all = s.val() || {}; H.players = {};
      for (const u in all) if (!H.kicked[u] && all[u] && all[u].nick) H.players[u] = all[u];
      refreshLive();
    }, fatal);
    H.ref.child("kicked").on("value", s => { H.kicked = s.val() || {}; });
    try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
    clearInterval(H.ticker); H.ticker = setInterval(tick, 100);
    soundButton();
  }

  async function resume(pin, g) {
    startHosting(pin);
    const saved = store.get("host:" + pin);
    H.deck = saved.deck || []; H.i = saved.i || 0; Object.assign(H.set, saved.set || {});
    H.scores = g.scores || {};
    const ph = g.state.phase;
    if (ph === "lobby" || !H.deck.length) return lobby();
    if (ph === "q") { await H.ref.child("answers/" + H.i).remove(); return ask(); }
    if (H.i >= H.deck.length - 1) return finish();
    H.i++; ask();
  }

  function saveLocal() { store.set("host:" + H.pin, { deck: H.deck, i: H.i, set: H.set }); store.set("settings", H.set); }
  const nickOf = uid => (H.players[uid] && H.players[uid].nick) || "Jugador";
  const onlineUids = () => Object.keys(H.players).filter(u => H.players[u].online);
  function ranking() {
    const ids = new Set([...Object.keys(H.players), ...Object.keys(H.scores)]);
    return [...ids].map(uid => ({ uid, nick: nickOf(uid), score: (H.scores[uid] || {}).score || 0, ok: (H.scores[uid] || {}).ok || 0, streak: (H.scores[uid] || {}).streak || 0 }))
      .sort((a, b) => b.score - a.score || b.ok - a.ok || a.nick.localeCompare(b.nick));
  }

  /* ---- botón de música (solo presentador) */
  function soundButton() {
    if (document.getElementById("snd")) return;
    const b = document.createElement("button");
    b.id = "snd"; b.className = "snd"; b.type = "button";
    const paint = () => { b.textContent = M.muted ? "🔇 Música" : "🔊 Música"; b.setAttribute("aria-pressed", String(!M.muted)); b.title = "Silenciar o activar (tecla M)"; };
    b.onclick = () => { M.init(); M.toggle(); paint(); };
    paint(); document.body.appendChild(b); document.body.classList.add("hosting");
  }

  /* ---- expulsar jugadores */
  function kick(uid) {
    if (!uid) return;
    H.kicked[uid] = true;
    delete H.players[uid]; delete H.scores[uid]; delete H.answers[uid];
    H.boardData = H.boardData.filter(r => r.uid !== uid);
    const upd = {}; upd["kicked/" + uid] = true; upd["players/" + uid] = null; upd["scores/" + uid] = null;
    if (H.phase === "q") upd["answers/" + H.i + "/" + uid] = null;
    H.ref.update(upd).catch(fatal);
    refreshLive();
  }
  // Primer clic: pide confirmación en el mismo elemento. Segundo clic (antes de 4 s): expulsa.
  function armKick(el, uid, label) {
    if (el.classList.contains("arm")) { el.classList.remove("arm"); el.remove(); kick(uid); return; }
    document.querySelectorAll(".arm").forEach(x => { x.classList.remove("arm"); x.dataset.label && (x.querySelector(".nm") || x).replaceChildren(x.dataset.label); });
    el.dataset.label = label;
    el.classList.add("arm");
    (el.querySelector(".nm") || el).textContent = "¿Expulsar a " + label + "?";
    clearTimeout(el._t);
    el._t = setTimeout(() => { if (el.isConnected && el.classList.contains("arm")) { el.classList.remove("arm"); (el.querySelector(".nm") || el).textContent = label; } }, 4000);
  }

  /* ---- lobby */
  function lobby() {
    H.phase = "lobby"; cancelDue(); M.play("lobby");
    const counts = { todas: Q.length }; Q.forEach(x => { counts[x.l] = (counts[x.l] || 0) + 1; if (x.j) counts["j" + x.j] = (counts["j" + x.j] || 0) + 1; });
    if (!counts[H.set.sel]) H.set.sel = "todas";
    const chip = (k, n) => `<button class="chip" data-k="${k}" aria-pressed="${H.set.sel === k}">${n}<small>${counts[k] || 0}</small></button>`;
    const secs = (id, val, opts) => `<select id="${id}">${opts.map(o => `<option value="${o}" ${o == val ? "selected" : ""}>${o} s</option>`).join("")}</select>`;
    let qrImg = "";
    try { const qr = qrcode(0, "M"); qr.addData(joinUrl(H.pin)); qr.make(); qrImg = qr.createImgTag(10, 0); } catch (e) { qrImg = `<p style="color:#17181c">No se pudo generar el QR</p>`; }
    app.innerHTML = `
    <div class="lobby">
      <div class="qrbox">${qrImg}</div>
      <div style="display:grid;gap:20px;min-width:0">
        <div><div class="label">Escanea el QR o entra a</div>
          <p class="url">${esc(location.host + location.pathname)} <span class="muted">con el PIN</span></p></div>
        <div class="pin">${H.pin.slice(0, 3)} ${H.pin.slice(3)}</div>
        <div><div class="label"><span id="pcount">Jugadores (0)</span> <span class="hint">· clic en un nombre para expulsar</span></div><div class="players" id="plist" style="margin-top:10px"></div></div>
        <div class="setup">
          <div class="label">Preguntas</div>
          <div class="row" id="lv">${chip("j1", "Juego 1")}${chip("j2", "Juego 2")}${chip("todas", "Todas")}${chip("facil", "Fáciles")}${chip("intermedia", "Intermedias")}${chip("dificil", "Difíciles")}</div>
          <label class="check"><input type="checkbox" id="mix" ${H.set.mix ? "checked" : ""}> Mezclar el orden <span class="hint">(si no, va de fácil a difícil)</span></label>
          <label class="check"><input type="checkbox" id="auto" ${H.set.auto ? "checked" : ""}> Avanzar solo</label>
          <div class="row muted" id="autoopts" ${H.set.auto ? "" : "hidden"}>
            <label>Respuesta en pantalla ${secs("rv", H.set.reveal, [3, 5, 8, 12])}</label>
            <label>Ranking ${secs("bd", H.set.board, [3, 5, 8])}</label>
          </div>
        </div>
        <div class="row"><button class="go" id="start" disabled>Comenzar</button><span class="muted">Mantén esta pestaña abierta durante el juego.</span></div>
      </div>
    </div>`;
    app.querySelectorAll("#lv .chip").forEach(b => b.onclick = () => { H.set.sel = b.dataset.k; app.querySelectorAll("#lv .chip").forEach(c => c.setAttribute("aria-pressed", c === b)); });
    app.querySelector("#mix").onchange = e => H.set.mix = e.target.checked;
    app.querySelector("#auto").onchange = e => { H.set.auto = e.target.checked; app.querySelector("#autoopts").hidden = !H.set.auto; };
    app.querySelector("#rv").onchange = e => H.set.reveal = +e.target.value;
    app.querySelector("#bd").onchange = e => H.set.board = +e.target.value;
    app.querySelector("#start").onclick = startGame;
    refreshLive();
  }

  function refreshLive() {
    if (H.phase === "lobby") {
      const list = app.querySelector("#plist"); if (!list) return;
      const ids = Object.keys(H.players).sort((a, b) => (H.players[a].joinedAt || 0) - (H.players[b].joinedAt || 0));
      const on = ids.filter(u => H.players[u].online);
      app.querySelector("#pcount").textContent = `Jugadores (${on.length})`;
      const have = new Set([...list.querySelectorAll("[data-u]")].map(e => e.dataset.u));
      if (!ids.length) list.innerHTML = `<span class="muted" style="background:none;padding:7px 0">Esperando jugadores…</span>`;
      else {
        if (!have.size) list.innerHTML = "";
        for (const u of ids) {
          let el = list.querySelector(`[data-u="${u}"]`);
          if (!el) {
            el = document.createElement("button"); el.type = "button"; el.className = "pl"; el.dataset.u = u; el.title = "Clic para expulsar";
            el.onclick = () => armKick(el, u, nickOf(u));
            list.appendChild(el);
          }
          if (!el.classList.contains("arm")) el.textContent = nickOf(u);
          el.classList.toggle("off", !H.players[u].online);
        }
        list.querySelectorAll("[data-u]").forEach(e => { if (!H.players[e.dataset.u]) e.remove(); });
      }
      app.querySelector("#start").disabled = !on.length;
    } else if (H.phase === "q") updateCounter();
  }

  async function startGame() {
    const sel = H.set.sel, ORD = { facil: 0, intermedia: 1, dificil: 2 };
    let d = Q.filter(x => sel === "todas" || x.l === sel || (sel[0] === "j" && String(x.j) === sel.slice(1)));
    // Mezclado: orden al azar. Sin mezclar: de fácil a difícil.
    d = H.set.mix ? shuffle(d) : d.map((x, k) => [x, k]).sort((a, b) => (ORD[a[0].l] - ORD[b[0].l]) || a[1] - b[1]).map(p => p[0]);
    H.deck = d.map(x => { const opts = shuffle([x.a, ...x.w]); return { q: x.q, l: x.l, e: x.e, opts, c: opts.indexOf(x.a) }; });
    H.i = 0; H.scores = {};
    await H.ref.update({ scores: null, answers: null });
    ask();
  }

  /* ---- pregunta */
  function ask() {
    cancelDue();
    const x = H.deck[H.i];
    H.phase = "q"; H.T = LV[x.l].t; H.opened = false; H.allAt = 0; H.answers = {};
    H.startAt = now() + INTRO_MS; H.deadline = H.startAt + H.T * 1000; H.lastTick = 99;
    M.play("none"); M.sfx("whoosh");
    saveLocal();
    if (H.ansRef) H.ansRef.off();
    H.ansRef = H.ref.child("answers/" + H.i);
    H.ansRef.on("value", s => { H.answers = s.val() || {}; updateCounter(); });
    H.ref.child("state").set({ phase: "q", i: H.i, n: H.deck.length, l: x.l, q: x.q, opts: x.opts, T: H.T, startAt: H.startAt, deadline: H.deadline }).catch(fatal);
    app.innerHTML = `
    <div class="stage intro" id="stage">
      <div class="hud">
        <span class="pill">Pregunta ${H.i + 1} de ${H.deck.length}</span>
        <span class="pill lvl-${x.l}">${LV[x.l].n}</span>
        <span class="pill">PIN ${H.pin}</span>
      </div>
      <div class="qcard"><h2>${esc(x.q)}</h2><div class="clock" id="clk">${H.T}</div></div>
      <div class="bar"><i id="bar"></i></div>
      <div class="grid" id="opts">${x.opts.map((o, k) => `<div class="ans a${k}" style="--d:${k * 90}ms"><span class="mk">${MK[k]}</span><span class="t">${esc(o)}</span></div>`).join("")}</div>
      <div class="foot" style="align-items:center;justify-content:space-between">
        <div class="counter" id="answered"></div>
        <button class="ghost" id="skip">Cerrar respuestas</button>
      </div>
    </div>`;
    app.querySelector("#skip").onclick = closeQ;
    updateCounter();
  }

  function updateCounter() {
    const c = app.querySelector("#answered"); if (!c || H.phase !== "q") return;
    const n = Object.keys(H.answers).length, of = new Set([...onlineUids(), ...Object.keys(H.answers)]).size;
    const prev = c.dataset.n;
    c.innerHTML = `${n}<small>de ${of} respuestas</small>`;
    if (prev !== undefined && +prev < n) M.sfx("blip");
    if (prev !== undefined && +prev !== n && !reduced) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
    c.dataset.n = n;
  }

  function tick() {
    const t = now();
    if (H.phase === "q") {
      const bar = app.querySelector("#bar"), clk = app.querySelector("#clk");
      if (t < H.startAt) { if (bar) bar.style.width = ((H.startAt - t) / INTRO_MS * 100) + "%"; }
      else {
        if (!H.opened) { H.opened = true; const st = app.querySelector("#stage"); if (st) st.classList.remove("intro"); M.play("question"); }
        const left = Math.max(0, (H.deadline - t) / 1000);
        if (bar) bar.style.width = (left / H.T * 100) + "%";
        if (clk) { clk.textContent = Math.ceil(left); clk.classList.toggle("low", left <= 5); }
        const sec = Math.ceil(left); if (sec <= 5 && sec > 0 && sec < H.lastTick) { H.lastTick = sec; M.sfx("tick"); }
        const on = onlineUids();
        const all = on.length > 0 && on.every(u => H.answers[u]);
        if (all && !H.allAt) H.allAt = t;
        if (left <= 0 || (H.allAt && t - H.allAt > 700)) closeQ();
      }
    }
    if (H.due !== null && !H.paused) {
      const left = Math.max(0, H.due - t), fill = app.querySelector("#autofill"), lab = app.querySelector("#autolab");
      if (fill) fill.style.width = (100 - left / H.dueTotal * 100) + "%";
      if (lab) lab.textContent = `Sigue en ${Math.ceil(left / 1000)} s`;
      if (left <= 0) { const f = H.dueFn; cancelDue(); f(); }
    }
  }

  /* ---- avance automático */
  function autoBar(label) {
    return `<div class="autoctl"><div class="autotrack"><i id="autofill"></i></div>
      <div class="row" style="justify-content:space-between"><span class="muted" id="autolab">${H.set.auto ? "" : "Avance manual"}</span>
      <div class="row">${H.set.auto ? `<button class="ghost" id="pause">Pausar</button>` : ""}<button class="go" id="nx">${label}</button></div></div></div>`;
  }
  function schedule(sec, fn) {
    H.dueFn = fn; H.paused = false;
    const nx = app.querySelector("#nx"); if (nx) { nx.onclick = () => { cancelDue(); fn(); }; nx.focus(); }
    const pb = app.querySelector("#pause"); if (pb) pb.onclick = togglePause;
    if (H.set.auto) { H.dueTotal = sec * 1000; H.due = now() + H.dueTotal; } else H.due = null;
  }
  function cancelDue() { H.due = null; H.paused = false; }
  function togglePause() {
    const pb = app.querySelector("#pause"), lab = app.querySelector("#autolab");
    if (!H.paused && H.due !== null) { H.paused = true; H.pausedLeft = Math.max(0, H.due - now()); if (pb) pb.textContent = "Continuar"; if (lab) lab.textContent = "En pausa"; }
    else if (H.paused) { H.paused = false; H.due = now() + H.pausedLeft; if (pb) pb.textContent = "Pausar"; }
  }

  /* ---- revelar */
  function closeQ() {
    if (H.phase !== "q") return;
    H.phase = "reveal";
    M.play("none"); M.sfx("reveal");
    if (H.ansRef) { H.ansRef.off(); H.ansRef = null; }
    const x = H.deck[H.i], counts = [0, 0, 0, 0];
    const before = ranking(), prevRank = {}; before.forEach((r, k) => prevRank[r.uid] = k + 1);
    const prevScore = {}; before.forEach(r => prevScore[r.uid] = r.score);
    const gained = {};
    const uids = new Set([...Object.keys(H.players), ...Object.keys(H.answers)]);
    for (const uid of uids) {
      const a = H.answers[uid], s = Object.assign({ score: 0, streak: 0, ok: 0 }, H.scores[uid]);
      if (a && a.k >= 0 && a.k < 4) counts[a.k]++;
      const inTime = a && a.at <= H.deadline + 1500;
      const good = !!a && inTime && a.k === x.c;
      let pts = 0;
      if (good) {
        const left = Math.min(H.T, Math.max(0, H.T - Math.max(0, a.at - H.startAt) / 1000));
        s.streak++; s.ok++; pts = Math.round(500 + 500 * left / H.T) + Math.min(s.streak - 1, 5) * 100; s.score += pts;
      } else s.streak = 0;
      gained[uid] = { pts, good, answered: !!a };
      H.scores[uid] = s;
    }
    const after = ranking(), upd = {};
    after.forEach((r, k) => {
      const s = H.scores[r.uid] || { score: 0, streak: 0, ok: 0 }, g = gained[r.uid] || { pts: 0, good: false, answered: false };
      upd["scores/" + r.uid] = { score: s.score, streak: s.streak, ok: s.ok, last: { i: H.i, good: g.good, pts: g.pts, answered: g.answered, rank: k + 1, prevRank: prevRank[r.uid] || 0, of: after.length } };
    });
    H.boardData = after.map((r, k) => ({ uid: r.uid, nick: r.nick, score: r.score, streak: r.streak, rank: k + 1, prevRank: prevRank[r.uid] || after.length + 1, prevScore: prevScore[r.uid] || 0, pts: (gained[r.uid] || {}).pts || 0 }));
    upd.state = { phase: "reveal", i: H.i, n: H.deck.length, l: x.l, q: x.q, opts: x.opts, correct: x.c, counts, e: x.e };
    H.ref.update(upd).catch(fatal);
    saveLocal();

    const total = Math.max(1, counts.reduce((s, n) => s + n, 0));
    const last = H.i === H.deck.length - 1;
    app.innerHTML = `
    <div class="stage reveal">
      <div class="hud"><span class="pill">Pregunta ${H.i + 1} de ${H.deck.length}</span><span class="pill lvl-${x.l}">${LV[x.l].n}</span><span class="pill">${counts[x.c]} de ${counts.reduce((s, n) => s + n, 0)} acertaron</span></div>
      <div class="qcard"><h2>${esc(x.q)}</h2></div>
      <div class="grid">${x.opts.map((o, k) => `<div class="ans a${k} ${k === x.c ? "right" : "wrong"}"><span class="fill" style="--w:${counts[k] / total * 100}%"></span><span class="mk">${k === x.c ? "✓" : MK[k]}</span><span class="t">${esc(o)}</span><span class="n">${counts[k]}</span></div>`).join("")}</div>
      <div class="explain">${esc(x.e)}</div>
      ${autoBar(last ? "Ver podio" : "Ver ranking")}
    </div>`;
    schedule(H.set.reveal, last ? finish : board);
  }

  /* ---- ranking animado */
  function board() {
    H.phase = "board";
    M.sfx("roll"); setTimeout(() => { if (H.phase === "board") M.play("lobby"); }, 1300);
    H.ref.child("state").set({ phase: "board", i: H.i, n: H.deck.length }).catch(fatal);
    const data = H.boardData.length ? H.boardData : ranking().map((r, k) => ({ ...r, rank: k + 1, prevRank: k + 1, prevScore: r.score, pts: 0 }));
    const top = data.filter(r => r.rank <= 5);
    const ROW = 76;
    app.innerHTML = `
    <div class="board">
      <h2 class="btitle">Ranking</h2>
      <div class="brows" style="height:${Math.max(1, top.length) * ROW}px">
        ${top.map(r => `<div class="brow ${r.rank === 1 ? "top" : ""}" data-u="${esc(r.uid)}" style="transform:translateY(${(Math.min(r.prevRank, 6) - 1) * ROW}px);opacity:${r.prevRank > 5 ? 0 : 1}">
          <span class="pos">${r.rank}</span><span class="nm">${esc(r.nick)}</span>
          ${r.pts ? `<span class="gain">+${fmt(r.pts)}</span>` : ""}${r.streak > 1 ? `<span class="streak">🔥${r.streak}</span>` : ""}
          <span class="sc" data-from="${r.prevScore}" data-to="${r.score}">${fmt(r.prevScore)}</span></div>`).join("") || `<p class="muted" style="text-align:center">Sin jugadores todavía.</p>`}
      </div>
    </div>
    ${autoBar("Siguiente pregunta")}`;
    const rows = app.querySelectorAll(".brow");
    rows.forEach(el => { el.title = "Clic para expulsar"; el.onclick = () => armKick(el, el.dataset.u, (top.find(x => x.uid === el.dataset.u) || {}).nick || "Jugador"); });
    setTimeout(() => {
      rows.forEach(el => {
        const r = top.find(x => x.uid === el.dataset.u);
        el.style.transform = `translateY(${(r.rank - 1) * ROW}px)`; el.style.opacity = 1;
        const sc = el.querySelector(".sc"); countUp(sc, +sc.dataset.from, +sc.dataset.to, 1100);
        el.classList.add("moved");
      });
    }, reduced ? 0 : 450);
    schedule(H.set.board + 1, () => { H.i++; ask(); });
  }

  /* ---- podio */
  function finish() {
    H.phase = "end"; cancelDue();
    M.play("none"); setTimeout(() => M.sfx("roll"), reduced ? 0 : 1200); setTimeout(() => M.sfx("fanfare"), reduced ? 0 : 2400);
    setTimeout(() => { if (H.phase === "end") M.play("lobby"); }, 6500);
    H.ref.child("state").set({ phase: "end", n: H.deck.length }).catch(fatal);
    store.del("activePin");
    const r = ranking();
    const pod = [r[1], r[0], r[2]], cls = ["p2", "p1", "p3"], num = [2, 1, 3], delay = [1, 2, 0];
    app.innerHTML = `
    <div class="board">
      <h2 class="btitle">Podio</h2>
      <div class="podium">${pod.map((p, i) => p ? `<div class="${cls[i]}" style="--d:${delay[i] * 1.1}s"><span class="nm">${esc(p.nick)}</span><span class="sc">${fmt(p.score)} pts</span><div class="step">${num[i]}</div></div>` : `<div></div>`).join("")}</div>
      ${r.slice(3, 10).map((p, i) => `<div class="brow static"><span class="pos">${i + 4}</span><span class="nm">${esc(p.nick)}</span><span class="sc">${fmt(p.score)}</span></div>`).join("")}
    </div>
    <div class="foot"><button class="ghost" id="again">Nueva partida con los mismos jugadores</button></div>`;
    setTimeout(() => confetti(5000), reduced ? 0 : 2600);
    app.querySelector("#again").onclick = async () => {
      H.scores = {}; H.boardData = [];
      await H.ref.update({ scores: null, answers: null, state: { phase: "lobby" } });
      store.set("activePin", H.pin);
      lobby();
    };
  }

  document.addEventListener("keydown", e => {
    if (!H.ref || /INPUT|SELECT/.test(e.target.tagName)) return;
    if (e.key === "m" || e.key === "M") { const b = document.getElementById("snd"); if (b) b.click(); return; }
    if (e.key === " " && app.querySelector("#pause")) { e.preventDefault(); togglePause(); }
    else if ((e.key === "Enter" || e.key === "ArrowRight") && H.dueFn && H.phase !== "q") {
      const nx = app.querySelector("#nx"); if (nx && document.activeElement !== nx) { e.preventDefault(); nx.click(); }
    }
  });

  /* ============================================================ JUGADOR */
  const P = { kicked: false, pin: "", ref: null, nick: "", state: null, me: null, sent: {}, view: "", timer: null, lastRank: 0 };

  async function playerEntry(pin) {
    P.pin = pin;
    app.innerHTML = `<div class="player">${spinner("Buscando la partida…")}</div>`;
    try { await signIn(); } catch (e) { return fatal(e); }
    P.ref = db.ref("games/" + pin);
    let g;
    try { g = (await P.ref.child("state").once("value")).val(); } catch (e) { return fatal(e); }
    if (!g) {
      app.innerHTML = `<div class="player">${center(`<p class="err">No hay una partida con el PIN ${esc(pin)}.</p><p class="muted">Revisa el número o pide que muestren el QR de nuevo.</p><button class="ghost" onclick="location.href=location.pathname">Volver</button>`)}</div>`;
      return;
    }
    if ((await P.ref.child("kicked/" + UID).once("value")).val()) return kickedScreen();
    const mine = (await P.ref.child("players/" + UID).once("value")).val();
    if (mine && mine.nick) { P.nick = mine.nick; return enter(); }
    const saved = store.get("nick") || "";
    app.innerHTML = `
    <div class="player">
      <div class="label">GeologyCraft · Geoquiz</div>
      <div class="center" style="align-items:stretch;text-align:left">
        <h1 style="font-size:44px">Únete a la partida</h1>
        <p class="muted">PIN <b style="color:var(--fg)">${esc(pin)}</b></p>
        <label class="label" for="nick">Tu apodo</label>
        <input type="text" id="nick" maxlength="18" autocomplete="nickname" value="${esc(saved)}" placeholder="Ej: Basalto_Feroz">
        <button class="go" id="enter">Entrar</button>
      </div>
    </div>`;
    const inp = app.querySelector("#nick");
    const go = async () => {
      let n = inp.value.replace(/\s+/g, " ").trim().slice(0, 18); if (!n) { inp.focus(); return; }
      store.set("nick", n);
      try {
        const others = (await P.ref.child("players").once("value")).val() || {};
        const taken = new Set(Object.entries(others).filter(([u]) => u !== UID).map(([, p]) => (p.nick || "").toLowerCase()));
        let k = 2; const base = n.slice(0, 15); while (taken.has(n.toLowerCase())) n = base + " " + k++;
      } catch (e) {}
      P.nick = n; enter();
    };
    app.querySelector("#enter").onclick = go;
    inp.onkeydown = e => { if (e.key === "Enter") go(); };
    if (!saved) inp.focus();
  }

  async function enter() {
    const me = P.ref.child("players/" + UID);
    try {
      await me.update({ nick: P.nick, online: true, joinedAt: TS });
    } catch (e) { return fatal(e); }
    me.child("online").onDisconnect().set(false);
    db.ref(".info/connected").on("value", s => { if (s.val()) { me.child("online").set(true).catch(() => {}); me.child("online").onDisconnect().set(false); } });
    P.ref.child("kicked/" + UID).on("value", s => { if (s.val()) kickedScreen(); });
    P.ref.child("scores/" + UID).on("value", s => { P.me = s.val(); renderPlayer(); });
    P.ref.child("state").on("value", async s => {
      P.state = s.val() || { phase: "lobby" };
      if (P.state.phase === "q" && !(P.state.i in P.sent)) {
        try { const a = (await P.ref.child(`answers/${P.state.i}/${UID}`).once("value")).val(); if (a) P.sent[P.state.i] = a.k; } catch (e) {}
      }
      renderPlayer();
    });
    clearInterval(P.timer); P.timer = setInterval(() => { if (P.state && P.state.phase === "q") renderPlayer(); }, 200);
  }

  function kickedScreen() {
    P.kicked = true; clearInterval(P.timer);
    if (P.ref) { P.ref.child("state").off(); P.ref.child("scores/" + UID).off(); }
    app.innerHTML = `<div class="player">${center(`<div class="big" style="font-size:40px">Fuiste expulsado</div><p class="muted">El presentador te sacó de esta partida.</p>`)}</div>`;
  }

  function pview(key, html, after) {
    if (P.view === key) return false;
    P.view = key;
    app.innerHTML = `<div class="player">${html}</div>`;
    if (after) after();
    return true;
  }

  function renderPlayer() {
    const s = P.state; if (!s || P.kicked) return;
    const t = now();
    if (s.phase === "lobby") {
      P.sent = {};
      pview("lobby", center(`<div class="label">Estás dentro</div><div class="big pop">${esc(P.nick)}</div><p class="muted">Mira la pantalla, el juego empieza pronto.</p>`));
    } else if (s.phase === "q") {
      if (s.i in P.sent) {
        pview("sent" + s.i, center(`<div class="sentmark a${P.sent[s.i]} pop">${MK[P.sent[s.i]] || "✓"}</div><div class="big" style="font-size:34px">Respuesta enviada</div><p class="muted">Esperando a los demás…</p>`));
      } else if (t < s.startAt) {
        const fresh = pview("intro" + s.i, `<div class="hud"><span class="pill">${s.i + 1} / ${s.n}</span><span class="pill lvl-${esc(s.l)}">${esc((LV[s.l] || {}).n || "")}</span></div>
          ${center(`<div class="label">Pregunta ${s.i + 1}</div><p class="qtext">${esc(s.q)}</p><div class="count" id="cd">3</div>`)}`);
        const cd = app.querySelector("#cd"); if (cd) { const v = String(Math.max(1, Math.ceil((s.startAt - t) / 1000))); if (cd.textContent !== v || fresh) { cd.textContent = v; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); } }
      } else if (t < s.deadline) {
        pview("q" + s.i, `
          <div class="hud"><span class="pill">${s.i + 1} / ${s.n}</span><span class="pill lvl-${esc(s.l)}">${esc((LV[s.l] || {}).n || "")}</span><span class="pill" id="pc"></span></div>
          <p class="qsmall">${esc(s.q)}</p>
          <div class="pgrid">${arr(s.opts).map((o, k) => `<button class="ans a${k}" data-k="${k}" style="--d:${k * 70}ms"><span class="mk">${MK[k]}</span><span class="t">${esc(o)}</span></button>`).join("")}</div>`,
          () => app.querySelectorAll(".pgrid .ans").forEach(b => b.onclick = () => answer(s.i, +b.dataset.k)));
        const pc = app.querySelector("#pc"); if (pc) pc.textContent = Math.ceil((s.deadline - t) / 1000) + " s";
      } else {
        pview("late" + s.i, center(`<div class="big" style="font-size:34px">Se acabó el tiempo</div><p class="muted">Mira la pantalla.</p>`));
      }
    } else if (s.phase === "reveal") {
      const L = P.me && P.me.last;
      if (!L || L.i !== s.i) { pview("wait-r" + s.i, spinner("Revelando…")); return; }
      const title = L.good ? "+" + fmt(L.pts) : (L.answered ? "Incorrecto" : "Sin respuesta");
      const correct = arr(s.opts)[s.correct];
      pview("rev" + s.i, center(`
        <div class="result ${L.good ? "ok" : "bad"} pop" style="width:100%"><div class="label" style="color:inherit;opacity:.75">${L.good ? "¡Correcto!" : "Esta vez no"}</div><div class="big">${title}</div>${L.good && P.me.streak > 1 ? `<p style="margin-top:8px;font-weight:700">Racha de ${P.me.streak} 🔥</p>` : ""}</div>
        ${L.good ? "" : `<p class="muted">Correcta: <b style="color:var(--fg)">${esc(correct)}</b></p>`}
        <p class="muted">${fmt(P.me.score)} puntos en total</p>`));
    } else if (s.phase === "board") {
      const L = P.me && P.me.last; if (!L) { pview("wait-b", spinner("Mira el ranking en la pantalla")); return; }
      const d = L.prevRank ? L.prevRank - L.rank : 0;
      const move = d > 0 ? `<p class="up">▲ Subiste ${d} lugar${d > 1 ? "es" : ""}</p>` : d < 0 ? `<p class="down">▼ Bajaste ${-d} lugar${d < -1 ? "es" : ""}</p>` : "";
      pview("board" + s.i, center(`<div class="label">Vas en el lugar</div><div class="big pop" style="font-size:96px">#${L.rank}</div><p>de ${L.of} jugadores</p>${move}<p class="muted">${fmt(P.me.score)} puntos</p>`));
    } else if (s.phase === "end") {
      const L = P.me && P.me.last, rank = L ? L.rank : 0;
      const fresh = pview("end", center(`<div class="label">Fin del juego</div><div class="big pop" style="font-size:96px">${rank ? "#" + rank : "—"}</div>${L ? `<p style="font-size:22px">de ${L.of} jugadores</p>` : ""}<p class="muted">${fmt(P.me ? P.me.score : 0)} puntos · ${esc(P.nick)}</p>`));
      if (fresh && rank && rank <= 3) confetti(4000);
    }
  }

  function answer(i, k) {
    if (i in P.sent) return;
    P.sent[i] = k;
    app.querySelectorAll(".pgrid .ans").forEach(b => { b.disabled = true; if (+b.dataset.k !== k) b.classList.add("dim"); else b.classList.add("chosen"); });
    try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
    P.ref.child(`answers/${i}/${UID}`).set({ k, at: TS }).then(() => setTimeout(renderPlayer, 250)).catch(() => {
      P.view = ""; app.innerHTML = `<div class="player">${center(`<div class="big" style="font-size:30px">No alcanzó a llegar</div><p class="muted">La pregunta ya se había cerrado.</p>`)}</div>`; P.view = "late" + i;
    });
  }

  /* ------------------------------------------------------------ inicio */
  const pin = (params.get("pin") || "").replace(/\D/g, "");
  if (pin.length === 6) playerEntry(pin); else home();
})();
