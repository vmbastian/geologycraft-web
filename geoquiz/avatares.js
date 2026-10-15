/* Avatares a color del Geoquiz — mascotas geológicas originales, dibujadas en SVG (sin imágenes).
 * window.AVATAR.svg(id, {tile:true|false}) → <svg>. Los id coinciden con EMBLEMAS de ilustraciones.js.
 * window.AVATAR.scene() → paisaje de fondo para el podio.
 */
(function () {
  "use strict";
  const OUT = "#2a2233";                                       // contorno
  const S = `stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  const sh = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${S} ${extra || ""}/>`;
  const fl = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${extra || ""}/>`;      // sin contorno
  const ci = (x, y, r, fill, line) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line === false ? "" : S}/>`;
  const el = (x, y, rx, ry, fill, line) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${line === false ? "" : S}/>`;
  const ln = (d, w, col) => `<path d="${d}" fill="none" stroke="${col || OUT}" stroke-width="${w || 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---------- cara: ojos grandes, brillo, mejillas y boca */
  function face(cx, cy, s, mood) {
    s = s || 1; mood = mood || "happy";
    const ex = 9 * s, o = [];
    if (mood !== "cool") for (const sx of [-1, 1]) {
      const x = cx + sx * ex;
      o.push(el(x, cy, 6.2 * s, 7.4 * s, "#fff"));
      o.push(ci(x + 0.9 * s, cy + 1.3 * s, 3.7 * s, OUT, false));
      o.push(ci(x - 0.6 * s, cy - 0.6 * s, 1.4 * s, "#fff", false));
    }
    if (mood === "worried") { o.push(ln(`M${cx - ex - 6 * s},${cy - 11 * s} L${cx - ex + 4 * s},${cy - 13 * s}`, 2.4)); o.push(ln(`M${cx + ex + 6 * s},${cy - 11 * s} L${cx + ex - 4 * s},${cy - 13 * s}`, 2.4)); }
    if (mood !== "cool") for (const sx of [-1, 1]) o.push(el(cx + sx * 15 * s, cy + 8.5 * s, 4.2 * s, 2.5 * s, "#ff7f9c", false).replace("/>", ' opacity=".55"/>'));
    if (mood === "nomouth") {}
    else if (mood === "worried") o.push(el(cx, cy + 12 * s, 3.6 * s, 4.4 * s, "#5a1f2b"));
    else if (mood === "grin") o.push(sh(`M${cx - 8 * s},${cy + 9 * s} Q${cx},${cy + 15 * s} ${cx + 8 * s},${cy + 9 * s} Z`, "#fff"));
    else {
      o.push(sh(`M${cx - 8.5 * s},${cy + 9 * s} Q${cx},${cy + 22 * s} ${cx + 8.5 * s},${cy + 9 * s} Z`, "#5a1f2b"));
      o.push(fl(`M${cx - 4.4 * s},${cy + 15.4 * s} Q${cx},${cy + 12.4 * s} ${cx + 4.4 * s},${cy + 15.4 * s} Q${cx},${cy + 19 * s} ${cx - 4.4 * s},${cy + 15.4 * s} Z`, "#ff7f8e"));
    }
    return o.join("");
  }
  // lentes oscuros para el "cool"
  const shades = (cx, cy) => sh(`M${cx - 18},${cy - 5} L${cx - 2},${cy - 5} L${cx - 3},${cy + 4} Q${cx - 10},${cy + 9} ${cx - 17},${cy + 4} Z M${cx + 2},${cy - 5} L${cx + 18},${cy - 5} L${cx + 17},${cy + 4} Q${cx + 10},${cy + 9} ${cx + 3},${cy + 4} Z`, "#2a2233") +
    ln(`M${cx - 2},${cy - 3} L${cx + 2},${cy - 3}`, 2.6) + fl(`M${cx - 15},${cy - 3} L${cx - 10},${cy - 3} L${cx - 13},${cy + 1} Z`, "#8fd3ff") + fl(`M${cx + 5},${cy - 3} L${cx + 10},${cy - 3} L${cx + 7},${cy + 1} Z`, "#8fd3ff") +
    sh(`M${cx - 8},${cy + 12} Q${cx},${cy + 20} ${cx + 8},${cy + 12} Z`, "#5a1f2b") +
    el(cx - 16, cy + 10, 4, 2.4, "#ff7f9c", false).replace("/>", ' opacity=".55"/>') + el(cx + 16, cy + 10, 4, 2.4, "#ff7f9c", false).replace("/>", ' opacity=".55"/>');
  const star = (x, y, r, col) => fl(`M${x},${y - r} Q${x + r * .18},${y - r * .18} ${x + r},${y} Q${x + r * .18},${y + r * .18} ${x},${y + r} Q${x - r * .18},${y + r * .18} ${x - r},${y} Q${x - r * .18},${y - r * .18} ${x},${y - r} Z`, col);

  /* ---------- personajes (viewBox 0 0 100 100) */
  const CH = {
    // Geofísica: la Tierra en corte con sus capas
    geofisica: { bg: "#bfe3ff", draw: () =>
      ci(50, 52, 40, "#4a90e2") +
      sh("M22,30 C30,22 40,24 40,32 C40,40 30,40 28,48 C26,54 18,52 16,46 C14,40 16,34 22,30 Z", "#8be0a4") +
      sh("M18,66 C24,62 34,64 36,72 C38,80 30,86 24,82 C20,78 16,72 18,66 Z", "#8be0a4") +
      sh("M52,12 A40,40 0 0 1 52,92 Z", "#2f5d8a") +
      sh("M52,22 A30,30 0 0 1 52,82 Z", "#f7c95c") +
      sh("M52,36 A16,16 0 0 1 52,68 Z", "#ef6a7a") +
      ci(50, 52, 40, "none") +
      face(31, 58, .72) },
    // Geología Estructural: red estereográfica (red de Schmidt) con dos planos y sus polos
    estructural: { bg: "#ffd9b3", draw: () => {
      let o = ci(50, 52, 38, "#fffbe8");
      o += `<clipPath id="av-st"><circle cx="50" cy="52" r="38"/></clipPath><g clip-path="url(#av-st)" fill="none" stroke="#c9b48a" stroke-width="1">`;
      for (let k = -3; k <= 3; k++) if (k) o += `<path d="M50,14 Q${50 + k * 14},52 50,90"/>` + `<path d="M12,52 Q50,${52 + k * 14} 88,52"/>`;
      o += `</g>`;
      o += `<path d="M50,14 Q74,52 50,90" fill="none" stroke="#e8453c" stroke-width="2.6"/><path d="M14,40 Q50,74 86,40" fill="none" stroke="#3a7bd5" stroke-width="2.6"/>`;
      o += ci(30, 34, 2.4, "#e8453c", false) + ci(70, 70, 2.4, "#3a7bd5", false) + ci(62, 30, 2.2, "#2a2233", false);
      o += ci(50, 52, 38, "none") + `<text x="50" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#2a2233">N</text>`;
      return o + face(50, 56, .8); } },
    // Geomorfología: bloque diagrama con relieve, río y estratos
    geomorfo: { bg: "#c9f0d6", draw: () =>
      sh("M8,52 L60,68 L60,92 L8,76 Z", "#d6a46a") + fl("M8,62 L60,78 L60,84 L8,68 Z", "#b9824e") + fl("M8,72 L60,88 L60,92 L8,76 Z", "#9b6a3e") +
      sh("M60,68 L92,52 L92,76 L60,92 Z", "#c48e57") + fl("M60,78 L92,62 L92,68 L60,84 Z", "#a87444") +
      sh("M8,52 L18,34 L26,42 L36,22 L46,38 L54,30 L62,40 L72,26 L82,38 L92,52 L60,68 Z", "#8fd18a") +
      fl("M36,22 L31,31 L36,28 L40,32 Z", "#fff") + fl("M72,26 L68,33 L72,31 L76,34 Z", "#fff") +
      ln("M50,46 C54,50 46,54 52,58 C58,62 54,64 60,68", 3.2, "#3aa8f0") +
      ln("M24,48 L30,50 M70,50 L78,48", 1.6, "#5a9a55") +
      face(34, 68, .62) },
    // Volcanología
    vulcano: { bg: "#ffd0c2", draw: () =>
      ci(40, 14, 7, "#cfc8d6") + ci(52, 10, 9, "#e3dde8") + ci(62, 17, 6, "#cfc8d6") +
      sh("M8,90 L34,34 Q50,28 66,34 L92,90 Z", "#8a5a44") +
      sh("M34,34 Q50,28 66,34 L62,42 Q58,50 55,42 Q51,52 47,42 Q43,48 40,42 Z", "#ff6a2b") +
      fl("M44,33 Q50,31 56,33", "none", `stroke="#ffd166" stroke-width="2"`) +
      face(50, 64, 1) },
    // Mapeo Geológico: mapa con unidades, contactos, falla y rumbo-manteo
    mapeo: { bg: "#fff1b8", draw: () =>
      `<clipPath id="av-map"><rect x="12" y="12" width="76" height="76" rx="6"/></clipPath>` +
      `<g clip-path="url(#av-map)">` +
      `<rect x="12" y="12" width="76" height="76" fill="#fbe7a1"/>` +
      fl("M12,12 L50,12 C44,26 30,30 12,34 Z", "#f4a3b5") +
      fl("M50,12 L88,12 L88,40 C76,36 64,26 50,12 Z", "#9fd38b") +
      fl("M12,60 C30,54 40,66 52,88 L12,88 Z", "#b9a0e8") +
      fl("M88,58 C76,64 70,76 72,88 L88,88 Z", "#8cc7ef") + `</g>` +
      ln("M12,34 C30,30 44,26 50,12 C64,26 76,36 88,40", 1.8) + ln("M12,60 C30,54 40,66 52,88", 1.8) + ln("M88,58 C76,64 70,76 72,88", 1.8) +
      ln("M20,86 L80,16", 2.6, "#e2361f") +
      ln("M24,24 L34,24 M29,24 L29,29", 1.8) + ln("M68,24 L78,24 M73,24 L73,29", 1.8) +
      `<rect x="12" y="12" width="76" height="76" rx="6" fill="none" ${S}/>` +
      face(50, 54, .85) },
    // Cartografía y SIG: capas apiladas (ráster, vector, puntos) y cursor
    sig: { bg: "#d6ecff", draw: () =>
      sh("M50,58 L90,74 L50,90 L10,74 Z", "#4a90e2") + ln("M24,74 L50,64 L76,74", 1.4, "#bfe3ff") +
      sh("M50,42 L90,58 L50,74 L10,58 Z", "#5cc46b") + fl("M30,58 L50,50 L62,56 L44,64 Z", "#3a9a52") +
      sh("M50,16 L90,32 L50,48 L10,32 Z", "#ffb347") +
      ln("M24,32 L40,28 L54,36 L72,30", 1.8, "#a85a10") + ci(40, 28, 2.4, "#fff") + ci(72, 30, 2.4, "#fff") +
      face(50, 28, .62) +
      sh("M74,46 L74,64 L79,59 L83,67 L86,65 L82,58 L89,58 Z", "#fff") },
    // Petrología Endógena: serpentinita verde con textura de escamas y vetillas de crisotilo
    endogena: { bg: "#d4f5df", draw: () =>
      `<clipPath id="av-serp"><path d="M16,70 C10,48 22,24 46,20 C70,16 90,32 88,56 C86,80 66,92 46,90 C28,88 20,82 16,70 Z"/></clipPath>` +
      sh("M16,70 C10,48 22,24 46,20 C70,16 90,32 88,56 C86,80 66,92 46,90 C28,88 20,82 16,70 Z", "#2f7d4e") +
      `<g clip-path="url(#av-serp)">` +
      [[24, 34], [40, 26], [58, 24], [74, 32], [20, 52], [80, 50], [26, 74], [44, 82], [64, 80], [80, 68], [34, 42], [68, 42]].map(([x, y], i) =>
        fl(`M${x - 7},${y} Q${x},${y - 7} ${x + 7},${y} Q${x},${y + 6} ${x - 7},${y} Z`, i % 3 ? "#5fb07a" : "#7fcf95")).join("") +
      ln("M8,40 C30,46 50,36 92,44", 1.6, "#eafff0") + ln("M8,78 C30,70 56,84 92,72", 1.4, "#eafff0") + `</g>` +
      sh("M16,70 C10,48 22,24 46,20 C70,16 90,32 88,56 C86,80 66,92 46,90 C28,88 20,82 16,70 Z", "none") +
      fl("M30,30 C36,26 44,25 48,26", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"') +
      face(52, 58, 1) },
    // Petrología Exógena: duna con estratificación cruzada eólica, lentes de sol y viento
    exogena: { bg: "#ffe8c2", draw: () =>
      ci(20, 18, 9, "#ffd23f") + [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return ln(`M${(20 + 12 * Math.cos(r)).toFixed(1)},${(18 + 12 * Math.sin(r)).toFixed(1)} L${(20 + 15 * Math.cos(r)).toFixed(1)},${(18 + 15 * Math.sin(r)).toFixed(1)}`, 2, "#f2a91a"); }).join("") +
      ln("M44,14 L66,14 M52,22 L80,22 M40,30 L58,30", 2.2, "#ffffff") +
      `<clipPath id="av-duna"><path d="M4,90 C20,70 46,40 66,36 C72,35 76,38 78,44 L96,90 Z"/></clipPath>` +
      sh("M4,90 C20,70 46,40 66,36 C72,35 76,38 78,44 L96,90 Z", "#f2c46d") +
      `<g clip-path="url(#av-duna)">` + [0, 1, 2, 3, 4, 5, 6].map(i => ln(`M${30 + i * 10},${96} L${56 + i * 10},${46}`, 1.4, "#d49a3f")).join("") +
      fl("M4,90 C20,74 46,48 66,42 L66,36 C46,40 20,70 4,90 Z", "#ffdf9a") + `</g>` +
      sh("M4,90 C20,70 46,40 66,36 C72,35 76,38 78,44 L96,90 Z", "none") +
      ln("M84,78 C86,82 88,84 92,86", 1.4, "#d49a3f") +
      shades(52, 62) },
    // Cristalografía: corte delgado con luz paralela (masa fundamental con microlitos y fenocristales)
    cristalo: { bg: "#e6dbff", draw: () => {
      let o = `<clipPath id="av-thin"><circle cx="50" cy="52" r="38"/></clipPath><g clip-path="url(#av-thin)">`;
      o += `<rect x="10" y="12" width="80" height="80" fill="#55524f"/>`;
      // microlitos (listones finos) con un generador fijo
      let z = 7; const rnd = () => (z = (z * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < 170; i++) { const x = 12 + rnd() * 76, y = 14 + rnd() * 76, a = rnd() * Math.PI, l = 2 + rnd() * 3;
        o += `<line x1="${(x).toFixed(1)}" y1="${(y).toFixed(1)}" x2="${(x + l * Math.cos(a)).toFixed(1)}" y2="${(y + l * Math.sin(a)).toFixed(1)}" stroke="#a9a49c" stroke-width=".9" stroke-linecap="round"/>`; }
      o += fl("M50,12 C54,30 46,40 58,56 C64,64 60,80 66,92 L72,92 C68,78 70,64 62,52 C54,40 58,28 56,12 Z", "#2d2b2a");     // vetilla oscura
      // plagioclasas: listones blancos con maclas
      const plag = (cx, cy, w, h, rot) => `<g transform="rotate(${rot} ${cx} ${cy})">` + `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#f4efe2" stroke="#2a2233" stroke-width="1.6"/>` +
        Array.from({ length: Math.floor(w / 4) - 1 }, (_, k) => `<line x1="${cx - w / 2 + 4 + k * 4}" y1="${cy - h / 2 + 1}" x2="${cx - w / 2 + 4 + k * 4}" y2="${cy + h / 2 - 1}" stroke="#c9c0ac" stroke-width="1"/>`).join("") + `</g>`;
      o += plag(24, 30, 24, 11, -32) + plag(78, 36, 24, 10, 22) + plag(26, 78, 26, 11, 36) + plag(76, 80, 20, 9, -18);
      // piroxenos / anfíboles: prismas pardo-oliva con clivaje
      const px = (cx, cy, r, fill) => { const pts = [0, 60, 120, 180, 240, 300].map(a => { const t = (a + 15) * Math.PI / 180; return `${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t) * .85).toFixed(1)}`; }).join(" ");
        return `<polygon points="${pts}" fill="${fill}" stroke="#2a2233" stroke-width="1.4"/>` + `<line x1="${cx - r * .6}" y1="${cy - r * .3}" x2="${cx + r * .6}" y2="${cy + r * .3}" stroke="#7a5a2a" stroke-width=".9"/><line x1="${cx - r * .5}" y1="${cy + r * .1}" x2="${cx + r * .7}" y2="${cy - r * .4}" stroke="#7a5a2a" stroke-width=".9"/>`; };
      o += px(17, 54, 7, "#c9a05a") + px(84, 58, 7.5, "#b9b26a") + px(56, 22, 6, "#d6b46a") + px(50, 86, 6, "#c9a05a") + px(40, 20, 4, "#b9b26a");
      o += ci(78, 48, 2.4, "#1c1a1a", false) + ci(16, 40, 1.8, "#1c1a1a", false) + ci(58, 86, 2, "#1c1a1a", false);
      o += plag(50, 56, 36, 24, -6);                                                                                         // fenocristal grande (la cara)
      o += `</g>` + `<circle cx="50" cy="52" r="40" fill="none" stroke="#2a2233" stroke-width="5"/>`;
      return o + face(50, 54, .78); } },
    // Geoquímica: condrito con cóndrulos y corteza de fusión, entrando en llamas
    geoquimica: { bg: "#d9f7f0", draw: () =>
      fl("M58,40 C70,26 84,12 98,4 C92,18 84,30 72,52 Z", "#ffb347") + fl("M62,44 C72,32 82,22 92,14 C88,26 80,36 70,52 Z", "#ffe27a") +
      sh("M18,62 C14,44 28,30 46,30 C64,28 78,42 76,60 C74,78 58,88 42,86 C28,84 20,76 18,62 Z", "#7a6f64", 'stroke-width="5"') +
      [[30, 46, 5], [62, 48, 4], [28, 72, 4.5], [58, 76, 5], [44, 38, 3], [70, 64, 3]].map(([x, y, r]) => ci(x, y, r, "#d8cbb0", false) + `<circle cx="${x}" cy="${y}" r="${r * .55}" fill="none" stroke="#a89878" stroke-width="1.2"/>`).join("") +
      [[38, 80], [66, 38], [24, 58]].map(([x, y]) => fl(`M${x},${y} l3,-2 l2,3 l-3,2 Z`, "#e6e9ef")).join("") +
      face(47, 58, .9) },
    // Hidrogeología
    hidro: { bg: "#cdeffd", draw: () =>
      sh("M50,8 C40,28 22,44 22,64 C22,80 35,92 50,92 C65,92 78,80 78,64 C78,44 60,28 50,8 Z", "#46b3f0") +
      el(36, 50, 4, 8, "#bfe9ff", false) +
      ln("M22,58 L78,58", 4, "#ff7a1a") +
      sh("M28,58 C28,48 48,48 48,58 C48,66 28,66 28,58 Z M52,58 C52,48 72,48 72,58 C72,66 52,66 52,58 Z", "#dff6ff", 'fill-opacity=".55"') +
      face(50, 60, .9) +
      sh("M78,30 L84,30 L84,62 Q84,68 78,68 L74,68 L74,64 L78,64 Z", "#ffd23f") },
    // Remociones en Masa: deslizamiento traslacional sobre un plano de estratificación
    remociones: { bg: "#e8e2d8", draw: () =>
      // terreno estable con estratos y el plano de deslizamiento inclinado
      sh("M4,92 L4,22 L24,22 L28,36 L96,74 L96,92 Z", "#c9a77c") +
      fl("M4,36 L28,36 L33,39 L4,39 Z", "#a87f52") + fl("M4,52 L56,52 L62,56 L4,56 Z", "#a87f52") + fl("M4,68 L84,68 L90,72 L4,72 Z", "#a87f52") +
      sh("M4,92 L4,22 L24,22 L28,36 L96,74 L96,92 Z", "none") + fl("M4,22 L24,22 L24,18 L4,18 Z", "#7cc46b") +
      // bloque desplazado pendiente abajo
      sh("M38,42 L86,68 L86,42 L38,16 Z", "#d9bb8f") +
      fl("M38,26 L86,52 L86,55 L38,29 Z", "#b08a5e") + fl("M38,34 L86,60 L86,63 L38,37 Z", "#b08a5e") +
      fl("M38,16 L86,42 L86,38 L38,12 Z", "#7cc46b") + ln("M38,16 L86,42 M38,12 L86,38 L86,68 M38,12 L38,42", 2.4) +
      ln("M30,10 L44,6 M39,3 L44,6 L40,10", 2.2) +
      ci(91, 72, 2.6, "#9a948c") + ci(94, 67, 1.8, "#9a948c") +
      face(62, 40, .74, "worried") },
    // Metalogénesis: bocamina entibada (la boca del cerro), rieles, carro con oro y farol
    metalo: { bg: "#fff0c4", draw: () =>
      sh("M2,92 C6,54 22,22 50,18 C78,22 94,54 98,92 Z", "#a78a6e") +
      fl("M14,46 C24,32 36,24 50,22 C64,24 76,32 86,46 C74,38 62,34 50,34 C38,34 26,38 14,46 Z", "#7cc46b") +
      ci(20, 70, 2, "#8a6e55", false) + ci(82, 62, 2.4, "#8a6e55", false) + ci(76, 80, 1.6, "#8a6e55", false) +
      sh("M33,92 L33,56 Q50,50 67,56 L67,92 Z", "#1f1a24") +
      sh("M30,92 L30,54 L36,54 L36,92 Z", "#a0662f") + sh("M64,92 L64,54 L70,54 L70,92 Z", "#a0662f") +
      sh("M26,50 L74,50 L74,57 L26,57 Z", "#b97a3a") + ln("M30,53.5 L70,53.5", 1, "#7a4a1e") +
      ln("M50,57 L50,62", 1.6) + sh("M47,62 L53,62 L54,70 L46,70 Z", "#ffd23f") + ln("M46,62 L54,62 M46,70 L54,70", 2) +
      ln("M44,92 L48,74 M56,92 L52,74", 2, "#8a8f9c") + ln("M45,86 L55,86 M46.5,80 L53.5,80", 1.6, "#8a8f9c") +
      sh("M74,78 L94,78 L91,90 L77,90 Z", "#6b7080") + ci(80, 91, 2.6, "#2a2233", false) + ci(89, 91, 2.6, "#2a2233", false) +
      sh("M76,78 L80,72 L84,76 L88,70 L92,78 Z", "#f2c230") + `<rect x="85" y="71" width="2" height="2" fill="#fff"/>` +
      face(50, 36, .8, "nomouth") },
    // Estratigrafía Andina: columna estratigráfica con litologías y un amonite
    estrati: { bg: "#ffe0cc", draw: () => {
      let o = "";
      o += ln("M14,12 L14,92 M10,92 L18,92 M10,72 L18,72 M10,52 L18,52 M10,32 L18,32 M10,12 L18,12", 1.8);
      const L = [  // [yTop, yBot, ancho, relleno, patrón]
        [12, 24, 34, "#f6dc9f", "dots"], [24, 34, 26, "#b9b3c9", "dash"], [34, 58, 50, "#a9c7e8", "brick"],
        [58, 68, 28, "#b9b3c9", "dash"], [68, 80, 38, "#f6dc9f", "dots"], [80, 92, 44, "#e2c49a", "pebble"]];
      L.forEach(([a, b, w, fill, pat]) => {
        o += `<rect x="24" y="${a}" width="${w}" height="${b - a}" fill="${fill}" ${S}/>`;
        if (pat === "dots") for (let x = 28; x < 22 + w; x += 5) for (let y = a + 3; y < b - 1; y += 4) o += ci(x + (y % 8 ? 2 : 0), y, .9, "#a07a3a", false);
        if (pat === "dash") for (let y = a + 3; y < b; y += 3.5) o += ln(`M27,${y} L${20 + w},${y}`, 1, "#6e6880").replace('stroke-linecap="round"', 'stroke-linecap="butt" stroke-dasharray="4 3"');
        if (pat === "brick") for (let y = a + 6; y < b; y += 6) o += ln(`M24,${y} L${24 + w},${y}`, 1.2, "#5e7fa8");
        if (pat === "pebble") [[30, 86], [40, 84], [52, 88], [62, 85], [36, 89]].forEach(([x, y]) => o += el(x, y, 3, 2, "#c9a26a", false) + `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="none" stroke="#2a2233" stroke-width="1"/>`);
      });
      o += ci(66, 44, 6, "#f0a76a") + ln("M66,44 m-1.5,0 a1.5,1.5 0 1,1 3,0 a3,3 0 1,1 -6,0 a5,5 0 1,1 10,0", 1.2);
      o += face(42, 44, .68);
      return o; } },
    // Geopatrimonio: roca con petroglifos y sombrero de guardaparque del geoparque (parche con volcán)
    geopatrimonio: { bg: "#d8e9ff", draw: () =>
      sh("M14,74 C10,56 18,40 36,36 L66,36 C84,40 92,56 88,74 C86,88 70,96 50,96 C30,96 16,88 14,74 Z", "#a89786") +
      ln("M22,84 m0,0 a5,5 0 1,1 6,-6 a3,3 0 1,1 -3,4", 1.8, "#e9dccb") +
      ln("M76,62 L76,78 M70,66 L82,66 M76,78 L70,86 M76,78 L82,86", 1.8, "#e9dccb") + ci(76, 58, 3, "none") +
      ln("M66,86 C70,82 74,88 78,84", 1.6, "#e9dccb") + ln("M20,62 L28,62 L28,70", 1.6, "#e9dccb") +
      fl("M30,44 C36,40 44,40 48,40", "none", 'stroke="#c8b8a6" stroke-width="3" stroke-linecap="round"') +
      sh("M8,40 C20,34 80,34 92,40 C82,46 18,46 8,40 Z", "#c9a65a") +
      sh("M30,38 C30,22 36,10 50,10 C64,10 70,22 70,38 Z", "#d8b86a") +
      fl("M30,32 L70,32 L70,38 L30,38 Z", "#4f8a3c") + ln("M30,32 L70,32 M30,38 L70,38", 2) +
      ln("M44,14 C46,18 54,18 56,14", 2) +
      ci(50, 24, 6.5, "#fff") + `<path d="M45.5,27 L48.5,21.5 L51.5,21.5 L54.5,27 Z" fill="#7d6f86"/><path d="M48.5,21.5 L51.5,21.5 L50.8,23 L49.2,23 Z" fill="#fff"/>` +
      face(50, 62, .95) }
  };


  /* ---------- opciones para Geología Estructural (vista previa) */
  const ALT = {
    // A: anticlinal — estratos arqueados de colores
    pliegueA: { bg: "#ffd9b3", draw: () => {
      let o = `<clipPath id="av-antA"><rect x="12" y="24" width="76" height="70" rx="14"/></clipPath><g clip-path="url(#av-antA)"><rect x="12" y="24" width="76" height="70" fill="#7d4a2c"/>`;
      const cols = ["#c9643a", "#f0b45c", "#fbe3a8", "#8fb07a", "#e88a5a", "#fbe3a8"];
      [78, 66, 54, 42, 30, 18].forEach((r, i) => o += `<path d="M${50 - r},110 A${r},${r * 1.05} 0 0 1 ${50 + r},110 Z" fill="${cols[i]}" stroke="#2a2233" stroke-width="2"/>`);
      o += `</g><rect x="12" y="24" width="76" height="70" rx="14" fill="none" ${S}/>`;
      o += ln("M50,22 L50,8", 2, "#2a2233").replace('stroke-linecap="round"', 'stroke-linecap="round" stroke-dasharray="3 3"');
      return o + face(50, 76, .78); } },
    // B: anticlinal + sinclinal muy marcados, con plano axial
    pliegueB: { bg: "#ffd9b3", draw: () => {
      let o = `<clipPath id="av-antB"><rect x="8" y="18" width="84" height="74" rx="14"/></clipPath><g clip-path="url(#av-antB)"><rect x="8" y="18" width="84" height="74" fill="#fbe3a8"/>`;
      const cols = ["#c9643a", "#fbe3a8", "#8fb07a", "#f0b45c", "#c9643a", "#fbe3a8", "#8fb07a"];
      cols.forEach((c, i) => { const y0 = 6 + i * 13; let d = `M0,${y0 + 40}`;
        for (let x = 0; x <= 100; x += 2) d += ` L${x},${(y0 + 22 * Math.cos((x - 30) / 18)).toFixed(1)}`;
        d += ` L100,120 L0,120 Z`; o += `<path d="${d}" fill="${c}" stroke="#2a2233" stroke-width="2"/>`; });
      o += `</g><rect x="8" y="18" width="84" height="74" rx="14" fill="none" ${S}/>`;
      o += `<line x1="30" y1="12" x2="30" y2="96" stroke="#2a2233" stroke-width="1.6" stroke-dasharray="3 3"/>`;
      return o + face(56, 60, .8); } },
    // C: red estereográfica (red de Schmidt) con planos y polos
    stereo: { bg: "#ffd9b3", draw: () => {
      let o = ci(50, 52, 38, "#fffbe8");
      o += `<clipPath id="av-st"><circle cx="50" cy="52" r="38"/></clipPath><g clip-path="url(#av-st)" fill="none" stroke="#c9b48a" stroke-width="1">`;
      for (let k = -3; k <= 3; k++) if (k) o += `<path d="M50,14 Q${50 + k * 14},52 50,90"/>` + `<path d="M12,52 Q50,${52 + k * 14} 88,52"/>`;
      o += `</g>`;
      o += `<path d="M50,14 Q74,52 50,90" fill="none" stroke="#e8453c" stroke-width="2.6"/><path d="M14,40 Q50,74 86,40" fill="none" stroke="#3a7bd5" stroke-width="2.6"/>`;
      o += ci(30, 34, 2.4, "#e8453c", false) + ci(70, 70, 2.4, "#3a7bd5", false) + ci(62, 30, 2.2, "#2a2233", false);
      o += ci(50, 52, 38, "none") + `<text x="50" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#2a2233">N</text>`;
      return o + face(50, 56, .8); } }
  };

  function svg(id, opt) {
    const c = CH[id] || ALT[id]; if (!c) return "";
    const tile = !opt || opt.tile !== false;
    const bg = tile ? `<rect x="2" y="2" width="96" height="96" rx="22" fill="${c.bg}"/>` : "";
    const inner = tile ? `<g transform="translate(50 52) scale(.86) translate(-50 -52)">${c.draw()}</g>` : c.draw();
    return `<svg class="avatar" viewBox="0 0 100 100" aria-hidden="true">${bg}${inner}</svg>`;
  }

  /* ---------- paisaje del podio: cielo al atardecer, Andes, volcán humeante y estratos */
  function scene() {
    const stars = Array.from({ length: 40 }, (_, i) => { const x = (i * 97.3) % 1600, y = (i * 53.7) % 340; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(i % 3) * .6 + .8}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`; }).join("");
    return `<svg class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2650"/><stop offset=".55" stop-color="#5a3d7a"/><stop offset=".85" stop-color="#e0785a"/><stop offset="1" stop-color="#f6b267"/></linearGradient>
      <linearGradient id="aur" x1="0" x2="1"><stop offset="0" stop-color="#6ef0c8" stop-opacity="0"/><stop offset=".5" stop-color="#6ef0c8" stop-opacity=".35"/><stop offset="1" stop-color="#7fb6ff" stop-opacity="0"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#sky)"/>${stars}
      <path d="M0,170 C300,90 600,230 900,140 C1150,70 1400,170 1600,110 L1600,190 C1400,250 1150,150 900,220 C600,300 300,170 0,250 Z" fill="url(#aur)"/>
      <circle cx="1270" cy="260" r="80" fill="#ffe2b0" opacity=".9"/>
      <path d="M0,620 L140,470 L230,540 L360,400 L470,520 L560,450 L700,560 L820,430 L960,540 L1080,470 L1200,560 L1320,440 L1460,540 L1600,470 L1600,900 L0,900 Z" fill="#3c3266"/>
      <path d="M360,400 L330,432 L352,426 L372,440 L392,428 Z M820,430 L796,456 L816,452 L834,464 L850,452 Z M1320,440 L1296,466 L1316,462 L1334,474 L1350,462 Z" fill="#e9e4ff"/>
      <g opacity=".9"><circle cx="1130" cy="300" r="34" fill="#9c93b0"/><circle cx="1170" cy="270" r="44" fill="#b3abc4"/><circle cx="1215" cy="300" r="30" fill="#9c93b0"/></g>
      <path d="M940,700 L1100,380 Q1150,365 1200,380 L1360,700 Z" fill="#5a3f4f"/>
      <path d="M1100,380 Q1150,365 1200,380 L1188,404 Q1176,426 1166,404 Q1152,436 1140,404 Q1126,420 1114,404 Z" fill="#ff6a2b"/>
      <path d="M0,700 L180,610 L320,660 L480,590 L640,670 L800,600 L960,680 L1120,620 L1300,690 L1460,620 L1600,660 L1600,900 L0,900 Z" fill="#2b2445"/>
      <path d="M0,780 C300,750 600,800 900,770 C1200,740 1400,790 1600,760 L1600,900 L0,900 Z" fill="#231d38"/>
    </svg>`;
  }

  window.AVATAR = { svg, scene, ids: Object.keys(CH), bg: id => (CH[id] || {}).bg };
})();
