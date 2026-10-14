/* Geoquiz en vivo — GeologyCraft
 * El computador del presentador hace de "servidor": los celulares se conectan
 * directo a él por WebRTC (PeerJS). No hay base de datos ni cuentas.
 * Si se cierra o recarga la pestaña del presentador, la partida se pierde.
 */
(function () {
  "use strict";

  const PREFIX = "geologycraft-geoquiz-";          // evita choques de PIN en el servidor público de PeerJS
  const LV = { facil: { n: "Fácil", t: 20 }, intermedia: { n: "Intermedia", t: 25 }, dificil: { n: "Difícil", t: 30 } };
  const MK = ["A", "B", "C", "D"];
  const Q = window.PREGUNTAS || [];
  const app = document.getElementById("app");
  const params = new URLSearchParams(location.search);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => Number(n || 0).toLocaleString("es-CL");
  const store = {
    get(k) { try { return localStorage.getItem("geoquiz:" + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem("geoquiz:" + k, v); } catch (e) {} }
  };
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const peerOpts = { debug: 1, config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] } };
  const joinUrl = pin => location.origin + location.pathname + "?pin=" + pin;

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
    app.querySelector("#host").onclick = host;
    const go = () => { const p = app.querySelector("#pin").value.replace(/\D/g, ""); if (p.length === 6) location.search = "?pin=" + p; };
    app.querySelector("#join").onclick = go;
    app.querySelector("#pin").onkeydown = e => { if (e.key === "Enter") go(); };
  }

  /* ============================================================ PRESENTADOR */
  const H = { peer: null, pin: "", players: new Map(), sel: "todas", mix: true, deck: [], i: 0, phase: "lobby", t0: 0, T: 0, timer: null, wake: null };

  function host() {
    if (typeof Peer === "undefined") { app.innerHTML = `<p class="err">No se pudo cargar la librería de conexión (vendor/peerjs.min.js).</p>`; return; }
    app.innerHTML = `<div class="center"><div class="spin"></div><p class="muted">Creando la partida…</p></div>`;
    openHostPeer(0);
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then(w => H.wake = w).catch(() => {}); } catch (e) {}
    window.addEventListener("beforeunload", e => { if (H.players.size && H.phase !== "end") { e.preventDefault(); e.returnValue = ""; } });
  }

  function openHostPeer(tries) {
    H.pin = String(Math.floor(100000 + Math.random() * 900000));
    const peer = new Peer(PREFIX + H.pin, peerOpts);
    H.peer = peer;
    peer.on("open", () => lobby());
    peer.on("connection", conn => wire(conn));
    peer.on("disconnected", () => { setTimeout(() => { if (!peer.destroyed) peer.reconnect(); }, 1500); });
    peer.on("error", err => {
      if (err.type === "unavailable-id" && tries < 5) { peer.destroy(); openHostPeer(tries + 1); return; }
      if (err.type === "peer-unavailable") return;
      if (H.phase === "lobby" && !H.players.size) {
        app.innerHTML = `<div class="center"><p class="err">No se pudo crear la partida (${esc(err.type || "error")}).</p><p class="muted">Revisa la conexión a internet y vuelve a intentar.</p><button class="go" onclick="location.reload()">Reintentar</button></div>`;
      }
      console.warn("PeerJS:", err);
    });
  }

  function wire(conn) {
    conn.on("data", d => onHostData(conn, d));
    conn.on("close", () => {
      for (const p of H.players.values()) if (p.conn === conn) { p.online = false; p.conn = null; }
      refreshLive();
    });
  }

  function send(p, msg) { if (p.conn && p.conn.open) { try { p.conn.send(msg); } catch (e) {} } }

  function onHostData(conn, d) {
    if (!d || typeof d !== "object") return;
    if (d.t === "join") {
      const pid = String(d.pid || "").slice(0, 40);
      if (!pid) return;
      let p = H.players.get(pid);
      if (!p) {
        let nick = String(d.nick || "").replace(/\s+/g, " ").trim().slice(0, 18) || "Jugador";
        const taken = new Set([...H.players.values()].map(x => x.nick.toLowerCase()));
        let n = 2, base = nick; while (taken.has(nick.toLowerCase())) nick = base + " " + n++;
        p = { pid, nick, score: 0, streak: 0, ok: 0, ans: null, last: null, conn: null, online: true };
        H.players.set(pid, p);
      }
      if (p.conn && p.conn !== conn) { try { p.conn.close(); } catch (e) {} }
      p.conn = conn; p.online = true;
      syncPlayer(p);
      refreshLive();
      return;
    }
    const p = [...H.players.values()].find(x => x.conn === conn);
    if (!p) return;
    if (d.t === "ans" && H.phase === "q" && d.i === H.i && p.ans === null) {
      const k = Number(d.k);
      if (!(k >= 0 && k < 4)) return;
      const left = Math.max(0, H.T - (performance.now() - H.t0) / 1000);
      if (left <= 0) return;
      p.ans = { k, left };
      send(p, { t: "got" });
      refreshLive();
      const online = [...H.players.values()].filter(x => x.online);
      if (online.length && online.every(x => x.ans !== null)) setTimeout(reveal, 600);
    }
  }

  function syncPlayer(p) {
    const x = H.deck[H.i];
    if (H.phase === "lobby") send(p, { t: "lobby", nick: p.nick });
    else if (H.phase === "q") send(p, { t: "q", i: H.i, n: H.deck.length, l: x.l, opts: x.opts, q: x.q, remain: Math.max(0, H.T * 1000 - (performance.now() - H.t0)), answered: p.ans !== null, nick: p.nick });
    else if (H.phase === "end") send(p, { t: "end", ...standing(p) });
    else if (p.last) send(p, { t: "res", ...p.last, ...standing(p) });
    else send(p, { t: "wait", nick: p.nick });
  }

  function ranking() { return [...H.players.values()].sort((a, b) => b.score - a.score || b.ok - a.ok); }
  function standing(p) { const r = ranking(); return { rank: r.indexOf(p) + 1, of: r.length, score: p.score, nick: p.nick }; }

  function lobby() {
    H.phase = "lobby";
    const counts = { todas: Q.length }; Q.forEach(x => counts[x.l] = (counts[x.l] || 0) + 1);
    const chip = (k, n) => `<button class="chip" data-k="${k}" aria-pressed="${H.sel === k}">${n}<small>${counts[k] || 0}</small></button>`;
    const url = joinUrl(H.pin);
    let qrImg = "";
    try { const qr = qrcode(0, "M"); qr.addData(url); qr.make(); qrImg = qr.createImgTag(10, 0); } catch (e) { qrImg = `<p style="color:#17181c">No se pudo generar el QR</p>`; }
    app.innerHTML = `
    <div class="lobby">
      <div class="qrbox">${qrImg}</div>
      <div style="display:grid;gap:20px;min-width:0">
        <div><div class="label">Escanea el QR o entra a</div>
          <p class="url">${esc(location.host + location.pathname)} <span class="muted">con el PIN</span></p></div>
        <div class="pin">${H.pin.slice(0, 3)} ${H.pin.slice(3)}</div>
        <div><div class="label" id="pcount">Jugadores (0)</div><div class="players" id="plist" style="margin-top:10px"></div></div>
        <div class="setup">
          <div class="label">Preguntas</div>
          <div class="row" id="lv">${chip("todas", "Todas")}${chip("facil", "Fáciles")}${chip("intermedia", "Intermedias")}${chip("dificil", "Difíciles")}</div>
          <label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" id="mix" ${H.mix ? "checked" : ""}> <span class="muted">Mezclar el orden</span></label>
        </div>
        <div class="row"><button class="go" id="start" disabled>Comenzar</button><span class="muted">Mantén esta pestaña abierta durante todo el juego.</span></div>
      </div>
    </div>`;
    app.querySelectorAll("#lv .chip").forEach(b => b.onclick = () => { H.sel = b.dataset.k; app.querySelectorAll("#lv .chip").forEach(c => c.setAttribute("aria-pressed", c === b)); });
    app.querySelector("#mix").onchange = e => H.mix = e.target.checked;
    app.querySelector("#start").onclick = startGame;
    refreshLive();
  }

  function refreshLive() {
    if (H.phase === "lobby") {
      const list = app.querySelector("#plist"); if (!list) return;
      const ps = [...H.players.values()];
      app.querySelector("#pcount").textContent = `Jugadores (${ps.filter(p => p.online).length})`;
      list.innerHTML = ps.map(p => `<span class="${p.online ? "" : "off"}">${esc(p.nick)}</span>`).join("") || `<span class="muted" style="background:none;padding:7px 0">Esperando jugadores…</span>`;
      app.querySelector("#start").disabled = !ps.some(p => p.online);
    } else if (H.phase === "q") {
      const c = app.querySelector("#answered"); if (!c) return;
      const ps = [...H.players.values()];
      c.innerHTML = `${ps.filter(p => p.ans !== null).length}<small>de ${ps.filter(p => p.online || p.ans !== null).length} respuestas</small>`;
    }
  }

  function startGame() {
    let d = Q.filter(x => H.sel === "todas" || x.l === H.sel);
    if (H.mix) d = shuffle(d);
    H.deck = d.map(x => ({ ...x, opts: shuffle([x.a, ...x.w]) }));
    for (const p of H.players.values()) Object.assign(p, { score: 0, streak: 0, ok: 0, ans: null, last: null });
    H.i = 0;
    ask();
  }

  function ask() {
    const x = H.deck[H.i];
    H.phase = "q"; H.T = LV[x.l].t; H.t0 = performance.now();
    for (const p of H.players.values()) p.ans = null;
    app.innerHTML = `
    <div class="hud">
      <span class="pill">Pregunta ${H.i + 1} de ${H.deck.length}</span>
      <span class="pill lvl-${x.l}">${LV[x.l].n}</span>
      <span class="pill">PIN ${H.pin}</span>
    </div>
    <div class="qcard"><h2>${esc(x.q)}</h2><div class="clock" id="clk">${H.T}</div></div>
    <div class="bar"><i id="bar"></i></div>
    <div class="grid">${x.opts.map((o, k) => `<div class="ans a${k}"><span class="mk">${MK[k]}</span><span class="t">${esc(o)}</span></div>`).join("")}</div>
    <div class="foot" style="align-items:center;justify-content:space-between">
      <div class="counter" id="answered"></div>
      <button class="ghost" id="skip">Cerrar respuestas</button>
    </div>`;
    app.querySelector("#skip").onclick = reveal;
    for (const p of H.players.values()) syncPlayer(p);
    refreshLive();
    const bar = app.querySelector("#bar"), clk = app.querySelector("#clk");
    clearInterval(H.timer);
    H.timer = setInterval(() => {
      const left = Math.max(0, H.T - (performance.now() - H.t0) / 1000);
      bar.style.width = (left / H.T * 100) + "%";
      clk.textContent = Math.ceil(left); clk.classList.toggle("low", left <= 5);
      if (left <= 0) reveal();
    }, 100);
  }

  function reveal() {
    if (H.phase !== "q") return;
    clearInterval(H.timer);
    H.phase = "reveal";
    const x = H.deck[H.i], counts = [0, 0, 0, 0];
    for (const p of H.players.values()) {
      const a = p.ans, good = !!a && x.opts[a.k] === x.a;
      if (a) counts[a.k]++;
      let pts = 0;
      if (good) { p.streak++; p.ok++; pts = Math.round(500 + 500 * (a.left / H.T)) + Math.min(p.streak - 1, 5) * 100; p.score += pts; }
      else p.streak = 0;
      p.last = { good, pts, answered: !!a, streak: p.streak, correct: x.a };
    }
    for (const p of H.players.values()) send(p, { t: "res", ...p.last, ...standing(p) });
    const total = counts.reduce((s, n) => s + n, 0) || 1;
    const last = H.i === H.deck.length - 1;
    app.innerHTML = `
    <div class="hud"><span class="pill">Pregunta ${H.i + 1} de ${H.deck.length}</span><span class="pill lvl-${x.l}">${LV[x.l].n}</span></div>
    <div class="qcard"><h2>${esc(x.q)}</h2></div>
    <div class="grid">${x.opts.map((o, k) => `<div class="ans a${k} ${o === x.a ? "right" : "dim"}"><span class="fill" style="width:${counts[k] / total * 100}%"></span><span class="mk">${o === x.a ? "✓" : MK[k]}</span><span class="t">${esc(o)}</span><span class="n">${counts[k]}</span></div>`).join("")}</div>
    <div class="explain">${esc(x.e)}</div>
    <div class="foot"><button class="go" id="nx">${last ? "Ver podio" : "Ver ranking"}</button></div>`;
    const nx = app.querySelector("#nx"); nx.focus();
    nx.onclick = () => last ? finish() : board();
  }

  function board() {
    H.phase = "board";
    const r = ranking().slice(0, 5);
    app.innerHTML = `
    <div class="board">
      <h2>Ranking</h2>
      ${r.map((p, i) => `<div class="brow ${i === 0 ? "top" : ""}"><span class="pos">${i + 1}</span><span class="nm">${esc(p.nick)}</span><span>${p.streak > 1 ? "🔥" + p.streak + " " : ""}${fmt(p.score)}</span></div>`).join("") || `<p class="muted" style="text-align:center">Sin jugadores todavía.</p>`}
    </div>
    <div class="foot"><button class="go" id="nx">Siguiente pregunta</button></div>`;
    const nx = app.querySelector("#nx"); nx.focus();
    nx.onclick = () => { H.i++; ask(); };
  }

  function finish() {
    H.phase = "end";
    const r = ranking();
    for (const p of H.players.values()) send(p, { t: "end", ...standing(p) });
    const pod = [r[1], r[0], r[2]];
    const cls = ["p2", "p1", "p3"], num = [2, 1, 3];
    app.innerHTML = `
    <div class="board">
      <h2>Podio</h2>
      <div class="podium">${pod.map((p, i) => p ? `<div class="${cls[i]}"><span class="nm">${esc(p.nick)}</span><span class="sc">${fmt(p.score)} pts</span><div class="step">${num[i]}</div></div>` : `<div></div>`).join("")}</div>
      ${r.slice(3, 10).map((p, i) => `<div class="brow"><span class="pos">${i + 4}</span><span class="nm">${esc(p.nick)}</span><span>${fmt(p.score)}</span></div>`).join("")}
    </div>
    <div class="foot"><button class="ghost" id="again">Nueva partida con los mismos jugadores</button></div>`;
    app.querySelector("#again").onclick = () => { for (const p of H.players.values()) Object.assign(p, { score: 0, streak: 0, ok: 0, ans: null, last: null }); lobby(); for (const p of H.players.values()) syncPlayer(p); };
  }

  document.addEventListener("keydown", e => {
    if (!H.peer || e.target.tagName === "INPUT") return;
    if (e.key === "Enter" || e.key === " ") { const nx = app.querySelector("#nx"); if (nx && document.activeElement !== nx) { e.preventDefault(); nx.click(); } }
  });

  /* ============================================================ JUGADOR */
  const P = { peer: null, conn: null, pin: "", pid: "", nick: "", i: -1, deadline: 0, timer: null, retry: null, joined: false };

  function playerJoin(pin) {
    P.pin = pin;
    P.pid = store.get("pid:" + pin) || rid();
    store.set("pid:" + pin, P.pid);
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
        <p id="msg" class="muted"></p>
      </div>
    </div>`;
    const inp = app.querySelector("#nick");
    const go = () => {
      const n = inp.value.trim(); if (!n) { inp.focus(); return; }
      P.nick = n; store.set("nick", n); connect();
    };
    app.querySelector("#enter").onclick = go;
    inp.onkeydown = e => { if (e.key === "Enter") go(); };
    if (!saved) inp.focus();
  }

  function pscreen(html) { app.innerHTML = `<div class="player">${html}</div>`; }
  function waiting(text) { pscreen(`<div class="center"><div class="spin"></div><p class="muted">${text}</p></div>`); }

  function connect() {
    if (typeof Peer === "undefined") { pscreen(`<div class="center"><p class="err">No se pudo cargar la conexión.</p></div>`); return; }
    waiting("Conectando…");
    if (!P.peer || P.peer.destroyed) {
      P.peer = new Peer(peerOpts);
      P.peer.on("open", dial);
      P.peer.on("disconnected", () => setTimeout(() => { if (!P.peer.destroyed) P.peer.reconnect(); }, 1500));
      P.peer.on("error", err => {
        if (err.type === "peer-unavailable") {
          if (P.joined) { scheduleRetry(); return; }
          pscreen(`<div class="center"><p class="err">No hay una partida activa con el PIN ${esc(P.pin)}.</p><p class="muted">Revisa el número o pide que muestren el QR de nuevo.</p><button class="ghost" onclick="location.href=location.pathname">Volver</button></div>`);
          return;
        }
        console.warn("PeerJS:", err);
        if (P.joined) scheduleRetry();
        else pscreen(`<div class="center"><p class="err">No se pudo conectar (${esc(err.type || "error")}).</p><button class="go" id="rt">Reintentar</button></div>`), app.querySelector("#rt").onclick = connect;
      });
    } else if (P.peer.open) dial();
  }

  function dial() {
    clearTimeout(P.retry);
    if (P.conn) { try { P.conn.close(); } catch (e) {} }
    const conn = P.peer.connect(PREFIX + P.pin, { reliable: true });
    P.conn = conn;
    const giveUp = setTimeout(() => { if (!conn.open) { if (P.joined) scheduleRetry(); else pscreen(`<div class="center"><p class="err">La conexión está tardando demasiado.</p><p class="muted">Algunas redes (wifi de la universidad, por ejemplo) bloquean este tipo de conexión. Prueba con datos móviles.</p><button class="go" id="rt">Reintentar</button></div>`), app.querySelector("#rt").onclick = dial; } }, 12000);
    conn.on("open", () => { clearTimeout(giveUp); P.joined = true; conn.send({ t: "join", pid: P.pid, nick: P.nick }); });
    conn.on("data", onPlayerData);
    conn.on("close", () => { if (P.conn === conn) scheduleRetry(); });
  }

  function scheduleRetry() {
    clearTimeout(P.retry);
    if (!app.querySelector(".pgrid")) waiting("Se perdió la conexión. Reconectando…");
    P.retry = setTimeout(() => { if (P.peer && P.peer.open) dial(); else connect(); }, 2000);
  }

  function onPlayerData(d) {
    if (!d || typeof d !== "object") return;
    clearInterval(P.timer);
    if (d.nick) P.nick = d.nick;
    if (d.t === "lobby" || d.t === "wait") {
      pscreen(`<div class="center"><div class="label">Estás dentro</div><div class="big">${esc(P.nick)}</div><p class="muted">${d.t === "lobby" ? "Mira la pantalla, el juego empieza pronto." : "Espera la siguiente pregunta."}</p></div>`);
    } else if (d.t === "q") {
      P.i = d.i;
      if (d.answered) { sent(); return; }
      P.deadline = performance.now() + d.remain;
      pscreen(`
        <div class="hud"><span class="pill">${d.i + 1} / ${d.n}</span><span class="pill lvl-${esc(d.l)}">${esc((LV[d.l] || {}).n || "")}</span><span class="pill" id="pc">–</span></div>
        <p style="font-weight:700">${esc(d.q)}</p>
        <div class="pgrid">${d.opts.map((o, k) => `<button class="ans a${k}" data-k="${k}"><span class="mk">${MK[k]}</span><span class="t">${esc(o)}</span></button>`).join("")}</div>`);
      app.querySelectorAll(".pgrid .ans").forEach(b => b.onclick = () => {
        if (!P.conn || !P.conn.open) return;
        P.conn.send({ t: "ans", i: P.i, k: Number(b.dataset.k) });
        app.querySelectorAll(".pgrid .ans").forEach(x => { x.disabled = true; if (x !== b) x.classList.add("dim"); });
      });
      const pc = app.querySelector("#pc");
      const tick = () => { const s = Math.max(0, Math.ceil((P.deadline - performance.now()) / 1000)); pc.textContent = s + " s"; if (s <= 0) { clearInterval(P.timer); waiting("Se acabó el tiempo. Mira la pantalla."); } };
      tick(); P.timer = setInterval(tick, 250);
    } else if (d.t === "got") {
      sent();
    } else if (d.t === "res") {
      const title = d.good ? "+" + fmt(d.pts) : (d.answered ? "Incorrecto" : "Sin respuesta");
      pscreen(`<div class="center">
        <div class="result ${d.good ? "ok" : "bad"}" style="width:100%"><div class="big">${title}</div>${d.good && d.streak > 1 ? `<p style="margin-top:8px;font-weight:700">Racha de ${d.streak} 🔥</p>` : ""}</div>
        ${d.good ? "" : `<p class="muted">Correcta: <b style="color:var(--fg)">${esc(d.correct)}</b></p>`}
        <p style="font-size:22px">Vas en el lugar <b>#${d.rank}</b> de ${d.of}</p>
        <p class="muted">${fmt(d.score)} puntos</p></div>`);
    } else if (d.t === "end") {
      pscreen(`<div class="center"><div class="label">Fin del juego</div><div class="big">#${d.rank}</div><p style="font-size:22px">de ${d.of} jugadores</p><p class="muted">${fmt(d.score)} puntos · ${esc(P.nick)}</p></div>`);
    }
  }

  function sent() { pscreen(`<div class="center"><div class="spin"></div><div class="big" style="font-size:36px">Respuesta enviada</div><p class="muted">Esperando a los demás…</p></div>`); }

  /* ------------------------------------------------------------ inicio */
  const pin = (params.get("pin") || "").replace(/\D/g, "");
  if (pin.length === 6) playerJoin(pin); else home();
})();
